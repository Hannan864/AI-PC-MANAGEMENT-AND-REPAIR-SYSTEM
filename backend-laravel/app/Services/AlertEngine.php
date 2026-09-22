<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Alert;
use App\Models\AlertRule;
use Illuminate\Support\Str;

class AlertEngine
{
    private SystemSnapshot $snapshot;
    private array $snapshotCache = [];

    public function __construct(SystemSnapshot $snapshot)
    {
        $this->snapshot = $snapshot;
    }

    public function evaluate(): array
    {
        $rules = AlertRule::enabled()->get();
        $now = now();
        $results = [];

        foreach ($rules as $rule) {
            $sectionData = $this->getSnapshotSection($rule->snapshot_section);
            $currentValue = $this->extractValue($sectionData, $rule->condition_field);
            $conditionMet = $this->evaluateCondition($currentValue, $rule->condition_operator, $rule->condition_value);

            // Acknowledged / in-progress alerts are still "open" — they must not
            // be silently replaced with a brand new active alert on every run.
            $existingAlert = Alert::where('rule_code', $rule->code)
                ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                ->first();

            if ($conditionMet) {
                if ($existingAlert) {
                    $existingAlert->update([
                        'last_updated_at' => $now,
                        'context_data' => ['current_value' => $currentValue],
                    ]);
                    $results[] = $existingAlert->fresh()->toArray();
                } else {
                    $cooldownExpired = $this->cooldownExpired($rule);
                    if ($cooldownExpired) {
                        $alert = $this->createAlert($rule, $currentValue, $now);
                        $results[] = $alert->toArray();
                    }
                }
            } else {
                // Condition cleared — close every open alert for this rule
                // (including acknowledged / in-progress ones).
                if ($existingAlert) {
                    $existingAlert->update([
                        'status' => 'resolved',
                        'resolved_at' => $now,
                        'last_updated_at' => $now,
                        'context_data' => ['current_value' => $currentValue, 'resolved_reason' => 'Condition no longer met'],
                    ]);
                }
            }
        }

        $this->checkSnapshotStaleness($now, $results);
        $this->checkBackendHealth($now, $results);
        $this->checkDatabaseHealth($now, $results);
        $this->checkRepairRequests($now, $results);

        return $results;
    }

    public function getActiveAlerts(array $filters = []): array
    {
        $query = Alert::query();

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', '!=', 'resolved');
        }

        if (!empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('detected_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('detected_at', '<=', $filters['date_to']);
        }

        $severityOrder = [
            'critical' => 0,
            'high' => 1,
            'warning' => 2,
            'medium' => 3,
            'low' => 4,
            'info' => 5,
        ];

        $alerts = $query->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'warning' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderBy('detected_at', 'desc')
            ->get()
            ->map(function ($alert) use ($severityOrder) {
                return $this->normalizeAlert($alert);
            })
            ->toArray();

        $active = array_values(array_filter($alerts, fn($a) => $a['status'] === 'active'));
        $acked = array_values(array_filter($alerts, fn($a) => $a['status'] === 'acknowledged'));
        $resolved = array_values(array_filter($alerts, fn($a) => $a['status'] === 'resolved'));

        return array_merge($active, $acked, $resolved);
    }

    private function createAlert(AlertRule $rule, mixed $currentValue, $now): Alert
    {
        $contextData = ['current_value' => $currentValue];

        return Alert::create([
            'uid' => Str::uuid()->toString(),
            'rule_code' => $rule->code,
            'category' => $rule->category,
            'severity' => $rule->severity,
            'title' => $this->renderTemplate($rule->title_template, $currentValue),
            'description' => $this->renderTemplate($rule->description_template, $currentValue),
            'status' => 'active',
            'source_module' => $rule->source_module,
            'recommended_action' => $rule->recommended_action,
            'suggested_fix' => $rule->suggested_fix,
            'fix_route' => $rule->fix_route,
            'context_data' => $contextData,
            'detected_at' => $now,
            'last_updated_at' => $now,
        ]);
    }

    private function renderTemplate(string $template, mixed $value): string
    {
        return str_replace('{value}', (string) $value, $template);
    }

    private function getSnapshotSection(string $section): ?array
    {
        if (!isset($this->snapshotCache[$section])) {
            $this->snapshotCache[$section] = $this->snapshot->get($section);
        }
        return $this->snapshotCache[$section];
    }

