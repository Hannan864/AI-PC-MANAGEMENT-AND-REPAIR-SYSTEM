<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Expand pc_builds status values.
 *
 * The original enum only allowed:
 *   draft | submitted_review | under_review | reviewed
 *
 * The technician review workflow needs additional persisted states:
 *   rejected   — returned to the customer for changes
 *   in_progress — technician started building the approved system
 *   completed   — build finished
 *
 * Widening the column to a plain string keeps existing rows intact while
 * allowing the full lifecycle to be stored.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pc_builds', function (Blueprint $table) {
            $table->string('status', 32)->default('draft')->change();
        });
    }

    public function down(): void
    {
        Schema::table('pc_builds', function (Blueprint $table) {
            $table->enum('status', [
                'draft',
                'submitted_review',
                'under_review',
                'reviewed',
            ])->default('draft')->change();
        });
    }
};
