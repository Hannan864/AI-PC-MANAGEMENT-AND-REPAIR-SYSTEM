<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: RoleMiddleware
 *
 * Enforces Role-Based Access Control (RBAC) for API routes.
 * Attached after 'auth:sanctum' to ensure the user is authenticated first.
 *
 * Usage in routes/api.php:
 *   Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
 *   Route::middleware(['auth:sanctum', 'role:technician'])->group(...)
 *   Route::middleware(['auth:sanctum', 'role:admin,technician'])->group(...)
 *
 * Multiple roles can be accepted as comma-separated values.
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! $user->isActive()) {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Check if user's role matches any of the allowed roles
        if (! in_array($user->role, $roles, strict: true)) {
            return response()->json([
                'message' => 'You do not have permission to access this resource.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
