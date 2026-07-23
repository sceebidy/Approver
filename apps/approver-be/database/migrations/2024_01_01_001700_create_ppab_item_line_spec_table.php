<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePpabItemLineSpecTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ppab_item_line_spec', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppab_item_line_id')->constrained('ppab_item')->cascadeOnDelete()->comment('source calls this ppab_item_line_id; only ppab_item table exists so it references that');
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
        Schema::dropIfExists('ppab_item_line_spec');
    }
}
