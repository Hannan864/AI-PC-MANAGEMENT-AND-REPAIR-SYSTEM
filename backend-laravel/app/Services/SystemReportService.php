<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Alert;
use App\Models\RepairRequest;
use App\Models\ReportSchedule;
use App\Models\SystemReport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Service: SystemReportService
 *
 * The "PC Medical Dossier" engine.
 *
 * Captures the user's full system state (from the real telemetry snapshot +
 * live power data) into a self-contained, enterprise-format JSON envelope —
 * the kind of chart a doctor reads before operating. Reports are stored
 * locally (source = 'local'), delivered ONLY to the technician currently
 * assigned to the user's repair request, and can be scheduled to run
 * daily / weekly / monthly.
 *
 * The envelope is versioned and cloud-ready: pushing it to a cloud backend
 * later is a matter of shipping the same JSON to an external API.
 */
class SystemReportService
{
    public function __construct(
        private readonly SystemSnapshot $snapshot,
    ) {}

    /**
     * Capture and store a fresh system report for the given user.
     *
     * Recipient technicians are resolved in order:
     *   1. explicit technician ids passed by the caller (user picked them),
     *   2. the customer's saved technician preference (schedule row),
     *   3. the technician assigned to their active repair request (legacy).
     */
    public function capture(User $user, string $type = 'manual', ?array $technicianIds = null): SystemReport
    {
        // The report is built from the real-time monitoring snapshot. If the
        // monitor loop hasn't written one yet, fail with a clear message
        // instead of silently storing a sparse, meaningless report.
        if (! $this->snapshot->exists()) {
            throw new \RuntimeException('The system monitoring snapshot is not ready yet. Please wait a moment and try again.');
        }

        $dossier = $this->buildDossier($user);

        $recipientIds = $this->resolveRecipientIds($user, $technicianIds);

        $report = SystemReport::create([
            'user_id'       => $user->id,
            'technician_id' => $recipientIds[0] ?? null,
            'title'         => $this->titleFor($type),
            'report_type'   => $type,
            'health_score'  => $dossier['vitals']['healthScore'] ?? null,
            'report_data'   => $dossier,
            'source'        => 'local',
        ]);

        if (count($recipientIds) > 0) {
            $report->technicians()->sync($recipientIds);
        }

        // Refresh the schedule's run bookkeeping when captured by the scheduler.
        if ($type !== 'manual') {
            $this->markScheduledRun($user, $type);
        }

        return $report;
    }

    /**
     * Keep only ids that belong to real, active technician accounts.
     */
    public function validTechnicianIds(array $ids): array
    {
        $ids = array_values(array_unique(array_filter($ids)));
        if (count($ids) === 0) {
            return [];
        }

        return User::whereIn('id', $ids)
            ->where('role', 'technician')
            ->where('status', 'active')
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();
    }

    /**
     * Persist the customer's chosen recipient technician(s) so manual and
     * scheduled captures keep going to the same people.
     */
    public function setPreferredTechnicians(User $user, array $technicianIds): void
    {
        $schedule = ReportSchedule::firstOrCreate(['user_id' => $user->id]);
        $schedule->technician_ids = array_values(array_unique(array_filter($technicianIds)));
        $schedule->save();
    }

    private function resolveRecipientIds(User $user, ?array $explicit): array
    {
        if (! empty($explicit)) {
            return $this->validTechnicianIds($explicit);
        }

        $preference = ReportSchedule::where('user_id', $user->id)->value('technician_ids');
        if (! empty($preference)) {
            return $this->validTechnicianIds($preference);
        }

        $assigned = $this->resolveAssignedTechnician($user);

        return $assigned ? [$assigned->id] : [];
    }

