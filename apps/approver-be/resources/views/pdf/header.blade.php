<div class="header-container">
    <!-- Kop Surat Table 4 Baris (Sesuai Grid Asli PT. Industri Nabati Lestari) -->
    <table class="header-table">
        <tbody>
            <tr>
                <td class="logo-cell" rowspan="4">
                    @if(file_exists(public_path('inl.png')))
                        <img src="{{ public_path('inl.png') }}" alt="Logo INL" class="logo-img">
                    @elseif(file_exists(public_path('logo.png')))
                        <img src="{{ public_path('logo.png') }}" alt="Logo INL" class="logo-img">
                    @else
                        <div style="font-weight: bold; font-size: 11px;">INL</div>
                    @endif
                </td>
                <td class="company-cell" rowspan="3">
                    <div class="company-title">PT. Industri Nabati Lestari</div>
                    <div class="company-subtitle">PABRIK MINYAK GORENG</div>
                    <div class="company-address">
                        <strong>Kantor Pusat:</strong> KAWASAN EKONOMI KHUSUS SEI MANGKEI JL. KELAPA SAWIT II KAV 2-3 SEI MANGKEI, BOSAR MALIGAS 21183
                    </div>
                </td>
                <th class="meta-title-cell">No. Dokumen</th>
                <th class="meta-title-cell">Tgl. Berlaku</th>
            </tr>
            <tr>
                <td class="meta-value-cell">{{ $docNo ?? 'INLHO/FIN-F/005' }}</td>
                <td class="meta-value-cell">{{ $tglBerlaku ?? '12-Nov-18' }}</td>
            </tr>
            <tr>
                <th class="meta-title-cell">No. Revisi</th>
                <th class="meta-title-cell">Halaman</th>
            </tr>
            <tr>
                <th class="doc-title-cell">{{ $docTitle ?? 'FUND SETTLEMENT FORM' }}</th>
                <td class="meta-value-cell">{{ $noRevisi ?? '00' }}</td>
                <td class="meta-value-cell">1 dari 1</td>
            </tr>
        </tbody>
    </table>
</div>
