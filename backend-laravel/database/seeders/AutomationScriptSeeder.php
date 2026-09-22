<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AutomationScript;
use Illuminate\Database\Seeder;

class AutomationScriptSeeder extends Seeder
{
    /**
     * Seed real automations — each one carries the exact list of safe actions
     * its "Run Now" / sandbox execution actually performs. last_run stays null
     * until the user (or a future scheduler) executes one.
     */
    public function run(): void
    {
        $scripts = [
            [
                'name' => 'Idle Time Maintenance',
                'trigger_condition' => 'SYSTEM_IDLE',
                'actions' => ['purge_temp', 'optimize_ram', 'report_summary'],
                'status' => 'Armed',
            ],
            [
                'name' => 'Daily Cache & DNS Purge',
                'trigger_condition' => '03:00 AM',
                'actions' => ['purge_temp', 'flush_dns'],
                'status' => 'Armed',
            ],
            [
                'name' => 'Boot Health Snapshot',
                'trigger_condition' => 'ON_BOOT',
                'actions' => ['report_summary', 'security_scan'],
                'status' => 'Armed',
            ],
            [
                'name' => 'Weekly Security Review',
                'trigger_condition' => 'SUNDAY 06:00',
                'actions' => ['security_scan', 'backup_check', 'report_summary'],
                'status' => 'Paused',
            ],
        ];

        foreach ($scripts as $s) {
            AutomationScript::updateOrCreate(['name' => $s['name']], $s);
        }
    }
}
