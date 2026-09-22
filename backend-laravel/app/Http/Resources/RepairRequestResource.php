<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: RepairRequestResource
 *
 * Transforms a RepairRequest model into a standardized JSON representation.
 * Includes nested resources for user, technician, lifecycle events, and completion report.
 * Compatibility aliases are added to match the original IndexedDB backend contract.
 */
class RepairRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $events = $this->relationLoaded('lifecycleEvents') ? $this->lifecycleEvents : null;
        $completionReport = $this->relationLoaded('completionReport') ? $this->completionReport : null;

        return [
            // Core fields
            'id'                    => $this->id,
            'historyId'             => $this->id,
            'userId'                => $this->user_id,
            'technicianId'          => $this->technician_id,

            // Issue details
            // Values are normalized to UPPERCASE to match the original IndexedDB
            // contract where status/severity/issueCategory were stored upper-cased
            // (e.g. RepairRequestStatus.COMPLETED, Role-based enums).
            'issueCategory'         => $this->issue_category ? strtoupper($this->issue_category) : $this->issue_category,
            'issueDescription'      => $this->issue_description,
            'severityLevel'         => $this->severity_level ? strtoupper($this->severity_level) : $this->severity_level,
            'status'                => $this->status
                ? ($this->status === 'assigned' ? 'TECHNICIAN_ASSIGNED' : strtoupper($this->status))
                : $this->status,

            // Gig/marketplace compatibility
            'gigTitle'              => $this->gig_title,
            'gigId'                 => null,

            // Flat user names for backward compatibility
            'userName'              => $this->whenLoaded('user', fn () => $this->user->name),
            'technicianNote'        => $this->whenLoaded('completionReport', fn () => $this->completionReport->work_notes),
            'technicianDecision'    => null,

            // Severity score (computed from severity_level)
            'severityScore'         => $this->computeSeverityScore(),

            // Diagnostic compatibility (IndexedDB stored attached diagnostics)
            'attachedDiagnosticId'  => null,
            'attachedDiagnostics'   => null,

            // AI suggestion compatibility (computed from routing engine)
            'aiSuggestion'          => null,
            'userChoice'            => null,
            'isAIOverridden'        => false,

            // Attached data
            'systemSpecifications'  => $this->system_specifications,
            'userImages'            => $this->user_images ?? [],
            'techImages'            => $this->tech_images ?? [],

            // Nested relationships
            'user'                  => new UserResource($this->whenLoaded('user')),
            'technician'            => new UserResource($this->whenLoaded('technician')),
            'lifecycleEvents'       => $events ? LifecycleEventResource::collection($events) : [],
            'completionReport'      => $completionReport ? new CompletionReportResource($completionReport) : null,

            // Computed lifecycleHistory (legacy format with numeric timestamps)
            'lifecycleHistory'      => $this->computeLifecycleHistory($events),

            // Computed SLA data
            'sla'                   => $this->computeSLA($events),

            // Technician notes list (computed from completion report)
            'technicianNotes'       => $this->computeTechnicianNotes($completionReport),

            // Timestamps
            'createdAt'             => $this->created_at?->toIso8601String(),
            'updatedAt'             => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Compute a numeric severity score from the severity level.
     * Original IndexedDB stored a 0-100 score; API stores low/medium/high.
     */
    private function computeSeverityScore(): ?int
    {
        return match ($this->severity_level) {
            'high'   => 85,
            'medium' => 55,
            'low'    => 25,
            default  => null,
        };
    }

    /**
     * Convert lifecycle events to the legacy lifecycleHistory format
     * with numeric timestamps matching the original IndexedDB contract.
     */
    private function computeLifecycleHistory($events): array
    {
        if (! $events) {
            return [];
        }

        return $events->map(fn ($event) => [
            'status'    => $event->status ? strtoupper($event->status) : $event->status,
            'timestamp' => $event->created_at ? $event->created_at->timestamp * 1000 : null,
            'updatedBy' => $event->updated_by,
            'note'      => $event->note,
        ])->toArray();
    }

    /**
     * Compute SLA data from lifecycle events.
     * Matches the original IndexedDB SLA interface.
     */
    private function computeSLA($events): array
    {
        if (! $events) {
            return [
                'createdAt'                => $this->created_at?->timestamp * 1000,
                'acceptedAt'               => null,
                'estimatedStartTime'       => null,
                'estimatedCompletionTime'  => null,
                'actualCompletionTime'     => null,
            ];
        }

        $assignedEvent     = $events->firstWhere('status', 'assigned');
        $inProgressEvent   = $events->firstWhere('status', 'in_progress');
        $completedEvent    = $events->firstWhere('status', 'completed');

        $acceptedAt = $assignedEvent?->created_at?->timestamp * 1000;

        // Estimate completion based on severity
        $estimatedCompletion = null;
        if ($this->created_at) {
            $baseMs = $this->created_at->timestamp * 1000;
            $estimatedCompletion = match ($this->severity_level) {
                'high'   => $baseMs + (2 * 3600 * 1000),  // 2 hours
                'medium' => $baseMs + (4 * 3600 * 1000),  // 4 hours
                'low'    => $baseMs + (24 * 3600 * 1000), // 24 hours
                default  => $baseMs + (4 * 3600 * 1000),
            };
        }

        return [
            'createdAt'               => $this->created_at?->timestamp * 1000,
            'acceptedAt'              => $acceptedAt,
            'estimatedStartTime'      => $acceptedAt ? $acceptedAt + (30 * 60 * 1000) : null,
            'estimatedCompletionTime' => $estimatedCompletion,
            'actualCompletionTime'    => $completedEvent?->created_at?->timestamp * 1000,
        ];
    }

    /**
     * Compute technicianNotes list from completion report.
     * Matches the original IndexedDB technicianNotes array.
     */
    private function computeTechnicianNotes($completionReport): array
    {
        if (! $completionReport || ! $completionReport->work_notes) {
            return [];
        }

        return [
            [
                'timestamp' => $completionReport->created_at?->timestamp * 1000,
                'note'      => $completionReport->work_notes,
                'author'    => 'TECHNICIAN',
            ],
        ];
    }
}
