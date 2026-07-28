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
        $user = auth()->user();
        $query = FundSettlement::with('requester:id,name', 'approvers')->latest();

        $showAll = request()->query('all') == '1' && $user->role === 'super_admin';
        if (!$showAll) {
            $query->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                  ->orWhereHas('approvers', function ($q2) use ($user) {
                      $q2->where('approver_id', $user->id);
                  });
            });
        }

        $items = $query->get()->map(function ($f) use ($user) {
            $approverLines = $f->approvers;
            return [
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
                'request_type'            => $f->requester_id === $user->id ? 'Pengajuan Saya' : ($approverLines->contains('approver_id', $user->id) ? 'Butuh Approval Anda' : 'Lainnya'),
            ];
        });

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show($id)
    {
        $fs = FundSettlement::with([
            'requester:id,name',
            'itemLines',
            'approvers.approver:id,name'
        ])->findOrFail($id);

        $currentUser = auth()->user();
        $isOwner = $fs->requester_id === $currentUser->id;
        $isApprover = $fs->approvers->contains('approver_id', $currentUser->id);

        if (!$isOwner && !$isApprover && $currentUser->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this document.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $fs->id,
                'number_fs' => $fs->number_fs,
                'balance' => $fs->balance,
                'balance_due_to_employee' => $fs->balance_due_to_employee,
                'balance_due_to_company' => $fs->balance_due_to_company,
                'created_at' => $fs->created_at->toIso8601String(),
                'status' => $fs->status,
                'request_type' => $isOwner ? 'Pengajuan Saya' : ($isApprover ? 'Butuh Approval Anda' : 'Lainnya'),
                'can_cancel' => !$fs->approvers->contains('status', 'approved'),
                'user' => [
                    'name' => $fs->requester?->name
                ],
                'items' => $fs->itemLines->map(function($line) {
                    return [
                        'deskripsi' => $line->deskripsi,
                        'total' => $line->total,
                    ];
                }),
                'approver_lines' => $fs->approvers->map(function($app) {
                    return [
                        'id' => $app->id,
                        'approver_id' => $app->approver_id,
                        'role' => $app->role,
                        'status' => $app->status,
                        'timestamp' => $app->update_date_time?->toIso8601String(),
                        'approver' => [
                            'id' => $app->approver?->id,
                            'name' => $app->approver?->name,
                        ]
                    ];
                }),
                'current_user_id' => $currentUser->id
            ]
        ]);
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
            'approver_lines' => 'required|array|min:1',
            'approver_lines.*.employee_id' => 'required|string',
            'approver_lines.*.role' => 'required|string',
            'approver_lines.*.name' => 'nullable|string',
            'approver_lines.*.email' => 'nullable|string',
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
                    $userModel = $this->getOrCreateUser($app);
                    $fs->approvers()->create([
                        'approver_id' => $userModel->id,
                        'role' => $app['role'],
                        'status' => 'pending',
                        'update_date_time' => null,
                    ]);
                }
            }

            // Sync physical document status to database based on new lines
            if ($status === 'submitted') {
                $totalLines = count($data['approver_lines']);
                $fs->status = $totalLines > 0 ? 'pending' : 'approved';
                $fs->save();
            }

            return $fs->load('itemLines', 'approvers.approver');
        });

        return response()->json([
            'success' => true,
            'data' => $fs,
        ], 201);
    }

    private function getOrCreateUser($approverData)
    {
        if (!empty($approverData['employee_id'])) {
            $user = \App\Models\User::where('employee_id', $approverData['employee_id'])->first();
            if ($user) {
                return $user;
            }
        }

        $email = $approverData['email'] ?? ($approverData['employee_id'] . '@inl.co.id');
        
        return \App\Models\User::firstOrCreate(
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

