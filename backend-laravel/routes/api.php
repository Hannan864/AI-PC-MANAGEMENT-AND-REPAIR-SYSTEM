<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Smart PC Hub v1
|--------------------------------------------------------------------------
|
| All routes are versioned under /api/v1/ prefix.
| Controllers will be implemented in Phase 3 onward.
|
| Role middleware usage:
|   'role:admin'            — Admin only
|   'role:technician'       — Technician only
|   'role:admin,technician' — Admin OR Technician
|
*/

// ============================================================================
// AUTH ROUTES (Phase 3)
// ============================================================================
Route::prefix('v1/auth')->group(function () {
    Route::get('/login',  [\App\Http\Controllers\Api\V1\AuthController::class, 'loginInfo'])->name('api.auth.login.info');
    Route::post('/register', [\App\Http\Controllers\Api\V1\AuthController::class, 'register'])->name('api.auth.register');
    Route::post('/login',    [\App\Http\Controllers\Api\V1\AuthController::class, 'login'])->name('api.auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout',  [\App\Http\Controllers\Api\V1\AuthController::class, 'logout'])->name('api.auth.logout');
        Route::get('/me',       [\App\Http\Controllers\Api\V1\AuthController::class, 'me'])->name('api.auth.me');
    });
});

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {

    // -----------------------------------------------------------------------
    // USER PROFILE (Phase 3)
    // -----------------------------------------------------------------------
    Route::get('/user/profile',   [\App\Http\Controllers\Api\V1\UserController::class, 'profile'])->name('api.user.profile');
    Route::put('/user/profile',   [\App\Http\Controllers\Api\V1\UserController::class, 'updateProfile'])->name('api.user.update');

    // -----------------------------------------------------------------------
    // GIGS — Marketplace (Technician CRUD, User browse)
    // -----------------------------------------------------------------------
    Route::apiResource('gigs', \App\Http\Controllers\Api\V1\GigController::class)
         ->names('api.gigs');

    // -----------------------------------------------------------------------
    // PC BUILDS — Customer + Admin + Technician (Phase 4)
    // -----------------------------------------------------------------------
    Route::apiResource('pc-builds', \App\Http\Controllers\Api\V1\PCBuildController::class)
         ->names('api.pc-builds');

    Route::post('/pc-builds/{id}/submit-review', [\App\Http\Controllers\Api\V1\PCBuildController::class, 'submitForReview'])
         ->name('api.pc-builds.submit-review');

    // Workflow progression (approve/reject/in-progress/completed) is a
    // technician/admin action — customers submit via submit-review above.
    Route::post('/pc-builds/{id}/status', [\App\Http\Controllers\Api\V1\PCBuildController::class, 'updateStatus'])
         ->middleware('role:technician,admin')
         ->name('api.pc-builds.status');

    // -----------------------------------------------------------------------
    // REPAIR REQUESTS (Phase 5 & 6)
    // -----------------------------------------------------------------------
    Route::get('/repair-requests',       [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'index'])->name('api.repair-requests.index');
    Route::get('/repair-requests/unassigned', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'unassigned'])
         ->middleware('role:technician,admin')
         ->name('api.repair-requests.unassigned');
    Route::post('/repair-requests',      [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'store'])->name('api.repair-requests.store');
    Route::get('/repair-requests/{id}',  [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'show'])->name('api.repair-requests.show');
    Route::delete('/repair-requests/{id}', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'destroy'])->name('api.repair-requests.destroy');

    // Admin-only: Assign technician
    Route::post('/repair-requests/{id}/assign', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'assign'])
         ->middleware('role:admin')
         ->name('api.repair-requests.assign');

    // Update job status.
    // No role middleware here: RepairRequestPolicy.updateStatus authorizes each call.
    // - Technicians/admin manage transitions.
    // - Customers may cancel their own submitted requests.
    Route::post('/repair-requests/{id}/status', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'updateStatus'])
         ->name('api.repair-requests.update-status');

    // Technician-only: Submit completion report
    Route::post('/repair-requests/{id}/complete', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'complete'])
         ->middleware('role:technician')
         ->name('api.repair-requests.complete');

    // Lifecycle timeline for a specific repair request
    Route::get('/repair-requests/{id}/timeline', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'timeline'])
         ->name('api.repair-requests.timeline');

    // -----------------------------------------------------------------------
    // USER HISTORY — Audit trail (legacy IndexedDB compatibility)
    // -----------------------------------------------------------------------
    Route::get('/user/history', [\App\Http\Controllers\Api\V1\UserHistoryController::class, 'index'])
         ->name('api.user.history');

    // -----------------------------------------------------------------------
    // SERVICE HISTORY (Phase 6)
    // -----------------------------------------------------------------------
    Route::get('/user/service-history', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'serviceHistory'])
         ->name('api.user.service-history');

    Route::get('/technician/service-history', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'technicianHistory'])
         ->middleware('role:technician')
         ->name('api.technician.service-history');

    // -----------------------------------------------------------------------
    // ADMIN MANAGEMENT (Phase 3 / Phase 5)
    // -----------------------------------------------------------------------
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users',           [\App\Http\Controllers\Api\V1\AdminController::class, 'listUsers'])->name('api.admin.users');
        Route::put('/users/{id}/status', [\App\Http\Controllers\Api\V1\AdminController::class, 'updateUserStatus'])->name('api.admin.user-status');
        Route::get('/technicians',     [\App\Http\Controllers\Api\V1\AdminController::class, 'listTechnicians'])->name('api.admin.technicians');
        Route::get('/dashboard',       [\App\Http\Controllers\Api\V1\AdminController::class, 'dashboard'])->name('api.admin.dashboard');
        Route::get('/reports/summary', [\App\Http\Controllers\Api\V1\RepairRequestController::class, 'adminReport'])->name('api.admin.reports.summary');
    });

    // -----------------------------------------------------------------------
    // AI TRIAGE (Phase 7)
    // -----------------------------------------------------------------------
    Route::post('/ai/triage', [\App\Http\Controllers\Api\V1\AIController::class, 'triage'])->name('api.ai.triage');

    // -----------------------------------------------------------------------
    // PC MEDICAL DOSSIERS (Phase 8) — system reports + delivery schedules
    // -----------------------------------------------------------------------
    Route::get('/system-reports',        [\App\Http\Controllers\Api\V1\SystemReportController::class, 'index'])->name('api.system-reports.index');
    Route::post('/system-reports/capture', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'capture'])->name('api.system-reports.capture');
    Route::get('/system-reports/latest', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'latest'])->name('api.system-reports.latest');
    Route::get('/system-reports/technicians', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'technicians'])->name('api.system-reports.technicians');
    Route::post('/system-reports/send', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'send'])->name('api.system-reports.send');
    Route::get('/system-reports/schedule', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'getSchedule'])->name('api.system-reports.schedule');
    Route::put('/system-reports/schedule', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'updateSchedule'])->name('api.system-reports.schedule.update');

    Route::get('/technician/system-reports', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'technicianPatients'])
         ->middleware('role:technician')
         ->name('api.technician.system-reports');
    Route::get('/technician/system-reports/{id}', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'technicianShow'])
         ->middleware('role:technician')
         ->name('api.technician.system-reports.show');

    Route::get('/admin/system-reports', [\App\Http\Controllers\Api\V1\SystemReportController::class, 'adminOverview'])
         ->middleware('role:admin')
         ->name('api.admin.system-reports');

});

