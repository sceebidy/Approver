<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLogNoteFsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('log_note_fs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fs_id')->constrained('fund_settlement')->cascadeOnDelete();
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
        Schema::dropIfExists('log_note_fs');
    }
}
