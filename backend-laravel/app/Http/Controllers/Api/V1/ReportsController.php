<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\CompletionReport;
use App\Models\Gig;
use App\Models\LifecycleEvent;
use App\Models\PCBuild;
use App\Models\RepairRequest;
use App\Models\User;
use App\Models\UserHistory;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportsController extends BaseController
{
    public function analytics(): JsonResponse
    {
        $start = microtime(true);

        $db = $this->getDbStats();
        $repairs = $this->getRepairStats();
        $users = $this->getUserStats();
        $timeline = $this->getTimeline();
        $security = app(SystemSnapshot::class)->get('security') ?? $this->defaultSecurity();
        $performance = $this->normalizePerformance(
            app(SystemSnapshot::class)->get('performance')
        );
        $database = $this->getDatabaseHealth();
        $api = $this->getApiAnalytics();
        $auditLogs = $this->getAuditLogs();

        $elapsed = round((microtime(true) - $start) * 1000);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'totalUsers' => $users['total'],
                    'totalTechnicians' => $users['technicians'],
                    'totalAdmins' => $users['admins'],
                    'totalRepairs' => $repairs['total'],
                    'completedRepairs' => $repairs['completed'],
                    'activeRepairs' => $repairs['active'],
                    'totalGigs' => Gig::count(),
                    'totalBuilds' => PCBuild::count(),
                    'totalLifecycleEvents' => LifecycleEvent::count(),
                    'totalCompletionReports' => CompletionReport::count(),
                    'performanceScore' => $performance['score'],
                    'cpu' => $performance['cpu'],
                    'ramPercent' => $performance['ramPercent'],
                    'diskPercent' => $performance['diskPercent'],
                    'uptime' => $performance['uptime'],
                    'dbStatus' => $db['status'],
                    'apiStatus' => 'Online',
                    'securityScore' => $security['score'] ?? 0,
                    'lastScan' => now()->toIso8601String(),
                    'serverTime' => now()->toIso8601String(),
                    'laravelVersion' => app()->version(),
                    'phpVersion' => phpversion(),
                    'queryCount' => $elapsed . 'ms',
                ],
                'timeline' => $timeline,
                'security' => $security,
                'performance' => $performance,
                'repairs' => $repairs,
                'database' => $database,
                'api' => $api,
                'auditLogs' => $auditLogs,
                'collectionDurationMs' => $elapsed,
            ],
        ]);
    }

    private function defaultSecurity(): array
    {
        return [
            'score' => 0,
            'defenderEnabled' => false,
            'firewallProfiles' => [],
            'services' => [],
            'events' => [],
            'lastScan' => now()->toIso8601String(),
        ];
    }

    private function defaultPerformance(): array
    {
        return [
            'score' => 0,
            'cpu' => 0,
            'ramPercent' => 0,
            'ramFreeMB' => 0,
            'ramTotalMB' => 0,
            'diskPercent' => 0,
            'diskFreeGB' => 0,
            'diskTotalGB' => 0,
            'uptime' => 'Collecting...',
            'serverTime' => now()->toIso8601String(),
        ];
    }

    /**
     * Normalize snapshot performance data into flat shape expected by frontend.
     * Snapshot has nested ram/disk objects; frontend reads flat keys.
     */
    private function normalizePerformance(?array $raw): array
    {
        if (! $raw) {
            return $this->defaultPerformance();
        }

        return [
            'score' => $raw['performanceScore'] ?? $raw['score'] ?? 0,
            'cpu' => $raw['cpu'] ?? 0,
            'ramPercent' => $raw['ramPercent'] ?? $raw['ram']['usedPercent'] ?? 0,
            'ramFreeMB' => $raw['ramFreeMB'] ?? $raw['ram']['freeMB'] ?? 0,
            'ramTotalMB' => $raw['ramTotalMB'] ?? $raw['ram']['totalMB'] ?? 0,
            'diskPercent' => $raw['diskPercent'] ?? $raw['disk']['usedPercent'] ?? 0,
            'diskFreeGB' => $raw['diskFreeGB'] ?? $raw['disk']['freeGB'] ?? 0,
            'diskTotalGB' => $raw['diskTotalGB'] ?? $raw['disk']['totalGB'] ?? 0,
            'uptime' => $raw['uptime'] ?? 'Collecting...',
            'serverTime' => $raw['serverTime'] ?? now()->toIso8601String(),
        ];
    }

    private function getDbStats(): array
    {
        try {
            DB::connection()->getPdo();
            $status = 'Connected';
        } catch (\Exception $e) {
            $status = 'Disconnected';
        }

        return ['status' => $status];
    }

    private function getUserStats(): array
    {
        $total = User::count();
        $technicians = User::where('role', 'technician')->count();
        $admins = User::where('role', 'admin')->count();
        $customers = User::where('role', 'user')->count();
        $active = User::where('status', 'active')->count();

        return compact('total', 'technicians', 'admins', 'customers', 'active');
    }

    private function getRepairStats(): array
    {
        $total = RepairRequest::count();
        $completed = RepairRequest::where('status', 'completed')->count();
        $cancelled = RepairRequest::where('status', 'cancelled')->count();
        $active = RepairRequest::whereNotIn('status', ['completed', 'cancelled'])->count();

        $byStatus = RepairRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $byCategory = RepairRequest::whereNotNull('issue_category')
            ->select('issue_category', DB::raw('count(*) as count'))
            ->groupBy('issue_category')
            ->pluck('count', 'issue_category')
            ->toArray();

        $bySeverity = RepairRequest::whereNotNull('severity_level')
            ->select('severity_level', DB::raw('count(*) as count'))
            ->groupBy('severity_level')
            ->pluck('count', 'severity_level')
            ->toArray();

        $recentRepairs = RepairRequest::with(['user', 'technician'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'customer' => $r->user?->name ?? 'Unknown',
                'technician' => $r->technician?->name ?? 'Unassigned',
                'issueCategory' => $r->issue_category,
                'status' => $r->status,
                'severity' => $r->severity_level,
                'createdAt' => $r->created_at->toIso8601String(),
            ]);

        $avgCompletionTime = CompletionReport::whereNotNull('time_spent_minutes')
            ->avg('time_spent_minutes');

        $totalRevenue = CompletionReport::sum('total_cost');

        return compact('total', 'completed', 'cancelled', 'active', 'byStatus', 'byCategory', 'bySeverity', 'recentRepairs', 'avgCompletionTime', 'totalRevenue');
    }

    private function getTimeline(): array
    {
        $events = [];

        $lifecycleEvents = LifecycleEvent::with(['repairRequest', 'actor'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        foreach ($lifecycleEvents as $e) {
            $events[] = [
                'source' => 'repair',
                'message' => 'Repair ' . ($e->repairRequest?->issue_category ?? 'request') . ' → ' . $e->status,
                'actor' => $e->actor?->name ?? 'System',
                'timestamp' => $e->created_at->toIso8601String(),
                'type' => $e->status === 'completed' ? 'success' : ($e->status === 'cancelled' ? 'warn' : 'info'),
            ];
        }

        $userHistory = UserHistory::orderByDesc('event_timestamp')
            ->limit(50)
            ->get();

        foreach ($userHistory as $h) {
            $events[] = [
                'source' => strtolower($h->type),
                'message' => $h->title,
                'details' => $h->summary,
                'timestamp' => $h->event_timestamp->toIso8601String(),
                'type' => 'info',
            ];
        }

        usort($events, fn ($a, $b) => strtotime($b['timestamp']) <=> strtotime($a['timestamp']));

        return array_slice($events, 0, 100);
    }

    private function getDatabaseHealth(): array
    {
        try {
            DB::connection()->getPdo();
            $connected = true;
        } catch (\Exception $e) {
            $connected = false;
        }

        $tables = [
            'users' => User::count(),
            'repair_requests' => RepairRequest::count(),
            'lifecycle_events' => LifecycleEvent::count(),
            'completion_reports' => CompletionReport::count(),
            'gigs' => Gig::count(),
            'pc_builds' => PCBuild::count(),
            'user_history' => UserHistory::count(),
        ];

        $dbPath = database_path('database.sqlite');
        $dbSize = file_exists($dbPath) ? round(filesize($dbPath) / 1024, 2) : 0;

        return [
            'connected' => $connected,
            'driver' => config('database.default'),
            'tableCounts' => $tables,
            'totalRecords' => array_sum($tables),
            'dbSizeKB' => $dbSize,
            'dbPath' => $dbPath,
        ];
    }

    private function getApiAnalytics(): array
    {
        return [
            'status' => 'Online',
            'totalUsers' => User::count(),
            'totalTokens' => \Laravel\Sanctum\PersonalAccessToken::count(),
            'activeTokens' => \Laravel\Sanctum\PersonalAccessToken::where('created_at', '>=', now()->subHours(24))->count(),
            'phpVersion' => phpversion(),
            'laravelVersion' => app()->version(),
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function getAuditLogs(): array
    {
        $logs = UserHistory::orderByDesc('event_timestamp')
            ->limit(100)
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'type' => strtolower($h->type),
                'message' => $h->title,
                'details' => $h->summary,
                'timestamp' => $h->event_timestamp->toIso8601String(),
                'source' => $h->type,
            ]);

        $lifecycleLogs = LifecycleEvent::with(['repairRequest'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($e) => [
                'id' => (string) $e->id,
                'type' => $e->status === 'completed' ? 'success' : ($e->status === 'cancelled' ? 'warn' : 'info'),
                'message' => 'Repair request ' . $e->status,
                'details' => $e->note ?? '',
                'timestamp' => $e->created_at->toIso8601String(),
                'source' => 'Repair',
            ]);

        $all = $logs->merge($lifecycleLogs)
            ->sortByDesc('timestamp')
            ->values()
            ->all();

        return $all;
    }
}
