<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SystemSnapshot;
use Illuminate\Console\Command;

class SnapshotRefresh extends Command
{
    protected $signature = 'snapshot:refresh {--timeout=120} {--section=}';
    protected $description = 'Collect system metrics and update the monitoring snapshot';

    private const STALE_INTERVALS = [
        'health'      => 3,
        'performance' => 3,
        'processes'   => 3,
        'drives'      => 10,
        'network'     => 10,
        'fileStats'   => 30,
        'hardware'    => 60,
        'security'    => 60,
    ];

    public function handle(): int
    {
        $snapshot = app(SystemSnapshot::class);
        $timeout = (int) $this->option('timeout');
        $onlySection = $this->option('section');
        $start = microtime(true);

        $this->info('Refreshing monitoring snapshot...');

        $collectors = [
            'health'      => fn() => $this->collectHealth(),
            'performance' => fn() => $this->collectPerformance(),
            'processes'   => fn() => $this->collectProcesses(),
            'drives'      => fn() => $this->collectDrives(),
            'network'     => fn() => $this->collectNetwork(),
            'fileStats'   => fn() => $this->collectFileStats(),
            'hardware'    => fn() => $this->collectHardware(),
            'security'    => fn() => $this->collectSecurity(),
        ];

        $built = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($collectors as $name => $collector) {
            if ((microtime(true) - $start) > $timeout) {
                $this->warn("  Timeout reached after {$timeout}s, skipping remaining sections");
                break;
            }

            if ($onlySection && $onlySection !== $name) {
                continue;
            }

            if (!$onlySection && $snapshot->has($name) && !$snapshot->isStale($name, self::STALE_INTERVALS[$name] ?? 60)) {
                $age = $snapshot->getAge($name);
                $this->line("  {$name}       SKIP  ({$age}s old, threshold " . (self::STALE_INTERVALS[$name] ?? 60) . "s)");
                $skipped++;
                continue;
            }

            $elapsed = microtime(true);
            try {
                $data = $collector();
                if (!empty($data)) {
                    $snapshot->put($name, $data);
                    $ms = round((microtime(true) - $elapsed) * 1000);
                    $this->line("  {$name}       OK  ({$ms}ms)");
                    $built++;
                } else {
                    $this->warn("  {$name}       EMPTY (kept previous data)");
                    $failed++;
                }
            } catch (\Throwable $e) {
                $this->error("  {$name}       FAILED: {$e->getMessage()}");
                $failed++;
            }
        }

        $total = round(microtime(true) - $start, 1);
        $this->info("Snapshot refreshed in {$total}s — Built: {$built} | Skipped: {$skipped} | Failed: {$failed}");

        return Command::SUCCESS;
    }

    private function collectHealth(): array
    {
        return [
            'cpu' => $this->getCpuUsage(),
            'ram' => $this->getRamUsage(),
            'disk' => $this->getDiskUsage(),
            'networkUp' => 0,
            'networkDown' => 0,
            'uptime' => $this->getUptime(),
            'backendStatus' => 'Online',
            'databaseStatus' => $this->getDbStatus(),
            'serverTime' => now()->toIso8601String(),
            'phpVersion' => phpversion(),
            'laravelVersion' => app()->version(),
            'os' => PHP_OS,
        ];
    }

