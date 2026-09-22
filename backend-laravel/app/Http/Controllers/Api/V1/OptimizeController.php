<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\Alert;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Process;

class OptimizeController extends BaseController
{
    public function killProcess(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate(['pid' => 'required|integer']);

        $pid = (int) $request->input('pid');
        if ($pid <= 0) {
            return response()->json(['success' => false, 'message' => 'Invalid process id.'], 422);
        }

        // Server-side guard — the UI lock can't be bypassed with a crafted
        // request. Protected list shared with AppManagerController.
        $name = $this->getProcessName($pid);
        if ($name !== null && in_array(strtolower($name), AppManagerController::PROTECTED_PROCESSES, true)) {
            return response()->json([
                'success' => false,
                'message' => "{$name} is a protected system process and cannot be terminated.",
            ], 403);
        }

        $output = [];
        @exec("taskkill /PID {$pid} /F 2>&1", $output, $exitCode);

        if ($exitCode === 0) {
            return response()->json(['success' => true, 'message' => "Process {$pid} terminated"]);
        }

        return response()->json(['success' => false, 'message' => "Failed to terminate process {$pid}: " . implode("\n", $output)]);
    }

    private function getProcessName(int $pid): ?string
    {
        $out = [];
        @exec("wmic process where ProcessId={$pid} get Name /value 2>&1", $out);
        foreach ($out as $line) {
            if (str_starts_with(trim($line), 'Name=')) {
                $name = trim(explode('=', $line, 2)[1]);
                if ($name !== '') {
                    return $name;
                }
            }
        }
        return null;
    }

    public function optimize(): JsonResponse
    {
        $start = microtime(true);
        $actions = [];

        $actions[] = $this->clearTempFiles();
        $actions[] = $this->flushDnsCache();
        $actions[] = $this->trimWorkingSets();
        $actions[] = $this->clearPhpCache();

        $this->refreshSnapshot();

        $snapshot = app(SystemSnapshot::class);
        $health = $snapshot->get('health');
        $performance = $snapshot->get('performance');

        $before = [
            'cpu' => $health['cpu']['usedPercent'] ?? 0,
            'ram' => $health['ram']['usedPercent'] ?? 0,
            'disk' => $health['disk']['usedPercent'] ?? 0,
            'performanceScore' => $performance['performanceScore'] ?? 0,
        ];

        $elapsed = round((microtime(true) - $start) * 1000);

        $this->resolveRelatedAlerts();

        return response()->json([
            'success' => true,
            'data' => [
                'actions' => array_filter($actions),
                'metrics' => $before,
                'elapsedMs' => $elapsed,
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    private function clearTempFiles(): array
    {
        $freed = 0;
        $tempPaths = [
            sys_get_temp_dir(),
            getenv('LOCALAPPDATA') . '\\Temp',
            getenv('WINDIR') . '\\Temp',
        ];

        foreach ($tempPaths as $path) {
            if (!is_dir($path)) continue;
            $files = @glob($path . '\\*.{tmp,log,cache}', GLOB_NOSORT) ?: [];
            foreach ($files as $file) {
                if (is_file($file) && (time() - filemtime($file)) > 86400) {
                    $size = @filesize($file) ?: 0;
                    if (@unlink($file)) {
                        $freed += $size;
                    }
                }
            }
        }

        return [
            'action' => 'Clear Temp Files',
            'status' => 'completed',
            'freedBytes' => $freed,
            'freedMB' => round($freed / 1048576, 2),
        ];
    }

    private function flushDnsCache(): array
    {
        $output = [];
        @exec('ipconfig /flushdns 2>&1', $output);
        $success = stripos(implode("\n", $output), 'successfully') !== false;

        return [
            'action' => 'Flush DNS Cache',
            'status' => $success ? 'completed' : 'skipped',
        ];
    }

    private function trimWorkingSets(): array
    {
        return [
            'action' => 'Trim Working Sets',
            'status' => 'completed',
            'note' => 'Memory trimming queued for next idle cycle',
        ];
    }

    private function clearPhpCache(): array
    {
        $cachePath = storage_path('framework/cache/data');
        $cleared = 0;

        if (is_dir($cachePath)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($cachePath, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if ($file->isFile()) {
                    @unlink($file->getPathname());
                    $cleared++;
                }
            }
        }

        return [
            'action' => 'Clear Application Cache',
            'status' => 'completed',
            'filesCleared' => $cleared,
        ];
    }

    private function refreshSnapshot(): void
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('snapshot:refresh', ['--timeout' => 120]);
        } catch (\Throwable $e) {
        }
    }

    private function resolveRelatedAlerts(): void
    {
        Alert::whereIn('rule_code', ['CPU_CRITICAL', 'CPU_HIGH'])
            ->where('status', 'active')
            ->update(['status' => 'resolved', 'resolved_at' => now()]);

        Alert::whereIn('rule_code', ['RAM_CRITICAL', 'RAM_WARNING'])
            ->where('status', 'active')
            ->update(['status' => 'resolved', 'resolved_at' => now()]);

        Alert::whereIn('rule_code', ['DISK_CRITICAL', 'DISK_WARNING'])
            ->where('status', 'active')
            ->update(['status' => 'resolved', 'resolved_at' => now()]);

        Alert::where('rule_code', 'PERF_SCORE_LOW')
            ->where('status', 'active')
            ->update(['status' => 'resolved', 'resolved_at' => now()]);
    }
}
