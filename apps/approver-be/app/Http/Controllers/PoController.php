<?php

namespace App\Http\Controllers;

use App\Models\Po;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoController extends Controller
{
    public function index()
    {
        $items = \App\Models\Po::with('user:id,name')
            ->latest()
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'nomor_po'    => $p->nomor_po,
                'nomor_ppab'  => $p->nomor_ppab,
                'vendor'      => $p->vendor,
                'user_id'     => $p->user_id,
                'user_name'   => $p->user?->name,
                'created_at'  => $p->created_at,
                'status'      => 'pending',
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
}
