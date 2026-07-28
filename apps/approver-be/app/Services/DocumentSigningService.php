<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use PDF; // Barryvdh\DomPDF\Facade\Pdf
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DocumentSigningService
{
    /**
     * Generate token verifikasi unik untuk approver line dan simpan signed_at.
     */
    public function generateVerifyToken($approverLine): string
    {
        if (empty($approverLine->verify_token)) {
            $token = hash('sha256', $approverLine->id . '_' . microtime(true) . '_' . config('app.key') . '_' . Str::random(16));
            $approverLine->verify_token = $token;
        }

        if (empty($approverLine->signed_at)) {
            $approverLine->signed_at = now();
        }

        $approverLine->save();

        return $approverLine->verify_token;
    }

    /**
     * Generate QR Code sebagai Base64 SVG Image Data URI untuk digunakan di DomPDF HTML.
     */
    public function generateQrForApprover(string $documentType, $documentId, $approverLine): string
    {
        $token = $this->generateVerifyToken($approverLine);
        
        $appUrl = rtrim(config('app.url', 'http://127.0.0.1:8000'), '/');
        $verifyUrl = "{$appUrl}/verify/{$documentType}/{$documentId}/{$approverLine->id}?token={$token}";

        // Generate SVG string using SimpleQrCode
        try {
            $svgContent = QrCode::format('svg')->size(100)->margin(1)->generate($verifyUrl);
            $base64Svg = base64_encode($svgContent);
            return 'data:image/svg+xml;base64,' . $base64Svg;
        } catch (\Exception $e) {
            Log::error("Failed generating QR code: " . $e->getMessage());
            return '';
        }
    }

    /**
     * Generate PDF resmi bertanda tangan digital jika semua approver_line sudah approved.
     */
    public function generateSignedPdf(string $documentType, $document): ?string
    {
        $documentType = strtolower($documentType);
        if ($documentType === 'fund_settlement') {
            $documentType = 'fs';
        }

        // Load relasi lengkap untuk dokumen jika belum di-load
        if ($documentType === 'ppab' && method_exists($document, 'items')) {
            $document->loadMissing(['items.lineSpecs', 'subtotals', 'user']);
        } elseif ($documentType === 'po' && method_exists($document, 'itemLines')) {
            $document->loadMissing(['itemLines', 'user']);
        } elseif ($documentType === 'mis' && method_exists($document, 'itemLines')) {
            $document->loadMissing(['itemLines', 'user']);
        } elseif ($documentType === 'fs' && method_exists($document, 'itemLines')) {
            $document->loadMissing(['itemLines', 'requester']);
        }

        // Tentukan relasi approver_line berdasarkan jenis dokumen
        $approvers = collect();
        if ($documentType === 'fs' || $documentType === 'fr') {
            $approvers = $document->approvers()->with('approver')->where('status', 'approved')->get();
        } elseif (method_exists($document, 'approverLines')) {
            $approvers = $document->approverLines()->with('approver')->where('status', 'approved')->get();
        }

        // Urutkan approvers berdasarkan 4 role berjenjang eksplisit
        $roleOrder = [
            'issued_by'          => 1,
            'checked_by'         => 2,
            'checkedby'          => 2,
            'approved_by'        => 3,
            'approvedby'         => 3,
            'approved_by_atasan' => 4,
            'atasan'             => 4,
        ];

        $approvers = $approvers->sortBy(function ($line) use ($roleOrder) {
            $roleKey = strtolower(trim($line->role ?? ''));
            return $roleOrder[$roleKey] ?? 99;
        })->values();

        // Siapkan QR Code data URI untuk setiap approver yang approved
        $signedApprovers = [];
        foreach ($approvers as $line) {
            $qrBase64 = $this->generateQrForApprover($documentType, $document->id, $line);
            
            $approverUser = $line->approver;
            $signedApprovers[] = [
                'line_id'      => $line->id,
                'role'         => str_replace('_', ' ', $line->role ?? 'Approver'),
                'name'         => $approverUser->name ?? 'User #' . $line->approver_id,
                'jabatan'      => $approverUser->role ?? $approverUser->unit_nama ?? 'Pejabat Berwenang',
                'signed_at'    => $line->signed_at ? \Carbon\Carbon::parse($line->signed_at)->format('d/m/Y H:i') : now()->format('d/m/Y H:i'),
                'qr_code_base64' => $qrBase64,
                'verify_url'   => url("/verify/{$documentType}/{$document->id}/{$line->id}?token={$line->verify_token}"),
            ];
        }

        // Pilih Blade view berdasarkan documentType
        $viewName = "pdf.{$documentType}";
        if ($documentType === 'fs') {
            $viewName = 'pdf.fund-settlement';
        }

        if (!view()->exists($viewName)) {
            $viewName = 'pdf.generic-document';
        }

        // Render PDF menggunakan DomPDF
        $pdf = PDF::loadView($viewName, [
            'doc' => $document,
            'documentType' => strtoupper($documentType),
            'signedApprovers' => $signedApprovers,
        ]);

        $pdf->setPaper('a4', 'portrait');

        // Pastikan direktori penyimpanan ada
        $dirPath = storage_path('app/signed-documents');
        if (!file_exists($dirPath)) {
            mkdir($dirPath, 0755, true);
        }

        $filename = "{$documentType}_{$document->id}_signed.pdf";
        $fullPath = "{$dirPath}/{$filename}";
        
        $pdf->save($fullPath);

        // Update path di database dokumen
        $relativePath = "signed-documents/{$filename}";
        $document->signed_pdf_path = $relativePath;
        $document->save();

        return $fullPath;
    }
}
