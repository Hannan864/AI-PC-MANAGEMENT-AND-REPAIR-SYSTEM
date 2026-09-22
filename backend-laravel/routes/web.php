<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\RepairRequest;
use App\Models\Gig;
use App\Models\PCBuild;

Route::get('/demo', function () {
    $token = request()->query('token', '');

    // Gather system data for the template
    $data = [
        'token' => $token,
        'phpVersion' => phpversion(),
        'laravelVersion' => app()->version(),
        'environment' => config('app.env'),
        'debug' => config('app.debug') ? 'true' : 'false',
        'timezone' => config('app.timezone'),
        'dbDriver' => config('database.default'),
        'cacheDriver' => config('cache.default'),
        'queueDriver' => config('queue.default'),
        'sessionDriver' => config('session.driver'),
        'serverTime' => now()->format('Y-m-d H:i:s'),
        'appUrl' => config('app.url'),
    ];

    // Database stats
    try {
        $data['userCount'] = User::count();
        $data['techCount'] = User::where('role', 'technician')->count();
        $data['adminCount'] = User::where('role', 'admin')->count();
        $data['customerCount'] = User::where('role', 'user')->count();
        $data['repairCount'] = RepairRequest::count();
        $data['activeRepairs'] = RepairRequest::whereNotIn('status', ['completed', 'cancelled'])->count();
        $data['completedRepairs'] = RepairRequest::where('status', 'completed')->count();
        $data['gigCount'] = Gig::count();
        $data['buildCount'] = PCBuild::count();
        $data['tokenCount'] = DB::table('personal_access_tokens')->count();
        $data['dbConnected'] = true;
    } catch (\Exception $e) {
        $data['dbConnected'] = false;
        $data['userCount'] = 0;
        $data['techCount'] = 0;
        $data['adminCount'] = 0;
        $data['customerCount'] = 0;
        $data['repairCount'] = 0;
        $data['activeRepairs'] = 0;
        $data['completedRepairs'] = 0;
        $data['gigCount'] = 0;
        $data['buildCount'] = 0;
        $data['tokenCount'] = 0;
    }

    // Routes — inspected directly from the router.
    // NEVER via `artisan route:list` inside a web request: that command calls
    // flushMiddlewareGroups(), wiping the 'web' middleware group from the
    // router and making request termination fail with
    // "Target class [web] does not exist."
    try {
        $routes = collect(app('router')->getRoutes())->map(function ($route) {
            return [
                'domain' => $route->domain(),
                'method' => implode('|', $route->methods()),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'action' => ltrim($route->getActionName(), '\\'),
                'middleware' => $route->middleware(),
                'vendor' => false,
            ];
        })->sortBy('uri')->values()->all();
    } catch (\Exception $e) {
        $routes = [];
    }
    $data['routes'] = $routes;

    // Tables
    try {
        $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
        $data['tables'] = array_column($tables, 'name');
    } catch (\Exception $e) {
        $data['tables'] = [];
    }

    return response()->view('demo', $data)->header('Content-Type', 'text/html');
});
