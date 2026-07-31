<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePpabVerfAnggaranTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ppab_verf_anggaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppab_id')->nullable()->constrained('ppab')->cascadeOnDelete();
            $table->string('no_ppab')->nullable();
            $table->string('sumber_rek')->nullable(); // investasi / eksploitasi
            $table->string('beban_rek')->nullable();
            $table->decimal('rkap_1_tahun', 18, 2)->nullable();
            $table->decimal('realisasi', 18, 2)->nullable();
            $table->decimal('permintaan', 18, 2)->nullable();
            $table->decimal('sisa_anggaran', 18, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ppab_verf_anggaran');
    }
}
