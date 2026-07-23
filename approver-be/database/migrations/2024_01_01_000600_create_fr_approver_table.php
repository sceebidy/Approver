<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFrApproverTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fr_approver', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fr_id')->constrained('fr')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->dateTime('update_date_time')->nullable();
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
        Schema::dropIfExists('fr_approver');
    }
}