    private function collectPerformance(): array
    {
        $cpu = $this->getCpuUsage();
        $ram = $this->getRamUsage();
        $disk = $this->getDiskUsage();

        $score = 100;
        if ($cpu > 80) $score -= 25;
        elseif ($cpu > 60) $score -= 15;
        elseif ($cpu > 40) $score -= 5;

        if ($ram['usedPercent'] > 85) $score -= 25;
        elseif ($ram['usedPercent'] > 70) $score -= 10;

        if ($disk['usedPercent'] > 90) $score -= 15;
        elseif ($disk['usedPercent'] > 75) $score -= 5;

        $score = max(0, min(100, $score));

        $health = 'Excellent';
        if ($score < 50) $health = 'Critical';
        elseif ($score < 70) $health = 'Fair';
        elseif ($score < 85) $health = 'Good';

        return [
            'cpu' => $cpu,
            'ram' => $ram,
            'disk' => $disk,
            'performanceScore' => $score,
            'performanceHealth' => $health,
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function collectProcesses(): array
    {
        $raw = [];
        exec('wmic process get Name,WorkingSetSize,ProcessId,ThreadCount /FORMAT:CSV 2>&1', $raw);

        $header = null;
        $processes = [];
        foreach ($raw as $line) {
            $line = trim($line);
            if ($line === '') continue;
            if (str_starts_with($line, 'Node')) {
                $parts = str_getcsv($line);
                $header = array_map('strtolower', array_slice($parts, 1));
                continue;
            }
            if ($header === null) continue;
            $parts = str_getcsv($line);
            if (count($parts) < 2) continue;
            $values = array_slice($parts, 1);
            if (count($values) < count($header)) continue;

            $map = array_combine($header, $values);
            $name = $map['name'] ?? '';
            $pid = (int) ($map['processid'] ?? 0);
            $workingSet = (int) ($map['workingsetsize'] ?? 0);
            $threads = (int) ($map['threadcount'] ?? 0);

            if ($pid === 0 || $workingSet === 0) {
                continue;
            }

            $processes[] = [
                'name' => $name,
                'pid' => $pid,
                'ramMB' => round($workingSet / 1048576, 1),
                'threads' => $threads,
            ];
        }

        usort($processes, fn($a, $b) => $b['ramMB'] <=> $a['ramMB']);
        $top = array_slice($processes, 0, 20);

        // Real per-process CPU (share of total CPU capacity, best-effort).
        // Win32_PerfFormattedData_PerfProc_Process reports per-core percentages
        // (can exceed 100); normalizing against the "_Total" instance yields
        // each process's % of overall CPU. Falls back to null when unavailable.
        $cpuByPid = [];
        $totalPct = 0.0;
        $cpuOut = $this->execWithTimeout('wmic path Win32_PerfFormattedData_PerfProc_Process get Name,PercentProcessorTime,IDProcess /FORMAT:CSV 2>&1', 6000);
        $cpuHeader = null;
        foreach ($cpuOut as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (str_starts_with($line, 'Node')) {
                $parts = str_getcsv($line);
                $cpuHeader = array_map('strtolower', array_slice($parts, 1));
                continue;
            }
            if ($cpuHeader === null) {
                continue;
            }
            $parts = str_getcsv($line);
            if (count($parts) < 2) {
                continue;
            }
            $values = array_slice($parts, 1);
            if (count($values) < count($cpuHeader)) {
                continue;
            }
            $map = array_combine($cpuHeader, $values);
            $cpuName = strtolower((string) ($map['name'] ?? ''));
            $cpuPid = (int) ($map['idprocess'] ?? 0);
            $cpuPct = (float) ($map['percentprocessortime'] ?? 0);
            if ($cpuName === '_total') {
                $totalPct = $cpuPct;
                continue;
            }
            if ($cpuPid > 0) {
                $cpuByPid[$cpuPid] = $cpuPct;
            }
        }

        $totalRamMb = 0;
        $raw2 = [];
        exec('wmic OS get TotalVisibleMemorySize /value 2>&1', $raw2);
        foreach ($raw2 as $line) {
            if (str_starts_with(trim($line), 'TotalVisibleMemorySize=')) {
                $totalRamMb = round((int) explode('=', $line)[1] / 1024);
                break;
            }
        }

        foreach ($top as &$proc) {
            $proc['status'] = 'Running';
            $proc['impact'] = $proc['ramMB'] > 500 ? 'High' : ($proc['ramMB'] > 100 ? 'Medium' : 'Low');
            if (isset($cpuByPid[$proc['pid']]) && $totalPct > 0) {
                $proc['cpuPercent'] = round(min(100, ($cpuByPid[$proc['pid']] / $totalPct) * 100), 1);
            } else {
                $proc['cpuPercent'] = null;
            }
        }
        unset($proc);

        return [
            'processes' => $top,
            'totalProcesses' => count($processes),
            'totalRamMB' => $totalRamMb,
        ];
    }

    private function collectDrives(): array
    {
        $output = $this->execWithTimeout('wmic logicaldisk get DeviceID,FileSystem,FreeSpace,Size,VolumeName,DriveType /FORMAT:CSV 2>&1', 8000);

        $drives = [];
        foreach ($output as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, 'Node')) {
                continue;
            }
            $parts = str_getcsv($line);
            if (count($parts) >= 6) {
                $deviceId = trim($parts[1] ?? '');
                $driveType = (int) ($parts[2] ?? 0);
                $fs = trim($parts[3] ?? '');
                $freeSpace = (int) ($parts[4] ?? 0);
                $size = (int) ($parts[5] ?? 0);
                $volumeName = trim($parts[6] ?? '');

                if ($deviceId === '' || ($driveType !== 3 && $driveType !== 2)) {
                    continue;
                }
                if ($size <= 0) {
                    continue;
                }

                $used = $size - $freeSpace;
                $usedPercent = round(($used / $size) * 100, 1);
                $freePercent = round(($freeSpace / $size) * 100, 1);

                $health = 'Excellent';
                if ($freePercent < 5) $health = 'Critical';
                elseif ($freePercent < 15) $health = 'Warning';
                elseif ($freePercent < 30) $health = 'Good';

                $drives[] = [
                    'deviceId' => $deviceId,
                    'volumeName' => $volumeName ?: ($deviceId === 'C:' ? 'System Drive' : $deviceId),
                    'fileSystem' => $fs ?: 'Unknown',
                    'totalBytes' => $size,
                    'freeBytes' => $freeSpace,
                    'usedBytes' => $used,
                    'totalGB' => round($size / 1073741824, 2),
                    'freeGB' => round($freeSpace / 1073741824, 2),
                    'usedGB' => round($used / 1073741824, 2),
                    'usedPercent' => $usedPercent,
                    'health' => $health,
                    'driveType' => $driveType === 3 ? 'Local Disk' : ($driveType === 2 ? 'Removable' : 'Other'),
                    'isSystem' => $deviceId === 'C:',
                    'readWrite' => true,
                    'mounted' => true,
                ];
            }
        }

        usort($drives, function ($a, $b) {
            if ($a['isSystem'] && !$b['isSystem']) return -1;
            if (!$a['isSystem'] && $b['isSystem']) return 1;
            return $b['totalBytes'] <=> $a['totalBytes'];
        });

        return [
            'drives' => $drives,
            'totalDrives' => count($drives),
        ];
    }

