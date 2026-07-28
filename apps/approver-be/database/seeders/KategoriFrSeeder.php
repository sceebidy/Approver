<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KategoriFrSeeder extends Seeder
{
    /**
     * Seed tabel kategori_fr dan tax dengan data awal (placeholder).
     *
     * Kolom kategori_fr:
     *   - nama       : nama kategori (string)
     *   - min_app    : jumlah minimum approver yang diperlukan (int)
     *   - seksi_id   : id seksi/departemen terkait (nullable)
     *   - max_amount : batas maksimal nilai FR (decimal 18,2)
     */
    public function run(): void
    {
        // ── Kategori FR ──────────────────────────────────────────────────────
        $now = now();

        DB::table('kategori_fr')->insertOrIgnore([
            [
                'nama'       => 'Operasional',
                'min_app'    => 1,
                'seksi_id'   => null,
                'max_amount' => 50_000_000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama'       => 'Investasi / Eksploitasi',
                'min_app'    => 2,
                'seksi_id'   => null,
                'max_amount' => 500_000_000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama'       => 'Perbaikan & Pemeliharaan',
                'min_app'    => 2,
                'seksi_id'   => null,
                'max_amount' => 200_000_000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $this->command->info('✅  KategoriFr seeded (3 kategori placeholder).');

        // ── Tax ──────────────────────────────────────────────────────────────
        // Tipe pajak umum Indonesia — value dalam persen (%)
        DB::table('tax')->insertOrIgnore([
            [
                'name'       => 'PPN 11%',
                'value'      => 11.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'PPh 21 (5%)',
                'value'      => 5.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'PPh 23 (2%)',
                'value'      => 2.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $this->command->info('✅  Tax seeded (PPN 11%, PPh 21, PPh 23).');
    }
}
