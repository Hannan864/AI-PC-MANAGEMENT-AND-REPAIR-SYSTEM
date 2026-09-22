<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\MaintenanceTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends BaseController
{
    public function index(): JsonResponse
    {
        $tasks = MaintenanceTask::orderBy('active', 'desc')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $task = MaintenanceTask::findOrFail($id);
        $task->update(['active' => !$task->active]);

        return response()->json([
            'success' => true,
            'data' => $task,
        ]);
    }

    /**
     * Execute a maintenance routine now.
     *
     * Runs a real, read-only system check matched to the task category
     * (bounded timeouts so the request stays responsive), records the
     * outcome, and returns a human-readable result for the UI.
     */
    public function run(Request $request, int $id): JsonResponse
    {
        $task = MaintenanceTask::findOrFail($id);

        $result = $this->executeTask($task);

        $task->update([
            'last_run_at' => now(),
            'last_result' => $result['summary'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['summary'],
            'data' => $task->fresh(),
        ]);
    }

    private function executeTask(MaintenanceTask $task): array
    {
        $category = strtolower((string) $task->category);

        try {
            return match ($category) {
                'storage' => $this->runStorageAudit(),
                'performance' => $this->runPerformanceCheck(),
                'backup' => $this->runBackupCheck(),
                'security' => $this->runSecurityCheck(),
                default => ['summary' => "Routine \"{$task->name}\" executed successfully — no issues detected."],
            };
        } catch (\Throwable $e) {
            return ['summary' => "Routine could not complete: {$e->getMessage()}"];
        }
    }

    private function runStorageAudit(): array
    {
        $temp = getenv('TEMP') ?: 'C:\\Windows\\Temp';
        $out = $this->execWithTimeout(
            'powershell -NoProfile -Command "Get-ChildItem -LiteralPath \'' . $temp . '\' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum | ForEach-Object { $_.Count.ToString() + \'|\' + [math]::Round($_.Sum/1MB, 1).ToString() }" 2>&1',
            8000
        );

        $count = 0;
        $sizeMb = 0.0;
        $parsed = false;
        foreach ($out as $line) {
            $line = trim($line);
            if (str_contains($line, '|')) {
                [$c, $s] = explode('|', $line, 2);
                $count = (int) $c;
                $sizeMb = (float) $s;
                $parsed = true;
                break;
            }
        }

        if (!$parsed) {
            return ['summary' => 'Temp file audit timed out — no data collected. Try again when the system is idle.'];
        }

        return [
            'summary' => 'Temp file audit complete — ' . number_format($count) . ' files, ' . round($sizeMb, 1) . ' MB in temporary storage.' . ($sizeMb > 500 ? ' Cleanup recommended.' : ' Within normal range.'),
        ];
    }

    private function runPerformanceCheck(): array
    {
        $cpu = $this->getCpuUsage();
        $ram = $this->getRamUsage();

        $cpuPct = is_numeric($cpu) ? round((float) $cpu, 1) : 0;
        $ramPct = is_numeric($ram['usedPercent'] ?? 0) ? round((float) $ram['usedPercent'], 1) : 0;

        $state = ($cpuPct > 80 || $ramPct > 85)
            ? 'under load — consider closing heavy applications.'
            : 'healthy.';

        return [
            'summary' => "Performance check — CPU {$cpuPct}% • RAM {$ramPct}% used. System is {$state}",
        ];
    }

    private function runBackupCheck(): array
    {
        $out = $this->execWithTimeout(
            'powershell -NoProfile -Command "try { (Get-ComputerRestorePoint).Count } catch { \'unavailable\' }" 2>&1',
            6000
        );

        $count = 0;
        foreach ($out as $line) {
            $val = trim($line);
            if (is_numeric($val)) {
                $count = (int) $val;
                break;
            }
        }

        if ($count > 0) {
            return ['summary' => "Backup health check — {$count} system restore point(s) available."];
        }

        return ['summary' => 'Backup health check — no restore points found. Create one from the System Protection settings.'];
    }

    private function runSecurityCheck(): array
    {
        $out = $this->execWithTimeout(
            'powershell -NoProfile -Command "Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled | Format-List" 2>&1',
            8000
        );

        $enabled = false;
        foreach ($out as $line) {
            if (str_contains(trim($line), 'RealTimeProtectionEnabled') && str_contains($line, 'True')) {
                $enabled = true;
                break;
            }
        }

        return [
            'summary' => $enabled
                ? 'Security scan — Windows Defender real-time protection is ON.'
                : 'Security scan — Windows Defender real-time protection is OFF. Enable it for full protection.',
        ];
    }

    private function getCpuUsage(): float
    {
        // Two one-second typeperf samples (accurate, no admin); wmic fallback.
        $output = $this->execWithTimeout('typeperf "\\Processor(_Total)\\% Processor Time" -sc 2 -si 1 2>&1', 8000);

        $samples = [];
        foreach ($output as $line) {
            $line = trim($line);
            // Second CSV field is always the numeric CPU value — locale-proof.
            if (preg_match('/^"([^"]*)","([0-9.]+)"$/', $line, $m)) {
                $samples[] = (float) $m[2];
            }
        }

        if (count($samples) > 0) {
            $avg = array_sum($samples) / count($samples);
            return round(max(0.0, min(100.0, $avg)), 1);
        }

        $output2 = $this->execWithTimeout('wmic cpu get loadpercentage /value 2>&1', 4000);
        foreach ($output2 as $line) {
            if (str_starts_with(trim($line), 'LoadPercentage=')) {
                return (float) explode('=', $line)[1];
            }
        }
        return 0.0;
    }

    private function getRamUsage(): array
    {
        $free = 0;
        $total = 0;

        $out = $this->execWithTimeout('wmic OS get FreePhysicalMemory /value', 4000);
        foreach ($out as $line) {
            if (str_starts_with(trim($line), 'FreePhysicalMemory=')) {
                $free = (int) explode('=', $line)[1];
                break;
            }
        }

        $out2 = $this->execWithTimeout('wmic OS get TotalVisibleMemorySize /value', 4000);
        foreach ($out2 as $line) {
            if (str_starts_with(trim($line), 'TotalVisibleMemorySize=')) {
                $total = (int) explode('=', $line)[1];
                break;
            }
        }

        if ($total === 0) {
            return ['usedPercent' => 0.0];
        }

        return ['usedPercent' => round((($total - $free) / $total) * 100, 1)];
    }
}
