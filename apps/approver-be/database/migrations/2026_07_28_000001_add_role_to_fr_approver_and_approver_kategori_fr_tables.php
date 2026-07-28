<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToFrApproverAndApproverKategoriFrTables extends Migration
{
    public function up()
    {
        // Kolom role untuk fr_approver (siapa peran approver di dokumen FR)
        if (Schema::hasTable('fr_approver') && !Schema::hasColumn('fr_approver', 'role')) {
            Schema::table('fr_approver', function (Blueprint $table) {
                $table->string('role')->nullable()->after('approver_id');
            });
        }

        // Kolom role untuk mapping approver per kategori FR
        if (Schema::hasTable('approver_kategori_fr') && !Schema::hasColumn('approver_kategori_fr', 'role')) {
            Schema::table('approver_kategori_fr', function (Blueprint $table) {
                $table->string('role')->nullable()->after('user_id');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('fr_approver') && Schema::hasColumn('fr_approver', 'role')) {
            Schema::table('fr_approver', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        if (Schema::hasTable('approver_kategori_fr') && Schema::hasColumn('approver_kategori_fr', 'role')) {
            Schema::table('approver_kategori_fr', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
}
