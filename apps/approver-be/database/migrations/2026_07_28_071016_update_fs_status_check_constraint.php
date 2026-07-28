<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateFsStatusCheckConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('fund_settlement', function (Blueprint $table) {
            DB::statement('ALTER TABLE fund_settlement DROP CONSTRAINT IF EXISTS fund_settlement_status_check');
            DB::statement("ALTER TABLE fund_settlement ADD CONSTRAINT fund_settlement_status_check CHECK (status IN ('draft','submitted','pending','approved','done','rejected'))");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('fund_settlement', function (Blueprint $table) {
            DB::statement('ALTER TABLE fund_settlement DROP CONSTRAINT IF EXISTS fund_settlement_status_check');
            DB::statement("ALTER TABLE fund_settlement ADD CONSTRAINT fund_settlement_status_check CHECK (status IN ('draft','submitted','approved','done','rejected'))");
        });
    }
}
