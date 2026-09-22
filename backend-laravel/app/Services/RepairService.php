<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CompletionReport;
use App\Models\RepairRequest;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Service: RepairService
 *
 * Encapsulates all business logic for repair request management:
 * creation, assignment, status transitions, image uploads, and completion reports.
 * Keeps controllers thin by handling validation, storage, and model operations here.
 */
class RepairService
{
    public function __construct(
        private readonly LifecycleService $lifecycleService,
        private readonly UserHistoryService $userHistoryService,
    ) {}

    /**
     * Create a new repair request with optional image uploads.
     * Automatically creates the initial "submitted" lifecycle event and user history entry.
     */
    public function createRepairRequest(array $data, User $user, ?array $images = null): RepairRequest
    {
        $data['user_id']  = $user->id;
        $data['status']   = 'submitted';

        if ($images !== null) {
            $data['user_images'] = $this->storeImages($images, 'repair-requests/user-images');
        }

        $request = RepairRequest::create($data);

        $this->lifecycleService->addEvent($request, 'submitted', $user, 'Repair request submitted.');

        // Record user history entry
        $this->userHistoryService->recordRepairCreated($request);

        return $request->fresh(['user', 'technician', 'lifecycleEvents']);
    }

    /**
     * Assign a technician to a repair request (admin only).
     * Transitions: submitted → assigned or reassigned.
     */
    public function assignTechnician(
        RepairRequest $request,
        User $technician,
        User $admin,
        ?string $note = null,
    ): RepairRequest {
        if (! $technician->isTechnician()) {
            throw ValidationException::withMessages([
                'technician_id' => 'The selected user is not a technician.',
            ]);
        }

        DB::transaction(function () use ($request, $technician, $admin, $note) {
            // If reassigning, we still transition through assigned
            if ($request->status === 'submitted') {
                $this->lifecycleService->transition($request, 'assigned', $admin, $note ?? 'Assigned to technician.');
            } else {
                // Reassignment: just add an event and update the FK
                $this->lifecycleService->addEvent(
                    $request,
                    $request->status,
                    $admin,
                    $note ?? sprintf('Reassigned to %s.', $technician->name),
                );
            }

            $request->update(['technician_id' => $technician->id]);
        });

        return $request->fresh(['user', 'technician', 'lifecycleEvents']);
    }

    /**
     * Update the status of a repair request (technician or admin).
     * Enforces valid status transitions via LifecycleService.
     */
    public function updateStatus(
        RepairRequest $request,
        string $newStatus,
        User $actor,
        ?string $note = null,
        ?string $severityLevel = null,
    ): RepairRequest {
        if ($severityLevel !== null && in_array($severityLevel, ['low', 'medium', 'high'], true)) {
            $request->severity_level = $severityLevel;
            $request->save();
        }

        // When a technician accepts a submitted request, auto-assign them
        if ($newStatus === 'accepted' && $request->status === 'submitted' && $request->technician_id === null && $actor->isTechnician()) {
            $request->update(['technician_id' => $actor->id]);
        }

        // Same-status updates are valid (e.g. admin adjusting the severity/
        // priority dispatch factor, or a technician adding a note). Persist the
        // change above, log a lifecycle note, and skip the state transition.
        if ($newStatus === $request->status) {
            $this->lifecycleService->addEvent($request, $request->status, $actor, $note);
            $this->userHistoryService->recordStatusChange($request, $newStatus, $note);

            return $request->fresh(['user', 'technician', 'lifecycleEvents']);
        }

        $result = $this->lifecycleService->transition($request, $newStatus, $actor, $note);

        // Record user history entry
        $this->userHistoryService->recordStatusChange($result, $newStatus, $note);

        return $result;
    }

    /**
     * Submit a completion report for a repair request (technician only).
     * Transitions the request to "completed" and creates the report.
     */
    public function submitCompletionReport(
        RepairRequest $request,
        array $reportData,
        User $technician,
        ?array $completionImages = null,
    ): CompletionReport {
        if ($request->technician_id !== $technician->id) {
            throw ValidationException::withMessages([
                'repair_request' => 'You can only complete repairs assigned to you.',
            ]);
        }

        if ($this->lifecycleService->canTransition($request->status, 'completed') === false
            && $request->status !== 'completed') {
            // Allow completing from any non-terminal state for flexibility,
            // but the lifecycle service will validate the transition.
            // If the current status doesn't allow → completed, try via in_progress first.
            $nonTerminal = ! in_array($request->status, ['completed', 'cancelled'], true);
            if ($nonTerminal && $request->status !== 'in_progress') {
                // Force through in_progress if coming from waiting_parts, testing, etc.
                $this->lifecycleService->transition($request, 'in_progress', $technician, 'Auto-transition before completion.');
            }
        }

        // Transition to completed
        $this->lifecycleService->transition($request, 'completed', $technician, 'Repair completed.');

        // Handle completion images
        if ($completionImages !== null) {
            $reportData['tech_images'] = $this->storeImages($completionImages, 'repair-requests/completion-images');
            $request->update(['tech_images' => $reportData['tech_images']]);
        }

        // Calculate total cost
        $reportData['repair_request_id'] = $request->id;
        $reportData['total_cost'] = ($reportData['labor_cost'] ?? 0)
            + array_sum(array_map(fn ($p) => $p['cost'] ?? 0, $reportData['parts_replaced'] ?? []));

        $report = CompletionReport::create($reportData);

        // Record user history entry for completion
        $this->userHistoryService->recordRepairCompleted($request, $reportData['work_notes'] ?? null);

        // Increment technician's jobs_completed counter
        TechnicianProfile::where('user_id', $technician->id)->increment('jobs_completed');

        return $report->fresh('repairRequest');
    }

