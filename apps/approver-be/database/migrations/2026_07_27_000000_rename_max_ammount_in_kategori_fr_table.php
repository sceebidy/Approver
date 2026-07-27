<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameMaxAmmountInKategoriFrTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kategori_fr', function (Blueprint $table) {
            $table->renameColumn('max_ammount', 'max_amount');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kategori_fr', function (Blueprint $table) {
            $table->renameColumn('max_amount', 'max_ammount');
        });
    }
}
