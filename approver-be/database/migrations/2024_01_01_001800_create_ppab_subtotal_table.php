<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePpabSubtotalTable extends Migration
{
    /**
     * Run the migrations.
     *
     * NOTE: Source schema lists only id/ppab_id/deskripsi for this table -- no amount column was specified, kept as-is.
     * @return void
     */
    public function up()
    {
        Schema::create('ppab_subtotal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppab_id')->constrained('ppab')->cascadeOnDelete();
            $table->text('deskripsi');
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
        Schema::dropIfExists('ppab_subtotal');
    }
}
