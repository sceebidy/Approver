<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKategoriFrTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kategori_fr', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->unsignedInteger('min_app')->comment('minimum number of approvers required');
            $table->unsignedBigInteger('seksi_id')->nullable()->comment('no seksi/department table in source schema, stored as plain id');
            $table->decimal('max_ammount', 18, 2);
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
        Schema::dropIfExists('kategori_fr');
    }
}
