<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;

class AppManagerController extends BaseController
{
    /**
     * System-critical processes that must never be offered for termination.
     * Compared case-insensitively against the process name.
     */
    /**
     * System-critical processes that must never be offered for termination.
     * Single source of truth shared with OptimizeController's server-side guard.
     */
    public const PROTECTED_PROCESSES = [
        'system', 'system idle process', 'memory compression', 'msmpeng.exe',
        'svchost.exe', 'csrss.exe', 'wininit.exe', 'winlogon.exe', 'services.exe',
        'lsass.exe', 'dwm.exe', 'audiodg.exe', 'fontdrvhost.exe', 'smss.exe',
        'registry', 'secure system',
    ];

    public function index(): JsonResponse
    {
        $snapshot = app(SystemSnapshot::class);
        $processes = $snapshot->get('processes');
        $health = $snapshot->get('health');

        $totalRamMB = $processes['totalRamMB'] ?? $health['ram']['totalMB'] ?? 8192;
        $usedPercent = (float) ($health['ram']['usedPercent'] ?? 0);
        $usedRamMB = $totalRamMB > 0 ? round($totalRamMB * ($usedPercent / 100)) : 0;

        $apps = [];
        if ($processes && isset($processes['processes'])) {
            foreach ($processes['processes'] as $p) {
                $name = $p['name'] ?? 'Unknown';
                $ramMB = (float) ($p['ramMB'] ?? $p['memoryMB'] ?? 0);
                $ramGB = round($ramMB / 1024, 1);
                $ramPercent = $totalRamMB > 0 ? round(($ramMB / $totalRamMB) * 100, 1) : 0.0;

                // Real per-process CPU from the snapshot (null when unavailable —
                // the UI shows "—" rather than a fabricated number).
                $cpuPercent = null;
                if (isset($p['cpuPercent']) && is_numeric($p['cpuPercent'])) {
                    $cpuPercent = round(max(0.0, min(100.0, (float) $p['cpuPercent'])), 1);
                }

                // Priority from the real RAM-based impact score, tuned by CPU.
                $impact = strtolower((string) ($p['impact'] ?? 'low'));
                $priority = 'Normal';
                if ($impact === 'high' || ($cpuPercent !== null && $cpuPercent > 30)) {
                    $priority = 'High';
                } elseif ($impact === 'low' && ($cpuPercent === null || $cpuPercent < 2)) {
                    $priority = 'Background';
                }

                $apps[] = [
                    'name' => $name,
                    'pid' => (int) ($p['pid'] ?? 0),
                    'cpuPercent' => $cpuPercent,
                    'ram' => $ramGB . ' GB',
                    'ramMB' => $ramMB,
                    'ramPercent' => $ramPercent,
                    'threads' => (int) ($p['threads'] ?? 0),
                    'impact' => ucfirst($impact),
                    'priority' => $priority,
                    'protected' => in_array(strtolower($name), self::PROTECTED_PROCESSES, true),
                ];
            }
        }

        usort($apps, fn($a, $b) => $b['ramMB'] <=> $a['ramMB']);
        $apps = array_slice($apps, 0, 15);

        // Real aggregate CPU across the displayed apps (null when no CPU data).
        $cpuAvg = null;
        $withCpu = array_values(array_filter($apps, fn($a) => $a['cpuPercent'] !== null));
        if (count($withCpu) > 0) {
            $cpuAvg = round(array_sum(array_column($withCpu, 'cpuPercent')) / count($withCpu), 1);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'apps' => $apps,
                'totalProcesses' => $processes['totalProcesses'] ?? count($apps),
                'totalRamMB' => $totalRamMB,
                'usedRamMB' => $usedRamMB,
                'cpuAvg' => $cpuAvg,
            ],
        ]);
    }
}
