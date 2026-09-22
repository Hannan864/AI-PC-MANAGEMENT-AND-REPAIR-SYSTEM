<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\MaintenanceTask;
use Illuminate\Database\Seeder;

class MaintenanceTaskSeeder extends Seeder
{
    public function run(): void
    {
        $tasks = [
            [
                'name' => 'Deep Disk Cleanup',
                'frequency' => 'Weekly',
                'next_run' => 'Sat, 03:00 AM',
                'active' => true,
                'category' => 'storage',
            ],
            [
                'name' => 'Registry Optimization',
                'frequency' => 'Monthly',
                'next_run' => '1st of Month',
                'active' => false,
                'category' => 'performance',
            ],
            [
                'name' => 'System Restore Point',
                'frequency' => 'Daily',
                'next_run' => 'Every 24h',
                'active' => true,
                'category' => 'backup',
            ],
            [
                'name' => 'Temp File Purge',
                'frequency' => 'Weekly',
                'next_run' => 'Sun, 04:00 AM',
                'active' => true,
                'category' => 'storage',
            ],
            [
                'name' => 'Security Scan',
                'frequency' => 'Daily',
                'next_run' => 'Every 24h',
                'active' => true,
                'category' => 'security',
            ],
        ];

        foreach ($tasks as $task) {
            MaintenanceTask::updateOrCreate(
                ['name' => $task['name']],
                $task
            );
        }
    }
}
