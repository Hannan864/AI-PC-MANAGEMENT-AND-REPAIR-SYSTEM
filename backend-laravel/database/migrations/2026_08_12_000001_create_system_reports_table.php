<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create system_reports table.
 *
 * Stores full "PC Medical Dossier" snapshots per user.
 * A report is a self-contained, enterprise-format JSON envelope of the
 * user's system state at capture time — designed to be sent to the assigned
 * technician (technician_id) and cloud-ready (source = 'local' now, 'cloud'
 * in future deployments).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('technician_id')->nullable()
                  ->comment('Technician this report was delivered to (assigned tech only)');
            $table->string('title');
            $table->string('report_type', 20)->default('manual')
                  ->comment('manual | daily | weekly | monthly');
            $table->integer('health_score')->nullable();
            $table->json('report_data')
                  ->comment('Full enterprise dossier envelope (self-contained JSON)');
            $table->string('source', 20)->default('local')
                  ->comment('local = on-premise storage; cloud = future cloud backend');
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->cascadeOnDelete();

            $table->foreign('technician_id')
                  ->references('id')->on('users')
                  ->nullOnDelete();

            $table->index(['user_id', 'created_at']);
            $table->index(['technician_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_reports');
    }
};
