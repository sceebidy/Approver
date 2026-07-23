<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePoApproverLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('po_approver_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('po_id')->constrained('po')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
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
        Schema::dropIfExists('po_approver_line');
    }
}
