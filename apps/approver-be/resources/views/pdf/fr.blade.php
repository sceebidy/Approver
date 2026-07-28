<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Fund Requisition - {{ $doc->number_fr ?? $doc->id }}</title>
    <style>
        @page {
            margin: 20px 25px;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            color: #000000;
            line-height: 1.25;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table, .header-table td {
            border: 1px solid #000000;
        }
        .meta-box-table td {
            border-bottom: 1px solid #000000;
            border-right: 1px solid #000000;
            padding: 3px 5px;
            color: #000000;
        }
        .meta-box-table tr:last-child td {
            border-bottom: none;
        }
        .meta-box-table td:last-child {
            border-right: none;
        }
        .company-title {
            font-family: 'Times New Roman', Times, serif;
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 0.3px;
            color: #000000;
        }
        .title-container {
            text-align: center;
            margin: 8px 0;
        }
        .title-text {
            font-size: 13px;
            font-weight: bold;
            color: #000000;
        }
        .info-table td {
            padding: 1px 0;
            vertical-align: top;
            color: #000000;
        }
        .items-table {
            width: 100%;
            border: 1px solid #000000;
            margin-top: 8px;
        }
        .items-table th {
            border: 1px solid #000000;
            background-color: #f2f2f2;
            font-weight: bold;
            padding: 4px;
            text-align: center;
            color: #000000;
        }
        .items-table td {
            border: 1px solid #000000;
            padding: 4px;
            vertical-align: top;
            color: #000000;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .notes-section {
            margin-top: 10px;
        }
        .notes-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 2px;
            color: #000000;
        }
        .notes-content {
            padding: 4px 0;
            color: #000000;
        }
        .signature-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
            page-break-inside: avoid;
        }
        .signature-cell {
            vertical-align: top;
            padding: 3px;
        }
        .signature-box {
            text-align: center;
            background-color: #ffffff;
            color: #000000;
        }
        .role-label {
            font-weight: bold;
            font-size: 8.5px;
            margin-bottom: 3px;
            color: #000000;
        }
        .qr-code-img {
            width: 45px;
            height: 45px;
            margin: 2px auto;
            display: block;
        }
        .signer-name {
            font-weight: bold;
            margin-top: 3px;
            font-size: 8.5px;
            color: #000000;
        }
        .signer-dept {
            font-size: 7.5px;
            color: #000000;
        }
        .digital-sig-text {
            font-size: 7px;
            color: #000000;
            font-style: italic;
            font-weight: normal;
            margin-top: 1px;
        }
    </style>
