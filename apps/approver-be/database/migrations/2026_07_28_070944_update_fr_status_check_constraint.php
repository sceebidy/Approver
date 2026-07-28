<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateFrStatusCheckConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('fr', function (Blueprint $table) {
            DB::statement('ALTER TABLE fr DROP CONSTRAINT IF EXISTS fr_status_check');
            DB::statement("ALTER TABLE fr ADD CONSTRAINT fr_status_check CHECK (status IN ('draft','submitted','pending','approved','rejected','canceled'))");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('fr', function (Blueprint $table) {
            DB::statement('ALTER TABLE fr DROP CONSTRAINT IF EXISTS fr_status_check');
            DB::statement("ALTER TABLE fr ADD CONSTRAINT fr_status_check CHECK (status IN ('draft','approved','submitted','rejected','canceled'))");
        });
    }
}
