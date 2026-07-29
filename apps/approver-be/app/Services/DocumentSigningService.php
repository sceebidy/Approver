<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use PDF; // Barryvdh\DomPDF\Facade\Pdf
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
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
     * Build verify URL untuk approver line (untuk dikirim ke Python stamper).
     */
    public function buildVerifyUrl(string $documentType, $documentId, $approverLine): string
    {
        $token = $this->generateVerifyToken($approverLine);
        $appUrl = rtrim(config('app.url', 'http://127.0.0.1:8000'), '/');
        return "{$appUrl}/verify/{$documentType}/{$documentId}/{$approverLine->id}?token={$token}";
    }

    /**
     * Generate PDF resmi bertanda tangan digital.
     * 
     * Untuk dokumen dengan source_pdf_path (PDF asli tersimpan):
     *   → Stamp PDF asli menggunakan Python microservice
     * 
     * Untuk dokumen tanpa source_pdf_path (legacy/fallback):
     *   → Generate ulang dari Blade template (cara lama)
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
        } elseif ($documentType === 'fr' && method_exists($document, 'itemLines')) {
            $document->loadMissing(['itemLines.itemLineTaxes.tax', 'requester', 'kategoriFr']);
        }

        // Tentukan relasi approver_line berdasarkan jenis dokumen
        $approvers = collect();
        if ($documentType === 'fs' || $documentType === 'fr') {
            $approvers = $document->approvers()->with('approver')->where('status', 'approved')->get();
        } elseif (method_exists($document, 'approverLines')) {
            $approvers = $document->approverLines()->with('approver')->where('status', 'approved')->get();
        }

        // Urutkan approvers berdasarkan 4 role berjenjang eksplisit (hanya untuk dokumen non-FR/FS)
        if ($documentType !== 'fs' && $documentType !== 'fr') {
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
        } else {
            // Untuk FR & FS, pertahankan urutan penyimpanan database (id ascending)
            $approvers = $approvers->sortBy('id')->values();
        }

        // Siapkan QR Code data URI untuk setiap approver yang approved
        $signedApprovers = [];
        foreach ($approvers as $line) {
            $verifyUrl = $this->buildVerifyUrl($documentType, $document->id, $line);
            $qrBase64 = $this->generateQrForApprover($documentType, $document->id, $line);
            
            $approverUser = $line->approver;
            $signedApprovers[] = [
                'line_id'      => $line->id,
                'role'         => str_replace('_', ' ', $line->role ?? 'Approver'),
                'name'         => $approverUser->name ?? 'User #' . $line->approver_id,
                'jabatan'      => $approverUser->role ?? $approverUser->unit_nama ?? 'Pejabat Berwenang',
                'signed_at'    => $line->signed_at ? \Carbon\Carbon::parse($line->signed_at)->setTimezone('Asia/Jakarta')->format('d/m/Y H:i') : now()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i'),
                'qr_code_base64' => $qrBase64,
                'verify_url'     => $verifyUrl,
            ];
        }

        // ======================================================================
        // STRATEGI: Jika ada source_pdf_path → STAMP PDF asli via Python service
        //           Jika tidak → fallback ke Blade template (cara lama)
        // ======================================================================
        $hasSourcePdf = !empty($document->source_pdf_path);
        
        if ($hasSourcePdf && in_array($documentType, ['ppab', 'po', 'mis'])) {
            $filePath = $this->stampSourcePdf($documentType, $document, $signedApprovers);
            if ($filePath) {
                return $filePath;
            }
            // Jika stamp gagal, fallback ke cara lama
            Log::warning("[DocumentSigning] Stamp PDF gagal untuk {$documentType}#{$document->id}, fallback ke Blade template.");
        }

        // === FALLBACK: Generate dari Blade template (cara lama) ===
        return $this->generateFromBlade($documentType, $document, $signedApprovers);
    }

    /**
     * Stamp PDF asli menggunakan Python microservice.
     */
    protected function stampSourcePdf(string $documentType, $document, array $signedApprovers): ?string
    {
        $sourcePdfFullPath = storage_path('app/' . $document->source_pdf_path);
        
        if (!file_exists($sourcePdfFullPath)) {
            Log::error("[DocumentSigning] Source PDF tidak ditemukan: {$sourcePdfFullPath}");
            return null;
        }

        // Siapkan data approver untuk Python stamper
        $approversForStamper = array_map(function ($a) {
            return [
                'role'       => $a['role'],
                'name'       => $a['name'],
                'jabatan'    => $a['jabatan'],
                'signed_at'  => $a['signed_at'],
                'verify_url' => $a['verify_url'],
            ];
        }, $signedApprovers);

        $pythonApiUrl = rtrim(env('PYTHON_API_URL', 'http://127.0.0.1:8001'), '/');
        $stampEndpoint = "{$pythonApiUrl}/stamp-pdf";

        Log::info("[DocumentSigning] Mengirim payload ke Python stamper", [
            'document_id' => $document->id,
            'approvers_count' => count($approversForStamper),
            'approvers' => $approversForStamper
        ]);

        try {
            $response = Http::timeout(30)
                ->attach('file', file_get_contents($sourcePdfFullPath), basename($sourcePdfFullPath))
                ->post($stampEndpoint, [
                    'approvers_json' => json_encode($approversForStamper),
                ]);

            if (!$response->successful()) {
                Log::error("[DocumentSigning] Python stamp API error: " . $response->body());
                return null;
            }

            // Simpan PDF yang sudah di-stamp
            $dirPath = storage_path('app/signed-documents');
            if (!file_exists($dirPath)) {
                mkdir($dirPath, 0755, true);
            }

            $filename = "{$documentType}_{$document->id}_signed.pdf";
            $fullPath = "{$dirPath}/{$filename}";
            
            file_put_contents($fullPath, $response->body());

            // Update path di database dokumen
            $relativePath = "signed-documents/{$filename}";
            $document->signed_pdf_path = $relativePath;
            $document->save();

            Log::info("[DocumentSigning] PDF berhasil di-stamp: {$fullPath}");
            return $fullPath;

        } catch (\Exception $e) {
            Log::error("[DocumentSigning] Gagal memanggil Python stamp API: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate PDF dari Blade template (cara lama / fallback).
     */
    protected function generateFromBlade(string $documentType, $document, array $signedApprovers): ?string
    {
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
