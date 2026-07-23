<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFrTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('fr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users');
            $table->unsignedBigInteger('seksi_id')->nullable()->comment('no seksi/department table in source schema, stored as plain id');
            $table->foreignId('kategori_fr_id')->constrained('kategori_fr');
            $table->string('currency', 10)->default('IDR');
            $table->dateTime('request_date_time');
            $table->string('number_fr')->unique();
            $table->text('keterangan')->nullable();
            $table->enum('status', ['draft','approved','submitted','rejected','canceled'])->default('draft');
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
        Schema::dropIfExists('fr');
    }
}
