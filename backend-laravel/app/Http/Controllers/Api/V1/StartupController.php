<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\StartupService;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StartupController extends BaseController
{
    public function index(): JsonResponse
    {
        $services = StartupService::orderByRaw("CASE impact WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 WHEN 'High' THEN 3 ELSE 4 END")
            ->orderBy('id')
            ->get()
            ->map(fn($s) => [
                'name' => $s->name,
                'impact' => $s->impact,
                'status' => $s->enabled ? 'Enabled' : 'Disabled',
                'time' => $s->boot_time_s . 's',
                'boot_time_s' => $s->boot_time_s,
            ]);

        $snapshot = app(SystemSnapshot::class);
        $health = $snapshot->get('health');
        $uptime = $health['uptime'] ?? 'Unknown';

        $enabledTotal = $services->where('status', 'Enabled')->sum('boot_time_s');
        $disabledSaving = $services->where('status', 'Disabled')->sum('boot_time_s');

        return response()->json([
            'success' => true,
            'data' => [
                'services' => $services,
                'analytics' => [
                    'totalBootPenalty' => round($enabledTotal, 2) . 's',
                    'potentialSaving' => round($disabledSaving, 2) . 's',
                    'uptime' => $uptime,
                ],
            ],
        ]);
    }

    public function toggle(Request $request, string $name): JsonResponse
    {
        $service = StartupService::where('name', $name)->firstOrFail();
        $service->update(['enabled' => !$service->enabled]);

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $service->name,
                'status' => $service->enabled ? 'Enabled' : 'Disabled',
            ],
        ]);
    }
}