// ============================================================================
// REPORTS & ANALYTICS (auth required)
// ============================================================================
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/reports/analytics', [\App\Http\Controllers\Api\V1\ReportsController::class, 'analytics'])->name('api.reports.analytics');
});

// ============================================================================
// HEALTH CHECK (no auth)
// ============================================================================
Route::get('/health', function () {
    return response()->json([
        'status'    => 'ok',
        'service'   => 'Smart PC Hub API',
        'version'   => 'v1',
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.health');

// ============================================================================
// SYSTEM HEALTH MONITORING (no auth — demo/viva purposes)
// ============================================================================
Route::get('/v1/system/health', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'index'])->name('api.system.health');
Route::get('/v1/system/performance', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'performance'])->name('api.system.performance');
Route::get('/v1/system/processes', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'processes'])->name('api.system.processes');
Route::get('/v1/system/drives', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'drives'])->name('api.system.drives');
Route::get('/v1/system/file-stats', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'fileStats'])->name('api.system.file-stats');
Route::get('/v1/system/network', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'network'])->name('api.system.network');
Route::get('/v1/system/hardware', [\App\Http\Controllers\Api\V1\SystemHealthController::class, 'hardware'])->name('api.system.hardware');

// ============================================================================
// ALERTS (no auth — derived from snapshot data)
// ============================================================================
Route::get('/v1/alerts', [\App\Http\Controllers\Api\V1\AlertController::class, 'index'])->name('api.alerts');
Route::get('/v1/alerts/counts', [\App\Http\Controllers\Api\V1\AlertController::class, 'counts'])->name('api.alerts.counts');
Route::post('/v1/alerts/{id}/acknowledge', [\App\Http\Controllers\Api\V1\AlertController::class, 'acknowledge'])->name('api.alerts.acknowledge');
Route::post('/v1/alerts/{id}/in-progress', [\App\Http\Controllers\Api\V1\AlertController::class, 'startProgress'])->name('api.alerts.in-progress');
Route::post('/v1/alerts/{id}/resolve', [\App\Http\Controllers\Api\V1\AlertController::class, 'resolve'])->name('api.alerts.resolve');
Route::post('/v1/alerts/{id}/archive', [\App\Http\Controllers\Api\V1\AlertController::class, 'archive'])->name('api.alerts.archive');
Route::post('/v1/alerts/{id}/ignore', [\App\Http\Controllers\Api\V1\AlertController::class, 'ignore'])->name('api.alerts.ignore');
Route::post('/v1/alerts/{id}/fix', [\App\Http\Controllers\Api\V1\AlertController::class, 'fix'])->name('api.alerts.fix');
Route::post('/v1/alerts/refresh', [\App\Http\Controllers\Api\V1\AlertController::class, 'refreshAll'])->name('api.alerts.refresh');

