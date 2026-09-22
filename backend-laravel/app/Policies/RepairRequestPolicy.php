<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\RepairRequest;
use App\Models\User;

/**
 * Policy: RepairRequestPolicy
 *
 * Authorization rules for repair request operations.
 * - Customers can view/manage their own requests.
 * - Technicians can view/manage requests assigned to them.
 * - Admins have full access.
 */
class RepairRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, RepairRequest $repairRequest): bool
    {
        return $user->id === $repairRequest->user_id
            || $user->id === $repairRequest->technician_id
            || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, RepairRequest $repairRequest): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->id === $repairRequest->technician_id) {
            return true;
        }

        // Customer can update only if request is still submitted (before assignment)
        return $user->id === $repairRequest->user_id && $repairRequest->status === 'submitted';
    }

    public function assign(User $user, RepairRequest $repairRequest): bool
    {
        return $user->isAdmin();
    }

    public function updateStatus(User $user, RepairRequest $repairRequest): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Technician can update if already assigned, OR if accepting an unassigned request
        if ($user->isTechnician()) {
            return $user->id === $repairRequest->technician_id
                || $repairRequest->technician_id === null;
        }

        // Customer can cancel their own submitted requests
        if ($user->id === $repairRequest->user_id) {
            return $repairRequest->status === 'submitted';
        }

        return false;
    }

    public function complete(User $user, RepairRequest $repairRequest): bool
    {
        return $user->isTechnician() && $user->id === $repairRequest->technician_id;
    }

    public function delete(User $user, RepairRequest $repairRequest): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Customer can delete only submitted (unassigned) requests
        return $user->id === $repairRequest->user_id
            && $repairRequest->status === 'submitted';
    }
}
