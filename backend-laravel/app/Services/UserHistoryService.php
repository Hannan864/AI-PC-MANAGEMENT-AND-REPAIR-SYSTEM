<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\RepairRequest;
use App\Models\UserHistory;
use Illuminate\Support\Facades\DB;

/**
 * Service: UserHistoryService
 *
 * Populates the user_history audit trail when repair requests change.
 * Replaces the IndexedDB addUserHistory calls from the original frontend.
 */
class UserHistoryService
{
    /**
     * Record a new user history entry.
     */
    public function record(
        string $userId,
        string $type,
        ?string $referenceId,
        string $title,
        ?string $summary = null,
    ): UserHistory {
        return UserHistory::create([
            'user_id'          => $userId,
            'type'             => $type,
            'reference_id'     => $referenceId,
            'title'            => $title,
            'summary'          => $summary,
            'event_timestamp'  => now(),
        ]);
    }

    /**
     * Record repair request creation.
     */
    public function recordRepairCreated(RepairRequest $request): void
    {
        $this->record(
            $request->user_id,
            'REPAIR_REQUEST',
            $request->id,
            'Created Repair Request',
            'Repair request logged for issue Category: ' . ($request->issue_category ?? 'General') . '.',
        );
    }

    /**
     * Record repair status change.
     */
    public function recordStatusChange(RepairRequest $request, string $newStatus, ?string $note = null): void
    {
        $this->record(
            $request->user_id,
            'REPAIR_REQUEST',
            $request->id,
            'Repair Status Updated: ' . str_replace('_', ' ', strtoupper($newStatus)),
            $note ?: "Status changed to {$newStatus}.",
        );
    }

    /**
     * Record repair completion.
     */
    public function recordRepairCompleted(RepairRequest $request, ?string $workNotes = null): void
    {
        $this->record(
            $request->user_id,
            'REPAIR_REQUEST',
            $request->id,
            'Repair Services Completed',
            'Job completed! ' . ($workNotes ?: 'Repair successfully finished.'),
        );
    }
}