    /**
     * Upload user images for a repair request.
     */
    public function uploadUserImages(RepairRequest $request, array $images): RepairRequest
    {
        $existing = $request->user_images ?? [];
        $newPaths = $this->storeImages($images, 'repair-requests/user-images');
        $request->update(['user_images' => array_merge($existing, $newPaths)]);

        return $request->fresh();
    }

    /**
     * Upload technician images for a repair request.
     */
    public function uploadTechImages(RepairRequest $request, array $images): RepairRequest
    {
        $existing = $request->tech_images ?? [];
        $newPaths = $this->storeImages($images, 'repair-requests/tech-images');
        $request->update(['tech_images' => array_merge($existing, $newPaths)]);

        return $request->fresh();
    }

    /**
     * Get the complete service history for a user (as customer).
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getUserServiceHistory(User $user, int $perPage = 20)
    {
        return RepairRequest::with(['technician', 'completionReport', 'lifecycleEvents.actor'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get the complete service history for a technician (assigned repairs).
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getTechnicianServiceHistory(User $technician, int $perPage = 20)
    {
        return RepairRequest::with(['user', 'completionReport', 'lifecycleEvents.actor'])
            ->where('technician_id', $technician->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Calculate SLA durations for a repair request.
     */
    public function calculateSLA(RepairRequest $request): array
    {
        $events = $request->lifecycleEvents()->orderBy('created_at', 'asc')->get();

        $timeline = [];
        $openedAt = $request->created_at;

        foreach ($events as $event) {
            $timeline[] = [
                'status'    => $event->status,
                'actor'     => $event->actor?->name,
                'note'      => $event->note,
                'timestamp' => $event->created_at->toIso8601String(),
            ];
        }

        // Calculate durations
        $assignedEvent   = $events->firstWhere('status', 'assigned');
        $inProgressEvent = $events->firstWhere('status', 'in_progress');
        $completedEvent  = $events->firstWhere('status', 'completed');

        $timeToAssign    = $assignedEvent
            ? $openedAt->diffInMinutes($assignedEvent->created_at)
            : null;
        $timeToStart     = $inProgressEvent
            ? $openedAt->diffInMinutes($inProgressEvent->created_at)
            : null;
        $repairDuration  = ($inProgressEvent && $completedEvent)
            ? $inProgressEvent->created_at->diffInMinutes($completedEvent->created_at)
            : null;
        $totalDuration   = $completedEvent
            ? $openedAt->diffInMinutes($completedEvent->created_at)
            : null;

        return [
            'opened_at'         => $openedAt->toIso8601String(),
            'assigned_at'       => $assignedEvent?->created_at->toIso8601String(),
            'in_progress_at'    => $inProgressEvent?->created_at->toIso8601String(),
            'completed_at'      => $completedEvent?->created_at->toIso8601String(),
            'minutes_to_assign' => $timeToAssign,
            'minutes_to_start'  => $timeToStart,
            'repair_duration_minutes'  => $repairDuration,
            'total_duration_minutes'   => $totalDuration,
            'timeline'          => $timeline,
        ];
    }

    /**
     * Get admin reporting summary.
     */
    public function getAdminReport(): array
    {
        $totalRequests    = RepairRequest::count();
        $completedRequests = RepairRequest::where('status', 'completed')->count();
        $cancelledRequests = RepairRequest::where('status', 'cancelled')->count();
        $activeRequests   = RepairRequest::whereNotIn('status', ['completed', 'cancelled'])->count();

        $avgCompletionMinutes = RepairRequest::where('status', 'completed')
            ->whereHas('completionReport')
            ->with('completionReport')
            ->get()
            ->pluck('completionReport.time_spent_minutes')
            ->filter()
            ->avg();

        $totalRevenue = CompletionReport::sum('total_cost');
        $totalLabor   = CompletionReport::sum('labor_cost');

        $byCategory = RepairRequest::select('issue_category', DB::raw('count(*) as count'))
            ->groupBy('issue_category')
            ->pluck('count', 'issue_category');

        $bySeverity = RepairRequest::select('severity_level', DB::raw('count(*) as count'))
            ->groupBy('severity_level')
            ->pluck('count', 'severity_level');

        $byStatus = RepairRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'total_requests'              => $totalRequests,
            'completed_requests'          => $completedRequests,
            'cancelled_requests'          => $cancelledRequests,
            'active_requests'             => $activeRequests,
            'avg_completion_minutes'      => $avgCompletionMinutes !== null ? round($avgCompletionMinutes) : null,
            'total_revenue'               => (float) $totalRevenue,
            'total_labor_cost'            => (float) $totalLabor,
            'requests_by_category'        => $byCategory,
            'requests_by_severity'        => $bySeverity,
            'requests_by_status'          => $byStatus,
        ];
    }

    /**
     * Store uploaded images to the specified directory.
     *
     * @param  array<int, UploadedFile>  $images
     * @return array<int, string> Storage paths
     */
    private function storeImages(array $images, string $directory): array
    {
        $paths = [];

        foreach ($images as $image) {
            $paths[] = $image->store($directory, 'public');
        }

        return $paths;
    }
}
