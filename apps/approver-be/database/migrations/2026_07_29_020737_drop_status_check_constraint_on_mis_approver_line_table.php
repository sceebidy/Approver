<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropStatusCheckConstraintOnMisApproverLineTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop the constraint because the original migration misspelled 'approved' as 'approval'
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE mis_approver_line DROP CONSTRAINT IF EXISTS mis_approver_line_status_check');
        
        Schema::table('mis_approver_line', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
