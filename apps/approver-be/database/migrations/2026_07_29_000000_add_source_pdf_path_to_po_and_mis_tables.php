<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSourcePdfPathToPoAndMisTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('po')) {
            Schema::table('po', function (Blueprint $table) {
                if (!Schema::hasColumn('po', 'source_pdf_path')) {
                    $table->string('source_pdf_path', 500)->nullable()->after('nomor_ppab');
                }
            });
        }

        if (Schema::hasTable('mis')) {
            Schema::table('mis', function (Blueprint $table) {
                if (!Schema::hasColumn('mis', 'source_pdf_path')) {
                    $table->string('source_pdf_path', 500)->nullable()->after('tgl_mis');
                }
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
        if (Schema::hasTable('po')) {
            Schema::table('po', function (Blueprint $table) {
                if (Schema::hasColumn('po', 'source_pdf_path')) {
                    $table->dropColumn('source_pdf_path');
                }
            });
        }

        if (Schema::hasTable('mis')) {
            Schema::table('mis', function (Blueprint $table) {
                if (Schema::hasColumn('mis', 'source_pdf_path')) {
                    $table->dropColumn('source_pdf_path');
                }
            });
        }
    }
}
