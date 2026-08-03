<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\DocumentSigningService;
use App\Models\FundSettlement;
use App\Models\Ppab;
use App\Models\Po;
use App\Models\Mis;
use App\Models\Fr;
use App\Models\FsApprover;
use App\Models\PpabApproverLine;
use App\Models\PoApproverLine;
use App\Models\MisApproverLine;
use App\Models\FrApprover;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DocumentSigningController extends Controller
{
    protected $signingService;

    public function __construct(DocumentSigningService $signingService)
    {
        $this->signingService = $signingService;
    }

    /**
     * Halaman publik untuk verifikasi QR Code tanda tangan digital.
     */
    public function verify(Request $request, string $documentType, $documentId, $approverLineId)
    {
        $token = $request->query('token');
        $documentType = strtolower($documentType);

        if (empty($token)) {
            return view('verify-document', [
                'isValid' => false,
                'errorMessage' => 'Token verifikasi tidak diberikan dalam URL.',
            ]);
        }

        $approverLine = null;
        $document = null;
        $docNumber = '-';

        if ($documentType === 'fs' || $documentType === 'fund_settlement') {
            $approverLine = FsApprover::with('approver')->find($approverLineId);
            $document = FundSettlement::find($documentId);
            $docNumber = $document->number_fs ?? "FS-{$documentId}";
        } elseif ($documentType === 'ppab') {
            $approverLine = PpabApproverLine::with('approver')->find($approverLineId);
            $document = Ppab::find($documentId);
            $docNumber = $document->nomor_ppab ?? "PPAB-{$documentId}";
        } elseif ($documentType === 'po') {
            $approverLine = PoApproverLine::with('approver')->find($approverLineId);
            $document = Po::find($documentId);
            $docNumber = $document->nomor_po ?? "PO-{$documentId}";
        } elseif ($documentType === 'mis') {
            $approverLine = MisApproverLine::with('approver')->find($approverLineId);
            $document = Mis::find($documentId);
            $docNumber = $document->nomor_mis ?? "MIS-{$documentId}";
        } elseif ($documentType === 'fr') {
            $approverLine = FrApprover::with('approver')->find($approverLineId);
            $document = Fr::find($documentId);
            $docNumber = $document->number_fr ?? "FR-{$documentId}";
        }

        if (!$approverLine || !$document) {
            return view('verify-document', [
                'isValid' => false,
                'errorMessage' => 'Dokumen atau data persetujuan tidak ditemukan.',
            ]);
        }

        if ($approverLine->verify_token !== $token) {
            return view('verify-document', [
                'isValid' => false,
                'errorMessage' => 'Token verifikasi tidak valid atau tidak cocok.',
            ]);
        }

        $approverUser = $approverLine->approver;

        return view('verify-document', [
            'isValid'        => true,
            'documentType'   => $documentType,
            'documentNumber' => $docNumber,
            'approverName'   => $approverUser->name ?? 'User #' . $approverLine->approver_id,
            'approverRole'   => $approverLine->role ?? $approverUser->role ?? 'Approver',
            'signedAt'       => $approverLine->signed_at ? Carbon::parse($approverLine->signed_at, 'UTC')->setTimezone('Asia/Jakarta')->format('d F Y H:i:s') : '-',
        ]);
    }

    /**
     * Endpoint untuk mendownload/melihat PDF resmi bertanda tangan digital.
     */
    public function downloadSignedPdf(Request $request, ...$args)
    {
        $route = $request->route();
        $documentType = strtolower($route->defaults['documentType'] ?? $route->parameter('documentType') ?? '');
        $id = $route->parameter('id');

        Log::info("[downloadSignedPdf] Corrected params: documentType={$documentType}, id={$id}");

        $document = null;

        if ($documentType === 'fs' || $documentType === 'fund_settlement') {
            $documentType = 'fs';
            $document = FundSettlement::with(['itemLines', 'fr.itemLines.itemLineTaxes', 'requester', 'approvers.approver'])->find($id);
        } elseif ($documentType === 'ppab') {
            $document = Ppab::with('items', 'user', 'approverLines.approver')->find($id);
        } elseif ($documentType === 'po') {
            $document = Po::with('itemLines', 'user', 'approverLines.approver')->find($id);
        } elseif ($documentType === 'mis') {
            $document = Mis::with('itemLines', 'user', 'approverLines.approver')->find($id);
        } elseif ($documentType === 'fr') {
            $document = Fr::with(['itemLines.itemLineTaxes', 'requester', 'approvers.approver'])->find($id);
        }

        if (!$document) {
            Log::warning("[downloadSignedPdf] Document NOT found for type={$documentType}, id={$id}");
            return response()->json(['success' => false, 'message' => 'Dokumen tidak ditemukan.'], 404);
        }

        // Keamanan data: Otentikasi dan otorisasi akses PDF
        $user = auth()->user();
        if ($user) {
            $ownerId = $document->user_id ?? $document->requester_id ?? null;
            $isOwner = $ownerId === $user->id;
            $approvers = $document->approverLines ?? $document->approvers ?? collect();
            $isApprover = $approvers->contains('approver_id', $user->id);

            if (!$isOwner && !$isApprover && $user->role !== 'super_admin') {
                return response()->json(['success' => false, 'message' => 'Anda tidak memiliki akses ke PDF dokumen ini.'], 403);
            }
        }

        // Cek apakah PDF sudah di-generate sebelumnya (regenerate jika dimintai atau template berubah)
        $filePath = null;
        if (!empty($document->signed_pdf_path) && !$request->has('regenerate') && $request->query('refresh') !== 'true') {
            $fullPath = storage_path('app/' . $document->signed_pdf_path);
            if (file_exists($fullPath)) {
                $filePath = $fullPath;
            }
        }

        // Jika file PDF bertanda tangan/ter-stamp belum di-cache, generate PDF (sesuai status stamp saat ini)
        if (!$filePath) {
            $filePath = $this->signingService->generateSignedPdf($documentType, $document);
        }

        if (!$filePath || !file_exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'File PDF tidak dapat ditemukan.'], 404);
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($filePath) . '"'
        ]);
    }
}
