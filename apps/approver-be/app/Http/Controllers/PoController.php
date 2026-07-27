<?php

namespace App\Http\Controllers;

use App\Models\Po;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = \App\Models\Po::with(['user:id,name', 'approverLines'])->latest();

        if ($user->role !== 'super_admin') {
            $query->where(function($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('approverLines', function($q2) use ($user) {
                      $q2->where('approver_id', $user->id);
                  });
            });
        }

        $items = $query->get()->map(fn($p) => [
                'id'          => $p->id,
                'nomor_po'    => $p->nomor_po,
                'nomor_ppab'  => $p->nomor_ppab,
                'vendor'      => $p->vendor,
                'user_id'     => $p->user_id,
                'user_name'   => $p->user?->name,
                'created_at'  => $p->created_at,
                'status'      => 'pending',
                'can_cancel'  => !$p->approverLines->contains('status', 'approved'),
                'request_type'=> $p->user_id === $user->id ? 'Pengajuan Saya' : ($p->approverLines->contains('approver_id', $user->id) ? 'Butuh Approval Anda' : 'Lainnya'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_po' => 'required|string|max:255|unique:po,nomor_po',
            'vendor' => 'required|string|max:255',
            'nomor_ppab' => 'nullable|string|max:255',
            'user_id' => 'nullable|integer|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.deskripsi' => 'required|string',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.qty' => 'required|numeric',
            'items.*.harga_satuan' => 'required|numeric',
            'items.*.spec' => 'nullable|string',
            'subtotals' => 'nullable|array',
            'subtotals.*.deskripsi' => 'required|string',
            'subtotals.*.value' => 'required|numeric',
            'subtotals.*.currency' => 'nullable|string|max:10',
            'approver_lines' => 'nullable|array',
            'approver_lines.*.approver_id' => 'required|integer|exists:users,id',
            'approver_lines.*.role' => 'nullable|string|max:255',
            'approver_lines.*.status' => 'nullable|string|in:pending,approved,rejected',
            'approver_lines.*.timestamp' => 'nullable|date',
        ]);

        $userId = auth()->id() ?? ($data['user_id'] ?? null);
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $po = DB::transaction(function () use ($data, $userId) {
            $po = Po::create([
                'user_id' => $userId,
                'nomor_po' => $data['nomor_po'],
                'nomor_ppab' => $data['nomor_ppab'] ?? null,
                'vendor' => $data['vendor'],
            ]);

            foreach ($data['items'] as $item) {
                $po->itemLines()->create([
                    'deskripsi' => $item['deskripsi'],
                    'satuan' => $item['satuan'],
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'spec' => $item['spec'] ?? null,
                ]);
            }

            if (!empty($data['subtotals'])) {
                foreach ($data['subtotals'] as $subtotal) {
                    $po->subtotals()->create([
                        'deskripsi' => $subtotal['deskripsi'],
                        'value' => $subtotal['value'],
                        'currency' => $subtotal['currency'] ?? 'IDR',
                    ]);
                }
            }

            if (!empty($data['approver_lines'])) {
                foreach ($data['approver_lines'] as $line) {
                    $po->approverLines()->create([
                        'approver_id' => $line['approver_id'],
                        'role' => $line['role'] ?? 'approver',
                        'status' => $line['status'] ?? 'pending',
                        'timestamp' => $line['timestamp'] ?? null,
                    ]);
                }
            }

            return $po->load('itemLines', 'subtotals', 'approverLines');
        });

        return response()->json([
            'success' => true,
            'data' => $po,
        ], 201);
    }

    public function show($id)
    {
        $po = Po::with(['user:id,name', 'itemLines', 'subtotals', 'approverLines.approver:id,name'])->findOrFail($id);
        
        $user = auth()->user();
        $isOwner = $po->user_id === $user->id;
        $isApprover = $po->approverLines->contains('approver_id', $user->id);
        
        if (!$isOwner && !$isApprover && $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this document.'], 403);
        }

        $po->request_type = $isOwner ? 'Pengajuan Saya' : ($isApprover ? 'Butuh Approval Anda' : 'Lainnya');
        $po->can_cancel = !$po->approverLines->contains('status', 'approved');
        $po->current_user_id = $user->id;

        return response()->json([
            'success' => true,
            'data' => $po
        ]);
    }

    public function destroy($id)
    {
        $po = Po::with('approverLines')->findOrFail($id);

        $hasApproved = $po->approverLines()->where('status', 'approved')->exists();

        if ($hasApproved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak dapat dihapus karena sudah ada approval yang disetujui.'
            ], 409);
        }

        DB::transaction(function () use ($po) {
            $po->approverLines()->delete();
            $po->itemLines()->delete();
            $po->subtotals()->delete();
            $po->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pengajuan PO berhasil dihapus.']);
    }
}
