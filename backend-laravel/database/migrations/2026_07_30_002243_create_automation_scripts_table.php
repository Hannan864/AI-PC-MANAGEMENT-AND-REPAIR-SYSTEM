<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_scripts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('trigger_condition');
            $table->string('status')->default('Armed');
            $table->string('last_run')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_scripts');
    }
};
