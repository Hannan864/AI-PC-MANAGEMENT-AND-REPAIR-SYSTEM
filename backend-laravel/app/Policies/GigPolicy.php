<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Gig;
use App\Models\User;

class GigPolicy
{
    public function create(User $user): bool
    {
        return $user->isTechnician();
    }

    public function update(User $user, Gig $gig): bool
    {
        return $user->id === $gig->technician_id || $user->isAdmin();
    }

    public function delete(User $user, Gig $gig): bool
    {
        return $user->id === $gig->technician_id || $user->isAdmin();
    }
}
