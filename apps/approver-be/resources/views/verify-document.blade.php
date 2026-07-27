<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Tanda Tangan Digital - PT INL</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #1f2937;
        }
        .card {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            max-width: 500px;
            width: 100%;
            padding: 30px;
            text-align: center;
        }
        .icon-success {
            width: 64px;
            height: 64px;
            background-color: #d1fae5;
            color: #059669;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        }
        .icon-error {
            width: 64px;
            height: 64px;
            background-color: #fee2e2;
            color: #dc2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        }
        h2 {
            margin: 0 0 8px;
            font-size: 20px;
            color: #1f3a5f;
        }
        p {
            margin: 0 0 20px;
            color: #4b5563;
            font-size: 14px;
            line-height: 1.5;
        }
        .info-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            text-align: left;
            margin-bottom: 20px;
            font-size: 13.5px;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            width: 130px;
            color: #6b7280;
            font-weight: 500;
        }
        .info-value {
            flex: 1;
            font-weight: 600;
            color: #111827;
        }
        .footer {
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 16px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="card">
        @if($isValid)
            <div class="icon-success">&#10004;</div>
            <h2>Tanda Tangan Digital Sah</h2>
            <p>Dokumen ini terverifikasi secara resmi oleh sistem <strong>PT. Industri Nabati Lestari</strong>.</p>
            
            <div class="info-box">
                <div class="info-row">
                    <div class="info-label">Jenis Dokumen</div>
                    <div class="info-value">{{ strtoupper($documentType) }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Nomor Dokumen</div>
                    <div class="info-value">{{ $documentNumber }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Disetujui Oleh</div>
                    <div class="info-value">{{ $approverName }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Peran / Jabatan</div>
                    <div class="info-value">{{ $approverRole }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Waktu Disetujui</div>
                    <div class="info-value">{{ $signedAt }}</div>
                </div>
            </div>
        @else
            <div class="icon-error">&#10060;</div>
            <h2>Verifikasi Gagal</h2>
            <p>{{ $errorMessage ?? 'Token verifikasi tidak valid atau dokumen tidak ditemukan.' }}</p>
        @endif

        <div class="footer">
            PT. Industri Nabati Lestari &copy; {{ date('Y') }} &bull; Verify Signature
        </div>
    </div>
</body>
</html>
