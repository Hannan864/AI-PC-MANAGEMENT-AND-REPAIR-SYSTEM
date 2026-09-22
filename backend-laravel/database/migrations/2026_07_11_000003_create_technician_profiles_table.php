<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create technician_profiles table.
 *
 * Extended profile data specific to technician-role users.
 * Kept separate from users to avoid bloating the users table
 * and to follow Single Responsibility (SOLID).
 *
 * Relationships:
 *   technician_profiles.user_id → users.id (1:1)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_profiles', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('specialty')->nullable()->comment('e.g. Hardware, Software, Networking');
            $table->decimal('rating', 3, 2)->default(0.00)->comment('Average rating out of 5.00');
            $table->boolean('is_available')->default(true);
            $table->text('bio')->nullable();
            $table->unsignedInteger('jobs_completed')->default(0);
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->unique('user_id'); // One profile per technician
            $table->index('is_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_profiles');
    }
};
