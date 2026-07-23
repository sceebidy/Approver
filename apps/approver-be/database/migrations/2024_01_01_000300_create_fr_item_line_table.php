<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFrItemLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fr_item_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fr_id')->constrained('fr')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->decimal('sub_total', 18, 2);
            $table->decimal('total', 18, 2)->comment('total setelah pajak');
            $table->dateTime('time_stamp')->nullable();
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
        Schema::dropIfExists('fr_item_line');
    }
}
