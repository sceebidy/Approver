<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $documentType }} - {{ $doc->id }}</title>
    <style>
        @page { margin: 25px 30px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; line-height: 1.4; }
        .header-table { width: 100%; border-bottom: 2px solid #1f3a5f; padding-bottom: 8px; margin-bottom: 15px; }
        .company-name { font-size: 16px; font-weight: bold; color: #1f3a5f; text-transform: uppercase; }
        .doc-title { font-size: 14px; font-weight: bold; text-align: right; color: #374151; }
        .meta-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .meta-table td { padding: 4px 0; vertical-align: top; }
        .meta-label { width: 130px; color: #6b7280; font-weight: 500; }
        .signatures-section { margin-top: 25px; page-break-inside: avoid; }
        .signatures-header { font-size: 11px; font-weight: bold; color: #1f3a5f; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 12px; }
        .signatures-table { width: 100%; border-collapse: collapse; }
        .signature-cell { vertical-align: top; text-align: center; padding: 5px; width: 25%; }
        .signature-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; background-color: #ffffff; }
        .role-title { font-weight: bold; font-size: 10px; color: #374151; text-transform: uppercase; margin-bottom: 6px; }
        .qr-img { width: 75px; height: 75px; margin: 0 auto; }
        .signed-notice { font-size: 8px; color: #059669; font-weight: bold; margin-top: 4px; }
        .signer-name { font-size: 10px; font-weight: bold; color: #111827; margin-top: 4px; }
        .signer-title { font-size: 8.5px; color: #6b7280; }
        .signed-date { font-size: 8px; color: #9ca3af; margin-top: 2px; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="company-name">PT. Industri Nabati Lestari</div>
                <div style="font-size: 9px; color: #6b7280;">Dokumen Resmi Bertanda Tangan Digital</div>
            </td>
            <td class="doc-title">
                {{ $documentType }}<br>
                <span style="font-size: 11px; font-weight: normal; color: #6b7280;">
                    ID: {{ $doc->id }}
                </span>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Jenis Dokumen</td>
            <td>: {{ $documentType }}</td>
            <td class="meta-label">Tanggal Dibuat</td>
            <td>: {{ $doc->created_at ? \Carbon\Carbon::parse($doc->created_at)->format('d F Y H:i') : '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Pemohon</td>
            <td>: {{ $doc->user->name ?? $doc->requester->name ?? '-' }}</td>
            <td class="meta-label">Status</td>
            <td>: <span style="color: #059669; font-weight: bold;">SELESAI (DISERTAI TANDA TANGAN DIGITAL)</span></td>
        </tr>
    </table>

    <div class="signatures-section">
        <div class="signatures-header">TANDA TANGAN ELEKTRONIK TERVERIFIKASI</div>
        <table class="signatures-table">
            <tr>
                @foreach($signedApprovers as $approver)
                    <td class="signature-cell">
                        <div class="signature-card">
                            <div class="role-title">{{ $approver['role'] }}</div>
                            @if(!empty($approver['qr_code_base64']))
                                <img src="{{ $approver['qr_code_base64'] }}" class="qr-img" alt="QR Code">
                            @endif
                            <div class="signed-notice">&#10003; Ditandatangani secara elektronik</div>
                            <div class="signer-name">{{ $approver['name'] }}</div>
                            <div class="signer-title">{{ $approver['jabatan'] }}</div>
                            <div class="signed-date">{{ $approver['signed_at'] }}</div>
                        </div>
                    </td>
                @endforeach
            </tr>
        </table>
    </div>
</body>
</html>