// ============================================================================
// OPTIMIZATION (no auth — safe system optimization)
// ============================================================================
Route::post('/v1/optimize', [\App\Http\Controllers\Api\V1\OptimizeController::class, 'optimize'])->name('api.optimize');
Route::post('/v1/optimize/kill', [\App\Http\Controllers\Api\V1\OptimizeController::class, 'killProcess'])->name('api.optimize.kill');

// ============================================================================
// MAINTENANCE TASKS (no auth — task scheduler)
// ============================================================================
Route::get('/v1/maintenance/tasks', [\App\Http\Controllers\Api\V1\MaintenanceController::class, 'index'])->name('api.maintenance.tasks');
Route::post('/v1/maintenance/tasks/{id}/toggle', [\App\Http\Controllers\Api\V1\MaintenanceController::class, 'toggle'])->name('api.maintenance.toggle');
Route::post('/v1/maintenance/tasks/{id}/run', [\App\Http\Controllers\Api\V1\MaintenanceController::class, 'run'])->name('api.maintenance.run');

// ============================================================================
// POWER INSIGHTS (no auth — real battery + power scheme reads)
// ============================================================================
Route::get('/v1/power', [\App\Http\Controllers\Api\V1\PowerController::class, 'index'])->name('api.power');
Route::post('/v1/power/profile', [\App\Http\Controllers\Api\V1\PowerController::class, 'setProfile'])->name('api.power.profile');

// ============================================================================
// STARTUP SERVICES (no auth — startup manager)
// ============================================================================
Route::get('/v1/startup/services', [\App\Http\Controllers\Api\V1\StartupController::class, 'index'])->name('api.startup.services');
Route::post('/v1/startup/services/{name}/toggle', [\App\Http\Controllers\Api\V1\StartupController::class, 'toggle'])->name('api.startup.toggle');

// ============================================================================
// APP MANAGER (no auth — derived from snapshot processes)
// ============================================================================
Route::get('/v1/app-manager', [\App\Http\Controllers\Api\V1\AppManagerController::class, 'index'])->name('api.app-manager');

// ============================================================================
// AUTOMATION HUB (no auth — automation scripts)
// ============================================================================
Route::get('/v1/automation/scripts', [\App\Http\Controllers\Api\V1\AutomationController::class, 'index'])->name('api.automation.scripts');
Route::post('/v1/automation/scripts', [\App\Http\Controllers\Api\V1\AutomationController::class, 'store'])->name('api.automation.store');
Route::post('/v1/automation/scripts/{id}/run', [\App\Http\Controllers\Api\V1\AutomationController::class, 'run'])->name('api.automation.run');
Route::post('/v1/automation/scripts/{id}/toggle', [\App\Http\Controllers\Api\V1\AutomationController::class, 'toggle'])->name('api.automation.toggle');
Route::delete('/v1/automation/scripts/{id}', [\App\Http\Controllers\Api\V1\AutomationController::class, 'destroy'])->name('api.automation.destroy');
