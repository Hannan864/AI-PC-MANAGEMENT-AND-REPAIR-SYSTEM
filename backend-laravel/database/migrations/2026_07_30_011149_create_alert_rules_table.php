<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name');
            $table->string('category', 32);
            $table->string('severity', 16);
            $table->string('source_module', 64);
            $table->string('snapshot_section', 32);
            $table->string('condition_field', 128);
            $table->string('condition_operator', 8);
            $table->float('condition_value');
            $table->text('title_template');
            $table->text('description_template');
            $table->text('recommended_action')->nullable();
            $table->text('suggested_fix')->nullable();
            $table->string('fix_route')->nullable();
            $table->boolean('enabled')->default(true);
            $table->integer('cooldown_seconds')->default(300);
            $table->timestamps();

            $table->index('enabled');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_rules');
    }
};
