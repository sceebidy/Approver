<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMisItemLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('mis_item_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mis_id')->constrained('mis')->cascadeOnDelete();
            $table->text('desc');
            $table->string('satuan');
            $table->decimal('qty', 12, 2);
            $table->text('remark')->nullable();
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
        Schema::dropIfExists('mis_item_line');
    }
}
