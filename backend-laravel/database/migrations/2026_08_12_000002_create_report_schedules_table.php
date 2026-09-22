<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create report_schedules table.
 *
 * Per-user schedule for automatic dossier captures.
 * The user chooses daily / weekly / monthly; the system-reports:run
 * console command captures a fresh dossier when next_run_at is due and
 * delivers it to the technician currently assigned to the user's request.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->string('frequency', 20)->default('off')
                  ->comment('off | daily | weekly | monthly');
            $table->boolean('enabled')->default(false);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_schedules');
    }
};
