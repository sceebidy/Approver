<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFrItemLineTaxTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fr_item_line_tax', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fr_item_line_id')->constrained('fr_item_line')->cascadeOnDelete();
            $table->foreignId('tax_id')->constrained('tax');
            $table->decimal('value', 18, 2);
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
        Schema::dropIfExists('fr_item_line_tax');
    }
}
