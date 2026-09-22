<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Controller: AdminController
 *
 * Handles admin-only operations:
 *   - List all users and technicians
 *   - Update user account status (activate/suspend)
 *   - Dashboard statistics overview
 *
 * All routes behind this controller require auth:sanctum + role:admin middleware.
 */
class AdminController extends BaseController
{
    /**
     * GET /api/v1/admin/users
     *
     * Lists all registered users with pagination.
     */
    public function listUsers(Request $request): JsonResponse
    {
        $users = User::query()
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse(
            UserResource::collection($users),
            'Users retrieved successfully.',
        );
    }

    /**
     * PUT /api/v1/admin/users/{id}/status
     *
     * Updates a user's account status (active/suspended).
     */
    public function updateUserStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,suspended'],
        ]);

        $user = User::findOrFail($id);
        $user->update(['status' => $request->status]);

        return $this->sendResponse(
            new UserResource($user->fresh()),
            'User status updated successfully.',
        );
    }

    /**
     * GET /api/v1/admin/technicians
     *
     * Lists all technicians with their profile data.
     */
    public function listTechnicians(Request $request): JsonResponse
    {
        $technicians = User::where('role', 'technician')
            ->with('technicianProfile')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse(
            UserResource::collection($technicians),
            'Technicians retrieved successfully.',
        );
    }

    /**
     * GET /api/v1/admin/dashboard
     *
     * Returns aggregate statistics for the admin dashboard.
     */
    public function dashboard(): JsonResponse
    {
        return $this->sendResponse([
            'totalUsers'        => User::where('role', 'user')->count(),
            'totalTechnicians'  => User::where('role', 'technician')->count(),
            'activeTechnicians' => User::where('role', 'technician')
                ->where('status', 'active')
                ->whereHas('technicianProfile', fn ($q) => $q->where('is_available', true))
                ->count(),
            'totalAdmins'       => User::where('role', 'admin')->count(),
        ], 'Dashboard statistics retrieved successfully.');
    }
}
