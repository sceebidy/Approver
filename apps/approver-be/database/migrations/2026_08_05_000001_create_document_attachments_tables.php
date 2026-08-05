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
        if (!Schema::hasTable('ppab_attachment')) {
            Schema::create('ppab_attachment', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ppab_id')->constrained('ppab')->cascadeOnDelete();
                $table->string('filename', 500);
                $table->string('original_name', 255)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('po_attachment')) {
            Schema::create('po_attachment', function (Blueprint $table) {
                $table->id();
                $table->foreignId('po_id')->constrained('po')->cascadeOnDelete();
                $table->string('filename', 500);
                $table->string('original_name', 255)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('mis_attachment')) {
            Schema::create('mis_attachment', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mis_id')->constrained('mis')->cascadeOnDelete();
                $table->string('filename', 500);
                $table->string('original_name', 255)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mis_attachment');
        Schema::dropIfExists('po_attachment');
        Schema::dropIfExists('ppab_attachment');
    }
};
