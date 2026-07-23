<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePpabApproverLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ppab_approver_line', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppab_id')->constrained('ppab')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('status', ['pending','approved','rejected'])->default('pending')->comment('source only listed a generic status column, enum values assumed from sibling tables');
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
        Schema::dropIfExists('ppab_approver_line');
    }
}
