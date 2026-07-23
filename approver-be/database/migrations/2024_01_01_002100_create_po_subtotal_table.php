<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePoSubtotalTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('po_subtotal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('po')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->decimal('value', 18, 2);
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
        Schema::dropIfExists('po_subtotal');
    }
}
