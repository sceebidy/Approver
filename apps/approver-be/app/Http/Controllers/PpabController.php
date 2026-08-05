<?php

namespace App\Http\Controllers;

use App\Models\Ppab;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PpabController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = \App\Models\Ppab::with(['user:id,name', 'approverLines'])->latest();

        // Keamanan data: hanya tampilkan dokumen di mana user adalah pemohon (user_id) 
        // atau terdaftar sebagai salah satu approver (approverLines).
        $showAll = request()->query('all') == '1' && $user->role === 'super_admin';
        if (!$showAll) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('approverLines', function ($q2) use ($user) {
                      $q2->where('approver_id', $user->id);
                  });
            });
        }

        $items = $query->get()->map(function($p) use ($user) {
            $approverLines = $p->approverLines;
            $totalLines = $approverLines->count();
            $approvedCount = $approverLines->where('status', 'approved')->count();
            $rejectedCount = $approverLines->where('status', 'rejected')->count();

            $status = 'pending';
            if ($rejectedCount > 0) {
                $status = 'rejected';
            } elseif ($totalLines > 0 && $approvedCount === $totalLines) {
                $status = 'approved';
            }

            return [
                'id'          => $p->id,
                'nomor_ppab'  => $p->nomor_ppab,
                'deskripsi'   => $p->deskripsi,
                'user_id'     => $p->user_id,
                'user_name'   => $p->user?->name,
                'created_at'  => $p->created_at,
                'status'      => $status,
                'can_cancel'  => !$approverLines->contains('status', 'approved'),
                'request_type'=> $p->user_id === $user->id ? 'Pengajuan Saya' : ($approverLines->contains('approver_id', $user->id) ? 'Butuh Approval Anda' : 'Lainnya'),
            ];
        });

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_ppab' => 'required|string|max:255|unique:ppab,nomor_ppab',
            'deskripsi' => 'required|string',
            'user_id' => 'nullable|integer|exists:users,id',
            'source_pdf_path' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.deskripsi' => 'required|string',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.qty' => 'required|numeric',
            'items.*.harga_satuan' => 'required|numeric',
            'items.*.kategori' => 'nullable|string|max:255',
            'items.*.currency' => 'nullable|string|max:10',
            'items.*.line_specs' => 'nullable|array',
            'items.*.line_specs.*.deskripsi' => 'required_with:items.*.line_specs|string',
            'subtotals' => 'nullable|array',
            'subtotals.*.deskripsi' => 'required|string',
            'approver_lines' => 'nullable|array',
            'approver_lines.*.approver_id' => 'required|integer|exists:users,id',
            'approver_lines.*.role' => 'nullable|string|max:255',
            'approver_lines.*.status' => 'nullable|string|in:pending,approved,rejected',
            'approver_lines.*.timestamp' => 'nullable|date',
            'approver_lines.*.is_verifier' => 'nullable|boolean',
        ]);

        $userId = auth()->id() ?? ($data['user_id'] ?? null);
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $ppab = DB::transaction(function () use ($data, $userId) {
            $ppab = Ppab::create([
                'user_id' => $userId,
                'nomor_ppab' => $data['nomor_ppab'],
                'deskripsi' => $data['deskripsi'],
                'source_pdf_path' => $data['source_pdf_path'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $itemModel = $ppab->items()->create([
                    'deskripsi' => $item['deskripsi'],
                    'satuan' => $item['satuan'],
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'kategori' => $item['kategori'] ?? null,
                    'currency' => $item['currency'] ?? 'IDR',
                ]);

                if (!empty($item['line_specs']) && is_array($item['line_specs'])) {
                    foreach ($item['line_specs'] as $spec) {
                        $itemModel->lineSpecs()->create([
                            'deskripsi' => $spec['deskripsi'],
                        ]);
                    }
                }
            }

            if (!empty($data['subtotals'])) {
                foreach ($data['subtotals'] as $subtotal) {
                    $ppab->subtotals()->create([
                        'deskripsi' => $subtotal['deskripsi'],
                    ]);
                }
            }

            if (!empty($data['approver_lines'])) {
                foreach ($data['approver_lines'] as $line) {
                    $ppab->approverLines()->create([
                        'approver_id' => $line['approver_id'],
                        'role' => $line['role'] ?? 'approver',
                        'status' => $line['status'] ?? 'pending',
                        'timestamp' => $line['timestamp'] ?? null,
                        'is_verifier' => !empty($line['is_verifier']) ? true : false,
                    ]);
                }
            }

            return $ppab->load('items.lineSpecs', 'subtotals', 'approverLines');
        });

        return response()->json([
            'success' => true,
            'data' => $ppab,
        ], 201);
    }

    public function show($id)
    {
        $ppab = Ppab::with(['user:id,name', 'items.lineSpecs', 'subtotals', 'approverLines.approver:id,name', 'verfAnggaran'])->findOrFail($id);
        
        $user = auth()->user();
        $userIds = [$user->id];
        if (!empty($user->employee_id)) {
            $userIds = array_unique(array_merge($userIds, User::where('employee_id', $user->employee_id)->pluck('id')->toArray()));
        }
        $isOwner = in_array($ppab->user_id, $userIds);
        $isApprover = $ppab->approverLines->contains(fn($l) => in_array($l->approver_id, $userIds));
        
        if (!$isOwner && !$isApprover && !in_array(strtolower($user->role ?? ''), ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this document.'], 403);
        }

        $hasVerifierDesignated = $ppab->approverLines->contains('is_verifier', true);
        if ($hasVerifierDesignated) {
            $isDesignatedVerifier = $ppab->approverLines->contains(fn($l) => $l->is_verifier && in_array($l->approver_id, $userIds));
        } else {
            // Legacy fallback if no verifier was explicitly assigned
            $isDesignatedVerifier = $isOwner || $isApprover;
        }

        $verifierLine = $ppab->approverLines->firstWhere('is_verifier', true);

        $ppab->request_type = $isOwner ? 'Pengajuan Saya' : ($isApprover ? 'Butuh Approval Anda' : 'Lainnya');
        $ppab->can_cancel = !$ppab->approverLines->contains('status', 'approved');
        $ppab->can_edit_verf_anggaran = $isDesignatedVerifier || strtolower($user->role ?? '') === 'super_admin';
        $ppab->verifier_name = $verifierLine?->approver?->name ?? null;
        $ppab->current_user_id = $user->id;
        $ppab->current_user_ids = $userIds;

        return response()->json([
            'success' => true,
            'data' => $ppab
        ]);
    }

    public function storeVerfAnggaran(Request $request, $id)
    {
        $ppab = Ppab::with('approverLines')->findOrFail($id);
        $user = auth()->user();

        $userIds = [$user->id];
        if (!empty($user->employee_id)) {
            $userIds = array_unique(array_merge($userIds, User::where('employee_id', $user->employee_id)->pluck('id')->toArray()));
        }

        $hasVerifierDesignated = $ppab->approverLines->contains('is_verifier', true);
        if ($hasVerifierDesignated) {
            $isAllowedVerifier = $ppab->approverLines->contains(fn($l) => $l->is_verifier && in_array($l->approver_id, $userIds));
        } else {
            // Legacy fallback
            $isAllowedVerifier = $ppab->user_id === $user->id || $ppab->approverLines->contains(fn($l) => in_array($l->approver_id, $userIds));
        }

        if (!$isAllowedVerifier && strtolower($user->role ?? '') !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Hanya Verifikator Anggaran yang ditunjuk yang dapat mengisi/mengubah Verifikasi Anggaran.'
            ], 403);
        }

        $validated = $request->validate([
            'sumber_rek'    => 'required|string|max:255',
            'beban_rek'     => 'required|string|max:255',
            'rkap_1_tahun'  => 'required|numeric',
            'realisasi'     => 'required|numeric',
            'permintaan'    => 'required|numeric',
            'sisa_anggaran' => 'required|numeric',
        ]);

        $verf = \App\Models\PpabVerfAnggaran::updateOrCreate(
            ['ppab_id' => $ppab->id],
            [
                'no_ppab'       => $ppab->nomor_ppab,
                'sumber_rek'    => $validated['sumber_rek'],
                'beban_rek'     => $validated['beban_rek'],
                'rkap_1_tahun'  => $validated['rkap_1_tahun'],
                'realisasi'     => $validated['realisasi'],
                'permintaan'    => $validated['permintaan'],
                'sisa_anggaran' => $validated['sisa_anggaran'],
            ]
        );

        // Regenerate signed PDF agar stamp merah pada file PDF ter-update secara real-time
        try {
            $signingService = app(\App\Services\DocumentSigningService::class);
            $signingService->generateSignedPdf('ppab', $ppab->fresh());
        } catch (\Throwable $e) {
            Log::error('[PpabController] Gagal update PDF setelah storeVerfAnggaran: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Data Verifikasi Anggaran berhasil disimpan.',
            'data'    => $verf,
        ]);
    }

    public function previewPdf($id)
    {
        $ppab = Ppab::with(['user:id,name', 'items.lineSpecs', 'subtotals', 'approverLines.approver:id,name', 'verfAnggaran'])->findOrFail($id);

        $signingService = app(\App\Services\DocumentSigningService::class);
        $pdfPath = $signingService->generateSignedPdf('ppab', $ppab);

        if (!$pdfPath || !file_exists($pdfPath)) {
            return response()->json(['success' => false, 'message' => 'Gagal membuat pratinjau PDF.'], 500);
        }

        return response()->file($pdfPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview_ppab_' . $ppab->id . '.pdf"',
        ]);
    }

    public function destroy($id)
    {
        $ppab = Ppab::with('approverLines')->findOrFail($id);

        $hasApproved = $ppab->approverLines()->where('status', 'approved')->exists();

        if ($hasApproved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak dapat dihapus karena sudah ada approval yang disetujui.'
            ], 409);
        }

        DB::transaction(function () use ($ppab) {
            $ppab->approverLines()->delete();
            $ppab->items()->delete();
            $ppab->subtotals()->delete();
            $ppab->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pengajuan PPAB berhasil dihapus.']);
    }
}
