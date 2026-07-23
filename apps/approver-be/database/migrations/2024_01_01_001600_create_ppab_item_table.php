<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePpabItemTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ppab_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppab_id')->constrained('ppab')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->string('satuan');
            $table->decimal('qty', 12, 2);
            $table->decimal('harga_satuan', 18, 2);
            $table->string('kategori')->nullable();
            $table->string('currency', 10)->default('IDR');
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
        Schema::dropIfExists('ppab_item');
    }
}
