<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePoItemlineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('po_itemline', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('po')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->string('satuan');
            $table->decimal('qty', 12, 2);
            $table->decimal('harga_satuan', 18, 2);
            $table->text('spec')->nullable();
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
        Schema::dropIfExists('po_itemline');
    }
}
