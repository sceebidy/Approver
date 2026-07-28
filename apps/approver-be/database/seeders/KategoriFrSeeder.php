<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KategoriFrSeeder extends Seeder
{
    /**
     * Seed tabel kategori_fr dan tax dengan data awal.
     *
     * Kolom kategori_fr:
     *   - nama       : nama kategori (string)
     *   - min_app    : jumlah minimum approver yang diperlukan (int)
     *   - seksi_id   : id seksi/departemen terkait (nullable string)
     *   - max_amount : batas maksimal nilai FR (decimal 18,2)
     */
    public function run(): void
    {
        // ── Kategori FR ──────────────────────────────────────────────────────
        $now = now();

        // Clean up dependent tables due to foreign keys before deleting kategori_fr
        DB::table('fr_approver')->delete();
        DB::table('fr_item_line_tax')->delete();
        DB::table('fr_item_line')->delete();
        DB::table('fr')->delete();
        DB::table('approver_kategori_fr')->delete();
        DB::table('kategori_fr')->delete();

        DB::table('kategori_fr')->insert([
            [
                'id'         => 1,
                'nama'       => 'Di atas Rp 5.000.000',
                'min_app'    => 1,
                'seksi_id'   => null,
                'max_amount' => 5000000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id'         => 2,
                'nama'       => 'Di atas Rp 50.000.000',
                'min_app'    => 1,
                'seksi_id'   => null,
                'max_amount' => 50000000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id'         => 3,
                'nama'       => 'Di atas Rp 100.000.000',
                'min_app'    => 1,
                'seksi_id'   => null,
                'max_amount' => 100000000.00,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $this->command->info('✅  KategoriFr seeded (nominal ranges).');

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
