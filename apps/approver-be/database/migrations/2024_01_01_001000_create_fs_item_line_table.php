<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFsItemLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fs_item_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fs_id')->constrained('fund_settlement')->cascadeOnDelete();
            $table->text('deskripsi');
            $table->decimal('total', 18, 2);
            $table->dateTime('timestamp')->nullable();
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
        Schema::dropIfExists('fs_item_line');
    }
}
