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
        // Using raw SQL to avoid Doctrine DBAL version conflicts in Laravel 8
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE kategori_fr RENAME COLUMN max_ammount TO max_amount');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE kategori_fr RENAME COLUMN max_amount TO max_ammount');
    }
}