    private function collectNetwork(): array
    {
        $start = microtime(true);

        $output = $this->execWithTimeout('ipconfig /ALL 2>&1', 15000);

        $adapters = [];
        $currentAdapter = null;

        foreach ($output as $line) {
            $line = trim($line);
            if (preg_match('/^(.+?)\s+adapter\s+(.+?):$/i', $line, $m)) {
                if ($currentAdapter) {
                    $adapters[] = $currentAdapter;
                }
                $currentAdapter = [
                    'name' => trim($m[1] . ' ' . $m[2]),
                    'status' => 'Disconnected',
                    'ipv4' => '',
                    'ipv6' => '',
                    'subnet' => '',
                    'gateway' => '',
                    'dns' => '',
                    'mac' => '',
                    'dhcp' => false,
                    'description' => '',
                ];
            } elseif ($currentAdapter) {
                if (str_contains($line, 'Media disconnected')) {
                    $currentAdapter['status'] = 'Disconnected';
                } elseif (str_contains($line, 'IPv4 Address')) {
                    $currentAdapter['ipv4'] = trim(explode(':', $line, 2)[1] ?? '');
                    $currentAdapter['ipv4'] = preg_replace('/\(.*\)/', '', $currentAdapter['ipv4']);
                    $currentAdapter['ipv4'] = trim($currentAdapter['ipv4']);
                    $currentAdapter['status'] = 'Connected';
                } elseif (str_contains($line, 'IPv6 Address') || str_contains($line, 'Link-local IPv6')) {
                    $val = trim(explode(':', $line, 2)[1] ?? '');
                    $val = preg_replace('/\(.*\)/', '', $val);
                    $val = trim($val);
                    if (!empty($val)) {
                        $currentAdapter['ipv6'] = $val;
                        $currentAdapter['status'] = 'Connected';
                    }
                } elseif (str_contains($line, 'Subnet Mask')) {
                    $currentAdapter['subnet'] = trim(explode(':', $line, 2)[1] ?? '');
                } elseif (str_contains($line, 'Default Gateway')) {
                    $val = trim(explode(':', $line, 2)[1] ?? '');
                    $val = preg_replace('/\(.*\)/', '', $val);
                    $currentAdapter['gateway'] = trim($val);
                } elseif (str_contains($line, 'DNS Servers') || str_contains($line, 'DNS Suffix')) {
                    $val = trim(explode(':', $line, 2)[1] ?? '');
                    $currentAdapter['dns'] = $val;
                } elseif (str_contains($line, 'Physical Address')) {
                    $currentAdapter['mac'] = trim(explode(':', $line, 2)[1] ?? '');
                } elseif (str_contains($line, 'DHCP Enabled')) {
                    $currentAdapter['dhcp'] = str_contains($line, 'Yes');
                } elseif (str_contains($line, 'Description')) {
                    $currentAdapter['description'] = trim(explode(':', $line, 2)[1] ?? '');
                }
            }
        }
        if ($currentAdapter) {
            $adapters[] = $currentAdapter;
        }

        $activeAdapter = null;
        foreach ($adapters as $a) {
            if ($a['status'] === 'Connected' && !empty($a['ipv4']) && !empty($a['gateway'])) {
                $activeAdapter = $a;
                break;
            }
        }
        if (!$activeAdapter) {
            foreach ($adapters as $a) {
                if ($a['status'] === 'Connected' && !empty($a['ipv4'])) {
                    $activeAdapter = $a;
                    break;
                }
            }
        }

        $latency = $this->measureLatency('8.8.8.8');
        $dnsLatency = $this->measureLatency('google.com');
        $netStats = $this->getNetStats();

        $quality = 'Excellent';
        if ($latency > 100) $quality = 'Poor';
        elseif ($latency > 60) $quality = 'Fair';
        elseif ($latency > 30) $quality = 'Good';

        $elapsed = round((microtime(true) - $start) * 1000);

        return [
            'adapters' => $adapters,
            'activeAdapter' => $activeAdapter,
            'latency' => $latency,
            'dnsLatency' => $dnsLatency,
            'netStats' => $netStats,
            'connectionQuality' => $quality,
            'gateway' => $activeAdapter['gateway'] ?? '',
            'dns' => $activeAdapter['dns'] ?? '',
            'internetReachable' => $latency > 0,
            'collectionDurationMs' => $elapsed,
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function collectFileStats(): array
    {
        $start = microtime(true);
        $profilePath = env('USERPROFILE', 'C:\\Users\\CORE');

        $dirOut = $this->execWithTimeout('dir /AD /B "' . $profilePath . '" 2>NUL', 5000);
        $totalFolders = count($dirOut);

        $fileOut = $this->execWithTimeout('dir /A-D /B "' . $profilePath . '\\Desktop" 2>NUL', 5000);
        $totalFiles = count($fileOut);

        $totalSize = 0;
        foreach ($fileOut as $f) {
            $fullPath = $profilePath . '\\Desktop\\' . $f;
            if (is_file($fullPath)) {
                $totalSize += @filesize($fullPath);
            }
        }

        $elapsed = round((microtime(true) - $start) * 1000);

        return [
            'totalFiles' => $totalFiles,
            'totalFolders' => $totalFolders,
            'totalSizeGB' => round($totalSize / 1073741824, 2),
            'averageFileSizeMB' => $totalFiles > 0 ? round(($totalSize / $totalFiles) / 1048576, 2) : 0,
            'scanDurationMs' => $elapsed,
            'scannedPath' => $profilePath,
        ];
    }

    private function collectHardware(): array
    {
        $start = microtime(true);

        $cpu = $this->getWmicRow('cpu', 'Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,CurrentClockSpeed');
        $allGpus = $this->getWmicAll('path win32_videocontroller', 'Name,DriverVersion,DriverDate,AdapterRAM,Status');
        $gpu = $allGpus[0] ?? [];
        $bios = $this->getWmicRow('bios', 'Manufacturer,SMBIOSBIOSVersion,ReleaseDate');
        $mb = $this->getWmicRow('baseboard', 'Manufacturer,Product,SerialNumber');
        $os = $this->getWmicRow('os', 'Caption,BuildNumber,OSArchitecture,Version');
        $allStorage = $this->getWmicAll('diskdrive', 'Model,Manufacturer,Size,InterfaceType,Status');
        $storage = $allStorage[0] ?? [];
        $ramSticks = $this->getWmicAll('memorychip', 'Capacity,Speed,Manufacturer,DeviceLocator,MemoryType');
        $nic = [];
        $nicOut = $this->execWithTimeout('powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq \'Up\' -or $_.PhysicalMediaType -ne $null} | Select-Object Name,DriverDescription,DriverVersion,Manufacturer | Format-List" 2>&1', 8000);
        $nicFields = ['name' => '', 'manufacturer' => '', 'driverVersion' => '', 'description' => ''];
        foreach ($nicOut as $line) {
            $line = trim($line);
            if (preg_match('/^Name\s*:\s*(.+)$/i', $line, $m)) {
                $nicFields['name'] = trim($m[1]);
            } elseif (preg_match('/^DriverDescription\s*:\s*(.+)$/i', $line, $m)) {
                $nicFields['description'] = trim($m[1]);
            } elseif (preg_match('/^Manufacturer\s*:\s*(.+)$/i', $line, $m)) {
                $nicFields['manufacturer'] = trim($m[1]);
            } elseif (preg_match('/^DriverVersion\s*:\s*(.+)$/i', $line, $m)) {
                $nicFields['driverVersion'] = trim($m[1]);
            }
        }
        if (!empty($nicFields['name'])) {
            $nic = [
                'Name' => $nicFields['description'] ?: $nicFields['name'],
                'Manufacturer' => $nicFields['manufacturer'] ?: 'Unknown',
                'DriverVersion' => $nicFields['driverVersion'] ?: 'Unknown',
            ];
        }
        if (empty($nic['Name']) || $nic['Name'] === '') {
            $nic = $this->getWmicRow('nic where "PhysicalAdapter=True"', 'Name,Manufacturer,DriverVersion,Speed');
        }

        $sysOut = $this->execWithTimeout('systeminfo | findstr /C:"System Manufacturer" /C:"System Model" /C:"Total Physical Memory" 2>&1', 15000);
        $sysInfo = ['manufacturer' => '', 'model' => '', 'totalRam' => ''];
        foreach ($sysOut as $line) {
            if (str_contains($line, 'System Manufacturer')) $sysInfo['manufacturer'] = trim(explode(':', $line, 2)[1] ?? '');
            elseif (str_contains($line, 'System Model')) $sysInfo['model'] = trim(explode(':', $line, 2)[1] ?? '');
            elseif (str_contains($line, 'Total Physical Memory')) $sysInfo['totalRam'] = trim(explode(':', $line, 2)[1] ?? '');
        }

        $totalRamGB = 0;
        $ramDetails = [];
        foreach ($ramSticks as $stick) {
            $capBytes = (int) ($stick['Capacity'] ?? 0);
            $capGB = round($capBytes / 1073741824, 1);
            $totalRamGB += $capGB;
            $memTypes = ['Unknown','Other','DRAM','EDO','Synchronous','CMOS','RAM','ROM','Flash','EEPROM','VRAM','SRAM','RAMBUS','SIMM','DIMM','PGM','RLDRAM','DDR','DDR2','DDR3','FB-DIMM','DDR4','LPDDR','HBM'];
            $typeIdx = (int) ($stick['MemoryType'] ?? 0);
            $ramDetails[] = [
                'capacityGB' => $capGB,
                'speedMHz' => (int) ($stick['Speed'] ?? 0),
                'manufacturer' => $stick['Manufacturer'] ?? 'Unknown',
                'slot' => $stick['DeviceLocator'] ?? '',
                'type' => $memTypes[$typeIdx] ?? 'Unknown',
            ];
        }

        $allGpuData = [];
        foreach ($allGpus as $g) {
            $vramGB = !empty($g['AdapterRAM']) ? round((int) $g['AdapterRAM'] / 1073741824, 1) : 0;
            $driverDate = '';
            if (!empty($g['DriverDate'])) {
                $raw = substr($g['DriverDate'], 0, 8);
                if (strlen($raw) === 8) {
                    $driverDate = substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2);
                }
            }
            $allGpuData[] = [
                'name' => $g['Name'] ?? 'Unknown',
                'vramMB' => $vramGB * 1024,
                'driverVersion' => $g['DriverVersion'] ?? 'Unknown',
                'driverDate' => $driverDate,
                'status' => $g['Status'] ?? 'Unknown',
            ];
        }

        $allStorageData = [];
        foreach ($allStorage as $s) {
            $storageGB = !empty($s['Size']) ? round((int) $s['Size'] / 1073741824, 0) : 0;
            $allStorageData[] = [
                'model' => $s['Model'] ?? 'Unknown',
                'manufacturer' => $s['Manufacturer'] ?? 'Unknown',
                'capacityGB' => $storageGB,
                'interface' => $s['InterfaceType'] ?? 'Unknown',
                'status' => $s['Status'] ?? 'Unknown',
            ];
        }

        $gpuVramGB = 0;
        if (!empty($gpu['AdapterRAM'])) {
            $gpuVramGB = round((int) $gpu['AdapterRAM'] / 1073741824, 1);
        }

        $driverDate = '';
        if (!empty($gpu['DriverDate'])) {
            $raw = substr($gpu['DriverDate'], 0, 8);
            if (strlen($raw) === 8) {
                $driverDate = substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2);
            }
        }

        $biosDate = '';
        if (!empty($bios['ReleaseDate'])) {
            $raw = substr($bios['ReleaseDate'], 0, 8);
            if (strlen($raw) === 8) {
                $biosDate = substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2);
            }
        }

