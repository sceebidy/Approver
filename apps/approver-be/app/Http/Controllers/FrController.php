<?php

namespace App\Http\Controllers;

use App\Models\Fr;
use App\Models\KategoriFr;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FrController extends Controller
{
    public function index()
    {
        $items = Fr::with('requester:id,name', 'kategoriFr:id,nama', 'approvers')
            ->latest()
            ->get()
            ->map(fn($f) => [
                'id'                => $f->id,
                'number_fr'         => $f->number_fr,
                'requester_id'      => $f->requester_id,
                'requester_name'    => $f->requester?->name,
                'kategori_fr_id'    => $f->kategori_fr_id,
                'kategori_fr_name'  => $f->kategoriFr?->nama,
                'request_date_time' => $f->request_date_time,
                'status'            => $f->status ?? 'pending',
                'keterangan'        => $f->keterangan,
                'created_at'        => $f->created_at,
                'can_cancel'        => !$f->approvers->contains('status', 'approved'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function categories()
    {
        $categories = KategoriFr::all();
        $taxes = Tax::all();
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categories,
                'taxes' => $taxes,
            ]
        ]);
    }

    public function approvedList()
    {
        $userId = auth()->id();
        $items = Fr::where('requester_id', $userId)
            ->where('status', 'approved')
            ->latest()
            ->get(['id', 'number_fr', 'keterangan', 'request_date_time']);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'number_fr' => 'required|string|max:255|unique:fr,number_fr',
            'kategori_fr_id' => 'required|integer|exists:kategori_fr,id',
            'currency' => 'nullable|string|max:10',
            'keterangan' => 'nullable|string',
            'status' => 'nullable|string|in:draft,submitted',
            'items' => 'required|array|min:1',
            'items.*.deskripsi' => 'required|string',
            'items.*.sub_total' => 'required|numeric',
            'items.*.taxes' => 'nullable|array',
            'items.*.taxes.*.tax_id' => 'required|integer|exists:tax,id',
            'items.*.taxes.*.value' => 'required|numeric',
        ]);

        $userId = auth()->id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $kategori = KategoriFr::with('approverKategoriFr')->findOrFail($data['kategori_fr_id']);

        $fr = DB::transaction(function () use ($data, $userId, $kategori) {
            $status = $data['status'] ?? 'submitted';

            $fr = Fr::create([
                'requester_id' => $userId,
                'seksi_id' => $kategori->seksi_id,
                'kategori_fr_id' => $kategori->id,
                'currency' => $data['currency'] ?? 'IDR',
                'request_date_time' => now(),
                'number_fr' => $data['number_fr'],
                'keterangan' => $data['keterangan'] ?? null,
                'status' => $status,
            ]);

            foreach ($data['items'] as $item) {
                $subTotal = (float) $item['sub_total'];
                $totalTax = 0;
                
                if (!empty($item['taxes']) && is_array($item['taxes'])) {
                    foreach ($item['taxes'] as $tax) {
                        $totalTax += (float) $tax['value'];
                    }
                }

                $total = $subTotal + $totalTax;

                $itemLine = $fr->itemLines()->create([
                    'deskripsi' => $item['deskripsi'],
                    'sub_total' => $subTotal,
                    'total' => $total,
                    'time_stamp' => now(),
                ]);

                if (!empty($item['taxes']) && is_array($item['taxes'])) {
                    foreach ($item['taxes'] as $tax) {
                        $itemLine->itemLineTaxes()->create([
                            'tax_id' => $tax['tax_id'],
                            'value' => $tax['value'],
                            'timestamp' => now(),
                        ]);
                    }
                }
            }

            foreach ($kategori->approverKategoriFr as $approverKat) {
                $fr->approvers()->create([
                    'approver_id' => $approverKat->user_id,
                    'role' => $approverKat->role,
                    'status' => 'pending',
                    'update_date_time' => null,
                ]);
            }

            return $fr->load('itemLines.itemLineTaxes', 'approvers.approver');
        });

        return response()->json([
            'success' => true,
            'data' => $fr,
        ], 201);
    }

    public function destroy($id)
    {
        $fr = Fr::with('approvers')->findOrFail($id);

        $hasApproved = $fr->approvers()->where('status', 'approved')->exists();

        if ($hasApproved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak dapat dihapus karena sudah ada approval yang disetujui.'
            ], 409);
        }

        DB::transaction(function () use ($fr) {
            $fr->approvers()->delete();
            $fr->itemLines()->delete(); // relasi itemLines() di model Fr
            $fr->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pengajuan FR berhasil dihapus.']);
    }
}

