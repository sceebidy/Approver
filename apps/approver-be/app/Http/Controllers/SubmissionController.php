<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ppab;
use App\Models\Po;
use App\Models\Mis;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubmissionController extends Controller
{
    /**
     * Handle document submission.
     */
    public function create(Request $request)
    {
        $request->validate([
            'type' => 'required|in:ppab,po,mis',
            'data' => 'required|array',
            'approvers' => 'required|array|min:1', // array of employee IDs or emails
        ]);

        $type = $request->type;
        $data = $request->data;
        $approvers = $request->approvers;
        $user = $request->user();

        try {
            DB::beginTransaction();

            $documentId = null;

            if ($type === 'ppab') {
                $ppab = Ppab::create([
                    'user_id' => $user->id,
                    'deskripsi' => $data['deskripsi'] ?? 'Pengajuan PPAB',
                    'nomor_ppab' => $data['nomor_ppab'] ?? 'PPAB-' . time(),
                ]);
                $documentId = $ppab->id;

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $ppab->approverLines()->create([
                        'approver_id' => $approver->id,
                        'status' => 'pending'
                    ]);
                }
            } elseif ($type === 'po') {
                $po = Po::create([
                    'user_id' => $user->id,
                    'nomor_po' => $data['nomor_po'] ?? 'PO-' . time(),
                    'nomor_ppab' => $data['nomor_ppab'] ?? null,
                    'vendor' => $data['vendor'] ?? 'Unknown Vendor',
                ]);
                $documentId = $po->id;

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $po->approverLines()->create([
                        'approver_id' => $approver->id,
                        'status' => 'pending'
                    ]);
                }
            } elseif ($type === 'mis') {
                $mis = Mis::create([
                    'user_id' => $user->id,
                    'nomor_mis' => $data['nomor_mis'] ?? 'MIS-' . time(),
                    'tgl_mis' => $data['tgl_mis'] ?? now()->toDateString(),
                ]);
                $documentId = $mis->id;

                foreach ($approvers as $approverData) {
                    $approver = $this->getOrCreateUser($approverData);
                    $mis->approverLines()->create([
                        'approver_id' => $approver->id,
                        'role' => 'approver', // default role required by DB
                        'status' => 'pending'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => strtoupper($type) . ' submission created successfully.',
                'data' => ['id' => $documentId]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Submission error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create submission: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending approvals for the current user.
     */
    public function pendingApprovals(Request $request)
    {
        $userId = $request->user()->id;

        $ppabPending = \App\Models\PpabApproverLine::with('ppab')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->ppab_id,
                    'type' => 'ppab',
                    'number' => $item->ppab->nomor_ppab ?? 'N/A',
                    'description' => $item->ppab->deskripsi ?? '',
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $poPending = \App\Models\PoApproverLine::with('po')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->po_id,
                    'type' => 'po',
                    'number' => $item->po->nomor_po ?? 'N/A',
                    'description' => 'Vendor: ' . ($item->po->vendor ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $misPending = \App\Models\MisApproverLine::with('mis')
            ->where('approver_id', $userId)
            ->where('status', 'pending')
            ->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'document_id' => $item->mis_id,
                    'type' => 'mis',
                    'number' => $item->mis->nomor_mis ?? 'N/A',
                    'description' => 'Date: ' . ($item->mis->tgl_mis ?? ''),
                    'status' => $item->status,
                    'created_at' => $item->created_at,
                ];
            });

        $allPending = collect()->merge($ppabPending)->merge($poPending)->merge($misPending)->sortByDesc('created_at')->values();

        return response()->json([
            'success' => true,
            'data' => $allPending
        ]);
    }

    /**
     * Approve a document
     */
    public function approve(Request $request, $type, $lineId)
    {
        return $this->updateApprovalStatus($request, $type, $lineId, 'approved');
    }

    /**
     * Reject a document
     */
    public function reject(Request $request, $type, $lineId)
    {
        return $this->updateApprovalStatus($request, $type, $lineId, 'rejected');
    }

    private function updateApprovalStatus(Request $request, $type, $lineId, $status)
    {
        $userId = $request->user()->id;
        $model = null;

        if ($type === 'ppab') {
            $model = \App\Models\PpabApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
        } elseif ($type === 'po') {
            $model = \App\Models\PoApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
        } elseif ($type === 'mis') {
            $model = \App\Models\MisApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
        }

        if (!$model) {
            return response()->json(['success' => false, 'message' => 'Approval line not found or unauthorized.'], 404);
        }

        $model->status = $status;
        $model->timestamp = now();
        $model->save();

        return response()->json([
            'success' => true,
            'message' => "Document successfully {$status}."
        ]);
    }

    private function getOrCreateUser($approverData)
    {
        // ApproverData from SSO might contain email, name, employee_id, role
        $email = $approverData['email'] ?? ($approverData['employee_id'] . '@inl.co.id');
        
        return User::firstOrCreate(
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
