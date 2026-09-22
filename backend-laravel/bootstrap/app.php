<?php

declare(strict_types=1);

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\AppServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Pure token-based auth — no session/CSRF on API routes.
        // auth:sanctum is applied to individual routes in routes/api.php.

        // Register the custom 'role' middleware alias
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // When an invalid/revoked Sanctum token is sent, the auth:sanctum
        // middleware falls back to the web guard and tries to redirect to
        // the 'login' route.  That route doesn't exist in this API-only
        // app, so Symfony throws a RouteNotFoundException (HTTP 500).
        // Convert it to the correct 401 JSON response.
        $exceptions->renderable(function (\Symfony\Component\Routing\Exception\RouteNotFoundException $e) {
            if (str_contains($e->getMessage(), 'login')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });
    })->create();
