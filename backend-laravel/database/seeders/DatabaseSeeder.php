<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder: Master seeder entry point.
 *
 * Run order matters due to foreign key constraints:
 *   1. UserSeeder         — creates users + technician_profiles
 *   2. RepairRequestSeeder — creates repair_requests + lifecycle_events + completion_reports
 *
 * To run:
 *   php artisan migrate:fresh --seed
 *   php artisan db:seed
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            // Default maintenance routines keep the Scheduler functional out of
            // the box (real, safe, read-only checks — no fake system data).
            MaintenanceTaskSeeder::class,
            // Real automations so the Automation Hub is functional out of the box.
            AutomationScriptSeeder::class,
            // RepairRequestSeeder intentionally excluded — no fake data.
            // GigSeeder intentionally excluded — no fake data.
            // Tester creates all data manually through the UI.
        ]);
    }
}
