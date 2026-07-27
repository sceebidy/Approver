<?php

namespace App\Http\Controllers;

use App\Models\Ppab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PpabController extends Controller
{
    public function index()
    {
        $items = \App\Models\Ppab::with(['user:id,name', 'approverLines'])
            ->latest()
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'nomor_ppab'  => $p->nomor_ppab,
                'deskripsi'   => $p->deskripsi,
                'user_id'     => $p->user_id,
                'user_name'   => $p->user?->name,
                'created_at'  => $p->created_at,
                'status'      => 'pending',
                'can_cancel'  => !$p->approverLines->contains('status', 'approved'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_ppab' => 'required|string|max:255|unique:ppab,nomor_ppab',
            'deskripsi' => 'required|string',
            'user_id' => 'nullable|integer|exists:users,id',
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
