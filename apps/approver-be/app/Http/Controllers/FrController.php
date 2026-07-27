<?php

namespace App\Http\Controllers;

use App\Models\Fr;

class FrController extends Controller
{
    public function index()
    {
        $items = Fr::with('requester:id,name', 'kategoriFr:id,nama')
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
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }
}
