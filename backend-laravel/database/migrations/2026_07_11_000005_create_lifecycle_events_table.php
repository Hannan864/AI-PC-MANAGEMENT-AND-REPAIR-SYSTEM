<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create lifecycle_events table.
 *
 * Immutable audit log of every status change on a repair_request.
 * Replaces the client-side LifecycleEvent array stored in IndexedDB.
 *
 * Design decisions:
 *   - No `updated_at` — events are append-only (created_at only).
 *   - `updated_by` FK identifies which actor made the change.
 *   - `status` uses a string (not enum) to avoid migration overhead
 *     if a new status is added in future phases.
 *
 * Relationships:
 *   lifecycle_events.repair_request_id → repair_requests.id
 *   lifecycle_events.updated_by        → users.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lifecycle_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('repair_request_id');
            $table->string('status', 50)
                  ->comment('The new status that was set at this event');
            $table->uuid('updated_by')
                  ->comment('User (admin/technician/system) who triggered the change');
            $table->text('note')->nullable()
                  ->comment('Optional context note added by the actor');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('repair_request_id')
                  ->references('id')
                  ->on('repair_requests')
                  ->onDelete('cascade');

            $table->foreign('updated_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->index('repair_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lifecycle_events');
    }
};
