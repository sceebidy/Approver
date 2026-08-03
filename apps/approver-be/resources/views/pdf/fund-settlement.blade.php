<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Fund Settlement - {{ $doc->number_fs ?? $doc->id }}</title>
    <style>
        @page {
            margin: 12mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 9.5px;
            color: #000000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }

        /* Kop Surat Table */
        .header-container {
            width: 100%;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td, .header-table th {
            border: 1px solid #000000;
            padding: 4px 6px;
            vertical-align: middle;
            box-sizing: border-box;
        }
        .logo-cell {
            width: 18%;
            text-align: center;
            padding: 4px !important;
            vertical-align: middle;
        }
        .logo-img {
            display: block;
            margin: 0 auto;
            max-width: 95%;
            height: auto;
        }
        .company-cell {
            width: 48%;
            text-align: center;
        }
        .company-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            color: #000000;
            letter-spacing: 0.3px;
        }
        .company-subtitle {
            font-size: 8.5px;
            color: #000000;
            font-weight: bold;
            margin-top: 2px;
            text-transform: uppercase;
        }
        .company-address {
            font-size: 7.5px;
            color: #000000;
            margin-top: 3px;
            line-height: 1.2;
        }
        .meta-title-cell {
            width: 17%;
            font-weight: bold;
            font-size: 9px;
            color: #000000;
            text-align: center;
        }
        .meta-value-cell {
            width: 17%;
            font-size: 9.5px;
            text-align: center;
            color: #000000;
        }
        .doc-title-cell {
            font-size: 13px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* Bingkai Metadata */
        .info-bingkai-table {
            width: 100%;
            border-collapse: collapse;
            border-left: 1px solid #000000;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            border-top: none;
        }
        .info-bingkai-table > tbody > tr > td {
            padding: 6px 10px;
            border: none !important;
            vertical-align: top;
        }
        .inner-info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .inner-info-table td {
            border: none !important;
            padding: 1.5px 0 !important;
            font-size: 9.5px;
            color: #000000;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border-left: 1px solid #000000;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            border-top: none;
            margin-bottom: 15px;
        }
        .items-table th {
            border: 1px solid #000000;
            font-weight: bold;
            padding: 5px;
            text-align: center;
            font-size: 9.5px;
            color: #000000;
        }
        .items-table td {
            border: 1px solid #000000;
            padding: 5px;
            vertical-align: middle;
            font-size: 9px;
            color: #000000;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Signatures Section */
        .signature-table {
            width: 100%;
            margin-top: 15px;
            border-collapse: collapse;
            page-break-inside: avoid;
        }
        .signature-cell {
            vertical-align: top;
            padding: 4px;
            text-align: center;
        }
        .signature-box {
            text-align: center;
        }
        .role-label {
            font-weight: bold;
            font-size: 9.5px;
            margin-bottom: 4px;
            color: #000000;
        }
        .qr-code-img {
            width: 55px;
            height: 55px;
            margin: 2px auto;
            display: block;
        }
        .signer-name {
            font-weight: bold;
            margin-top: 4px;
            font-size: 9px;
            color: #000000;
        }
        .signer-dept {
            font-size: 8px;
            color: #000000;
        }
        .digital-sig-text {
            font-size: 7.5px;
            color: #6b7280;
            font-style: italic;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <!-- 1. Kop Surat Header Table -->
    @include('pdf.header', [
        'docNo' => 'INLHO/FIN-F/005',
        'tglBerlaku' => '12-Nov-18',
        'noRevisi' => '00',
        'docTitle' => 'FUND SETTLEMENT FORM'
    ])

    <!-- 2. Bingkai Metadata -->
    <table class="info-bingkai-table">
        <tbody>
            <tr>
                <td style="width: 58%;">
                    <table class="inner-info-table">
                        <tr>
                            <td style="width: 100px; font-weight: bold;">DATE</td>
                            <td style="width: 15px; text-align: center;">:</td>
                            <td>{{ $doc->settlement_date ? \Carbon\Carbon::parse($doc->settlement_date)->format('d/m/Y H:i:s') : ($doc->requester_date_time ? \Carbon\Carbon::parse($doc->requester_date_time)->format('d/m/Y H:i:s') : ($doc->created_at ? \Carbon\Carbon::parse($doc->created_at)->format('d/m/Y H:i:s') : now()->format('d/m/Y H:i:s'))) }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">REQUESTED BY</td>
                            <td style="text-align: center;">:</td>
                            <td>{{ $doc->requester->name ?? 'Divisi IT' }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">DEPARTMENT</td>
                            <td style="text-align: center;">:</td>
                            <td>{{ $doc->requester->unit_nama ?? 'IT' }}</td>
                        </tr>
                    </table>
                </td>
                <td style="width: 42%;">
                    <table class="inner-info-table">
                        <tr>
                            <td style="width: 105px; font-weight: bold;">FORM NO</td>
                            <td style="width: 15px; text-align: center;">:</td>
                            <td>{{ $doc->number_fs ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">ADVANCED NO</td>
                            <td style="text-align: center;">:</td>
                            <td>{{ $doc->fr->number_fr ?? '-' }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>

    @php
        // Ambil item realisasi pengeluaran dari relasi itemLines atau items
        $realisasiItems = [];
        if (isset($doc->itemLines) && count($doc->itemLines) > 0) {
            $realisasiItems = $doc->itemLines;
        } elseif (isset($doc->items) && count($doc->items) > 0) {
            $realisasiItems = $doc->items;
        }

        // Total Advance (FR Amount / Balance awal)
        $frTotal = 0;
        if (isset($doc->fr) && isset($doc->fr->itemLines) && count($doc->fr->itemLines) > 0) {
            foreach ($doc->fr->itemLines as $frLine) {
                $frTotal += floatval($frLine->sub_total ?? 0);
                if (isset($frLine->itemLineTaxes)) {
                    foreach ($frLine->itemLineTaxes as $frTax) {
                        $frTotal += floatval($frTax->value ?? 0);
                    }
                }
            }
        }
        if ($frTotal == 0 && isset($doc->balance)) {
            $frTotal = floatval($doc->balance);
        }

        $no = 1;
        $totalExpenses = 0;
    @endphp

    <!-- 3. Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">NO</th>
                <th style="width: 55%; text-align: center;">DESCRIPTION</th>
                <th style="width: 20%; text-align: center;">SUB TOTAL</th>
                <th style="width: 20%; text-align: center;">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            <!-- Row 1: Advance amount -->
            <tr>
                <td class="text-center">1</td>
                <td>Advance amount (FR : {{ $doc->fr->number_fr ?? '-' }})</td>
                <td></td>
                <td class="text-right">Rp {{ number_format($frTotal, 0, '.', ',') }}</td>
            </tr>

            <!-- Item Lines Realisasi Pengeluaran -->
            @if(count($realisasiItems) > 0)
                @foreach($realisasiItems as $item)
                    @php
                        $no++;
                        $realisasi = floatval($item->total ?? $item->nominal_realisasi ?? $item->sub_total ?? 0);
                        $totalExpenses += $realisasi;
                    @endphp
                    <tr>
                        <td class="text-center">{{ $no }}</td>
                        <td>{{ $item->deskripsi }}</td>
                        <td class="text-right">Rp {{ number_format($realisasi, 0, '.', ',') }}</td>
                        <td class="text-right">Rp {{ number_format($realisasi, 0, '.', ',') }}</td>
                    </tr>
                @endforeach
            @endif

            <!-- Total Expenses Row -->
            <tr style="font-weight: bold;">
                <td colspan="2" style="font-weight: bold;">Total Expenses</td>
                <td></td>
                <td class="text-right">Rp {{ number_format($totalExpenses, 0, '.', ',') }}</td>
            </tr>

            <!-- Balance Row -->
            <tr>
                <td colspan="2" style="border-right: none;"></td>
                <td style="font-weight: bold; border-left: 1px solid #000;">Balance</td>
                <td class="text-right" style="font-weight: bold;">Rp {{ number_format($frTotal, 0, '.', ',') }}</td>
            </tr>

            @php
                $balanceDueEmployee = isset($doc->balance_due_to_employee) && floatval($doc->balance_due_to_employee) > 0
                    ? floatval($doc->balance_due_to_employee)
                    : max(0, $totalExpenses - $frTotal);

                $balanceDueCompany = isset($doc->balance_due_to_company) && floatval($doc->balance_due_to_company) > 0
                    ? floatval($doc->balance_due_to_company)
                    : max(0, $frTotal - $totalExpenses);
            @endphp

            <!-- Balance Due to Employee Row -->
            <tr>
                <td colspan="2" style="border-right: none;"></td>
                <td style="font-weight: bold; border-left: 1px solid #000;">Balace Due to Employee</td>
                <td class="text-right" style="font-weight: bold;">
                    {{ $balanceDueEmployee > 0 ? 'Rp ' . number_format($balanceDueEmployee, 0, '.', ',') : '' }}
                </td>
            </tr>

            <!-- Balance Due to Company Row -->
            <tr>
                <td colspan="2" style="border-right: none;"></td>
                <td style="font-weight: bold; border-left: 1px solid #000;">Balance due to Company</td>
                <td class="text-right" style="font-weight: bold;">
                    {{ $balanceDueCompany > 0 ? 'Rp ' . number_format($balanceDueCompany, 0, '.', ',') : '' }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- 4. Baris Tanda Tangan Dinamis -->
    @if(isset($signedApprovers) && count($signedApprovers) > 0)
        <table class="signature-table">
            <tr>
                @foreach($signedApprovers as $approver)
                    <td class="signature-cell" style="width: {{ 100 / count($signedApprovers) }}%;">
                        <div class="signature-box">
                            <div class="role-label">{{ str_replace('_', ' ', $approver['role']) }}</div>
                            @if(!empty($approver['qr_code_base64']))
                                <img src="{{ $approver['qr_code_base64'] }}" class="qr-code-img" alt="QR Code">
                            @else
                                <div style="height: 55px;"></div>
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
