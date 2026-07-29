<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ppab;
use App\Models\Po;
use App\Models\Mis;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\DocumentSigningService;

class SubmissionController extends Controller
{
    /**
     * Handle document submission.
     */
    public function create(Request $request)
    {
        $request->validate([
            'type' => 'required|in:ppab,po,mis',
            'data' => 'required|array',
            'approvers' => 'required|array|min:1', // array of employee IDs or emails
        ]);

        $type = $request->type;
        $data = $request->data;
        $approvers = $request->approvers;
        $user = $request->user();

        // Validate unique document numbers
        if ($type === 'ppab') {
            $request->validate([
                'data.nomor_ppab' => 'required|unique:ppab,nomor_ppab'
            ], [
                'data.nomor_ppab.unique' => 'Pengajuan dengan Nomor PPAB ini sudah ada di sistem.',
                'data.nomor_ppab.required' => 'Nomor PPAB wajib diisi.'
            ]);
        } elseif ($type === 'po') {
            $request->validate([
                'data.nomor_po' => 'required|unique:po,nomor_po'
            ], [
                'data.nomor_po.unique' => 'Pengajuan dengan Nomor PO ini sudah ada di sistem.',
                'data.nomor_po.required' => 'Nomor PO wajib diisi.'
            ]);
        } elseif ($type === 'mis') {
            $request->validate([
                'data.nomor_mis' => 'required|unique:mis,nomor_mis'
            ], [
                'data.nomor_mis.unique' => 'Pengajuan dengan Nomor MIS ini sudah ada di sistem.',
                'data.nomor_mis.required' => 'Nomor MIS wajib diisi.'
            ]);
        }

        try {
            DB::beginTransaction();

            $documentId = null;

            if ($type === 'ppab') {
            $ppab = Ppab::create([
                    'user_id' => $user->id,
                    'deskripsi' => $data['deskripsi'] ?? 'Pengajuan PPAB',
                    'nomor_ppab' => $data['nomor_ppab'] ?? 'PPAB-' . time(),
                    'source_pdf_path' => $data['source_pdf_path'] ?? null,
                ]);
                $documentId = $ppab->id;

                if (isset($data['items']) && is_array($data['items'])) {
                    foreach ($data['items'] as $item) {
                        $itemModel = $ppab->items()->create([
                            'deskripsi' => $item['deskripsi'] ?? '',
                            'satuan' => $item['satuan'] ?? '',
                            'qty' => $item['qty'] ?? 0,
                            'harga_satuan' => $item['harga_satuan'] ?? 0,
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
                }

                if (!empty($data['subtotals']) && is_array($data['subtotals'])) {
                    foreach ($data['subtotals'] as $subtotal) {
                        $ppab->subtotals()->create([
                            'deskripsi' => $subtotal['deskripsi'],
                        ]);
                    }
                }

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $ppab->approverLines()->create([
                        'approver_id' => $approver->id,
                        'role' => $approverData['role'] ?? 'approver',
                        'status' => 'pending'
                    ]);
                }
            } elseif ($type === 'po') {
                $po = Po::create([
                    'user_id' => $user->id,
                    'nomor_po' => $data['nomor_po'] ?? 'PO-' . time(),
                    'nomor_ppab' => $data['nomor_ppab'] ?? null,
                    'vendor' => $data['vendor'] ?? 'Unknown Vendor',
                ]);
                $documentId = $po->id;

                if (isset($data['items']) && is_array($data['items'])) {
                    foreach ($data['items'] as $item) {
                        $po->itemLines()->create([
                            'deskripsi' => $item['deskripsi'] ?? '',
                            'satuan' => $item['satuan'] ?? '',
                            'qty' => $item['qty'] ?? 0,
                            'harga_satuan' => $item['harga_satuan'] ?? 0,
                            'spec' => $item['spec'] ?? null,
                        ]);
                    }
                }

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $po->approverLines()->create([
                        'approver_id' => $approver->id,
                        'role' => $approverData['role'] ?? 'approver',
                        'status' => 'pending'
                    ]);
                }
            } elseif ($type === 'mis') {
                $tglMisStr = $data['tgl_mis'] ?? null;
                $tglMis = now()->toDateString();
                if ($tglMisStr) {
                    try {
                        if (str_contains($tglMisStr, '/')) {
                            $tglMis = \Illuminate\Support\Carbon::createFromFormat('d/m/Y', $tglMisStr)->format('Y-m-d');
                        } else {
                            $tglMis = \Illuminate\Support\Carbon::parse($tglMisStr)->format('Y-m-d');
                        }
                    } catch (\Exception $e) {
                        // ignore and use fallback
                    }
                }

                $mis = Mis::create([
                    'user_id' => $user->id,
                    'nomor_mis' => $data['nomor_mis'] ?? 'MIS-' . time(),
                    'tgl_mis' => $tglMis,
                    'source_pdf_path' => $data['source_pdf_path'] ?? null,
                ]);
                $documentId = $mis->id;

                if (isset($data['items']) && is_array($data['items'])) {
                    foreach ($data['items'] as $item) {
                        $mis->itemLines()->create([
                            'desc' => $item['desc'] ?? '',
                            'satuan' => $item['satuan'] ?? '',
                            'qty' => $item['qty'] ?? 0,
                            'remark' => $item['remark'] ?? null,
                        ]);
                    }
                }

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $mis->approverLines()->create([
                        'approver_id' => $approver->id,
                        'role' => $approverData['role'] ?? 'approver',
                        'status' => 'pending'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => strtoupper($type) . ' submission created successfully.',
                'data' => ['id' => $documentId]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Submission error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create submission: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending approvals for the current user.
     */
    public function pendingApprovals(Request $request)
    {
        $userId = $request->user()->id;

        $ppabPending = \App\Models\PpabApproverLine::with('ppab')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->ppab_id,
                    'type' => 'ppab',
                    'number' => $item->ppab->nomor_ppab ?? 'N/A',
                    'description' => $item->ppab->deskripsi ?? '',
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $poPending = \App\Models\PoApproverLine::with('po')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->po_id,
                    'type' => 'po',
                    'number' => $item->po->nomor_po ?? 'N/A',
                    'description' => 'Vendor: ' . ($item->po->vendor ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $misPending = \App\Models\MisApproverLine::with('mis')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->mis_id,
                    'type' => 'mis',
                    'number' => $item->mis->nomor_mis ?? 'N/A',
                    'description' => 'Date: ' . ($item->mis->tgl_mis ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $frPending = \App\Models\FrApprover::with('fr.kategoriFr', 'fr.requester')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->fr_id,
                    'type' => 'fr',
                    'number' => $item->fr->number_fr ?? 'N/A',
                    'description' => 'Kategori: ' . ($item->fr->kategoriFr->nama ?? '') . ' | Keterangan: ' . ($item->fr->keterangan ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $fsPending = \App\Models\FsApprover::with('fundSettlement.requester', 'fundSettlement.fr')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->fs_id,
                    'type' => 'fs',
                    'number' => $item->fundSettlement->number_fs ?? 'N/A',
                    'description' => 'Balance: ' . number_format($item->fundSettlement->balance ?? 0) . ' | Keterangan: ' . ($item->fundSettlement->fr->keterangan ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $allPending = collect()
            ->merge($ppabPending)
            ->merge($poPending)
            ->merge($misPending)
            ->merge($frPending)
            ->merge($fsPending)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $allPending
        ]);
    }

    /**
     * Get recent documents related to the current user (owner or approver).
     */
    public function recentDocuments(Request $request)
    {
        $userId = $request->user()->id;

        $ppabList = Ppab::with('approverLines')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('approverLines', fn($q2) => $q2->where('approver_id', $userId));
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'type'        => 'PPAB',
                'number'      => $p->nomor_ppab,
                'description' => $p->deskripsi,
                'created_at'  => $p->created_at,
                'status'      => $p->approverLines->contains('status', 'rejected') ? 'rejected' : ($p->approverLines->count() > 0 && $p->approverLines->where('status', 'approved')->count() === $p->approverLines->count() ? 'approved' : 'pending'),
            ]);

        $poList = Po::with('approverLines')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('approverLines', fn($q2) => $q2->where('approver_id', $userId));
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'type'        => 'PO',
                'number'      => $p->nomor_po,
                'description' => 'Vendor: ' . ($p->vendor ?? ''),
                'created_at'  => $p->created_at,
                'status'      => $p->approverLines->contains('status', 'rejected') ? 'rejected' : ($p->approverLines->count() > 0 && $p->approverLines->where('status', 'approved')->count() === $p->approverLines->count() ? 'approved' : 'pending'),
            ]);

        $misList = Mis::with('approverLines')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('approverLines', fn($q2) => $q2->where('approver_id', $userId));
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($m) => [
                'id'          => $m->id,
                'type'        => 'MIS',
                'number'      => $m->nomor_mis,
                'description' => 'Tanggal MIS: ' . ($m->tgl_mis ?? ''),
                'created_at'  => $m->created_at,
                'status'      => $m->approverLines->contains('status', 'rejected') ? 'rejected' : ($m->approverLines->count() > 0 && $m->approverLines->where('status', 'approved')->count() === $m->approverLines->count() ? 'approved' : 'pending'),
            ]);

        $frList = \App\Models\Fr::with('approvers')
            ->where(function ($q) use ($userId) {
                $q->where('requester_id', $userId)
                  ->orWhereHas('approvers', fn($q2) => $q2->where('approver_id', $userId));
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($f) => [
                'id'          => $f->id,
                'type'        => 'FR',
                'number'      => $f->number_fr,
                'description' => $f->keterangan ?? 'Fund Request',
                'created_at'  => $f->created_at,
                'status'      => $f->status ?? 'pending',
            ]);

        $fsList = \App\Models\FundSettlement::with('approvers')
            ->where(function ($q) use ($userId) {
                $q->where('requester_id', $userId)
                  ->orWhereHas('approvers', fn($q2) => $q2->where('approver_id', $userId));
            })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($f) => [
                'id'          => $f->id,
                'type'        => 'FS',
                'number'      => $f->number_fs,
                'description' => 'Fund Settlement',
                'created_at'  => $f->created_at,
                'status'      => $f->status ?? 'pending',
            ]);

        $recent = collect()
            ->concat($ppabList)
            ->concat($poList)
            ->concat($misList)
            ->concat($frList)
            ->concat($fsList)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $recent,
        ]);
    }

    /**
     * Approve a document
     */
    public function approve(Request $request, $type, $lineId)
    {
        Log::info("[SubmissionController@approve] Called with type={$type}, lineId={$lineId}, user=" . ($request->user() ? $request->user()->id : 'null'));
        return $this->updateApprovalStatus($request, $type, $lineId, 'approved');
    }

    /**
     * Reject a document
     */
    public function reject(Request $request, $type, $lineId)
    {
        return $this->updateApprovalStatus($request, $type, $lineId, 'rejected');
    }

    private function updateApprovalStatus(Request $request, $type, $lineId, $status)
    {
        $userId = $request->user()->id;
        $type = strtolower($type);
        if ($type === 'fund_settlement') {
            $type = 'fs';
        }

        $model    = null;
        $document = null;

        if ($type === 'ppab') {
            $model = \App\Models\PpabApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Ppab::find($model->ppab_id);
            }
        } elseif ($type === 'po') {
            $model = \App\Models\PoApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Po::find($model->po_id);
            }
        } elseif ($type === 'mis') {
            $model = \App\Models\MisApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Mis::find($model->mis_id);
            }
        } elseif ($type === 'fs') {
            $model = \App\Models\FsApprover::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\FundSettlement::find($model->fs_id);
            }
        } elseif ($type === 'fr') {
            $model = \App\Models\FrApprover::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Fr::find($model->fr_id);
            }
        }

        if (!$model || !$document) {
            return response()->json(['success' => false, 'message' => 'Approval line not found or unauthorized.'], 404);
        }

        // ---------------------------------------------------------------
        // TRANSACTION: hanya operasi DB ringan (update status + token)
        // ---------------------------------------------------------------
        $shouldGeneratePdf = false;

        DB::transaction(function () use ($model, $status, $document, $type, &$shouldGeneratePdf) {
            $signingService = app(DocumentSigningService::class);

            $model->status = $status;
            if ($status === 'approved') {
                $model->signed_at = now();
                $signingService->generateVerifyToken($model); // hash + save: ringan, aman dalam transaction
            }
            $model->save();

            // Cek apakah SEMUA approver_line untuk dokumen ini sudah approved
            $approverLines = collect();
            if ($type === 'fs') {
                $approverLines = \App\Models\FsApprover::where('fs_id', $document->id)->lockForUpdate()->get();
            } elseif ($type === 'fr') {
                $approverLines = \App\Models\FrApprover::where('fr_id', $document->id)->lockForUpdate()->get();
            } elseif ($type === 'ppab') {
                $approverLines = \App\Models\PpabApproverLine::where('ppab_id', $document->id)->lockForUpdate()->get();
            } elseif ($type === 'po') {
                $approverLines = \App\Models\PoApproverLine::where('po_id', $document->id)->lockForUpdate()->get();
            } elseif ($type === 'mis') {
                $approverLines = \App\Models\MisApproverLine::where('mis_id', $document->id)->lockForUpdate()->get();
            }

            $totalLines    = $approverLines->count();
            $approvedLines = $approverLines->where('status', 'approved')->count();
            $rejectedLines = $approverLines->where('status', 'rejected')->count();

            // Sinkronisasi status fisik ke database untuk FR dan FS jika ada
            if ($type === 'fs' || $type === 'fr') {
                if ($rejectedLines > 0) {
                    $document->status = 'rejected';
                } elseif ($totalLines > 0 && $approvedLines === $totalLines) {
                    $document->status = 'approved';
                } else {
                    $document->status = 'pending';
                }
                $document->save();
            }

            if ($status === 'approved') {
                if ($totalLines > 0 && $totalLines === $approvedLines && empty($document->signed_pdf_path)) {
                    // Semua approver sudah menyetujui & PDF belum pernah di-generate
                    // Set flag — generateSignedPdf() dipanggil di LUAR transaction (heavy I/O)
                    $shouldGeneratePdf = true;
                }
            }
        });

        // ---------------------------------------------------------------
        // SETELAH TRANSACTION COMMIT: generate PDF (I/O berat, tidak perlu lock)
        // ---------------------------------------------------------------
        if ($shouldGeneratePdf) {
            try {
                $signingService = app(DocumentSigningService::class);
                $signingService->generateSignedPdf($type, $document->fresh());
            } catch (\Throwable $e) {
                // Jangan gagalkan response approve jika PDF gagal dibuat.
                // PDF dapat di-generate ulang lewat endpoint downloadSignedPdf.
                Log::error("[DocumentSigning] Gagal generate PDF setelah approve {$type}#{$document->id}: " . $e->getMessage(), [
                    'type'        => $type,
                    'document_id' => $document->id,
                    'exception'   => $e,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Document successfully {$status}."
        ]);
    }

    private function getOrCreateUser($approverData)
    {
        $authUser = auth()->user();

        // 1. Cek apakah approver yang dipilih adalah user yang sedang login
        // (Berdasarkan employee_id atau kecocokan nama, berguna jika user login pakai local/seeder account)
        if ($authUser) {
            $isSelf = false;
            if (!empty($approverData['employee_id']) && $authUser->employee_id === $approverData['employee_id']) {
                $isSelf = true;
            } elseif (!empty($approverData['name']) && strtolower($authUser->name) === strtolower(trim($approverData['name']))) {
                $isSelf = true;
            }

            if ($isSelf) {
                // Update employee_id user yang sedang login jika sebelumnya kosong
                if (empty($authUser->employee_id) && !empty($approverData['employee_id'])) {
                    $authUser->employee_id = $approverData['employee_id'];
                    $authUser->save();
                }
                return $authUser;
            }
        }

        // 2. Cari berdasarkan employee_id dari SSO
        if (!empty($approverData['employee_id'])) {
            $user = User::where('employee_id', $approverData['employee_id'])->first();
            if ($user) {
                return $user;
            }
        }

        // ApproverData from SSO might contain email, name, employee_id, role
        $email = $approverData['email'] ?? ($approverData['employee_id'] . '@inl.co.id');
        
        return User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $approverData['name'] ?? 'Approver',
                'employee_id' => $approverData['employee_id'] ?? null,
                'role' => $approverData['role'] ?? null,
                'password' => bcrypt(\Illuminate\Support\Str::random(16)),
            ]
        );
    }
}
