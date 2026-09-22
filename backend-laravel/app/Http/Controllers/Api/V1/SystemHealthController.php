<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Services\SystemSnapshot;
use Illuminate\Http\JsonResponse;

class SystemHealthController extends BaseController
{
    public function index(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('health');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultHealth(),
        ]);
    }

    public function performance(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('performance');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultPerformance(),
        ]);
    }

    public function processes(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('processes');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultProcesses(),
        ]);
    }

    public function drives(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('drives');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultDrives(),
        ]);
    }

    public function fileStats(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('fileStats');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultFileStats(),
        ]);
    }

    public function network(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('network');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultNetwork(),
        ]);
    }

    public function hardware(): JsonResponse
    {
        $data = app(SystemSnapshot::class)->get('hardware');

        return response()->json([
            'success' => true,
            'data' => $data ?? $this->defaultHardware(),
        ]);
    }

    private function defaultHealth(): array
    {
        return [
            'cpu' => 0.0,
            'ram' => ['usedPercent' => 0.0, 'freeMB' => 0, 'totalMB' => 0],
            'disk' => ['usedPercent' => 0.0, 'freeGB' => 0, 'totalGB' => 0],
            'networkUp' => 0,
            'networkDown' => 0,
            'uptime' => 'Collecting...',
            'backendStatus' => 'Online',
            'databaseStatus' => 'Collecting...',
            'serverTime' => now()->toIso8601String(),
            'phpVersion' => phpversion(),
            'laravelVersion' => app()->version(),
            'os' => PHP_OS,
        ];
    }

    private function defaultPerformance(): array
    {
        return [
            'cpu' => 0,
            'ram' => ['usedPercent' => 0.0, 'freeMB' => 0, 'totalMB' => 0],
            'disk' => ['usedPercent' => 0.0, 'freeGB' => 0, 'totalGB' => 0],
            'performanceScore' => 0,
            'performanceHealth' => 'Collecting...',
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function defaultProcesses(): array
    {
        return [
            'processes' => [],
            'totalProcesses' => 0,
            'totalRamMB' => 0,
        ];
    }

    private function defaultDrives(): array
    {
        return [
            'drives' => [],
            'totalDrives' => 0,
        ];
    }

    private function defaultFileStats(): array
    {
        return [
            'totalFiles' => 0,
            'totalFolders' => 0,
            'totalSizeGB' => 0,
            'averageFileSizeMB' => 0,
            'scanDurationMs' => 0,
            'scannedPath' => '',
        ];
    }

    private function defaultNetwork(): array
    {
        return [
            'adapters' => [],
            'activeAdapter' => null,
            'latency' => -1,
            'dnsLatency' => -1,
            'netStats' => ['bytesReceived' => 0, 'bytesSent' => 0, 'packetsReceived' => 0, 'packetsSent' => 0, 'errors' => 0],
            'connectionQuality' => 'Collecting...',
            'gateway' => '',
            'dns' => '',
            'internetReachable' => false,
            'collectionDurationMs' => 0,
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function defaultHardware(): array
    {
        return [
            'cpu' => ['name' => 'Collecting...', 'cores' => 0, 'threads' => 0, 'maxClockMHz' => 0, 'currentClockMHz' => 0],
            'gpu' => ['name' => 'Collecting...', 'vramMB' => 0, 'driverVersion' => '', 'driverDate' => '', 'status' => ''],
            'bios' => ['manufacturer' => '', 'version' => '', 'date' => ''],
            'motherboard' => ['manufacturer' => '', 'model' => '', 'serial' => ''],
            'os' => ['name' => '', 'build' => '', 'architecture' => '', 'version' => ''],
            'storage' => ['model' => '', 'manufacturer' => '', 'capacityGB' => 0, 'interface' => '', 'status' => ''],
            'ram' => ['totalGB' => 0, 'sticks' => []],
            'network' => ['name' => '', 'manufacturer' => '', 'driverVersion' => ''],
            'system' => ['manufacturer' => '', 'model' => '', 'totalRam' => ''],
            'hardwareHealth' => 'Collecting...',
            'hardwareScore' => 0,
            'scanDurationMs' => 0,
            'serverTime' => now()->toIso8601String(),
        ];
    }
}
