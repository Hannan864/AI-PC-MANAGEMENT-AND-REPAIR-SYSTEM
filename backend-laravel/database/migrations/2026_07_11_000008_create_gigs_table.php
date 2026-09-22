<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gigs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('technician_id');
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['Hardware', 'Software', 'Network', 'Full Repair']);
            $table->decimal('price', 10, 2);
            $table->string('estimated_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->foreign('technician_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->index('technician_id');
            $table->index('category');
            $table->index('is_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gigs');
    }
};
