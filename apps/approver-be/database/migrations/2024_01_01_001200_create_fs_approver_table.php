<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFsApproverTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fs_approver', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fs_id')->constrained('fund_settlement')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('role', ['atasan','checkedby','approvedby']);
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->dateTime('update_date_time')->nullable()->comment('source cell listed this inline with status enum, split out here');
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
        Schema::dropIfExists('fs_approver');
    }
}
