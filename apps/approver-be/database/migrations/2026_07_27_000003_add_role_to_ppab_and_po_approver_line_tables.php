<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToPpabAndPoApproverLineTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('ppab_approver_line') && !Schema::hasColumn('ppab_approver_line', 'role')) {
            Schema::table('ppab_approver_line', function (Blueprint $table) {
                $table->string('role')->nullable()->after('approver_id');
            });
        }

        if (Schema::hasTable('po_approver_line') && !Schema::hasColumn('po_approver_line', 'role')) {
            Schema::table('po_approver_line', function (Blueprint $table) {
                $table->string('role')->nullable()->after('approver_id');
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
        if (Schema::hasTable('ppab_approver_line') && Schema::hasColumn('ppab_approver_line', 'role')) {
            Schema::table('ppab_approver_line', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        if (Schema::hasTable('po_approver_line') && Schema::hasColumn('po_approver_line', 'role')) {
            Schema::table('po_approver_line', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
}
