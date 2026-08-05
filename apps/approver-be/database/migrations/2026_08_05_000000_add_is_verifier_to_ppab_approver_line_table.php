<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('ppab_approver_line') && !Schema::hasColumn('ppab_approver_line', 'is_verifier')) {
            Schema::table('ppab_approver_line', function (Blueprint $table) {
                $table->boolean('is_verifier')->default(false)->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ppab_approver_line') && Schema::hasColumn('ppab_approver_line', 'is_verifier')) {
            Schema::table('ppab_approver_line', function (Blueprint $table) {
                $table->dropColumn('is_verifier');
            });
        }
    }
};
