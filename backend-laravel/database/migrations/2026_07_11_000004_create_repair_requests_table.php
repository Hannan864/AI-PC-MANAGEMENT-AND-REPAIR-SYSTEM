<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create repair_requests table.
 *
 * Central ticket table. Gig/marketplace fields are intentionally excluded
 * per FYP approved Admin Assignment workflow.
 *
 * Status flow: submitted → assigned → accepted → in_progress
 *              → waiting_parts → testing → completed | cancelled
 *
 * JSON columns (MySQL 5.7+):
 *   - system_specifications: static hardware context snapshot
 *   - user_images: array of stored file paths (Laravel Storage)
 *   - tech_images: array of stored file paths (Laravel Storage)
 *
 * Relationships:
 *   repair_requests.user_id       → users.id  (customer)
 *   repair_requests.technician_id → users.id  (assigned technician, nullable)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('technician_id')->nullable();

            $table->string('issue_category')->nullable()
                  ->comment('e.g. Hardware, Software, Network, Other');
            $table->text('issue_description');
            $table->enum('severity_level', ['low', 'medium', 'high'])->default('medium');

            $table->enum('status', [
                'submitted',
                'assigned',
                'accepted',
                'in_progress',
                'waiting_parts',
                'testing',
                'completed',
                'cancelled',
            ])->default('submitted');

            // Static system spec snapshot attached at request time
            $table->json('system_specifications')->nullable()
                  ->comment('CPU, GPU, RAM, OS, Disk — static at submission time');

            // File storage paths (relative to storage/app/public)
            $table->json('user_images')->nullable();
            $table->json('tech_images')->nullable();

            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('technician_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');

            $table->index('status');
            $table->index('user_id');
            $table->index('technician_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_requests');
    }
};
