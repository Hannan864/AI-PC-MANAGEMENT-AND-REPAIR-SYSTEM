<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create completion_reports table.
 *
 * Maps to the ServiceCompletionReport TypeScript interface.
 * Filed by the technician when marking a repair as completed.
 *
 * JSON column `parts_replaced` stores an array of:
 *   { name: string, price: number, quantity: number }
 *
 * Costs are stored in PKR (Pakistani Rupees) as the primary currency.
 *
 * Relationships:
 *   completion_reports.repair_request_id → repair_requests.id (1:1)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('completion_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('repair_request_id')->unique();

            $table->text('issue_summary');
            $table->text('root_cause');
            $table->json('parts_replaced')->nullable()
                  ->comment('[{name, price_pkr, quantity}]');
            $table->decimal('labor_cost', 10, 2)->default(0.00)
                  ->comment('Labor cost in PKR');
            $table->decimal('total_cost', 10, 2)->default(0.00)
                  ->comment('Total invoice amount in PKR');
            $table->text('work_notes')->nullable();
            $table->unsignedInteger('time_spent_minutes')->default(0);

            $table->timestamps();

            $table->foreign('repair_request_id')
                  ->references('id')
                  ->on('repair_requests')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('completion_reports');
    }
};