</head>
<body>

    <!-- 1. Header (Tabel 2 kolom kiri-kanan) -->
    <table class="header-table">
        <tr>
            <!-- Kiri atas: Logo + Info PT -->
            <td style="width: 55%; padding: 6px; vertical-align: top; border-right: 1px solid #000000;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50px; vertical-align: top; padding-right: 6px;">
                            @if(file_exists(public_path('logo.png')))
                                <img src="{{ public_path('logo.png') }}" style="width: 42px; height: auto;" alt="INL Logo">
                            @else
                                <div style="width: 42px; height: 42px; border: 1px solid #ccc; text-align: center; line-height: 42px; font-size: 8px;">LOGO</div>
                            @endif
                        </td>
                        <td style="vertical-align: top; padding-top: 1px;">
                            <div class="company-title">PT. Industri Nabati Lestari</div>
                            <div style="font-size: 8px; font-weight: bold; margin-top: 1px;">PABRIK MINYAK GORENG</div>
                            <div style="font-size: 7px; color: #000000; margin-top: 3px; line-height: 1.3;">
                                Kantor Pusat KAWASAN EKONOMI KHUSUS SEI MANGKEI JL. KELAPA SAWIT II<br>
                                KAV 2-3 SEI MANGKEI BOSAR MALIGAS 21183
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <!-- Kanan atas: Box dokumen info -->
            <td style="width: 45%; vertical-align: top; padding: 0;">
                <table class="meta-box-table" style="width: 100%;">
                    <tr>
                        <td style="width: 40%; font-weight: bold; background-color: #f2f2f2;">No. Dokumen</td>
                        <td style="width: 60%;">INLHO/FRF-F/001</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f2f2f2;">Tgl. Berlaku</td>
                        <td>12-11-2018</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f2f2f2;">No. Revisi</td>
                        <td>00</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f2f2f2;">Halaman</td>
                        <td>1 dari 1</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Judul Tengah -->
    <div class="title-container">
        <span class="title-text">FUND REQUISITION FORM</span>
    </div>

    <!-- 2. Info Block -->
    <table style="width: 100%;">
        <tr>
            <!-- Rata Kiri -->
            <td style="width: 60%; vertical-align: top;">
                <table class="info-table" style="width: 100%;">
                    <tr>
                        <td style="width: 100px; font-weight: bold;">DATE</td>
                        <td style="width: 10px;">:</td>
                        <td>{{ $doc->request_date_time ? \Carbon\Carbon::parse($doc->request_date_time)->format('d/m/Y H:i:s') : ($doc->created_at ? \Carbon\Carbon::parse($doc->created_at)->format('d/m/Y H:i:s') : now()->format('d/m/Y H:i:s')) }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">REQUESTED BY</td>
                        <td>:</td>
                        <td>{{ $doc->requester->name ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">DEPARTMENT</td>
                        <td>:</td>
                        <td>{{ $doc->requester->unit_nama ?? '-' }}</td>
                    </tr>
                </table>
            </td>
            <!-- Rata Kanan sejajar -->
            <td style="width: 40%; vertical-align: top; text-align: right; font-weight: bold; font-size: 9px; padding-top: 2px;">
                FORM NO: {{ $doc->number_fr ?? '-' }}
            </td>
        </tr>
    </table>

    <!-- 3. Tabel Item -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25px;">NO</th>
                <th>DESCRIPTION</th>
                <th style="width: 105px;">SUB TOTAL</th>
                <th style="width: 105px;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @php
                $no = 1;
                $grandTotal = 0;
            @endphp
            @if(isset($doc->itemLines) && count($doc->itemLines) > 0)
                @foreach($doc->itemLines as $item)
                    <!-- Main Item Line Row -->
                    <tr>
                        <td class="text-center">{{ $no++ }}</td>
                        <td>{{ $item->deskripsi }}</td>
                        <td class="text-right">Rp {{ number_format($item->sub_total, 0, '.', ',') }}</td>
                        <td class="text-right">Rp {{ number_format($item->sub_total, 0, '.', ',') }}</td>
                    </tr>
                    @php
                        $grandTotal += $item->sub_total;
                    @endphp

                    @if(isset($item->itemLineTaxes) && count($item->itemLineTaxes) > 0)
                        @foreach($item->itemLineTaxes as $itemTax)
                            @php
                                $taxVal = (float) $itemTax->value;
                                $grandTotal += $taxVal;
                                $taxName = $itemTax->tax->name ?? 'Pajak';
                            @endphp
                            <tr>
                                <td class="text-center">{{ $no++ }}</td>
                                <td>{{ $taxName }}</td>
                                <td class="text-right">Rp {{ number_format($taxVal, 0, '.', ',') }}</td>
                                <td class="text-right">Rp {{ number_format($taxVal, 0, '.', ',') }}</td>
                            </tr>
                        @endforeach
                    @endif
                @endforeach
            @else
                <tr>
                    <td colspan="4" class="text-center">Tidak ada data item line.</td>
                </tr>
            @endif

            <!-- GRAND TOTAL -->
            <tr style="font-weight: bold; background-color: #f2f2f2;">
                <td colspan="2" class="text-right">GRAND TOTAL</td>
                <td class="text-right"></td>
                <td class="text-right">Rp {{ number_format($grandTotal, 0, '.', ',') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Notes Section -->
    @if(!empty($doc->keterangan))
        <div class="notes-section">
            <div class="notes-title">Notes:</div>
            <div class="notes-content">{{ $doc->keterangan }}</div>
        </div>
    @endif

    <!-- 5. Baris Tanda Tangan Dinamis -->
    @if(isset($signedApprovers) && count($signedApprovers) > 0)
        <table class="signature-table">
            <tr>
                @foreach($signedApprovers as $approver)
                    <td class="signature-cell" style="width: {{ 100 / count($signedApprovers) }}%;">
                        <div class="signature-box">
                            <div class="role-label">{{ $approver['role'] }}</div>
                            @if(!empty($approver['qr_code_base64']))
                                <img src="{{ $approver['qr_code_base64'] }}" class="qr-code-img" alt="QR Code">
                            @else
                                <div style="height: 45px;"></div>
                            @endif
                            <div class="digital-sig-text">Ditandatangani secara elektronik</div>
                            <div class="signer-name">{{ $approver['name'] }}</div>
                            <div class="signer-dept">{{ $approver['jabatan'] }}</div>
                        </div>
                    </td>
                @endforeach
            </tr>
        </table>
    @endif

</body>
</html>