    private function techniciansFor(array $ids): array
    {
        if (count($ids) === 0) {
            return [];
        }

        return User::whereIn('id', $ids)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
            ])
            ->values()
            ->all();
    }

    /**
     * Build the full enterprise dossier envelope for a user.
     */
    public function buildDossier(User $user): array
    {
        $all = $this->snapshot->getAll();

        $health      = $all['health'] ?? [];
        $performance = $all['performance'] ?? [];
        $processes   = $all['processes'] ?? [];
        $drives      = $all['drives'] ?? [];
        $network     = $all['network'] ?? [];
        $hardware    = $all['hardware'] ?? [];
        $security    = $all['security'] ?? [];
        $files       = $all['fileStats'] ?? [];

        $cpuPercent  = $this->percent($health['cpu']['usedPercent'] ?? null, $performance['cpu'] ?? null);
        $ramPercent  = $this->percent(
            $health['ram']['usedPercent'] ?? null,
            $performance['ram']['usedPercent'] ?? $performance['ram'] ?? null
        );
        $temperature = $this->numberOrNull($health['cpu']['temperature'] ?? $health['temperature'] ?? null);

        $vitals = [
            'healthScore'    => 0, // filled below after scoring
            'status'         => 'HEALTHY',
            'cpuPercent'     => $cpuPercent,
            'ramPercent'     => $ramPercent,
            'temperature'    => $temperature,
            'diskFreePct'    => $this->diskFreePercent($drives),
            'uptime'         => $health['uptime'] ?? null,
            'os'             => $hardware['os'] ?? $health['os'] ?? null,
            'performanceScore' => $this->numberOrNull($performance['performanceScore'] ?? null),
            'batteryLevel'   => null,
            'isCharging'     => null,
        ];

        $symptoms = $this->deriveSymptoms($vitals, $security, $network, $all);

        $vitals['healthScore'] = $this->healthScore($vitals, $security, $symptoms);
        $vitals['status']      = $this->statusLabel($vitals['healthScore']);

        $patient = [
            'userId'         => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'os'             => $hardware['os'] ?? $health['os'] ?? null,
            'systemSummary'  => $this->systemSummary($hardware),
            'assignedTech'   => $this->resolveAssignedTechnician($user)?->name,
        ];

        return [
            'schemaVersion'    => '1.0',
            'source'           => 'local',
            'generatedAt'      => now()->toIso8601String(),
            'reportType'       => 'dossier',
            'patient'          => $patient,
            'vitals'           => $vitals,
            'systems'          => [
                'performance' => $performance,
                'processes'   => $processes,
                'storage'     => $drives,
                'files'       => $files,
                'network'     => $network,
                'hardware'    => $hardware,
                'security'    => $security,
            ],
            'symptoms'         => $symptoms,
            'recommendations'  => $this->deriveRecommendations($symptoms),
            'history'          => $this->healthHistory($user),
        ];
    }

    // ---------------------------------------------------------------------
    // Symptoms & Recommendations ("what the doctor sees first")
    // ---------------------------------------------------------------------

    private function deriveSymptoms(array $vitals, array $security, array $network, array $all): array
    {
        $symptoms = [];

        $cpu = $vitals['cpuPercent'];
        if ($cpu !== null && $cpu >= 92) {
            $symptoms[] = $this->symptom('critical', 'Extreme CPU saturation', sprintf('CPU pegged at %.0f%% — system may be unresponsive or thermal-throttled.', $cpu), 'performance');
        } elseif ($cpu !== null && $cpu >= 80) {
            $symptoms[] = $this->symptom('warning', 'High CPU load', sprintf('CPU at %.0f%% sustained — background processes or runaway tasks likely.', $cpu), 'performance');
        }

        $ram = $vitals['ramPercent'];
        if ($ram !== null && $ram >= 95) {
            $symptoms[] = $this->symptom('critical', 'Memory exhaustion', sprintf('RAM at %.0f%% — applications at risk of crashing, swap thrash likely.', $ram), 'performance');
        } elseif ($ram !== null && $ram >= 85) {
            $symptoms[] = $this->symptom('warning', 'High memory pressure', sprintf('RAM at %.0f%% — close heavy apps or expand memory.', $ram), 'performance');
        }

        $temp = $vitals['temperature'];
        if ($temp !== null && $temp >= 85) {
            $symptoms[] = $this->symptom('critical', 'Overheating', sprintf('CPU temperature at %.0f°C — risk of thermal shutdown / hardware damage.', $temp), 'hardware');
        } elseif ($temp !== null && $temp >= 75) {
            $symptoms[] = $this->symptom('warning', 'Elevated temperature', sprintf('CPU temperature at %.0f°C — check cooling and dust build-up.', $temp), 'hardware');
        }

        $disk = $vitals['diskFreePct'];
        if ($disk !== null && $disk < 5) {
            $symptoms[] = $this->symptom('critical', 'Storage nearly full', sprintf('Only %.0f%% disk space free — system instability and boot failures possible.', $disk), 'storage');
        } elseif ($disk !== null && $disk < 15) {
            $symptoms[] = $this->symptom('warning', 'Low disk space', sprintf('Only %.0f%% disk space free — clean temp files and large folders.', $disk), 'storage');
        }

        if (! empty($network)) {
            $latency = $this->numberOrNull($network['latency'] ?? null);
            if (($network['internetReachable'] ?? null) === false) {
                $symptoms[] = $this->symptom('critical', 'No internet connectivity', 'The machine cannot reach the internet — check adapters, gateway and DNS.', 'network');
            } elseif ($latency !== null && $latency > 200) {
                $symptoms[] = $this->symptom('warning', 'High network latency', sprintf('Latency %.0fms — poor connection quality.', $latency), 'network');
            }
        }

        $securityScore = $this->numberOrNull($security['score'] ?? null);
        if ($securityScore !== null && $securityScore < 70) {
            $symptoms[] = $this->symptom('critical', 'Security posture degraded', sprintf('Security score %.0f/100 — threats or disabled protections detected.', $securityScore), 'security');
        } elseif (($security['defenderEnabled'] ?? true) === false) {
            $symptoms[] = $this->symptom('critical', 'Defender disabled', 'Windows Defender is off — the machine is exposed to malware.', 'security');
        }

        $healthHealth = $all['health']['hardwareHealth'] ?? ($all['hardware']['hardwareHealth'] ?? null);
        if (is_string($healthHealth) && strtolower($healthHealth) !== 'good' && strtolower($healthHealth) !== 'healthy') {
            $symptoms[] = $this->symptom('warning', 'Hardware health flagged', 'Hardware self-check did not report healthy — inspect CPU/GPU/storage sensors.', 'hardware');
        }

        // Open alerts from the live alert engine (already stored in DB).
        $alerts = Alert::whereIn('status', ['active', 'acknowledged'])
            ->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'warning' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->orderByDesc('detected_at')
            ->limit(8)
            ->get();

        foreach ($alerts as $alert) {
            $symptoms[] = [
                'severity'          => in_array($alert->severity, ['critical', 'high'], true) ? 'critical' : (in_array($alert->severity, ['warning', 'medium'], true) ? 'warning' : 'info'),
                'title'             => $alert->title,
                'message'           => $alert->description,
                'source'            => $alert->source_module,
                'recommendedAction' => $alert->recommended_action ?? $alert->suggested_fix,
                'detectedAt'        => $alert->detected_at?->toIso8601String(),
                'status'            => $alert->status,
            ];
        }

        return $symptoms;
    }

    private function deriveRecommendations(array $symptoms): array
    {
        $map = [
            'critical' => ['P0', 'Immediate action required'],
            'warning'  => ['P1', 'Address in next maintenance window'],
            'info'     => ['P2', 'Monitor / scheduled maintenance'],
        ];

        $recommendations = [];
        foreach ($symptoms as $symptom) {
            [$priority, $framing] = $map[$symptom['severity']] ?? $map['info'];

            $recommendations[] = [
                'priority' => $priority,
                'title'    => $symptom['title'],
                'details'  => $symptom['message'],
                'action'   => $symptom['recommendedAction'] ?? null,
                'system'   => $symptom['source'],
                'framing'  => $framing,
            ];
        }

        // Deterministic ordering: P0 first, then P1, then P2.
        usort($recommendations, fn ($a, $b) => strcmp($a['priority'], $b['priority']));

        return $recommendations;
    }

    private function symptom(string $severity, string $title, string $message, string $source): array
    {
        return [
            'severity'          => $severity,
            'title'             => $title,
            'message'           => $message,
            'source'            => $source,
            'recommendedAction' => null,
            'detectedAt'        => now()->toIso8601String(),
            'status'            => 'derived',
        ];
    }

    // ---------------------------------------------------------------------
    // Scoring
    // ---------------------------------------------------------------------

    private function healthScore(array $vitals, array $security, array $symptoms): int
    {
        $score = 100;

        $cpu = $vitals['cpuPercent'];
        if ($cpu !== null && $cpu >= 92) {
            $score -= 30;
        } elseif ($cpu !== null && $cpu >= 80) {
            $score -= 15;
        }

        $ram = $vitals['ramPercent'];
        if ($ram !== null && $ram >= 95) {
            $score -= 20;
        } elseif ($ram !== null && $ram >= 85) {
            $score -= 10;
        }

        $temp = $vitals['temperature'];
        if ($temp !== null && $temp >= 85) {
            $score -= 15;
        } elseif ($temp !== null && $temp >= 75) {
            $score -= 8;
        }

        $disk = $vitals['diskFreePct'];
        if ($disk !== null && $disk < 5) {
            $score -= 20;
        } elseif ($disk !== null && $disk < 15) {
            $score -= 10;
        }

        if (($security['score'] ?? null) !== null && (int) $security['score'] < 70) {
            $score -= 15;
        }
        if (($security['defenderEnabled'] ?? true) === false) {
            $score -= 15;
        }

        $critical = 0;
        foreach ($symptoms as $symptom) {
            if (($symptom['severity'] ?? '') === 'critical' && ($symptom['status'] ?? '') !== 'derived') {
                $critical++;
            }
        }
        $score -= min(25, $critical * 5);

        return max(0, min(100, $score));
    }

    private function statusLabel(int $score): string
    {
        if ($score >= 80) {
            return 'HEALTHY';
        }
        if ($score >= 60) {
            return 'WARNING';
        }

        return 'CRITICAL';
    }

    // ---------------------------------------------------------------------
    // Scheduling
    // ---------------------------------------------------------------------

    public function getSchedule(User $user): array
    {
        $schedule = ReportSchedule::firstOrCreate(['user_id' => $user->id]);

        return [
            'frequency'     => $schedule->frequency,
            'enabled'       => $schedule->enabled,
            'lastRunAt'     => $schedule->last_run_at?->toIso8601String(),
            'nextRunAt'     => $schedule->next_run_at?->toIso8601String(),
            'technicianIds' => $schedule->technician_ids ?? [],
            'technicians'   => $this->techniciansFor($schedule->technician_ids ?? []),
            'updatedAt'     => $schedule->updated_at?->toIso8601String(),
        ];
    }

    public function updateSchedule(User $user, string $frequency): array
    {
        $frequency = in_array($frequency, ['off', 'daily', 'weekly', 'monthly'], true) ? $frequency : 'off';

        $schedule = ReportSchedule::firstOrCreate(['user_id' => $user->id]);
        $schedule->frequency = $frequency;
        $schedule->enabled   = $frequency !== 'off';
        $schedule->next_run_at = $frequency === 'off' ? null : $this->nextRunFor($frequency);
        $schedule->save();

        return $this->getSchedule($user);
    }

    /**
     * Sweep for due scheduled captures (invoked by the console loop).
     *
     * @return array<int, array{user:string, type:string, tech:string|null}>
     */
    public function runScheduledSweep(): array
    {
        $ran = [];

        ReportSchedule::where('enabled', true)
            ->where(fn ($q) => $q->whereNull('next_run_at')->orWhere('next_run_at', '<=', now()))
            ->with('user')
            ->get()
            ->each(function (ReportSchedule $schedule) use (&$ran) {
                $user = $schedule->user;
                if (! $user) {
                    return;
                }

                try {
                    $report = $this->capture($user, $schedule->frequency);
                    $ran[] = [
                        'user' => $user->email,
                        'type' => $schedule->frequency,
                        'tech' => $report->technician?->name ?? $report->technician_id,
                    ];
                } catch (\Throwable $e) {
                    report($e);
                }
            });

        return $ran;
    }

    private function markScheduledRun(User $user, string $type): void
    {
        $schedule = ReportSchedule::where('user_id', $user->id)->first();
        if (! $schedule) {
            return;
        }

        $schedule->last_run_at = now();
        $schedule->next_run_at = $this->nextRunFor($type);
        $schedule->save();
    }

    private function nextRunFor(string $frequency): Carbon
    {
        return match ($frequency) {
            'daily'   => now()->addDay(),
            'weekly'  => now()->addWeek(),
            'monthly' => now()->addMonth(),
            default   => now()->addDay(),
        };
    }

    // ---------------------------------------------------------------------
    // Queries
    // ---------------------------------------------------------------------

    public function userReports(User $user, int $perPage = 20)
    {
        return SystemReport::with('technicians')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function latestForUser(User $user): ?SystemReport
    {
        return SystemReport::with('technicians')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Customers visible to a technician: every user whose report was
     * delivered to them (single or multi-recipient), plus every user with a
     * request currently assigned to them.
     */
    public function dossiersForTechnician(User $technician): array
    {
        $reported = SystemReport::where(function ($q) use ($technician) {
                $q->where('technician_id', $technician->id)
                  ->orWhereHas('technicians', fn ($tq) => $tq->whereKey($technician->id));
            })
            ->with(['user', 'technicians'])
            ->orderByDesc('created_at')
            ->get();

        $assigned = RepairRequest::where('technician_id', $technician->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with('user')
            ->orderByDesc('created_at')
            ->get();

        $reportedByUser = $reported->groupBy('user_id');
        $assignedByUser = $assigned->groupBy('user_id');

        // Batch-load the latest report for every involved user up front
        // (covers users who only have an assigned job and no delivered report).
        $userIds = $reportedByUser->keys()->merge($assignedByUser->keys())->unique()->values();
        $latestByUser = $this->latestReportsForUsers($userIds);

        $users = collect();
        foreach ($userIds as $userId) {
            $reports = $reportedByUser->get($userId, collect());
            $job = $assignedByUser->get($userId)?->first();
            $user = $reports->first()?->user ?? $job?->user;
            if (! $user) {
                continue;
            }

            $latest = $reports->first() ?? $latestByUser->get($userId);

            $users->push([
                'user'         => $user,
                'latestReport' => $latest,
                // Every report delivered to this technician, newest first —
                // lightweight summaries; the full chart is fetched on demand.
                'reportCount'  => $reports->count(),
                'reports'      => $reports
                    ->map(fn (SystemReport $r) => $this->shapeReportSummary($r))
                    ->values()
                    ->all(),
                'job'          => $job,
            ]);
        }

        return $users
            ->map(fn ($entry) => $this->shapeDossierEntry($entry))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Admin overview: latest dossier + schedule for every customer.
     *
     * Everything is batched (latest report, report count, schedule, assigned
     * technician) so the whole overview costs ~5 queries instead of ~5 per
     * customer.
     */
    public function adminOverview(): array
    {
        $customers = User::where('role', 'user')->get();
        if ($customers->isEmpty()) {
            return [];
        }

        $ids = $customers->pluck('id');

        $latestByUser = $this->latestReportsForUsers($ids);
        $countsByUser = $this->reportCountsForUsers($ids);
        $schedules = ReportSchedule::whereIn('user_id', $ids)->get()->keyBy('user_id');
        $activeRequests = RepairRequest::whereIn('user_id', $ids)
            ->whereNotNull('technician_id')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with('technician')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('user_id');

        return $customers->map(function (User $user) use ($latestByUser, $countsByUser, $schedules, $activeRequests) {
            $latest = $latestByUser->get($user->id);
            $schedule = $schedules->get($user->id);
            $assignedTech = $activeRequests->get($user->id)?->first()?->technician;

            return [
                'userId'       => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'status'       => $user->status,
                'healthScore'  => $latest?->health_score,
                'reportStatus' => $latest?->report_data['vitals']['status'] ?? null,
                'lastCaptured' => $latest?->created_at?->toIso8601String(),
                'reportCount'  => (int) ($countsByUser->get($user->id) ?? 0),
                'schedule'     => $schedule?->frequency ?? 'off',
                'scheduleEnabled' => (bool) ($schedule?->enabled ?? false),
                'nextRunAt'    => $schedule?->next_run_at?->toIso8601String(),
                'assignedTech' => $assignedTech?->name,
            ];
        })->values()->all();
    }

    /**
     * Latest report per user, batched in one query (newest report wins).
     */
    private function latestReportsForUsers($userIds): \Illuminate\Support\Collection
    {
        if ($userIds->isEmpty()) {
            return collect();
        }

        return SystemReport::whereIn('user_id', $userIds)
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($group) => $group->first());
    }

    /**
     * Report count per user, batched in one grouped query.
     */
    private function reportCountsForUsers($userIds): \Illuminate\Support\Collection
    {
        if ($userIds->isEmpty()) {
            return collect();
        }

        return SystemReport::whereIn('user_id', $userIds)
            ->select('user_id', DB::raw('count(*) as total'))
            ->groupBy('user_id')
            ->pluck('total', 'user_id');
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function shapeDossierEntry(array $entry): ?array
    {
        $user = $entry['user'] ?? null;
        if (! $user) {
            return null;
        }

        $report = $entry['latestReport'];
        $job = $entry['job'];

        return [
            'userId'       => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'reportCount'  => $entry['reportCount'],
            'healthScore'  => $report?->health_score,
            'reportStatus' => $report?->report_data['vitals']['status'] ?? null,
            'lastCaptured' => $report?->created_at?->toIso8601String(),
            'job'          => $job ? [
                'id'        => $job->id,
                'gigTitle'  => $job->gig_title,
                'issue'     => $job->issue_description,
                'status'    => $job->status,
                'severity'  => $job->severity_level,
            ] : null,
            'latestReport' => $report ? $this->shapeReport($report) : null,
            'reports'      => $entry['reports'] ?? [],
        ];
    }

    public function shapeReport(SystemReport $report): array
    {
        return [
            'id'           => $report->id,
            'title'        => $report->title,
            'reportType'   => $report->report_type,
            'healthScore'  => $report->health_score,
            'source'       => $report->source,
            'data'         => $report->report_data,
            'createdAt'    => $report->created_at?->toIso8601String(),
            // First recipient kept for backward compatibility.
            'technician'   => $report->technician ? [
                'id'   => $report->technician->id,
                'name' => $report->technician->name,
                'email' => $report->technician->email,
            ] : null,
            // Every recipient the report was delivered to.
            'technicians'  => $report->technicians->map(fn (User $t) => [
                'id'    => $t->id,
                'name'  => $t->name,
                'email' => $t->email,
            ])->values()->all(),
        ];
    }

    /**
     * Lightweight row for the technician's report-history table — no heavy
     * report_data payload; the full chart is fetched on demand via the
     * technician show endpoint.
     */
    private function shapeReportSummary(SystemReport $report): array
    {
        return [
            'id'          => $report->id,
            'title'       => $report->title,
            'reportType'  => $report->report_type,
            'healthScore' => $report->health_score,
            'status'      => $report->report_data['vitals']['status'] ?? null,
            'createdAt'   => $report->created_at?->toIso8601String(),
        ];
    }

    private function healthHistory(User $user): array
    {
        return SystemReport::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->map(fn (SystemReport $r) => [
                'capturedAt' => $r->created_at?->toIso8601String(),
                'healthScore' => $r->health_score,
            ])
            ->reverse()
            ->values()
            ->all();
    }

    private function resolveAssignedTechnician(User $user): ?User
    {
        $request = RepairRequest::where('user_id', $user->id)
            ->whereNotNull('technician_id')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderByDesc('created_at')
            ->first();

        return $request?->technician;
    }

    private function percent($a, $b): ?float
    {
        $value = $a ?? $b;
        if (! is_numeric($value)) {
            return null;
        }

        return round(max(0.0, min(100.0, (float) $value)), 1);
    }

    private function numberOrNull($value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }

    private function diskFreePercent(array $drives): ?float
    {
        $list = $drives['drives'] ?? null;
        if (! is_array($list) || count($list) === 0) {
            return null;
        }

        $frees = [];
        foreach ($list as $drive) {
            if (! is_array($drive)) {
                continue;
            }
            $total = $drive['totalGB'] ?? $drive['total'] ?? null;
            $free  = $drive['freeGB'] ?? $drive['free'] ?? null;
            if (is_numeric($total) && is_numeric($free) && (float) $total > 0) {
                $frees[] = ((float) $free / (float) $total) * 100;
            }
        }

        return count($frees) > 0 ? round(min($frees), 1) : null;
    }

    private function systemSummary(array $hardware): string
    {
        $parts = [];
        foreach (['cpu', 'ram', 'gpu'] as $key) {
            $value = $hardware[$key] ?? null;
            if (is_string($value) && trim($value) !== '') {
                $parts[] = trim($value);
            } elseif (is_array($value)) {
                foreach (['name', 'model', 'summary', 'title'] as $field) {
                    if (is_string($value[$field] ?? null) && trim($value[$field]) !== '') {
                        $parts[] = trim($value[$field]);
                        break;
                    }
                }
            }
        }

        return implode(' • ', $parts) ?: 'System details unavailable';
    }

    private function titleFor(string $type): string
    {
        return match ($type) {
            'daily'   => 'Daily System Dossier — '.now()->format('Y-m-d'),
            'weekly'  => 'Weekly System Dossier — Week of '.now()->format('Y-m-d'),
            'monthly' => 'Monthly System Dossier — '.now()->format('Y-m'),
            default   => 'Manual System Dossier — '.now()->format('Y-m-d H:i'),
        };
    }
}
