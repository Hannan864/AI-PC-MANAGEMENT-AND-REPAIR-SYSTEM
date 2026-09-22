<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Add execution tracking to maintenance tasks.
 *
 * Adds:
 *   - last_run_at   — when the routine last executed (via "Run Now")
 *   - last_result   — human-readable outcome of the last execution
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_tasks', function (Blueprint $table) {
            $table->timestamp('last_run_at')->nullable();
            $table->text('last_result')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_tasks', function (Blueprint $table) {
            $table->dropColumn(['last_run_at', 'last_result']);
        });
    }
};
