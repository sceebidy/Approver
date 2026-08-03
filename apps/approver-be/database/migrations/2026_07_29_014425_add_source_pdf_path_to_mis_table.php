<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSourcePdfPathToMisTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('mis') && !Schema::hasColumn('mis', 'source_pdf_path')) {
            Schema::table('mis', function (Blueprint $table) {
                $table->string('source_pdf_path')->nullable()->after('nomor_mis');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('mis') && Schema::hasColumn('mis', 'source_pdf_path')) {
            Schema::table('mis', function (Blueprint $table) {
                $table->dropColumn('source_pdf_path');
            });
        }
    }
}
