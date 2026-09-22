<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\RepairRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory: RepairRequestFactory
 *
 * Generates realistic repair ticket data.
 * No gig/marketplace fields per approved FYP Admin Assignment scope.
 *
 * Usage:
 *   RepairRequest::factory()->create();                    // unassigned
 *   RepairRequest::factory()->assigned($tech)->create();   // with technician
 *   RepairRequest::factory()->completed()->create();       // completed status
 */
class RepairRequestFactory extends Factory
{
    protected $model = RepairRequest::class;

    private const CATEGORIES = [
        'Hardware', 'Software', 'Networking', 'Screen/Display',
        'Keyboard/Input', 'Battery/Power', 'Storage/Data Recovery', 'Other',
    ];

    private const DESCRIPTIONS = [
        'My computer keeps crashing randomly with a blue screen error.',
        'The laptop overheats and shuts down after 20 minutes of use.',
        'WiFi drops every few minutes and will not reconnect automatically.',
        'The screen has vertical lines and flickering on startup.',
        'Computer runs very slow, takes 10 minutes to boot up.',
        'Hard drive making clicking sounds, worried about data loss.',
        'Cannot install Windows updates, getting error code 0x80070057.',
        'Keyboard keys are unresponsive after liquid spill.',
        'PC does not POST, no display on startup.',
        'Fan is extremely loud and CPU temperature is very high.',
    ];

    public function definition(): array
    {
        return [
            'user_id'              => User::factory(),
            'technician_id'        => null,
            'issue_category'       => fake()->randomElement(self::CATEGORIES),
            'issue_description'    => fake()->randomElement(self::DESCRIPTIONS),
            'severity_level'       => fake()->randomElement(['low', 'medium', 'high']),
            'status'               => 'submitted',
            'system_specifications' => $this->fakeSystemSpec(),
            'user_images'          => [],
            'tech_images'          => [],
        ];
    }

    /**
     * Assign to a specific technician and update status.
     */
    public function assigned(?User $technician = null): static
    {
        return $this->state(fn (array $attributes) => [
            'technician_id' => $technician?->id ?? User::factory()->technician(),
            'status'        => 'assigned',
        ]);
    }

    /**
     * Mark as in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    /**
     * Mark as completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * Generate a fake static system specification snapshot.
     */
    private function fakeSystemSpec(): array
    {
        $cpus  = ['Intel Core i5-10400', 'AMD Ryzen 5 5600X', 'Intel Core i7-12700K', 'AMD Ryzen 7 5800X'];
        $gpus  = ['NVIDIA GeForce GTX 1660', 'AMD Radeon RX 5700', 'NVIDIA GeForce RTX 3060', 'Intel UHD 630'];
        $rams  = ['8GB DDR4 3200MHz', '16GB DDR4 3600MHz', '32GB DDR4 3200MHz'];
        $disks = ['256GB SSD + 1TB HDD', '512GB NVMe SSD', '1TB HDD', '2TB NVMe SSD'];

        return [
            'cpu'            => fake()->randomElement($cpus),
            'gpu'            => fake()->randomElement($gpus),
            'ram'            => fake()->randomElement($rams),
            'storage'        => fake()->randomElement($disks),
            'os'             => fake()->randomElement(['Windows 10 Home', 'Windows 11 Pro', 'Windows 10 Pro']),
            'browser'        => 'Chrome/' . fake()->numerify('##.0.####.##'),
            'captured_at'    => now()->toIso8601String(),
        ];
    }
}
