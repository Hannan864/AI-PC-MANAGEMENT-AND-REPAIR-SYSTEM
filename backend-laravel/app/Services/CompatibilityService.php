<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service: CompatibilityService
 *
 * Server-side PC component compatibility validation engine.
 * Validates CPU+motherboard socket, RAM type/capacity, PSU wattage,
 * chassis sizing and GPU clearance, and computes a performance score (0-100)
 * with issue/bottleneck arrays.
 *
 * Spec database is aligned 1:1 with the frontend component catalog
 * (frontend/services/pcComponents.ts) so the server-side verification
 * matches what the customer sees in the PC Build Planner.
 */
class CompatibilityService
{
    /**
     * CPU specifications. Keys are the exact model strings stored in pc_builds.
     */
    private const CPU_SPECS = [
        // AMD — AM5
        'AMD Ryzen 7 7800X3D' => ['socket' => 'AM5', 'tdp' => 120, 'tier' => 'high', 'cores' => 8],
        'AMD Ryzen 5 7600X'   => ['socket' => 'AM5', 'tdp' => 105, 'tier' => 'mid',  'cores' => 6],
        // AMD — AM4
        'AMD Ryzen 7 5800X3D' => ['socket' => 'AM4', 'tdp' => 105, 'tier' => 'high', 'cores' => 8],
        'AMD Ryzen 5 5600X'   => ['socket' => 'AM4', 'tdp' => 65,  'tier' => 'mid',  'cores' => 6],
        // Intel — LGA 1700
        'Intel Core i9-14900K' => ['socket' => 'LGA1700', 'tdp' => 253, 'tier' => 'ultra', 'cores' => 24],
        'Intel Core i7-14700K' => ['socket' => 'LGA1700', 'tdp' => 253, 'tier' => 'high',  'cores' => 20],
        'Intel Core i5-13600K' => ['socket' => 'LGA1700', 'tdp' => 181, 'tier' => 'mid',   'cores' => 14],
    ];

    /**
     * Motherboard specifications (socket, memory type, form factor).
     */
    private const MOTHERBOARD_SPECS = [
        'ASUS ROG Crosshair X670E'     => ['socket' => 'AM5',     'chipset' => 'X670E', 'maxRam' => 128, 'ramType' => 'DDR5', 'formFactor' => 'ATX'],
        'MSI MAG B650 Tomahawk'        => ['socket' => 'AM5',     'chipset' => 'B650',  'maxRam' => 128, 'ramType' => 'DDR5', 'formFactor' => 'ATX'],
        'Gigabyte X570 AORUS MASTER'   => ['socket' => 'AM4',     'chipset' => 'X570',  'maxRam' => 128, 'ramType' => 'DDR4', 'formFactor' => 'ATX'],
        'ASUS ROG Strix B550-F'        => ['socket' => 'AM4',     'chipset' => 'B550',  'maxRam' => 128, 'ramType' => 'DDR4', 'formFactor' => 'ATX'],
        'MSI MPG Z790 Carbon'          => ['socket' => 'LGA1700', 'chipset' => 'Z790',  'maxRam' => 192, 'ramType' => 'DDR5', 'formFactor' => 'ATX'],
        'ASUS TUF Gaming B760M-PLUS'   => ['socket' => 'LGA1700', 'chipset' => 'B760',  'maxRam' => 128, 'ramType' => 'DDR4', 'formFactor' => 'mATX'],
    ];

    /**
     * RAM kit specifications.
     */
    private const RAM_SPECS = [
        'G.Skill Trident Z5 32GB (2x16GB) 6000MHz'  => ['type' => 'DDR5', 'capacityGB' => 32, 'speedMHz' => 6000],
        'Corsair Dominator 64GB (2x32GB) 6400MHz'   => ['type' => 'DDR5', 'capacityGB' => 64, 'speedMHz' => 6400],
        'Corsair Vengeance LPX 16GB (2x8GB) 3200MHz' => ['type' => 'DDR4', 'capacityGB' => 16, 'speedMHz' => 3200],
        'G.Skill Ripjaws V 32GB (2x16GB) 3600MHz'   => ['type' => 'DDR4', 'capacityGB' => 32, 'speedMHz' => 3600],
    ];

    /**
     * Power supply specifications.
     */
    private const PSU_SPECS = [
        'Corsair RM1000x 1000W 80+ Gold'  => ['wattage' => 1000, 'efficiency' => 'gold'],
        'EVGA SuperNOVA 850 G6 850W'      => ['wattage' => 850,  'efficiency' => 'gold'],
        'Seasonic Focus GX-750 750W'      => ['wattage' => 750,  'efficiency' => 'gold'],
        'Corsair RM650x 650W'             => ['wattage' => 650,  'efficiency' => 'gold'],
        'Thermaltake Smart 500W'          => ['wattage' => 500,  'efficiency' => 'white'],
    ];

