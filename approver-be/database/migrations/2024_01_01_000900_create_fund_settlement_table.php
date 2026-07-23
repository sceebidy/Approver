<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFundSettlementTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fund_settlement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('fr_id')->constrained('fr');
            $table->dateTime('requester_date_time');
            $table->string('number_fs')->unique();
            $table->decimal('balance', 18, 2)->nullable();
            $table->decimal('balance_due_to_employee', 18, 2)->nullable();
            $table->decimal('balance_due_to_company', 18, 2)->nullable();
            $table->enum('status', ['draft','submitted','approved','done','rejected'])->default('draft');
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
        Schema::dropIfExists('fund_settlement');
    }
}
