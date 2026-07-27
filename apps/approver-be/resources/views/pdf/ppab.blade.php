<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>PPAB - {{ $doc->nomor_ppab ?? $doc->id }}</title>
    <style>
        @page { margin: 25px 30px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1f2937; line-height: 1.4; }
        .header-table { width: 100%; border-bottom: 2px solid #1f3a5f; padding-bottom: 8px; margin-bottom: 15px; }
        .company-name { font-size: 16px; font-weight: bold; color: #1f3a5f; text-transform: uppercase; }
        .doc-title { font-size: 14px; font-weight: bold; text-align: right; color: #374151; }
        .meta-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .meta-table td { padding: 3px 0; vertical-align: top; }
        .meta-label { width: 130px; color: #6b7280; font-weight: 500; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .items-table th { background-color: #1f3a5f; color: #ffffff; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10.5px; }
        .items-table td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .spec-list { margin: 4px 0 0 0; padding-left: 14px; color: #6b7280; font-size: 9.5px; }
        
        .subtotals-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; margin-bottom: 20px; float: right; width: 320px; }
        .subtotals-table { width: 100%; font-size: 10.5px; }
        .subtotals-table td { padding: 3px 0; }
        .clear { clear: both; }

        .signatures-section { margin-top: 25px; page-break-inside: avoid; }
        .signatures-header { font-size: 11px; font-weight: bold; color: #1f3a5f; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 12px; }
        .signatures-table { width: 100%; border-collapse: collapse; }
        .signature-cell { vertical-align: top; text-align: center; padding: 5px; width: 33.33%; }
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
                <div style="font-size: 9px; color: #6b7280;">Pengajuan Pembelian Anggaran Biaya (PPAB)</div>
            </td>
            <td class="doc-title">
                PPAB<br>
                <span style="font-size: 11px; font-weight: normal; color: #6b7280;">
                    No: {{ $doc->nomor_ppab ?? ('PPAB-' . $doc->id) }}
                </span>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Nomor PPAB</td>
            <td>: <strong>{{ $doc->nomor_ppab ?? '-' }}</strong></td>
            <td class="meta-label">Tanggal Dibuat</td>
            <td>: {{ $doc->created_at ? \Carbon\Carbon::parse($doc->created_at)->format('d F Y H:i') : '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Deskripsi</td>
            <td>: {{ $doc->deskripsi ?? '-' }}</td>
            <td class="meta-label">Pemohon</td>
            <td>: {{ $doc->user->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Status Dokumen</td>
            <td>: <span style="color: #059669; font-weight: bold;">SELESAI (TANDA TANGAN DIGITAL TERVERIFIKASI)</span></td>
            <td></td>
            <td></td>
        </tr>
    </table>

    <!-- Tabel Rincian Item PPAB -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25px;" class="text-center">No</th>
                <th>Deskripsi / Spesifikasi Item</th>
                <th style="width: 45px;" class="text-center">Satuan</th>
                <th style="width: 45px;" class="text-right">Qty</th>
                <th style="width: 100px;" class="text-right">Harga Satuan</th>
                <th style="width: 110px;" class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @php $grandTotal = 0; @endphp
            @if(isset($doc->items) && count($doc->items) > 0)
                @foreach($doc->items as $index => $item)
                    @php
                        $qty = floatval($item->qty ?? 0);
                        $harga = floatval($item->harga_satuan ?? 0);
                        $subtotal = $qty * $harga;
                        $grandTotal += $subtotal;
                    @endphp
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->deskripsi ?? '-' }}</strong>
                            @if(isset($item->lineSpecs) && count($item->lineSpecs) > 0)
                                <ul class="spec-list">
                                    @foreach($item->lineSpecs as $spec)
                                        <li>{{ $spec->deskripsi }}</li>
                                    @endforeach
                                </ul>
                            @endif
                        </td>
                        <td class="text-center">{{ $item->satuan ?? '-' }}</td>
                        <td class="text-right">{{ number_format($qty, 0, ',', '.') }}</td>
                        <td class="text-right">{{ $item->currency ?? 'IDR' }} {{ number_format($harga, 0, ',', '.') }}</td>
                        <td class="text-right">{{ $item->currency ?? 'IDR' }} {{ number_format($subtotal, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="6" class="text-center" style="color: #9ca3af;">Tidak ada rincian item pengajuan.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Subtotals Box -->
    @if(isset($doc->subtotals) && count($doc->subtotals) > 0)
        <div class="subtotals-box">
            <table class="subtotals-table">
                @foreach($doc->subtotals as $st)
                    <tr>
                        <td style="font-weight: 500;">{{ $st->deskripsi }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
        <div class="clear"></div>
    @elseif($grandTotal > 0)
        <div class="subtotals-box">
            <table class="subtotals-table">
                <tr>
                    <td style="font-weight: bold;">Total Keseluruhan</td>
                    <td class="text-right" style="font-weight: bold; color: #1f3a5f;">
                        IDR {{ number_format($grandTotal, 0, ',', '.') }}
                    </td>
                </tr>
            </table>
        </div>
        <div class="clear"></div>
    @endif

    <div class="signatures-section">
        <div class="signatures-header">TANDA TANGAN ELEKTRONIK TERVERIFIKASI</div>
        <table class="signatures-table">
            <tr>
                @foreach($signedApprovers as $approver)
                    <td class="signature-cell">
                        <div class="signature-card">
                            <div class="role-title">{{ str_replace('_', ' ', $approver['role']) }}</div>
                            @if(!empty($approver['qr_code_base64']))
                                <img src="{{ $approver['qr_code_base64'] }}" class="qr-img" alt="QR Code">
                            @endif
                            <div class="signed-notice">Ditandatangani secara elektronik</div>
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
