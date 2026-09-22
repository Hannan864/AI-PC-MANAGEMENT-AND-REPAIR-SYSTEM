<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\Alert;
use App\Services\AlertEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlertController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $engine = app(AlertEngine::class);
        $engine->evaluate();

        $filters = [
            'status' => $request->query('status'),
            'severity' => $request->query('severity'),
            'category' => $request->query('category'),
            'search' => $request->query('search'),
            'date_from' => $request->query('date_from'),
            'date_to' => $request->query('date_to'),
        ];

        $filters = array_filter($filters, fn($v) => $v !== null && $v !== '');

        $alerts = $engine->getActiveAlerts($filters);

        $counts = [
            'total' => Alert::count(),
            'active' => Alert::where('status', 'active')->count(),
            'acknowledged' => Alert::where('status', 'acknowledged')->count(),
            'in_progress' => Alert::where('status', 'in_progress')->count(),
            'resolved' => Alert::where('status', 'resolved')->count(),
            'ignored' => Alert::where('status', 'ignored')->count(),
            'archived' => Alert::where('status', 'archived')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $alerts,
            'counts' => $counts,
        ]);
    }

    public function acknowledge(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
            'last_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->fresh()->toArray(),
        ]);
    }

    public function startProgress(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update([
            'status' => 'in_progress',
            'last_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->fresh()->toArray(),
        ]);
    }

    public function resolve(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'last_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->fresh()->toArray(),
        ]);
    }

    public function archive(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update([
            'status' => 'archived',
            'last_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->fresh()->toArray(),
        ]);
    }

    public function ignore(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update([
            'status' => 'ignored',
            'last_updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->fresh()->toArray(),
        ]);
    }

    /**
     * Attempt an automatic fix for a fixable alert.
     *
     * - SNAPSHOT_STALE_* alerts start a background snapshot:refresh for the
     *   affected section. The alert is moved to 'in_progress' and resolves
     *   automatically on the next evaluation once the data is fresh.
     * - DB_DISCONNECTED re-checks the live connection and resolves if healthy.
     */
    public function fix(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);

        if (!in_array($alert->status, ['active', 'acknowledged', 'in_progress'], true)) {
            return $this->sendError('This alert cannot be fixed right now.', [], 400);
        }

        // Monitoring delay → refresh the stale snapshot section in the background.
        if (str_starts_with((string) $alert->rule_code, 'SNAPSHOT_STALE_')) {
            $section = str_replace('SNAPSHOT_STALE_', '', (string) $alert->rule_code);

            $alert->update([
                'status' => 'in_progress',
                'context_data' => array_merge($alert->context_data ?? [], [
                    'fix_started_at' => now()->toIso8601String(),
                    'fix_note' => "Re-collecting {$section} metrics...",
                ]),
                'last_updated_at' => now(),
            ]);

            if ($this->spawnSnapshotRefresh($section, 45)) {
                return response()->json([
                    'success' => true,
                    'message' => "Monitoring data refresh started for {$section}. The alert resolves automatically when fresh data arrives.",
                    'data' => $alert->fresh()->toArray(),
                ], 202);
            }

            // Spawn failed — restore and tell the user what to do manually.
            $alert->update(['status' => 'active', 'last_updated_at' => now()]);

            return $this->sendError('Could not start the data refresh automatically. Please run: php artisan snapshot:refresh', [], 500);
        }

        // Database connectivity → verify live and auto-resolve if healthy.
        if ($alert->rule_code === 'DB_DISCONNECTED') {
            try {
                DB::connection()->getPdo();
                $alert->update([
                    'status' => 'resolved',
                    'resolved_at' => now(),
                    'last_updated_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Database connection verified — alert resolved.',
                    'data' => $alert->fresh()->toArray(),
                ]);
            } catch (\Throwable $e) {
                return $this->sendError('Database is still unreachable. Check the database file and permissions.', [], 500);
            }
        }

        return $this->sendError('No automatic fix is available for this alert.', [], 422);
    }

    /**
     * Refresh all monitoring data in the background and mark every stale-snapshot
     * alert as in-progress so they resolve once fresh data arrives.
     */
    public function refreshAll(): JsonResponse
    {
        if (!$this->spawnSnapshotRefresh(null, 90)) {
            return $this->sendError('Could not start the monitoring refresh. Please run: php artisan snapshot:refresh', [], 500);
        }

        Alert::where('rule_code', 'like', 'SNAPSHOT_STALE_%')
            ->whereIn('status', ['active', 'acknowledged'])
            ->update(['status' => 'in_progress', 'last_updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Monitoring data refresh started in the background. Alerts will clear automatically.',
        ], 202);
    }

    /**
     * Launch a detached snapshot:refresh process so the HTTP request returns
     * immediately while the collectors run in the background.
     *
     * NOTE: proc_close() must NOT be called here — on Windows it blocks until
     * the child process exits, which would hang the request for the full
     * refresh duration (well past the frontend's axios timeout). Leaving the
     * handle unclosed lets the child run on; it is reaped at request end
     * without terminating the process.
     */
    private function spawnSnapshotRefresh(?string $section = null, int $timeout = 90): bool
    {
        $sectionArg = $section !== null ? ' --section=' . $section : '';
        $command = '"' . PHP_BINARY . '" artisan snapshot:refresh --timeout=' . $timeout . $sectionArg;

        try {
            $descriptors = [
                0 => ['file', 'NUL', 'r'],
                1 => ['file', 'NUL', 'w'],
                2 => ['file', 'NUL', 'w'],
            ];
            $process = proc_open($command, $descriptors, $pipes, base_path());

            if (is_resource($process)) {
                return true; // intentionally no proc_close() — see note above
            }
        } catch (\Throwable $e) {
            // Fall through to the cmd fallback below.
        }

        // Fallback: classic Windows fire-and-forget via start /B.
        try {
            $cmd = 'start /B "" cmd /c "cd /d ' . base_path() . ' && ' . $command . ' > NUL 2>&1"';
            $pipe = @popen($cmd, 'r');
            if (is_resource($pipe)) {
                pclose($pipe);
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return false;
    }

    public function counts(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => Alert::count(),
                'active' => Alert::where('status', 'active')->count(),
                'acknowledged' => Alert::where('status', 'acknowledged')->count(),
                'in_progress' => Alert::where('status', 'in_progress')->count(),
                'resolved' => Alert::where('status', 'resolved')->count(),
                'ignored' => Alert::where('status', 'ignored')->count(),
                'archived' => Alert::where('status', 'archived')->count(),
                'bySeverity' => [
                    'critical' => Alert::where('severity', 'critical')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                    'high' => Alert::where('severity', 'high')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                    'warning' => Alert::where('severity', 'warning')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                    'medium' => Alert::where('severity', 'medium')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                    'low' => Alert::where('severity', 'low')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                    'info' => Alert::where('severity', 'info')->where('status', '!=', 'resolved')->where('status', '!=', 'archived')->count(),
                ],
                'byCategory' => Alert::where('status', '!=', 'resolved')->where('status', '!=', 'archived')
                    ->selectRaw('category, count(*) as count')
                    ->groupBy('category')
                    ->pluck('count', 'category')
                    ->toArray(),
            ],
        ]);
    }
}
