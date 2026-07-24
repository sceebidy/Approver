<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSsoFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->after('email');
            $table->string('role')->nullable()->after('employee_id');
            $table->integer('grade_level')->nullable()->after('role');
            $table->string('unit_nama')->nullable()->after('grade_level');
            $table->string('foto_profil')->nullable()->after('unit_nama');
            $table->string('penempatan_nama')->nullable()->after('foto_profil');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id',
                'role',
                'grade_level',
                'unit_nama',
                'foto_profil',
                'penempatan_nama',
            ]);
        });
    }
}
