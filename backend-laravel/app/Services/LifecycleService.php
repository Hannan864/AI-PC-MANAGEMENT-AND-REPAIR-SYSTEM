<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\RepairRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Service: LifecycleService
 *
 * Manages repair request status transitions and lifecycle event creation.
 * Enforces a strict state machine to prevent invalid transitions.
 * Every status change automatically creates an immutable lifecycle event.
 *
 * Allowed transitions:
 *   submitted   → assigned, cancelled
 *   assigned    → accepted, in_progress, cancelled
 *   accepted    → in_progress, cancelled
 *   in_progress → waiting_parts, testing, completed, cancelled
 *   waiting_parts → in_progress, cancelled
 *   testing     → in_progress, completed, cancelled
 *   completed   → (terminal)
 *   cancelled   → (terminal)
 */
class LifecycleService
{
    /**
     * Valid status transitions map.
     * Key = current status, Value = array of allowed next statuses.
     */
    private const TRANSITIONS = [
        'submitted'     => ['assigned', 'accepted', 'cancelled'],
        'assigned'      => ['accepted', 'in_progress', 'cancelled'],
        'accepted'      => ['in_progress', 'cancelled'],
        'in_progress'   => ['waiting_parts', 'testing', 'completed', 'cancelled'],
        'waiting_parts' => ['in_progress', 'cancelled'],
        'testing'       => ['in_progress', 'completed', 'cancelled'],
        'completed'     => [],
        'cancelled'     => [],
    ];

    /**
     * Transition a repair request to a new status.
     * Validates the transition, updates the status, and creates a lifecycle event.
     *
     * @throws ValidationException if the transition is invalid
     */
    public function transition(
        RepairRequest $request,
        string $newStatus,
        User $actor,
        ?string $note = null,
    ): RepairRequest {
        $currentStatus = $request->status;

        if (! $this->canTransition($currentStatus, $newStatus)) {
            throw ValidationException::withMessages([
                'status' => sprintf(
                    'Cannot transition from "%s" to "%s". Allowed transitions: %s.',
                    $currentStatus,
                    $newStatus,
                    implode(', ', self::TRANSITIONS[$currentStatus] ?? ['(none)']),
                ),
            ]);
        }

        DB::transaction(function () use ($request, $newStatus, $actor, $note) {
            $request->update(['status' => $newStatus]);

            $this->createEvent($request, $newStatus, $actor, $note);
        });

        return $request->fresh();
    }

    /**
     * Create a lifecycle event for a repair request without changing status.
     * Useful for adding notes or recording events on the current status.
     */
    public function addEvent(
        RepairRequest $request,
        string $status,
        User $actor,
        ?string $note = null,
    ): void {
        $this->createEvent($request, $status, $actor, $note);
    }

    /**
     * Check if a status transition is allowed.
     */
    public function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    /**
     * Get all allowed transitions from a given status.
     *
     * @return array<int, string>
     */
    public function getAllowedTransitions(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    /**
     * Get the full list of valid statuses.
     *
     * @return array<int, string>
     */
    public function getAllStatuses(): array
    {
        return array_keys(self::TRANSITIONS);
    }

    private function createEvent(
        RepairRequest $request,
        string $status,
        User $actor,
        ?string $note,
    ): void {
        $request->lifecycleEvents()->create([
            'status'     => $status,
            'updated_by' => $actor->id,
            'note'       => $note,
        ]);
    }
}
