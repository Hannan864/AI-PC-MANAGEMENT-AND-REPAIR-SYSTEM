<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\TokenResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Controller: AuthController
 *
 * Handles user registration, login, logout, and current user retrieval.
 * All endpoints return standardized JSON envelopes for React + Flutter.
 */
class AuthController extends BaseController
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    /**
     * POST /api/v1/auth/register
     *
     * Creates a new user account and returns a Sanctum token.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->sendResponse(
            (new TokenResource($result['user']))->withPlainToken($result['plainToken']),
            'Account created successfully.',
            Response::HTTP_CREATED,
        );
    }

    /**
     * GET /api/v1/auth/login
     *
     * Returns the Developer API Inspector page (demo/viva purposes).
     * The actual login is POST /api/v1/auth/login.
     */
    public function loginInfo(): \Illuminate\Http\Response
    {
        $data = [
            'endpoint' => 'POST /api/v1/auth/login',
            'method' => 'POST',
            'purpose' => 'Authenticate user and return Bearer token',
            'expectedBody' => ['email' => 'string (required)', 'password' => 'string (required)'],
            'backendStatus' => 'Running',
            'laravelVersion' => app()->version(),
            'phpVersion' => phpversion(),
            'environment' => config('app.env'),
            'debug' => config('app.debug') ? 'true' : 'false',
            'dbDriver' => config('database.default'),
            'dbConnected' => true,
            'timezone' => config('app.timezone'),
            'cacheStatus' => config('cache.default'),
            'queueStatus' => config('queue.default'),
            'apiVersion' => 'v1',
            'serverTime' => now()->toIso8601String(),
            'authEndpoints' => [
                'POST /api/v1/auth/register' => 'Create new account',
                'POST /api/v1/auth/login' => 'Authenticate and get token',
                'POST /api/v1/auth/logout' => 'Revoke current token (auth required)',
                'GET /api/v1/auth/me' => 'Get current user profile (auth required)',
            ],
            'csrf' => 'Disabled (token-based auth via Sanctum Bearer tokens)',
            'sessionDriver' => config('session.driver'),
            'sanctumGuard' => config('sanctum.guard', ['web']),
            'notes' => [
                'This API uses Sanctum Bearer tokens, not session cookies',
                'Send Authorization: Bearer <token> header on authenticated requests',
                'No CSRF token needed — token auth is stateless',
                'All API routes are under /api/v1/ prefix',
                'Role-based access: Admin, Technician, Customer',
            ],
        ];

        return response()->view('login-info', $data)->header('Content-Type', 'text/html');
    }

    /**
     * POST /api/v1/auth/login
     *
     * Authenticates a user and returns a Sanctum bearer token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
        );

        if (! $result) {
            return $this->sendError('Invalid credentials.', [], Response::HTTP_UNAUTHORIZED);
        }

        return $this->sendResponse(
            (new TokenResource($result['user']))->withPlainToken($result['plainToken']),
            'Login successful.',
        );
    }

    /**
     * POST /api/v1/auth/logout
     *
     * Revokes the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->sendMessage('Logged out successfully.');
    }

    /**
     * GET /api/v1/auth/me
     *
     * Returns the currently authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->sendResponse(
            new \App\Http\Resources\UserResource($request->user()),
            'Profile retrieved successfully.',
        );
    }
}