    private function extractValue(?array $data, string $fieldPath): mixed
    {
        if ($data === null) {
            return null;
        }

        $parts = explode('.', $fieldPath);
        $current = $data;

        foreach ($parts as $part) {
            if (is_array($current) && isset($current[$part])) {
                $current = $current[$part];
            } elseif (is_object($current) && property_exists($current, $part)) {
                $current = $current->$part;
            } else {
                return null;
            }
        }

        return $current;
    }

    private function evaluateCondition(mixed $value, string $operator, float $threshold): bool
    {
        if ($value === null) {
            return false;
        }

        $numValue = is_numeric($value) ? (float) $value : null;
        if ($numValue === null) {
            return false;
        }

        return match ($operator) {
            '>' => $numValue > $threshold,
            '>=' => $numValue >= $threshold,
            '<' => $numValue < $threshold,
            '<=' => $numValue <= $threshold,
            '==' => $numValue == $threshold,
            '!=' => $numValue != $threshold,
            default => false,
        };
    }

    private function cooldownExpired(AlertRule $rule): bool
    {
        $lastAlert = Alert::where('rule_code', $rule->code)
            ->orderBy('detected_at', 'desc')
            ->first();

        if (!$lastAlert) {
            return true;
        }

        return $lastAlert->detected_at->diffInSeconds(now()) >= $rule->cooldown_seconds;
    }

    private function checkSnapshotStaleness($now, array &$results): void
    {
        $sections = ['health', 'performance', 'processes', 'drives', 'network', 'hardware', 'security'];
        $intervals = [
            'health' => 10,
            'performance' => 10,
            'processes' => 10,
            'drives' => 30,
            'network' => 30,
            'hardware' => 120,
            'security' => 120,
        ];

        foreach ($sections as $section) {
            $age = $this->snapshot->getAge($section);
            $threshold = $intervals[$section] * 3;

            if ($age > $threshold) {
                // Respect acknowledged / in-progress states so a user action
                // actually sticks instead of being re-created on every run.
                $existing = Alert::where('rule_code', "SNAPSHOT_STALE_{$section}")
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->first();

                if (!$existing) {
                    $alert = Alert::create([
                        'uid' => Str::uuid()->toString(),
                        'rule_code' => "SNAPSHOT_STALE_{$section}",
                        'category' => 'System',
                        'severity' => 'warning',
                        'title' => "Monitoring Delay: {$section}",
                        'description' => sprintf('Snapshot section "%s" is %ds old (threshold: %ds). Data may be stale.', $section, $age, $threshold),
                        'status' => 'active',
                        'source_module' => 'AlertEngine',
                        'recommended_action' => 'Refresh the monitoring data to restore live metrics.',
                        'suggested_fix' => 'Click "Fix Now" — this re-collects the section and auto-resolves the alert.',
                        'fix_route' => null,
                        'context_data' => ['section' => $section, 'age_seconds' => $age, 'threshold' => $threshold],
                        'detected_at' => $now,
                        'last_updated_at' => $now,
                    ]);
                    $results[] = $alert->toArray();
                }
            } else {
                // Fresh data — close any open staleness alert for this section.
                Alert::where('rule_code', "SNAPSHOT_STALE_{$section}")
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->update(['status' => 'resolved', 'resolved_at' => $now, 'last_updated_at' => $now]);
            }
        }
    }

    private function checkBackendHealth($now, array &$results): void
    {
        try {
            $health = $this->snapshot->get('health');
            $status = $health['backendStatus'] ?? null;

            if ($status !== 'Online') {
                $existing = Alert::where('rule_code', 'BACKEND_OFFLINE')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->first();
                if (!$existing) {
                    $alert = Alert::create([
                        'uid' => Str::uuid()->toString(),
                        'rule_code' => 'BACKEND_OFFLINE',
                        'category' => 'System',
                        'severity' => 'critical',
                        'title' => 'Backend Offline',
                        'description' => 'Laravel backend is not responding.',
                        'status' => 'active',
                        'source_module' => 'AlertEngine',
                        'recommended_action' => 'Restart the Laravel backend server.',
                        'suggested_fix' => 'Execute: php artisan serve',
                        'fix_route' => null,
                        'context_data' => ['backend_status' => $status],
                        'detected_at' => $now,
                        'last_updated_at' => $now,
                    ]);
                    $results[] = $alert->toArray();
                }
            } else {
                Alert::where('rule_code', 'BACKEND_OFFLINE')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->update(['status' => 'resolved', 'resolved_at' => $now, 'last_updated_at' => $now]);
            }
        } catch (\Throwable $e) {
        }
    }

