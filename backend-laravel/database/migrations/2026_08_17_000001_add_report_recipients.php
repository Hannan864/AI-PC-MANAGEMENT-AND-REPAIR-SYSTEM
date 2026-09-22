<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: report recipients.
 *
 * - system_report_technicians pivot: a system report can be delivered to
 *   ONE or MANY technicians — the customer picks who receives their report.
 * - report_schedules.technician_ids: the customer's chosen technician(s),
 *   reused by the daily / weekly / monthly auto-capture schedule so every
 *   scheduled report goes to the same people.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_report_technicians', function (Blueprint $table) {
            $table->uuid('system_report_id');
            $table->uuid('technician_id');
            $table->timestamps();

            $table->primary(['system_report_id', 'technician_id']);

            $table->foreign('system_report_id')
                  ->references('id')->on('system_reports')
                  ->cascadeOnDelete();

            $table->foreign('technician_id')
                  ->references('id')->on('users')
                  ->cascadeOnDelete();
        });

        Schema::table('report_schedules', function (Blueprint $table) {
            $table->json('technician_ids')->nullable()
                  ->after('next_run_at')
                  ->comment('Customer-chosen technician ids for report delivery');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_report_technicians');

        Schema::table('report_schedules', function (Blueprint $table) {
            $table->dropColumn('technician_ids');
        });
    }
};