    /**
     * Chassis specifications (form factor + maximum GPU length in mm).
     */
    private const CASE_SPECS = [
        'NZXT H9 Flow Mid-Tower ATX'   => ['formFactor' => 'ATX',  'maxGpuLength' => 435],
        'Corsair 4000D Airflow ATX'    => ['formFactor' => 'ATX',  'maxGpuLength' => 360],
        'Lian Li O11 Dynamic EVO ATX'  => ['formFactor' => 'ATX',  'maxGpuLength' => 426],
        'Deepcool CH370 Micro-ATX'     => ['formFactor' => 'mATX', 'maxGpuLength' => 320],
        'ASUS Prime AP201 Micro-ATX'   => ['formFactor' => 'mATX', 'maxGpuLength' => 338],
    ];

    /**
     * GPU specifications — power draw (W), physical length (mm), tier and the
     * recommended minimum PSU wattage (mirrors the frontend catalog).
     */
    private const GPU_SPECS = [
        'NVIDIA RTX 4090'            => ['power' => 450, 'length' => 340, 'tier' => 'high', 'minPower' => 850],
        'NVIDIA RTX 4080 Super'      => ['power' => 320, 'length' => 310, 'tier' => 'high', 'minPower' => 750],
        'NVIDIA RTX 4070 Super'      => ['power' => 220, 'length' => 267, 'tier' => 'mid',  'minPower' => 650],
        'NVIDIA RTX 4060'            => ['power' => 115, 'length' => 240, 'tier' => 'low',  'minPower' => 500],
        'AMD Radeon RX 7900 XTX'     => ['power' => 355, 'length' => 320, 'tier' => 'high', 'minPower' => 800],
        'AMD Radeon RX 7800 XT'      => ['power' => 263, 'length' => 280, 'tier' => 'mid',  'minPower' => 700],
        'AMD Radeon RX 7600 XT'      => ['power' => 190, 'length' => 250, 'tier' => 'low',  'minPower' => 500],
    ];

    /**
     * CPU tier vs GPU tier bottleneck matrix.
     */
    private const BOTTLENECK_MATRIX = [
        'entry' => ['minGpuTierForWarning' => 'high', 'message' => 'CPU (%s) may bottleneck %s in CPU-intensive workloads.'],
        'mid'   => ['minGpuTierForWarning' => 'high', 'message' => 'GPU (%s) outpaces CPU (%s) — expect a processor bottleneck in CPU-heavy tasks.'],
        'ultra' => ['maxGpuTierForWarning' => 'low',  'message' => 'GPU (%s) is significantly underpowered for %s. Consider upgrading the GPU.'],
    ];

