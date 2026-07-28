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
        $user = auth()->user();
        $query = Fr::with('requester:id,name', 'kategoriFr:id,nama', 'approvers')->latest();

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
            $totalLines = $approverLines->count();
            $approvedCount = $approverLines->where('status', 'approved')->count();
            $rejectedCount = $approverLines->where('status', 'rejected')->count();

            $status = 'pending';
            if ($rejectedCount > 0) {
                $status = 'rejected';
            } elseif ($totalLines > 0 && $approvedCount === $totalLines) {
                $status = 'approved';
            } elseif ($f->status === 'draft') {
                $status = 'draft';
            }

            return [
                'id'                => $f->id,
                'number_fr'         => $f->number_fr,
                'requester_id'      => $f->requester_id,
                'requester_name'    => $f->requester?->name,
                'kategori_fr_id'    => $f->kategori_fr_id,
                'kategori_fr_name'  => $f->kategoriFr?->nama,
                'request_date_time' => $f->request_date_time,
                'status'            => $status,
                'keterangan'        => $f->keterangan,
                'created_at'        => $f->created_at,
                'can_cancel'        => !$approverLines->contains('status', 'approved'),
                'request_type'      => $f->requester_id === $user->id ? 'Pengajuan Saya' : ($approverLines->contains('approver_id', $user->id) ? 'Butuh Approval Anda' : 'Lainnya'),
            ];
        });

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show($id)
    {
        $fr = Fr::with([
            'requester:id,name',
            'kategoriFr:id,nama',
            'itemLines.itemLineTaxes.tax',
            'approvers.approver:id,name'
        ])->findOrFail($id);

        $currentUser = auth()->user();
        $isOwner = $fr->requester_id === $currentUser->id;
        $isApprover = $fr->approvers->contains('approver_id', $currentUser->id);

        if (!$isOwner && !$isApprover && $currentUser->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to this document.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $fr->id,
                'number_fr' => $fr->number_fr,
                'keterangan' => $fr->keterangan,
                'currency' => $fr->currency,
                'created_at' => $fr->created_at->toIso8601String(),
                'status' => $fr->status,
                'request_type' => $isOwner ? 'Pengajuan Saya' : ($isApprover ? 'Butuh Approval Anda' : 'Lainnya'),
                'can_cancel' => !$fr->approvers->contains('status', 'approved'),
                'user' => [
                    'name' => $fr->requester?->name
                ],
                'kategori_fr_name' => $fr->kategoriFr?->nama,
                'items' => $fr->itemLines->map(function($line) {
                    return [
                        'deskripsi' => $line->deskripsi,
                        'sub_total' => $line->sub_total,
                        'total' => $line->total,
                        'taxes' => $line->itemLineTaxes->map(function($taxLine) {
                            return [
                                'name' => $taxLine->tax->name ?? 'Pajak',
                                'value' => $taxLine->value
                            ];
                        })
                    ];
                }),
                'approver_lines' => $fr->approvers->map(function($app) {
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

        $kategori = KategoriFr::findOrFail($data['kategori_fr_id']);

        $fr = DB::transaction(function () use ($data, $userId, $kategori) {
            $status = $data['status'] ?? 'submitted';

            $fr = Fr::create([
                'requester_id' => $userId,
                'seksi_id' => null,
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

            foreach ($data['approver_lines'] as $app) {
                $userModel = $this->getOrCreateUser($app);
                $fr->approvers()->create([
                    'approver_id' => $userModel->id,
                    'role' => $app['role'],
                    'status' => 'pending',
                    'update_date_time' => null,
                ]);
            }

            // Sync physical document status to database based on new lines
            $totalLines = count($data['approver_lines']);
            $fr->status = $totalLines > 0 ? 'pending' : 'approved';
            $fr->save();

            return $fr->load('itemLines.itemLineTaxes', 'approvers.approver');
        });

        return response()->json([
            'success' => true,
            'data' => $fr,
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

