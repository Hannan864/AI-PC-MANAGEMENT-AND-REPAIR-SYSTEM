<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('uid', 64)->unique();
            $table->string('rule_code', 64);
            $table->string('category', 32);
            $table->string('severity', 16);
            $table->string('title');
            $table->text('description');
            $table->string('status', 16)->default('active');
            $table->string('source_module', 64);
            $table->text('recommended_action')->nullable();
            $table->text('suggested_fix')->nullable();
            $table->string('fix_route')->nullable();
            $table->json('context_data')->nullable();
            $table->timestamp('detected_at');
            $table->timestamp('last_updated_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'severity']);
            $table->index(['rule_code', 'status']);
            $table->index('category');
            $table->index('detected_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