    /**
     * Run the full compatibility analysis on a PC build configuration.
     *
     * @return array{
     *     compatibility_status: string,
     *     performance_score: int,
     *     issues: array<int, string>,
     *     bottlenecks: array<int, string>,
     * }
     */
    public function analyze(array $components): array
    {
        $issues = [];
        $bottlenecks = [];

        $cpuSpecs = self::CPU_SPECS[$components['cpu']] ?? null;
        $mbSpecs  = self::MOTHERBOARD_SPECS[$components['motherboard']] ?? null;
        $ramSpecs = self::RAM_SPECS[$components['ram']] ?? null;
        $psuSpecs = self::PSU_SPECS[$components['power_supply']] ?? null;
        $caseSpecs = ! empty($components['chassis']) ? (self::CASE_SPECS[$components['chassis']] ?? null) : null;
        $gpuSpecs = self::GPU_SPECS[$components['gpu']] ?? null;

        // --- Critical compatibility checks (issues) ---

        // 1. Unknown component detection
        if ($cpuSpecs === null) {
            $issues[] = 'CPU model not recognized in compatibility database.';
        }
        if ($mbSpecs === null) {
            $issues[] = 'Motherboard model not recognized in compatibility database.';
        }
        if ($ramSpecs === null) {
            $issues[] = 'RAM kit not recognized in compatibility database.';
        }
        if ($psuSpecs === null) {
            $issues[] = 'Power supply model not recognized in compatibility database.';
        }
        if ($gpuSpecs === null) {
            $issues[] = 'GPU model not recognized in compatibility database.';
        }

        // 2. CPU ↔ Motherboard socket match
        if ($cpuSpecs !== null && $mbSpecs !== null && $cpuSpecs['socket'] !== $mbSpecs['socket']) {
            $issues[] = sprintf(
                'CPU socket mismatch: %s requires %s but motherboard uses %s.',
                $components['cpu'],
                $cpuSpecs['socket'],
                $mbSpecs['socket'],
            );
        }

        // 3. RAM type ↔ Motherboard compatibility
        if ($ramSpecs !== null && $mbSpecs !== null) {
            if ($ramSpecs['type'] !== $mbSpecs['ramType']) {
                $issues[] = sprintf(
                    'RAM standard mismatch: %s uses %s but motherboard requires %s.',
                    $components['ram'],
                    $ramSpecs['type'],
                    $mbSpecs['ramType'],
                );
            }
            if ($ramSpecs['capacityGB'] > $mbSpecs['maxRam']) {
                $issues[] = sprintf(
                    'RAM capacity (%dGB) exceeds motherboard maximum (%dGB).',
                    $ramSpecs['capacityGB'],
                    $mbSpecs['maxRam'],
                );
            }
        }

        // 4. Chassis sizing — ATX board inside mATX case
        if ($mbSpecs !== null && $caseSpecs !== null && $mbSpecs['formFactor'] === 'ATX' && $caseSpecs['formFactor'] === 'mATX') {
            $issues[] = sprintf(
                'Chassis sizing collision: motherboard [%s] is ATX and will not fit inside mATX case [%s].',
                $components['motherboard'],
                $components['chassis'],
            );
        }

        // 5. GPU clearance inside chassis
        if ($gpuSpecs !== null && $caseSpecs !== null && $gpuSpecs['length'] > $caseSpecs['maxGpuLength']) {
            $issues[] = sprintf(
                'GPU clearance collision: [%s] is %dmm long but chassis [%s] allows only %dmm.',
                $components['gpu'],
                $gpuSpecs['length'],
                $components['chassis'],
                $caseSpecs['maxGpuLength'],
            );
        }

        // 6. PSU wattage sufficiency (mirrors frontend pcBuilder logic)
        if ($gpuSpecs !== null && $psuSpecs !== null && $psuSpecs['wattage'] < $gpuSpecs['minPower']) {
            $issues[] = sprintf(
                'Underpowered PSU for GPU: Selected GPU [%s] demands a minimum power supply of [%dW]. Your selected PSU is only [%dW].',
                $components['gpu'],
                $gpuSpecs['minPower'],
                $psuSpecs['wattage'],
            );
        }

        if ($cpuSpecs !== null && $psuSpecs !== null && $gpuSpecs !== null) {
            $systemDraw = $cpuSpecs['tdp'] + $gpuSpecs['power'] + 60; // 60W for mobo/RAM/storage/fans
            $headroom   = $psuSpecs['wattage'] - $systemDraw;

            if ($headroom < 0) {
                $issues[] = sprintf(
                    'Total Watts Power Draw Overload: Estimated peaks [%dW] exceed PSU ceiling limit [%dW].',
                    $systemDraw,
                    $psuSpecs['wattage'],
                );
            } elseif ($headroom < 100) {
                $bottlenecks[] = sprintf(
                    'Critical PSU Margin Warning: Margin is tighter than 100W under maximum diagnostic loads (%dW headroom).',
                    $headroom,
                );
            }
        }

        // --- Performance bottlenecks (data-driven via BOTTLENECK_MATRIX + GPU tier) ---
        if ($cpuSpecs !== null && $gpuSpecs !== null) {
            $gpuTier = $gpuSpecs['tier'];

            foreach (self::BOTTLENECK_MATRIX as $cpuTier => $rule) {
                if ($cpuSpecs['tier'] !== $cpuTier) {
                    continue;
                }

                if (isset($rule['minGpuTierForWarning'])) {
                    $tierOrder = ['low' => 0, 'mid' => 1, 'high' => 2];
                    $minTier = $tierOrder[$rule['minGpuTierForWarning']] ?? 0;
                    if (($tierOrder[$gpuTier] ?? 0) >= $minTier) {
                        $bottlenecks[] = sprintf($rule['message'], $components['cpu'], $components['gpu']);
                    }
                }

                if (isset($rule['maxGpuTierForWarning'])) {
                    $tierOrder = ['low' => 0, 'mid' => 1, 'high' => 2];
                    $maxTier = $tierOrder[$rule['maxGpuTierForWarning']] ?? 0;
                    if (($tierOrder[$gpuTier] ?? 0) <= $maxTier) {
                        $bottlenecks[] = sprintf($rule['message'], $components['gpu'], $components['cpu']);
                    }
                }
            }
        }

        // RAM capacity bottleneck
        if ($ramSpecs !== null && $ramSpecs['capacityGB'] < 16) {
            $bottlenecks[] = '16GB RAM recommended for modern gaming and productivity workloads.';
        }

        // --- Performance score calculation ---
        $score = 80; // baseline

        // CPU tier contribution
        $score += match ($cpuSpecs['tier'] ?? 'entry') {
            'ultra' => 15,
            'high'  => 10,
            'mid'   => 5,
            default => 0,
        };

        // GPU tier contribution
        $score += match ($gpuSpecs['tier'] ?? 'low') {
            'high' => 10,
            'mid'  => 5,
            default => 0,
        };

        // Deductions for issues
        $score -= count($issues) * 15;

        // Deductions for bottlenecks
        $score -= count($bottlenecks) * 5;

        // RAM bonus
        if ($ramSpecs !== null && $ramSpecs['capacityGB'] >= 32) {
            $score += 5;
        }

        $score = max(0, min(100, $score));

        // --- Determine status ---
        $status = 'pass';
        if (count($issues) > 0) {
            $status = 'fail';
        } elseif (count($bottlenecks) > 0) {
            $status = 'warning';
        }

        return [
            'compatibility_status' => $status,
            'performance_score'    => $score,
            'issues'               => $issues,
            'bottlenecks'          => $bottlenecks,
        ];
    }
}
