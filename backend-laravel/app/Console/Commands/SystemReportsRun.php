<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SystemReportService;
use Illuminate\Console\Command;

/**
 * Command: system-reports:run
 *
 * Sweeps every user with an enabled dossier schedule (daily / weekly /
 * monthly) and captures a fresh "PC Medical Dossier" for each one whose
 * next_run_at is due. Reports are delivered to the user's currently
 * assigned technician.
 *
 * Wired into the snapshot monitor loop (bat/run_snapshot_loop.bat) so it
 * runs continuously alongside the telemetry refresh on this local machine.
 * When moving to cloud, point this same command at a scheduler instead.
 */
class SystemReportsRun extends Command
{
    protected $signature = 'system-reports:run {--quiet-ok}';
    protected $description = 'Capture due scheduled system dossiers and deliver them to assigned technicians';

    public function handle(SystemReportService $service): int
    {
        $ran = $service->runScheduledSweep();

        if (count($ran) === 0) {
            $this->line('No scheduled dossier captures due.');
        } else {
            foreach ($ran as $entry) {
                $this->info(sprintf(
                    'Captured %s dossier for %s → delivered to %s',
                    strtoupper($entry['type']),
                    $entry['user'],
                    $entry['tech'] ?? 'no assigned technician (stored for later)',
                ));
            }
        }

        return Command::SUCCESS;
    }
}
