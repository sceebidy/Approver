<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateMisApproverLineStatusConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('mis_approver_line')) {
            Schema::table('mis_approver_line', function (Blueprint $table) {
                DB::statement('ALTER TABLE mis_approver_line DROP CONSTRAINT IF EXISTS mis_approver_line_status_check');
                DB::statement("ALTER TABLE mis_approver_line ADD CONSTRAINT mis_approver_line_status_check CHECK (status IN ('pending', 'approved', 'approval', 'rejected'))");
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
        if (Schema::hasTable('mis_approver_line')) {
            Schema::table('mis_approver_line', function (Blueprint $table) {
                DB::statement('ALTER TABLE mis_approver_line DROP CONSTRAINT IF EXISTS mis_approver_line_status_check');
                DB::statement("ALTER TABLE mis_approver_line ADD CONSTRAINT mis_approver_line_status_check CHECK (status IN ('pending', 'approval', 'rejected'))");
            });
        }
    }
}