    private function checkDatabaseHealth($now, array &$results): void
    {
        try {
            $dbStatus = $this->snapshot->get('health')['databaseStatus'] ?? null;

            if ($dbStatus !== 'Connected' && $dbStatus !== null) {
                $existing = Alert::where('rule_code', 'DB_DISCONNECTED')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->first();
                if (!$existing) {
                    $alert = Alert::create([
                        'uid' => Str::uuid()->toString(),
                        'rule_code' => 'DB_DISCONNECTED',
                        'category' => 'Database',
                        'severity' => 'critical',
                        'title' => 'Database Connection Lost',
                        'description' => 'SQLite database is not accessible.',
                        'status' => 'active',
                        'source_module' => 'AlertEngine',
                        'recommended_action' => 'Check database file permissions and disk space.',
                        'suggested_fix' => 'Verify database.sqlite exists and is writable.',
                        'fix_route' => 'REPORTS',
                        'context_data' => ['db_status' => $dbStatus],
                        'detected_at' => $now,
                        'last_updated_at' => $now,
                    ]);
                    $results[] = $alert->toArray();
                }
            } else {
                Alert::where('rule_code', 'DB_DISCONNECTED')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->update(['status' => 'resolved', 'resolved_at' => $now, 'last_updated_at' => $now]);
            }
        } catch (\Throwable $e) {
        }
    }

    private function checkRepairRequests($now, array &$results): void
    {
        try {
            $overdueRepairs = \App\Models\RepairRequest::whereNotIn('status', ['completed', 'cancelled'])
                ->where('created_at', '<', now()->subDays(7))
                ->count();

            if ($overdueRepairs > 0) {
                $existing = Alert::where('rule_code', 'REPAIRS_OVERDUE')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->first();
                if (!$existing) {
                    $alert = Alert::create([
                        'uid' => Str::uuid()->toString(),
                        'rule_code' => 'REPAIRS_OVERDUE',
                        'category' => 'Repair Requests',
                        'severity' => 'warning',
                        'title' => 'Service Delay: Overdue Repair Requests',
                        'description' => "{$overdueRepairs} repair request(s) have been open for more than 7 days.",
                        'status' => 'active',
                        'source_module' => 'AlertEngine',
                        'recommended_action' => 'Review overdue requests and update status.',
                        'suggested_fix' => 'Check Active Requests for stalled jobs.',
                        'fix_route' => 'ACTIVE_REQUESTS',
                        'context_data' => ['overdue_count' => $overdueRepairs],
                        'detected_at' => $now,
                        'last_updated_at' => $now,
                    ]);
                    $results[] = $alert->toArray();
                }
            } else {
                Alert::where('rule_code', 'REPAIRS_OVERDUE')
                    ->whereIn('status', ['active', 'acknowledged', 'in_progress'])
                    ->update(['status' => 'resolved', 'resolved_at' => $now, 'last_updated_at' => $now]);
            }
        } catch (\Throwable $e) {
        }
    }

    private function normalizeAlert(Alert $alert): array
    {
        $ruleCode = (string) $alert->rule_code;
        $isStale = str_starts_with($ruleCode, 'SNAPSHOT_STALE_');
        $isDbCheck = $ruleCode === 'DB_DISCONNECTED';

        $fixAction = $isStale || $isDbCheck
            ? 'refresh'
            : ($alert->fix_route !== null ? 'navigate' : null);
        $fixLabel = $isStale ? 'Fix Now' : ($isDbCheck ? 'Verify Connection' : 'Go to module');

        return [
            'id' => $alert->id,
            'uid' => $alert->uid,
            'ruleCode' => $alert->rule_code,
            'category' => $alert->category,
            'severity' => $alert->severity,
            'title' => $alert->title,
            'description' => $alert->description,
            'status' => $alert->status,
            'sourceModule' => $alert->source_module,
            'recommendedAction' => $alert->recommended_action,
            'suggestedFix' => $alert->suggested_fix,
            'fixRoute' => $alert->fix_route,
            'fixAction' => $fixAction,
            'fixLabel' => $fixLabel,
            'fixable' => $fixAction !== null,
            'contextData' => $alert->context_data,
            'detectedAt' => $alert->detected_at?->toIso8601String(),
            'lastUpdatedAt' => $alert->last_updated_at?->toIso8601String(),
            'acknowledgedAt' => $alert->acknowledged_at?->toIso8601String(),
            'resolvedAt' => $alert->resolved_at?->toIso8601String(),
            'actionable' => $alert->fix_route !== null,
        ];
    }
}
