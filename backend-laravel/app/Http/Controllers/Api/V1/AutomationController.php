<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\AutomationScript;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationController extends BaseController
{
    /** Known safe action codes an automation may carry. */
    private const KNOWN_ACTIONS = ['purge_temp', 'optimize_ram', 'flush_dns', 'security_scan', 'backup_check', 'report_summary'];

    public function index(): JsonResponse
    {
        $scripts = AutomationScript::orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'scripts' => $scripts,
                'counts' => [
                    'total' => $scripts->count(),
                    'armed' => $scripts->where('status', 'Armed')->count(),
                    'paused' => $scripts->where('status', 'Paused')->count(),
                    'executed' => $scripts->whereNotNull('last_run')->count(),
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'trigger_condition' => 'required|string|max:255',
            'actions' => 'sometimes|array|max:3',
            'actions.*' => 'string|in:' . implode(',', self::KNOWN_ACTIONS),
        ]);

        $actions = $validated['actions'] ?? ['report_summary'];
        if (empty($actions)) {
            $actions = ['report_summary'];
        }
        $actions = array_values(array_unique(array_slice($actions, 0, 3)));

        $script = AutomationScript::create([
            'name' => $validated['name'],
            'trigger_condition' => $validated['trigger_condition'],
            'actions' => $actions,
            'status' => 'Armed',
            'last_run' => null,
            'last_result' => null,
        ]);

        return response()->json(['success' => true, 'data' => $script], 201);
    }

    /**
     * Execute the automation's real, safe actions now.
     *
     * Each action is a bounded, best-effort system operation (temp purge,
     * DNS flush, health summary, etc.). Outcomes are recorded on the script
     * and returned as a human-readable summary for the UI.
     */
    public function run(Request $request, int $id): JsonResponse
    {
        $script = AutomationScript::findOrFail($id);

        $actions = is_array($script->actions) ? array_slice($script->actions, 0, 3) : [];
        $results = [];
        foreach ($actions as $action) {
            $results[] = $this->executeAction((string) $action);
        }

        if (count($results) === 0) {
            $summary = 'No actions defined for this automation.';
        } else {
            $summary = implode(' • ', array_map(fn($r) => $r['detail'], $results));
        }

        $script->update([
            'last_run' => now(),
            'last_result' => $summary,
        ]);

        return response()->json([
            'success' => true,
            'message' => $summary,
            'data' => $script->fresh(),
        ]);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $script = AutomationScript::findOrFail($id);
        $script->update([
            'status' => $script->status === 'Armed' ? 'Paused' : 'Armed',
        ]);

        return response()->json([
            'success' => true,
            'data' => $script->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $script = AutomationScript::findOrFail($id);
        $script->delete();

        return response()->json(['success' => true]);
    }

    // ---------------------------------------------------------------------
    // Real action executors (bounded, safe, no fake numbers)
    // ---------------------------------------------------------------------

    private function executeAction(string $action): array
    {
        try {
            return match ($action) {
                'purge_temp' => $this->runPurgeTemp(),
                'optimize_ram' => $this->runOptimizeRam(),
                'flush_dns' => $this->runFlushDns(),
                'security_scan' => $this->runSecurityScan(),
                'backup_check' => $this->runBackupCheck(),
                'report_summary' => $this->runReportSummary(),
                default => ['ok' => false, 'detail' => "Unknown action: {$action}"],
            };
        } catch (\Throwable $e) {
            return ['ok' => false, 'detail' => "Action failed: {$e->getMessage()}"];
        }
    }

    private function runPurgeTemp(): array
    {
        $freed = 0;
        $count = 0;
        $paths = [sys_get_temp_dir(), getenv('LOCALAPPDATA') . '\\Temp', getenv('WINDIR') . '\\Temp'];

        foreach ($paths as $path) {
            if (!is_dir($path)) {
                continue;
            }
            $files = @glob($path . '\\*.{tmp,log,cache}', GLOB_NOSORT) ?: [];
            foreach ($files as $file) {
                if (is_file($file) && (time() - @filemtime($file)) > 86400) {
                    $size = @filesize($file) ?: 0;
                    if (@unlink($file)) {
                        $freed += $size;
                        $count++;
                    }
                }
            }
        }

        return [
            'ok' => true,
            'detail' => "Temp purge — removed {$count} stale file(s), freed " . round($freed / 1048576, 1) . ' MB',
        ];
    }

    private function runOptimizeRam(): array
    {
        $snapshot = app(SystemSnapshot::class);
        $health = $snapshot->get('health');
        $ram = $health['ram'] ?? [];
        $ramPct = (float) ($ram['usedPercent'] ?? 0);
        $totalMb = (float) ($ram['totalMB'] ?? 0);
        $usedMb = round($totalMb * ($ramPct / 100));

        // Real, safe cache clearance.
        $cleared = 0;
        $cachePath = storage_path('framework/cache/data');
        if (is_dir($cachePath)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($cachePath, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );
            foreach ($files as $file) {
                if ($file->isFile() && @unlink($file->getPathname())) {
                    $cleared++;
                }
            }
        }

        $state = $ramPct > 85 ? 'high — consider closing heavy applications.' : 'healthy.';
        return [
            'ok' => true,
            'detail' => "RAM optimize — {$ramPct}% used ({$usedMb} MB), application caches cleared ({$cleared} files). System {$state}",
        ];
    }

    private function runFlushDns(): array
    {
        $output = [];
        @exec('ipconfig /flushdns 2>&1', $output);
        $success = stripos(implode("\n", $output), 'successfully') !== false;

        return [
            'ok' => $success,
            'detail' => $success ? 'DNS cache flushed successfully.' : 'DNS flush did not report success.',
        ];
    }

    private function runSecurityScan(): array
    {
        $out = $this->execWithTimeout(
            'powershell -NoProfile -Command "Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled | Format-List" 2>&1',
            6000
        );

        $enabled = false;
        foreach ($out as $line) {
            if (str_contains(trim($line), 'RealTimeProtectionEnabled') && str_contains($line, 'True')) {
                $enabled = true;
                break;
            }
        }

        return [
            'ok' => $enabled,
            'detail' => $enabled
                ? 'Security scan — Windows Defender real-time protection is ON.'
                : 'Security scan — Windows Defender real-time protection is OFF.',
        ];
    }

    private function runBackupCheck(): array
    {
        $out = $this->execWithTimeout(
            'powershell -NoProfile -Command "try { (Get-ComputerRestorePoint).Count } catch { \'unavailable\' }" 2>&1',
            5000
        );

        $count = 0;
        foreach ($out as $line) {
            if (is_numeric(trim($line))) {
                $count = (int) trim($line);
                break;
            }
        }

        return [
            'ok' => $count > 0,
            'detail' => $count > 0
                ? "Backup check — {$count} system restore point(s) available."
                : 'Backup check — no restore points found. Enable System Protection to create them.',
        ];
    }

    private function runReportSummary(): array
    {
        $snapshot = app(SystemSnapshot::class);
        $health = $snapshot->get('health');
        $performance = $snapshot->get('performance');

        $cpu = (float) ($health['cpu']['usedPercent'] ?? $performance['cpu'] ?? 0);
        $ram = (float) ($health['ram']['usedPercent'] ?? $performance['ram']['usedPercent'] ?? 0);
        $disk = (float) ($health['disk']['usedPercent'] ?? $performance['disk']['usedPercent'] ?? 0);
        $score = (int) ($performance['performanceScore'] ?? 0);

        return [
            'ok' => true,
            'detail' => "Summary — CPU {$cpu}%, RAM {$ram}%, disk {$disk}%, performance score {$score}/100",
        ];
    }
}