        $storageGB = !empty($storage['Size']) ? round((int) $storage['Size'] / 1073741824, 0) : 0;

        $score = 100;
        if (empty($cpu['Name'])) $score -= 20;
        if (empty($gpu['Name'])) $score -= 20;
        if ($totalRamGB < 4) $score -= 10;
        if (empty($storage['Model'])) $score -= 20;

        $health = 'Excellent';
        if ($score < 50) $health = 'Critical';
        elseif ($score < 70) $health = 'Warning';
        elseif ($score < 90) $health = 'Good';

        $elapsed = round((microtime(true) - $start) * 1000);

        return [
            'cpu' => [
                'name' => $cpu['Name'] ?? 'Unknown',
                'cores' => (int) ($cpu['NumberOfCores'] ?? 0),
                'threads' => (int) ($cpu['NumberOfLogicalProcessors'] ?? 0),
                'maxClockMHz' => (int) ($cpu['MaxClockSpeed'] ?? 0),
                'currentClockMHz' => (int) ($cpu['CurrentClockSpeed'] ?? 0),
            ],
            'gpu' => [
                'name' => $gpu['Name'] ?? 'Unknown',
                'vramMB' => $gpuVramGB * 1024,
                'driverVersion' => $gpu['DriverVersion'] ?? 'Unknown',
                'driverDate' => $driverDate,
                'status' => $gpu['Status'] ?? 'Unknown',
            ],
            'bios' => [
                'manufacturer' => $bios['Manufacturer'] ?? 'Unknown',
                'version' => $bios['SMBIOSBIOSVersion'] ?? 'Unknown',
                'date' => $biosDate,
            ],
            'motherboard' => [
                'manufacturer' => $mb['Manufacturer'] ?? 'Unknown',
                'model' => $mb['Product'] ?? 'Unknown',
                'serial' => isset($mb['SerialNumber']) ? substr($mb['SerialNumber'], 0, 6) . '***' : 'N/A',
            ],
            'os' => [
                'name' => $os['Caption'] ?? 'Unknown',
                'build' => $os['BuildNumber'] ?? 'Unknown',
                'architecture' => $os['OSArchitecture'] ?? 'Unknown',
                'version' => $os['Version'] ?? 'Unknown',
            ],
            'storage' => [
                'model' => $storage['Model'] ?? 'Unknown',
                'manufacturer' => $storage['Manufacturer'] ?? 'Unknown',
                'capacityGB' => $storageGB,
                'interface' => $storage['InterfaceType'] ?? 'Unknown',
                'status' => $storage['Status'] ?? 'Unknown',
            ],
            'allGpus' => $allGpuData,
            'allStorage' => $allStorageData,
            'ram' => [
                'totalGB' => $totalRamGB,
                'sticks' => $ramDetails,
            ],
            'network' => [
                'name' => $nic['Name'] ?? 'Unknown',
                'manufacturer' => $nic['Manufacturer'] ?? 'Unknown',
                'driverVersion' => $nic['DriverVersion'] ?? 'Unknown',
            ],
            'system' => $sysInfo,
            'hardwareHealth' => $health,
            'hardwareScore' => $score,
            'scanDurationMs' => $elapsed,
            'serverTime' => now()->toIso8601String(),
        ];
    }

    private function collectSecurity(): array
    {
        $score = 100;
        $defenderEnabled = false;
        $firewallProfiles = [];
        $services = [];

        $output = $this->execWithTimeout('powershell -Command "Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled,AntivirusEnabled | Format-List" 2>&1', 10000);
        foreach ($output as $line) {
            $line = trim($line);
            if (str_contains($line, 'RealTimeProtectionEnabled') && str_contains($line, 'True')) {
                $defenderEnabled = true;
            }
            if (str_contains($line, 'AntivirusEnabled') && str_contains($line, 'True')) {
                $defenderEnabled = true;
            }
        }
        if (!$defenderEnabled) $score -= 15;

        $fwOut = $this->execWithTimeout('netsh advfirewall show allprofiles state 2>&1', 8000);
        $currentProfile = null;
        foreach ($fwOut as $line) {
            $line = trim($line);
            if (preg_match('/^(Domain|Private|Public)\s+Profile\s+Settings/i', $line, $m)) {
                $currentProfile = $m[1];
            } elseif ($currentProfile && preg_match('/^State\s+(ON|OFF)/i', $line, $m)) {
                $firewallProfiles[] = ['profile' => $currentProfile, 'state' => $m[1]];
                if ($m[1] === 'OFF') $score -= 5;
                $currentProfile = null;
            }
        }

        $svcOut = $this->execWithTimeout('sc query wuauserv 2>&1', 5000);
        foreach ($svcOut as $line) {
            if (str_contains($line, 'RUNNING')) {
                $services[] = ['name' => 'Windows Update', 'status' => 'Running'];
            } elseif (str_contains($line, 'STOPPED')) {
                $services[] = ['name' => 'Windows Update', 'status' => 'Stopped'];
                $score -= 3;
            }
        }

        $defOut = $this->execWithTimeout('sc query WinDefend 2>&1', 5000);
        foreach ($defOut as $line) {
            if (str_contains($line, 'RUNNING')) {
                $services[] = ['name' => 'Windows Defender', 'status' => 'Running'];
            } elseif (str_contains($line, 'STOPPED')) {
                $services[] = ['name' => 'Windows Defender', 'status' => 'Stopped'];
                $score -= 10;
            }
        }

        $uacOut = $this->execWithTimeout('reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA 2>&1', 5000);
        foreach ($uacOut as $line) {
            if (str_contains($line, '0x1')) {
                $services[] = ['name' => 'User Account Control', 'status' => 'Enabled'];
            } elseif (str_contains($line, '0x0')) {
                $services[] = ['name' => 'User Account Control', 'status' => 'Disabled'];
                $score -= 5;
            }
        }

        $score = max(0, min(100, $score));

        return [
            'score' => $score,
            'defenderEnabled' => $defenderEnabled,
            'firewallProfiles' => $firewallProfiles,
            'services' => $services,
            'events' => [],
            'lastScan' => now()->toIso8601String(),
        ];
    }

    // ─── System metric helpers ─────────────────────────────────────

    private function getCpuUsage(): float
    {
        // Accurate measurement: two one-second samples of the overall processor
        // counter via typeperf (no admin required). wmic loadpercentage is a
        // single instantaneous sample and is unreliable on modern Windows.
        $output = $this->execWithTimeout('typeperf "\\Processor(_Total)\\% Processor Time" -sc 2 -si 1 2>&1', 8000);

        $samples = [];
        foreach ($output as $line) {
            $line = trim($line);
            // Second CSV field is always the numeric CPU value — locale-proof
            // (the (PDH-CSV 4.0) header line is skipped since its second
            // field contains letters).
            if (preg_match('/^"([^"]*)","([0-9.]+)"$/', $line, $m)) {
                $samples[] = (float) $m[2];
            }
        }

        if (count($samples) > 0) {
            $avg = array_sum($samples) / count($samples);
            return round(max(0.0, min(100.0, $avg)), 1);
        }

        // Fallback: wmic single sample.
        $output2 = $this->execWithTimeout('wmic cpu get loadpercentage /value 2>&1', 5000);
        foreach ($output2 as $line) {
            if (str_starts_with(trim($line), 'LoadPercentage=')) {
                return round((float) explode('=', $line)[1], 1);
            }
        }
        return 0.0;
    }

    private function getRamUsage(): array
    {
        $free = 0;
        $total = 0;

        $out = $this->execWithTimeout('wmic OS get FreePhysicalMemory /value', 5000);
        foreach ($out as $line) {
            if (str_starts_with(trim($line), 'FreePhysicalMemory=')) {
                $free = (int) explode('=', $line)[1];
                break;
            }
        }

        $out2 = $this->execWithTimeout('wmic OS get TotalVisibleMemorySize /value', 5000);
        foreach ($out2 as $line) {
            if (str_starts_with(trim($line), 'TotalVisibleMemorySize=')) {
                $total = (int) explode('=', $line)[1];
                break;
            }
        }

        if ($total === 0) {
            return ['usedPercent' => 0.0, 'freeMB' => 0, 'totalMB' => 0];
        }

        $usedKb = $total - $free;
        return [
            'usedPercent' => round(($usedKb / $total) * 100, 1),
            'freeMB' => round($free / 1024),
            'totalMB' => round($total / 1024),
        ];
    }

    private function getDiskUsage(): array
    {
        $free = @disk_free_space('C:');
        $total = @disk_total_space('C:');
        if (!$total || $total === 0) {
            return ['usedPercent' => 0.0, 'freeGB' => 0, 'totalGB' => 0];
        }
        return [
            'usedPercent' => round((($total - $free) / $total) * 100, 1),
            'freeGB' => round($free / 1073741824, 2),
            'totalGB' => round($total / 1073741824, 2),
        ];
    }

    private function getUptime(): string
    {
        $output = $this->execWithTimeout('wmic OS get LastBootUpTime /value 2>&1', 5000);
        foreach ($output as $line) {
            if (str_starts_with(trim($line), 'LastBootUpTime=')) {
                $raw = explode('=', $line)[1];
                $trimmed = trim($raw);
                if (strlen($trimmed) >= 14) {
                    $bootTime = \DateTime::createFromFormat('YmdHis', substr($trimmed, 0, 14));
                    if ($bootTime) {
                        $diff = (new \DateTime())->diff($bootTime);
                        if ($diff->d > 0) return "{$diff->d}d {$diff->h}h {$diff->i}m";
                        if ($diff->h > 0) return "{$diff->h}h {$diff->i}m";
                        return "{$diff->i}m";
                    }
                }
            }
        }
        return 'Unavailable';
    }

    private function getDbStatus(): string
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            return 'Connected';
        } catch (\Exception $e) {
            return 'Disconnected';
        }
    }

    private function measureLatency(string $host): int
    {
        $output = $this->execWithTimeout("ping -n 1 $host 2>&1", 5000);
        foreach ($output as $line) {
            if (preg_match('/time[=<](\d+)ms/i', $line, $m)) {
                return (int) $m[1];
            }
        }
        return -1;
    }

    private function getNetStats(): array
    {
        $output = $this->execWithTimeout('netstat -e 2>&1', 5000);
        $stats = ['bytesReceived' => 0, 'bytesSent' => 0, 'packetsReceived' => 0, 'packetsSent' => 0, 'errors' => 0];
        foreach ($output as $line) {
            $line = trim($line);
            if (preg_match('/^Bytes\s+([\d,]+)\s+([\d,]+)$/i', $line, $m)) {
                $stats['bytesReceived'] = (int) str_replace(',', '', $m[1]);
                $stats['bytesSent'] = (int) str_replace(',', '', $m[2]);
            } elseif (preg_match('/^Unicast packets\s+([\d,]+)\s+([\d,]+)$/i', $line, $m)) {
                $stats['packetsReceived'] = (int) str_replace(',', '', $m[1]);
                $stats['packetsSent'] = (int) str_replace(',', '', $m[2]);
            } elseif (preg_match('/^Errors\s+([\d,]+)\s+([\d,]+)$/i', $line, $m)) {
                $stats['errors'] = (int) str_replace(',', '', $m[1]) + (int) str_replace(',', '', $m[2]);
            }
        }
        return $stats;
    }

    private function getWmicRow(string $class, string $fields): array
    {
        $output = $this->execWithTimeout("wmic $class get $fields /FORMAT:CSV 2>&1", 8000);
        $header = null;
        $values = null;
        foreach ($output as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, 'Node')) {
                if ($header === null && str_starts_with($line, 'Node')) {
                    $parts = str_getcsv($line);
                    $header = array_slice($parts, 1);
                }
                continue;
            }
            $parts = str_getcsv($line);
            $values = array_slice($parts, 1);
            break;
        }
        if ($header && $values) {
            return array_combine($header, $values);
        }
        return [];
    }

    private function getWmicAll(string $class, string $fields): array
    {
        $output = $this->execWithTimeout("wmic $class get $fields /FORMAT:CSV 2>&1", 8000);
        $header = null;
        $rows = [];
        foreach ($output as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, 'Node')) {
                if ($header === null && str_starts_with($line, 'Node')) {
                    $parts = str_getcsv($line);
                    $header = array_slice($parts, 1);
                }
                continue;
            }
            $parts = str_getcsv($line);
            $values = array_slice($parts, 1);
            if ($header && count($values) === count($header)) {
                $rows[] = array_combine($header, $values);
            }
        }
        return $rows;
    }

    protected function execWithTimeout(string $command, int $timeoutMs = 5000): array
    {
        $output = [];
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $process = @proc_open($command, $descriptors, $pipes);
        if (is_resource($process)) {
            fclose($pipes[0]);
            $start = microtime(true);
            while (true) {
                $status = proc_get_status($process);
                if (!$status['running']) break;
                if ((microtime(true) - $start) * 1000 > $timeoutMs) {
                    $output = explode("\n", stream_get_contents($pipes[1]));
                    proc_terminate($process, 9);
                    proc_close($process);
                    return $output;
                }
                usleep(100000);
            }
            $output = explode("\n", stream_get_contents($pipes[1]));
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($process);
        }
        return $output;
    }
}
