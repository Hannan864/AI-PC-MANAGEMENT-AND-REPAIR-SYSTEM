<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\StartupService;
use Illuminate\Database\Seeder;

class StartupServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Sentinel Core Persistence', 'impact' => 'Medium', 'enabled' => true, 'boot_time_s' => 0.12],
            ['name' => 'Gemini Analysis Bridge', 'impact' => 'Low', 'enabled' => true, 'boot_time_s' => 0.04],
            ['name' => 'Telemetry Engine Pro', 'impact' => 'Low', 'enabled' => true, 'boot_time_s' => 0.08],
            ['name' => 'IndexedDB Re-indexing', 'impact' => 'High', 'enabled' => false, 'boot_time_s' => 0.85],
        ];

        foreach ($services as $s) {
            StartupService::updateOrCreate(['name' => $s['name']], $s);
        }
    }
}
