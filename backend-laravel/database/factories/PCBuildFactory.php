<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PCBuild;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory: PCBuildFactory
 *
 * Generates realistic PC build configurations.
 * Compatibility status and score are set to 'pass' by default.
 * Specific warning/fail states available via named factory states.
 *
 * Usage:
 *   PCBuild::factory()->create();
 *   PCBuild::factory()->withWarning()->create();
 *   PCBuild::factory()->forUser($user)->create();
 */
class PCBuildFactory extends Factory
{
    protected $model = PCBuild::class;

    private const CPUS = [
        'Intel Core i3-12100', 'Intel Core i5-12400', 'Intel Core i5-12600K',
        'Intel Core i7-12700K', 'Intel Core i9-12900K',
        'AMD Ryzen 5 5600', 'AMD Ryzen 5 5600X', 'AMD Ryzen 7 5700X',
        'AMD Ryzen 7 5800X3D', 'AMD Ryzen 9 5900X',
    ];

    private const GPUS = [
        'NVIDIA GeForce GTX 1660 Super', 'NVIDIA GeForce RTX 3060',
        'NVIDIA GeForce RTX 3060 Ti', 'NVIDIA GeForce RTX 3070',
        'NVIDIA GeForce RTX 3080', 'NVIDIA GeForce RTX 4070',
        'AMD Radeon RX 6600 XT', 'AMD Radeon RX 6700 XT',
        'AMD Radeon RX 6800 XT', 'AMD Radeon RX 7700 XT',
    ];

    private const MOTHERBOARDS = [
        'ASUS ROG Strix B550-F', 'MSI MAG B550 TOMAHAWK',
        'Gigabyte B550 AORUS Pro', 'ASUS Prime Z690-P',
        'MSI PRO Z690-A', 'Gigabyte Z690 AORUS Elite',
    ];

    private const RAMS = [
        '8GB (1x8GB) DDR4 3200MHz', '16GB (2x8GB) DDR4 3200MHz',
        '16GB (2x8GB) DDR4 3600MHz', '32GB (2x16GB) DDR4 3600MHz',
        '64GB (2x32GB) DDR4 3200MHz',
    ];

    private const STORAGES = [
        '500GB Samsung 870 EVO SSD', '1TB Samsung 870 EVO SSD',
        '1TB WD Black SN770 NVMe', '2TB Seagate Barracuda HDD',
        '500GB WD Blue NVMe + 2TB HDD',
    ];

    private const PSUS = [
        'Corsair RM650x 650W Gold', 'EVGA SuperNOVA 750 G5',
        'Seasonic Focus GX-750', 'be quiet! Straight Power 11 850W',
    ];

    private const CHASSIS_CASES = [
        'NZXT H510', 'Fractal Design Meshify C', 'Corsair 4000D Airflow',
        'Lian Li Lancool 205', 'be quiet! Pure Base 500DX',
    ];

    public function definition(): array
    {
        $cpu = fake()->randomElement(self::CPUS);
        $gpu = fake()->randomElement(self::GPUS);

        // Estimate costs (rough PKR values for a mid-range build)
        $estimatedCostUSD = fake()->numberBetween(600, 2500);
        $estimatedCostPKR = $estimatedCostUSD * 278; // ~PKR/USD rate

        return [
            'user_id'              => User::factory(),
            'technician_id'        => null,
            'build_name'           => fake()->randomElement(['Gaming Rig', 'Workstation', 'Budget Build', 'High-End Build', 'Streaming PC']) . ' v' . fake()->numberBetween(1, 5),
            'cpu'                  => $cpu,
            'gpu'                  => $gpu,
            'motherboard'          => fake()->randomElement(self::MOTHERBOARDS),
            'ram'                  => fake()->randomElement(self::RAMS),
            'storage'              => fake()->randomElement(self::STORAGES),
            'power_supply'         => fake()->randomElement(self::PSUS),
            'chassis'              => fake()->randomElement(self::CHASSIS_CASES),
            'estimated_cost_usd'   => $estimatedCostUSD,
            'estimated_cost_pkr'   => $estimatedCostPKR,
            'compatibility_status' => 'pass',
            'performance_score'    => fake()->numberBetween(55, 95),
            'issues'               => [],
            'bottlenecks'          => [],
            'status'               => 'draft',
            'user_notes'           => fake()->optional(0.4)->sentence(),
            'technician_notes'     => null,
        ];
    }

    /**
     * Build with a compatibility warning.
     */
    public function withWarning(): static
    {
        return $this->state(fn (array $attributes) => [
            'compatibility_status' => 'warning',
            'performance_score'    => fake()->numberBetween(30, 55),
            'bottlenecks'          => ['CPU may bottleneck selected GPU in gaming workloads.'],
        ]);
    }

    /**
     * Build with a compatibility failure.
     */
    public function withFailure(): static
    {
        return $this->state(fn (array $attributes) => [
            'compatibility_status' => 'fail',
            'performance_score'    => fake()->numberBetween(0, 30),
            'issues'               => ['Selected RAM is not compatible with chosen motherboard.'],
        ]);
    }

    /**
     * Build submitted for technician review.
     */
    public function submittedForReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'submitted_review',
        ]);
    }

    /**
     * Associate to a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
