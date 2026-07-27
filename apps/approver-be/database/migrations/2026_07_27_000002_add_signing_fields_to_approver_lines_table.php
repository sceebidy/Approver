<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSigningFieldsToApproverLinesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $approverTables = [
            'fs_approver',
            'ppab_approver_line',
            'po_approver_line',
            'mis_approver_line',
            'fr_approver',
        ];

        foreach ($approverTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'signed_at')) {
                        $table->timestamp('signed_at')->nullable();
                    }
                    if (!Schema::hasColumn($tableName, 'verify_token')) {
                        $table->string('verify_token')->nullable()->unique();
                    }
                });
            }
        }

        $documentTables = [
            'fund_settlement',
            'ppab',
            'po',
            'mis',
            'fr',
        ];

        foreach ($documentTables as $docTable) {
            if (Schema::hasTable($docTable)) {
                Schema::table($docTable, function (Blueprint $table) use ($docTable) {
                    if (!Schema::hasColumn($docTable, 'signed_pdf_path')) {
                        $table->string('signed_pdf_path')->nullable();
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $approverTables = [
            'fs_approver',
            'ppab_approver_line',
            'po_approver_line',
            'mis_approver_line',
            'fr_approver',
        ];

        foreach ($approverTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'verify_token')) {
                        $table->dropUnique([$tableName . '_verify_token_unique']);
                        $table->dropColumn('verify_token');
                    }
                    if (Schema::hasColumn($tableName, 'signed_at')) {
                        $table->dropColumn('signed_at');
                    }
                });
            }
        }

        $documentTables = [
            'fund_settlement',
            'ppab',
            'po',
            'mis',
            'fr',
        ];

        foreach ($documentTables as $docTable) {
            if (Schema::hasTable($docTable)) {
                Schema::table($docTable, function (Blueprint $table) use ($docTable) {
                    if (Schema::hasColumn($docTable, 'signed_pdf_path')) {
                        $table->dropColumn('signed_pdf_path');
                    }
                });
            }
        }
    }
}
