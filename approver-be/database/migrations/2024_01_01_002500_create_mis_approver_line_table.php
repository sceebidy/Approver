<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMisApproverLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('mis_approver_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mis_id')->constrained('mis')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('role', ['requestor','checker','issuer','approver']);
            $table->enum('status', ['pending','approval','rejected'])->default('pending');
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
        Schema::dropIfExists('mis_approver_line');
    }
}
