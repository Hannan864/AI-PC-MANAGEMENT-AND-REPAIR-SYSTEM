<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create pc_builds table.
 *
 * Maps to the PCBuild TypeScript interface.
 * Renames `buildId` → `id`, `case` → `chassis` for DB clarity.
 *
 * Compatibility engine runs server-side in Phase 4.
 * JSON columns store the output from the compatibility validator.
 *
 * Build review workflow:
 *   draft → submitted_review → under_review → reviewed
 *
 * Relationships:
 *   pc_builds.user_id       → users.id (owner)
 *   pc_builds.technician_id → users.id (optional reviewer)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pc_builds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('technician_id')->nullable();

            $table->string('build_name');

            // Core component selections (stored as model strings, e.g. "AMD Ryzen 5 5600X")
            $table->string('cpu');
            $table->string('gpu');
            $table->string('motherboard');
            $table->string('ram');
            $table->string('storage');
            $table->string('power_supply');
            $table->string('chassis')->nullable();

            // Cost estimates
            $table->decimal('estimated_cost_usd', 10, 2)->nullable();
            $table->decimal('estimated_cost_pkr', 12, 2)->nullable();

            // Compatibility engine output
            $table->enum('compatibility_status', ['pass', 'warning', 'fail'])->default('pass');
            $table->unsignedSmallInteger('performance_score')->default(0)
                  ->comment('0-100 score from server-side compatibility engine');
            $table->json('issues')->nullable()
                  ->comment('Array of compatibility issue strings');
            $table->json('bottlenecks')->nullable()
                  ->comment('Array of bottleneck description strings');

            // Build review lifecycle
            $table->enum('status', [
                'draft',
                'submitted_review',
                'under_review',
                'reviewed',
            ])->default('draft');

            $table->text('user_notes')->nullable();
            $table->text('technician_notes')->nullable();

            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('technician_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pc_builds');
    }
};
