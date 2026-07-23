<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLongNoteFrTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('long_note_fr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fr_id')->constrained('fr')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->text('remark');
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
        Schema::dropIfExists('long_note_fr');
    }
}
