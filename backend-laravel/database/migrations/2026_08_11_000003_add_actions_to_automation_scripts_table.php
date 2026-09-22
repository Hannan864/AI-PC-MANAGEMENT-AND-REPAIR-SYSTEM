<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('automation_scripts', function (Blueprint $table) {
            $table->text('actions')->nullable()->after('trigger_condition');
            $table->text('last_result')->nullable()->after('last_run');
        });
    }

    public function down(): void
    {
        Schema::table('automation_scripts', function (Blueprint $table) {
            $table->dropColumn(['actions', 'last_result']);
        });
    }
};
