<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ppab;
use App\Models\Po;
use App\Models\Mis;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\DocumentSigningService;

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
                        'role' => $approverData['role'] ?? 'approver',
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
                        'role' => $approverData['role'] ?? 'approver',
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
                        'role' => $approverData['role'] ?? 'approver',
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
        $type = strtolower($type);
        if ($type === 'fund_settlement') {
            $type = 'fs';
        }

        $model    = null;
        $document = null;

        if ($type === 'ppab') {
            $model = \App\Models\PpabApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Ppab::find($model->ppab_id);
            }
        } elseif ($type === 'po') {
            $model = \App\Models\PoApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Po::find($model->po_id);
            }
        } elseif ($type === 'mis') {
            $model = \App\Models\MisApproverLine::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Mis::find($model->mis_id);
            }
        } elseif ($type === 'fs') {
            $model = \App\Models\FsApprover::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\FundSettlement::find($model->fs_id);
            }
        } elseif ($type === 'fr') {
            $model = \App\Models\FrApprover::where('id', $lineId)->where('approver_id', $userId)->first();
            if ($model) {
                $document = \App\Models\Fr::find($model->fr_id);
            }
        }

        if (!$model || !$document) {
            return response()->json(['success' => false, 'message' => 'Approval line not found or unauthorized.'], 404);
        }

        // ---------------------------------------------------------------
        // TRANSACTION: hanya operasi DB ringan (update status + token)
        // ---------------------------------------------------------------
        $shouldGeneratePdf = false;

        DB::transaction(function () use ($model, $status, $document, $type, &$shouldGeneratePdf) {
            $signingService = app(DocumentSigningService::class);

            $model->status = $status;
            if ($status === 'approved') {
                $model->signed_at = now();
                $signingService->generateVerifyToken($model); // hash + save: ringan, aman dalam transaction
            }
            $model->save();

            // Cek apakah SEMUA approver_line untuk dokumen ini sudah approved
            if ($status === 'approved') {
                $approverLines = collect();
                if ($type === 'fs') {
                    $approverLines = \App\Models\FsApprover::where('fs_id', $document->id)->lockForUpdate()->get();
                } elseif ($type === 'fr') {
                    $approverLines = \App\Models\FrApprover::where('fr_id', $document->id)->lockForUpdate()->get();
                } elseif ($type === 'ppab') {
                    $approverLines = \App\Models\PpabApproverLine::where('ppab_id', $document->id)->lockForUpdate()->get();
                } elseif ($type === 'po') {
                    $approverLines = \App\Models\PoApproverLine::where('po_id', $document->id)->lockForUpdate()->get();
                } elseif ($type === 'mis') {
                    $approverLines = \App\Models\MisApproverLine::where('mis_id', $document->id)->lockForUpdate()->get();
                }

                $totalLines    = $approverLines->count();
                $approvedLines = $approverLines->where('status', 'approved')->count();

                if ($totalLines > 0 && $totalLines === $approvedLines && empty($document->signed_pdf_path)) {
                    // Semua approver sudah menyetujui & PDF belum pernah di-generate
                    // Set flag — generateSignedPdf() dipanggil di LUAR transaction (heavy I/O)
                    $shouldGeneratePdf = true;
                }
            }
        });

        // ---------------------------------------------------------------
        // SETELAH TRANSACTION COMMIT: generate PDF (I/O berat, tidak perlu lock)
        // ---------------------------------------------------------------
        if ($shouldGeneratePdf) {
            try {
                $signingService = app(DocumentSigningService::class);
                $signingService->generateSignedPdf($type, $document->fresh());
            } catch (\Throwable $e) {
                // Jangan gagalkan response approve jika PDF gagal dibuat.
                // PDF dapat di-generate ulang lewat endpoint downloadSignedPdf.
                Log::error("[DocumentSigning] Gagal generate PDF setelah approve {$type}#{$document->id}: " . $e->getMessage(), [
                    'type'        => $type,
                    'document_id' => $document->id,
                    'exception'   => $e,
                ]);
            }
        }

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
