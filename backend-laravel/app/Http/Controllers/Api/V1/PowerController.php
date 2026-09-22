<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PowerController extends BaseController
{
    /**
     * Known Windows power plan GUIDs mapped to friendly profile metadata.
     * Active scheme is detected live via `powercfg /list` — never guessed.
     */
    private const PROFILES = [
        '381b4222-f694-41f0-9685-ff5bb260df2e' => ['label' => 'Balanced',            'desc' => 'Default system energy distribution.',               'color' => 'text-indigo-400'],
        '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c' => ['label' => 'Ultra Performance',   'desc' => 'No throttling, maximum clock speed.',             'color' => 'text-amber-400'],
        'e9a42b02-d5df-448d-aa00-03f14749eb61' => ['label' => 'Ultimate Performance','desc' => 'Removes micro-latencies for maximum responsiveness.', 'color' => 'text-rose-400'],
        'a1841308-3541-4fab-bc81-f71556f20b4a' => ['label' => 'Power Saver',         'desc' => 'Aggressive background task suppression.',          'color' => 'text-emerald-400'],
    ];

    public function index(): JsonResponse
    {
        $snapshot = app(SystemSnapshot::class);
        $health = $snapshot->get('health');
        $performance = $snapshot->get('performance');

        $cpuPercent = $this->getCpuPercent($health, $performance);
        $ramPercent = $this->getRamPercent($health, $performance);

        $battery = $this->readBattery();
        $schemes = $this->readPowerSchemes();
        $consumption = $this->consumptionEstimates($cpuPercent, $ramPercent);

        return response()->json([
            'success' => true,
            'data' => [
                'hasBattery' => $battery['hasBattery'],
                'battery' => $battery,
                'profiles' => $schemes['profiles'],
                'activeGuid' => $schemes['activeGuid'],
                'powerCfgAvailable' => $schemes['available'],
                'consumption' => $consumption,
                'totalWatts' => $consumption['totalWatts'],
                'healthScore' => $this->healthScore($battery, $cpuPercent, $ramPercent),
                'uptime' => $health['uptime'] ?? 'Unknown',
                'serverTime' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Apply a real Windows power plan.
     *
     * Executes `powercfg /setactive <guid>` — switches the actual OS power
     * scheme. Requires the PHP process to have sufficient privileges; if the
     * switch is denied we surface the real OS error instead of pretending.
     */
    public function setProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guid' => ['required', 'string', 'regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/'],
        ]);

        $guid = $validated['guid'];

        $out = $this->execWithTimeout('powercfg /setactive ' . $guid . ' 2>&1', 8000);

        $errors = [];
        foreach ($out as $line) {
            $line = trim($line);
            if ($line !== '') {
                $errors[] = $line;
            }
        }

        if (count($errors) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Could not apply power plan: ' . implode(' ', array_slice($errors, 0, 2)),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Power plan applied successfully.',
            'data' => ['guid' => $guid],
        ]);
    }

    // ---------------------------------------------------------------------
    // Real data readers
    // ---------------------------------------------------------------------

    private function readBattery(): array
    {
        $out = $this->execWithTimeout(
            'wmic Path Win32_Battery get EstimatedChargeRemaining, BatteryStatus, FullChargeCapacity, DesignCapacity, Name, EstimatedRunTime /value 2>&1',
            5000
        );

        $fields = [];
        foreach ($out as $line) {
            $line = trim($line);
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $fields[trim($k)] = trim($v);
            }
        }

        // wmic is removed on newer Windows builds — fall back to PowerShell
        // when the charge reading is missing (not just when fields are empty,
        // since wmic can return partial output on some systems).
        if (!isset($fields['EstimatedChargeRemaining'])) {
            $out2 = $this->execWithTimeout(
                'powershell -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus, FullChargeCapacity, DesignCapacity, Name, EstimatedRunTime | Format-List" 2>&1',
                6000
            );
            foreach ($out2 as $line) {
                if (str_contains($line, ':')) {
                    [$k, $v] = explode(':', $line, 2);
                    $fields[trim($k)] = trim($v);
                }
            }
        }

        // No battery present (e.g. desktop PC) — honest AC-only state.
        if (!isset($fields['EstimatedChargeRemaining'])) {
            return [
                'hasBattery' => false,
                'level' => null,
                'isCharging' => null,
                'onAc' => true,
                'status' => 'AC Power',
                'type' => 'No Battery Detected',
                'healthPercent' => null,
                'wearPercent' => null,
                'runTimeMinutes' => null,
            ];
        }

        $level = max(0, min(100, (int) $fields['EstimatedChargeRemaining']));
        $statusCode = (int) ($fields['BatteryStatus'] ?? 2);

        // BatteryStatus: 1/4/5 = discharging, 3 = fully charged, 2 = on AC,
        // 6/7/8/9/11 = charging (various levels).
        $isCharging = in_array($statusCode, [6, 7, 8, 9, 11], true);
        $onAc = !in_array($statusCode, [1, 4, 5], true);

        if ($statusCode === 3) {
            $status = 'Fully Charged';
        } elseif ($isCharging) {
            $status = 'Charging';
        } elseif ($onAc) {
            $status = 'On AC Power';
        } else {
            $status = 'Discharging';
        }

        $design = (int) ($fields['DesignCapacity'] ?? 0);
        $full = (int) ($fields['FullChargeCapacity'] ?? 0);

        $wearPercent = null;
        $healthPercent = null;
        if ($design > 0 && $full > 0 && $full <= $design) {
            $wearPercent = round((1 - ($full / $design)) * 100, 1);
            $healthPercent = max(0, min(100, round(($full / $design) * 100, 1)));
        }

        // EstimatedRunTime is in minutes; -1 means on AC with no estimate.
        $runTimeMinutes = null;
        $runTime = (int) ($fields['EstimatedRunTime'] ?? -1);
        if ($runTime > 0) {
            $runTimeMinutes = $runTime;
        }

        return [
            'hasBattery' => true,
            'level' => $level,
            'isCharging' => $isCharging,
            'onAc' => $onAc,
            'status' => $status,
            'type' => ($fields['Name'] ?? '') !== '' ? $fields['Name'] : 'System Battery',
            'healthPercent' => $healthPercent,
            'wearPercent' => $wearPercent,
            'runTimeMinutes' => $runTimeMinutes,
        ];
    }

    /**
     * Read the real active power scheme and all available schemes.
     *
     * `powercfg /list` lines look like:
     *   Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *
     * The trailing `*` marks the active scheme.
     */
    private function readPowerSchemes(): array
    {
        $out = $this->execWithTimeout('powercfg /list 2>&1', 5000);

        $found = [];
        foreach ($out as $line) {
            if (!preg_match(
                '/^.*?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\s*\(([^)]*)\)\s*(\*)?\s*$/',
                trim($line),
                $m
            )) {
                continue;
            }
            $found[] = [
                'guid' => strtolower($m[1]),
                'name' => trim($m[2]),
                'active' => ($m[3] ?? '') === '*',
            ];
        }

        if (empty($found)) {
            return ['available' => false, 'activeGuid' => null, 'profiles' => []];
        }

        $activeGuid = null;
        foreach ($found as $scheme) {
            if ($scheme['active']) {
                $activeGuid = $scheme['guid'];
                break;
            }
        }

        $profiles = [];
        $custom = [];
        foreach ($found as $scheme) {
            $known = self::PROFILES[$scheme['guid']] ?? null;
            if ($known !== null) {
                $profiles[] = [
                    'guid' => $scheme['guid'],
                    'name' => $known['label'],
                    'desc' => $known['desc'],
                    'active' => $scheme['active'],
                    'color' => $known['color'],
                    'systemName' => $scheme['name'],
                ];
            } else {
                $custom[] = [
                    'guid' => $scheme['guid'],
                    'name' => $scheme['name'],
                    'desc' => 'Custom power plan configured on this system.',
                    'active' => $scheme['active'],
                    'color' => 'text-slate-400',
                    'systemName' => $scheme['name'],
                ];
            }
        }

        return [
            'available' => true,
            'activeGuid' => $activeGuid,
            'profiles' => array_merge($profiles, $custom),
        ];
    }

    // ---------------------------------------------------------------------
    // Honest estimates (clearly labelled, derived from real usage)
    // ---------------------------------------------------------------------

    private function getCpuPercent(?array $health, ?array $performance): float
    {
        $cpu = $health['cpu']['usedPercent'] ?? $performance['cpu'] ?? null;
        if (is_numeric($cpu)) {
            return max(0.0, min(100.0, (float) $cpu));
        }

        $out = $this->execWithTimeout('wmic cpu get loadpercentage /value 2>&1', 3000);
        foreach ($out as $line) {
            if (str_starts_with(trim($line), 'LoadPercentage=')) {
                return max(0.0, min(100.0, (float) explode('=', $line)[1]));
            }
        }
        return 0.0;
    }

    private function getRamPercent(?array $health, ?array $performance): float
    {
        $ram = $health['ram']['usedPercent'] ?? $performance['ram']['usedPercent'] ?? null;
        if (is_numeric($ram)) {
            return max(0.0, min(100.0, (float) $ram));
        }

        $free = 0;
        $total = 0;
        $out = $this->execWithTimeout('wmic OS get FreePhysicalMemory /value', 3000);
        foreach ($out as $line) {
            if (str_starts_with(trim($line), 'FreePhysicalMemory=')) {
                $free = (int) explode('=', $line)[1];
                break;
            }
        }
        $out2 = $this->execWithTimeout('wmic OS get TotalVisibleMemorySize /value', 3000);
        foreach ($out2 as $line) {
            if (str_starts_with(trim($line), 'TotalVisibleMemorySize=')) {
                $total = (int) explode('=', $line)[1];
                break;
            }
        }
        if ($total === 0) {
            return 0.0;
        }
        return max(0.0, min(100.0, round((($total - $free) / $total) * 100, 1)));
    }

    private function consumptionEstimates(float $cpuPercent, float $ramPercent): array
    {
        // Estimates based on real utilization, scaled to typical component
        // envelopes. Kept honest: the UI labels these as estimates.
        $cpuWatts = round(($cpuPercent / 100) * 65, 1);
        $ramWatts = round(($ramPercent / 100) * 12, 1);
        $gpuWatts = round(($cpuPercent / 100) * 8, 1);
        $peripheralWatts = 2.5;
        $totalWatts = round($cpuWatts + $ramWatts + $gpuWatts + $peripheralWatts, 1);

        return [
            'items' => [
                ['label' => 'CPU Package', 'watts' => $cpuWatts, 'percent' => round($cpuPercent, 1)],
                ['label' => 'Memory', 'watts' => $ramWatts, 'percent' => round($ramPercent, 1)],
                ['label' => 'GPU Core', 'watts' => $gpuWatts, 'percent' => round(($cpuPercent / 100) * 15, 1)],
                ['label' => 'Peripherals', 'watts' => $peripheralWatts, 'percent' => 0],
            ],
            'totalWatts' => $totalWatts,
            'estimated' => true,
        ];
    }

    private function healthScore(array $battery, float $cpuPercent, float $ramPercent): int
    {
        $score = 100;

        // Real battery wear is the primary health signal when a battery exists.
        if ($battery['hasBattery'] && $battery['wearPercent'] !== null) {
            $score -= min(60, (int) $battery['wearPercent']);
        }

        if ($cpuPercent > 80) {
            $score -= 20;
        } elseif ($cpuPercent > 60) {
            $score -= 10;
        }
        if ($ramPercent > 85) {
            $score -= 15;
        } elseif ($ramPercent > 70) {
            $score -= 5;
        }

        return max(0, $score);
    }
}
