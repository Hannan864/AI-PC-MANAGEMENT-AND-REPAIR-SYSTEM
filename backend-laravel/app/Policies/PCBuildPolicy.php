<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PCBuild;
use App\Models\User;

/**
 * Policy: PCBuildPolicy
 *
 * Authorization rules for PC build operations.
 * - Customers can manage their own builds.
 * - Technicians can view/manage builds assigned to them.
 * - Admins have full access.
 */
class PCBuildPolicy
{
    /**
     * Any authenticated user can view builds (filtered at query level).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * User can view a build if they own it, are assigned as technician, or are admin.
     */
    public function view(User $user, PCBuild $pcBuild): bool
    {
        return $user->id === $pcBuild->user_id
            || $user->id === $pcBuild->technician_id
            || $user->isAdmin();
    }

    /**
     * Any authenticated user can create builds.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * User can update their own draft builds (and rejected builds that were
     * returned for changes), or if admin.
     * Technicians can update builds assigned to them or in the review pipeline.
     */
    public function update(User $user, PCBuild $pcBuild): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->id === $pcBuild->user_id && in_array($pcBuild->status, ['draft', 'rejected'], true)) {
            return true;
        }

        if ($user->id === $pcBuild->technician_id) {
            return true;
        }

        // Technicians can update any build that is in the review pipeline
        // (allows techs to claim/review builds not yet assigned to them and
        // advance the workflow through approved → in-progress → completed).
        if ($user->isTechnician() && in_array($pcBuild->status, [
            'submitted_review',
            'under_review',
            'reviewed',
            'in_progress',
            'completed',
            'rejected',
        ], true)) {
            return true;
        }

        return false;
    }

    /**
     * User can delete their own draft builds, or if admin.
     */
    public function delete(User $user, PCBuild $pcBuild): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->id === $pcBuild->user_id && $pcBuild->status === 'draft';
    }

    /**
     * User can submit their own draft build for review.
     * Passing builds and builds with only warnings are eligible — technicians
     * review the part list before approving or requesting changes.
     */
    public function submitForReview(User $user, PCBuild $pcBuild): bool
    {
        return $user->id === $pcBuild->user_id
            && $pcBuild->status === 'draft'
            && in_array($pcBuild->compatibility_status, ['pass', 'warning'], true);
    }
}
