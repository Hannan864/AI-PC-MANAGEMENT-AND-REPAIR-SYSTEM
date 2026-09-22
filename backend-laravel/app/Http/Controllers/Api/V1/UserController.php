<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller: UserController
 *
 * Manages authenticated user profile operations.
 * Replaces the client-side IndexedDB user store with MySQL-backed endpoints.
 */
class UserController extends BaseController
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    /**
     * GET /api/v1/user/profile
     *
     * Returns the authenticated user's full profile.
     */
    public function profile(Request $request): JsonResponse
    {
        return $this->sendResponse(
            new UserResource($request->user()),
            'Profile retrieved successfully.',
        );
    }

    /**
     * PUT /api/v1/user/profile
     *
     * Updates the authenticated user's profile fields.
     * Accepts optional: name, email, password.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $updatedUser = $this->authService->updateProfile(
            $request->user(),
            $request->validated(),
        );

        return $this->sendResponse(
            new UserResource($updatedUser),
            'Profile updated successfully.',
        );
    }
}
