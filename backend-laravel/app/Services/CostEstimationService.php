<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service: CostEstimationService
 *
 * Provides component-level price estimation in USD and PKR
 * for PC build configurations.
 *
 * Pricing is derived from the frontend component catalog
 * (frontend/services/pcComponents.ts) so the server-side estimate
 * matches the customer's planner at roughly a 1:278 USD→PKR rate.
 */
class CostEstimationService
{
    private const PKR_RATE = 278.0; // USD to PKR conversion rate

    /**
     * Component pricing in USD (converted from the PKR catalog).
     */
    private const PRICES_USD = [
        // CPUs
        'AMD Ryzen 7 7800X3D'   => 402,
        'AMD Ryzen 5 7600X'     => 301,
        'AMD Ryzen 7 5800X3D'   => 352,
        'AMD Ryzen 5 5600X'     => 200,
        'Intel Core i9-14900K'  => 553,
        'Intel Core i7-14700K'  => 402,
        'Intel Core i5-13600K'  => 301,

        // GPUs
        'NVIDIA RTX 4090'          => 1611,
        'NVIDIA RTX 4080 Super'    => 1006,
        'NVIDIA RTX 4070 Super'    => 603,
        'NVIDIA RTX 4060'          => 301,
        'AMD Radeon RX 7900 XTX'   => 1006,
        'AMD Radeon RX 7800 XT'    => 503,
        'AMD Radeon RX 7600 XT'    => 331,

        // Motherboards
        'ASUS ROG Crosshair X670E'   => 503,
        'MSI MAG B650 Tomahawk'      => 200,
        'Gigabyte X570 AORUS MASTER' => 301,
        'ASUS ROG Strix B550-F'      => 150,
        'MSI MPG Z790 Carbon'        => 352,
        'ASUS TUF Gaming B760M-PLUS' => 160,

        // RAM
        'G.Skill Trident Z5 32GB (2x16GB) 6000MHz' => 121,
        'Corsair Dominator 64GB (2x32GB) 6400MHz'  => 251,
        'Corsair Vengeance LPX 16GB (2x8GB) 3200MHz' => 45,
        'G.Skill Ripjaws V 32GB (2x16GB) 3600MHz'  => 76,

        // Storage
        'Samsung 990 Pro 4TB NVMe SSD'  => 352,
        'WD Black SN850X 2TB NVMe SSD'  => 150,
        'Crucial P3 Plus 1TB NVMe SSD'  => 65,
        'Samsung 870 EVO 2TB SATA SSD'  => 130,
        'Seagate Barracuda 4TB HDD'     => 90,

        // PSUs
        'Corsair RM1000x 1000W 80+ Gold'  => 170,
        'EVGA SuperNOVA 850 G6 850W'      => 140,
        'Seasonic Focus GX-750 750W'      => 110,
        'Corsair RM650x 650W'             => 90,
        'Thermaltake Smart 500W'          => 49,

        // Cases
        'NZXT H9 Flow Mid-Tower ATX'   => 160,
        'Corsair 4000D Airflow ATX'    => 105,
        'Lian Li O11 Dynamic EVO ATX'  => 150,
        'Deepcool CH370 Micro-ATX'     => 65,
        'ASUS Prime AP201 Micro-ATX'   => 80,
    ];

    /**
     * Estimate the total build cost in USD and PKR.
     *
     * @return array{estimated_cost_usd: float, estimated_cost_pkr: float, breakdown: array<string, float>}
     */
    public function estimate(array $components): array
    {
        $breakdown = [];
        $totalUSD  = 0.0;

        $componentKeys = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'power_supply', 'chassis'];

        foreach ($componentKeys as $key) {
            $model = $components[$key] ?? null;
            if ($model === null) {
                continue;
            }

            $price = self::PRICES_USD[$model] ?? 0.0;
            $breakdown[$key] = $price;
            $totalUSD += $price;
        }

        $totalPKR = round($totalUSD * self::PKR_RATE, 2);

        return [
            'estimated_cost_usd' => round($totalUSD, 2),
            'estimated_cost_pkr' => $totalPKR,
            'breakdown'          => $breakdown,
        ];
    }

    /**
     * Return the current USD to PKR exchange rate.
     */
    public static function getPkrRate(): float
    {
        return self::PKR_RATE;
    }
}
