<?php

namespace App\Http\Controllers;

use App\Models\FundSettlement;

class FsController extends Controller
{
    public function index()
    {
        $items = FundSettlement::with('requester:id,name')
            ->latest()
            ->get()
            ->map(fn($f) => [
                'id'                      => $f->id,
                'number_fs'               => $f->number_fs,
                'fr_id'                   => $f->fr_id,
                'requester_id'            => $f->requester_id,
                'requester_name'          => $f->requester?->name,
                'requester_date_time'     => $f->requester_date_time,
                'balance'                 => $f->balance,
                'balance_due_to_employee' => $f->balance_due_to_employee,
                'balance_due_to_company'  => $f->balance_due_to_company,
                'status'                  => $f->status ?? 'pending',
                'created_at'              => $f->created_at,
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }
}
