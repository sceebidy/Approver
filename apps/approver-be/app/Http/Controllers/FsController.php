<?php

namespace App\Http\Controllers;

use App\Models\Fr;
use App\Models\FundSettlement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function store(Request $request)
    {
        $data = $request->validate([
            'fr_id' => 'required|integer|exists:fr,id',
            'number_fs' => 'required|string|max:255|unique:fund_settlement,number_fs',
            'balance' => 'nullable|numeric',
            'balance_due_to_employee' => 'nullable|numeric',
            'balance_due_to_company' => 'nullable|numeric',
            'status' => 'nullable|string|in:draft,submitted',
            'items' => 'required|array|min:1',
            'items.*.deskripsi' => 'required|string',
            'items.*.total' => 'required|numeric',
            'approver_lines' => 'nullable|array',
            'approver_lines.*.approver_id' => 'required|integer|exists:users,id',
            'approver_lines.*.role' => 'required|string|in:atasan,checkedby,approvedby',
        ]);

        $userId = auth()->id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $fr = Fr::find($data['fr_id']);
        if (!$fr || $fr->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Fund Settlement hanya dapat dibuat untuk Fund Request (FR) yang berstatus "approved".',
            ], 422);
        }

        $fs = DB::transaction(function () use ($data, $userId) {
            $status = $data['status'] ?? 'submitted';

            $fs = FundSettlement::create([
                'requester_id' => $userId,
                'fr_id' => $data['fr_id'],
                'requester_date_time' => now(),
                'number_fs' => $data['number_fs'],
                'balance' => $data['balance'] ?? 0,
                'balance_due_to_employee' => $data['balance_due_to_employee'] ?? 0,
                'balance_due_to_company' => $data['balance_due_to_company'] ?? 0,
                'status' => $status,
            ]);

            foreach ($data['items'] as $item) {
                $fs->itemLines()->create([
                    'deskripsi' => $item['deskripsi'],
                    'total' => $item['total'],
                    'timestamp' => now(),
                ]);
            }

            if (!empty($data['approver_lines'])) {
                foreach ($data['approver_lines'] as $app) {
                    $fs->approvers()->create([
                        'approver_id' => $app['approver_id'],
                        'role' => $app['role'],
                        'status' => 'pending',
                        'update_date_time' => null,
                    ]);
                }
            }

            return $fs->load('itemLines', 'approvers.approver');
        });

        return response()->json([
            'success' => true,
            'data' => $fs,
        ], 201);
    }
}

