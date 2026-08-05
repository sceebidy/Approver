<?php

namespace App\Http\Controllers;

use App\Models\Mis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class MisController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = \App\Models\Mis::with(['user:id,name', 'approverLines'])->latest();

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
                'nomor_mis'   => $p->nomor_mis,
                'tgl_mis'     => $p->tgl_mis ? $p->tgl_mis : null,
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
            'nomor_mis' => 'required|string|max:255|unique:mis,nomor_mis',
            'tgl_mis' => 'required|string',
            'source_pdf_path' => 'nullable|string|max:500',
            'user_id' => 'nullable|integer|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.desc' => 'required|string',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.qty' => 'required|numeric',
            'items.*.remark' => 'nullable|string',
            'approver_lines' => 'nullable|array',
            'approver_lines.*.approver_id' => 'required|integer|exists:users,id',
            'approver_lines.*.role' => 'required|string|in:requestor,checker,issuer,approver',
            'approver_lines.*.status' => 'nullable|string|in:pending,approval,rejected',
            'approver_lines.*.timestamp' => 'nullable|date',
        ]);

        $tglMis = $this->parseMisDate($data['tgl_mis']);
        if (!$tglMis) {
            return response()->json([
                'success' => false,
                'message' => 'Format tgl_mis harus dd/mm/YYYY or YYYY-mm-dd.',
            ], 422);
        }

        $userId = auth()->id() ?? ($data['user_id'] ?? null);
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $mis = DB::transaction(function () use ($data, $userId, $tglMis) {
            $mis = Mis::create([
                'user_id' => $userId,
                'nomor_mis' => $data['nomor_mis'],
                'tgl_mis' => $tglMis->format('Y-m-d'),
                'source_pdf_path' => $data['source_pdf_path'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $mis->itemLines()->create([
                    'desc' => $item['desc'],
                    'satuan' => $item['satuan'],
                    'qty' => $item['qty'],
                    'remark' => $item['remark'] ?? null,
                ]);
            }

            if (!empty($data['approver_lines'])) {
                foreach ($data['approver_lines'] as $line) {
                    $mis->approverLines()->create([
                        'approver_id' => $line['approver_id'],
                        'role' => $line['role'],
                        'status' => $line['status'] ?? 'pending',
                        'timestamp' => $line['timestamp'] ?? null,
                    ]);
                }
            }

            return $mis->load('itemLines', 'approverLines');
        });

        return response()->json([
            'success' => true,
            'data' => $mis,
        ], 201);
    }

    public function show($id)
    {
        $mis = Mis::with(['user:id,name', 'itemLines', 'approverLines.approver:id,name', 'attachments'])->findOrFail($id);
        
        $user = auth()->user();
        $isOwner = $mis->user_id === $user->id;
        $isApprover = $mis->approverLines->contains('approver_id', $user->id);
        
        if (!$isOwner && !$isApprover && $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this document.'], 403);
        }

        $mis->request_type = $isOwner ? 'Pengajuan Saya' : ($isApprover ? 'Butuh Approval Anda' : 'Lainnya');
        $mis->can_cancel = !$mis->approverLines->contains('status', 'approved');
        $mis->current_user_id = $user->id;

        $mis->attachments_list = $mis->attachments->map(function ($att) {
            return [
                'id'            => $att->id,
                'filename'      => basename($att->filename),
                'original_name' => $att->original_name ?? basename($att->filename),
                'file_size'     => $att->file_size,
                'mime_type'     => $att->mime_type,
                'url'           => url('/api/mis/attachment/' . $att->id),
                'created_at'    => $att->created_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $mis
        ]);
    }

    public function destroy($id)
    {
        $mis = Mis::with('approverLines')->findOrFail($id);

        $hasApproved = $mis->approverLines()->where('status', 'approved')->exists();

        if ($hasApproved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak dapat dihapus karena sudah ada approval yang disetujui.'
            ], 409);
        }

        DB::transaction(function () use ($mis) {
            $mis->approverLines()->delete();
            $mis->itemLines()->delete();
            $mis->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pengajuan MIS berhasil dihapus.']);
    }

    private function parseMisDate(string $date)
    {
        foreach (['d/m/Y', 'Y-m-d'] as $format) {
            try {
                return Carbon::createFromFormat($format, $date);
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }
}
