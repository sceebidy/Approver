<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Fund Settlement - {{ $doc->number_fs ?? $doc->id }}</title>
    <style>
        @page {
            margin: 25px 30px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #1f3a5f;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #1f3a5f;
            text-transform: uppercase;
        }
        .doc-title {
            font-size: 14px;
            font-weight: bold;
            text-align: right;
            color: #374151;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .meta-label {
            width: 130px;
            color: #6b7280;
            font-weight: 500;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table th {
            background-color: #1f3a5f;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 6px 8px;
            font-size: 10.5px;
        }
        .items-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 6px 8px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .balance-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .balance-table {
            width: 100%;
        }
        .balance-table td {
            padding: 3px 5px;
        }
        
        /* Baris Tanda Tangan Digital */
        .signatures-section {
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .signatures-header {
            font-size: 11px;
            font-weight: bold;
            color: #1f3a5f;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
            margin-bottom: 12px;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
        }
        .signature-cell {
            vertical-align: top;
            text-align: center;
            padding: 5px;
            width: 25%;
        }
        .signature-card {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px;
            background-color: #ffffff;
        }
        .role-title {
            font-weight: bold;
            font-size: 10px;
            color: #374151;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .qr-img {
            width: 75px;
            height: 75px;
            margin: 0 auto;
        }
        .signed-notice {
            font-size: 8px;
            color: #059669;
            font-weight: bold;
            margin-top: 4px;
        }
        .signer-name {
            font-size: 10px;
            font-weight: bold;
            color: #111827;
            margin-top: 4px;
        }
        .signer-title {
            font-size: 8.5px;
            color: #6b7280;
        }
        .signed-date {
            font-size: 8px;
            color: #9ca3af;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <!-- Header Perusahaan & Dokumen -->
    <table class="header-table">
        <tr>
            <td>
                <div class="company-name">PT. Industri Nabati Lestari</div>
                <div style="font-size: 9px; color: #6b7280;">Sistem Pengajuan & Pertanggungjawaban Digital</div>
            </td>
            <td class="doc-title">
                FUND SETTLEMENT (FS)<br>
                <span style="font-size: 11px; font-weight: normal; color: #6b7280;">
                    {{ $doc->number_fs ?? ('FS-' . $doc->id) }}
                </span>
            </td>
        </tr>
    </table>

    <!-- Metadata Dokumen -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">Nomor Dokumen</td>
            <td>: <strong>{{ $doc->number_fs ?? '-' }}</strong></td>
            <td class="meta-label">Tanggal Request</td>
            <td>: {{ $doc->requester_date_time ? \Carbon\Carbon::parse($doc->requester_date_time)->format('d F Y H:i') : '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Pemohon (Requester)</td>
            <td>: {{ $doc->requester->name ?? 'N/A' }} ({{ $doc->requester->email ?? '-' }})</td>
            <td class="meta-label">Ref. FR ID</td>
            <td>: {{ $doc->fr_id ?? '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Status Dokumen</td>
            <td>: <span style="color: #059669; font-weight: bold;">SELESAI / DISERTAI TANDA TANGAN DIGITAL</span></td>
            <td class="meta-label">Dibuat Pada</td>
            <td>: {{ $doc->created_at ? \Carbon\Carbon::parse($doc->created_at)->format('d F Y H:i') : '-' }}</td>
        </tr>
    </table>

    <!-- Tabel Rincian Item Line -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 30px;">#</th>
                <th>Deskripsi Rincian Pengeluaran</th>
                <th style="width: 100px;" class="text-right">Nominal (Rp)</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @if(isset($doc->itemLines) && count($doc->itemLines) > 0)
                @foreach($doc->itemLines as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item->description ?? $item->desc ?? '-' }}</td>
                        <td class="text-right">{{ number_format($item->amount ?? $item->nominal ?? 0, 0, ',', '.') }}</td>
                        <td>{{ $item->remark ?? '-' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" class="text-center" style="color: #9ca3af;">Tidak ada rincian item line.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Rincian Balance -->
    <div class="balance-box">
        <table class="balance-table">
            <tr>
                <td style="font-weight: bold; width: 200px;">Total Saldo (Balance)</td>
                <td class="text-right" style="font-weight: bold; font-size: 12px; color: #1f3a5f;">
                    Rp {{ number_format($doc->balance ?? 0, 0, ',', '.') }}
                </td>
            </tr>
            @if(($doc->balance_due_to_employee ?? 0) > 0)
            <tr>
                <td style="color: #d97706;">Kurang Bayar ke Pegawai (Due to Employee)</td>
                <td class="text-right" style="color: #d97706; font-weight: 500;">
                    Rp {{ number_format($doc->balance_due_to_employee, 0, ',', '.') }}
                </td>
            </tr>
            @endif
            @if(($doc->balance_due_to_company ?? 0) > 0)
            <tr>
                <td style="color: #2563eb;">Sisa Pengembalian ke Perusahaan (Due to Company)</td>
                <td class="text-right" style="color: #2563eb; font-weight: 500;">
                    Rp {{ number_format($doc->balance_due_to_company, 0, ',', '.') }}
                </td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Baris Tanda Tangan Digital Berjajar -->
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
