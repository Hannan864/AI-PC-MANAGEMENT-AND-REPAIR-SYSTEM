<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('startup_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('impact')->default('Low');
            $table->boolean('enabled')->default(true);
            $table->decimal('boot_time_s', 4, 2)->default(0.05);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('startup_services');
    }
};
