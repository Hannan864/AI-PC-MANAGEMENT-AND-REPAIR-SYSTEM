<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory: TechnicianProfileFactory
 *
 * Creates realistic technician profile data.
 * Must always be linked to a User with role='technician'.
 *
 * Usage:
 *   TechnicianProfile::factory()->for(User::factory()->technician())->create();
 */
class TechnicianProfileFactory extends Factory
{
    protected $model = TechnicianProfile::class;

    private const SPECIALTIES = [
        'Hardware Repair',
        'Software Troubleshooting',
        'Networking & Connectivity',
        'PC Assembly & Upgrades',
        'Data Recovery',
        'Virus & Malware Removal',
        'Laptop Repair',
        'Gaming PC Optimization',
    ];

    public function definition(): array
    {
        return [
            'user_id'        => User::factory()->technician(),
            'specialty'      => fake()->randomElement(self::SPECIALTIES),
            'rating'         => fake()->randomFloat(2, 3.0, 5.0),
            'is_available'   => fake()->boolean(75), // 75% chance available
            'bio'            => fake()->paragraph(2),
            'jobs_completed' => fake()->numberBetween(0, 200),
        ];
    }

    /**
     * Available technician state.
     */
    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => true,
        ]);
    }

    /**
     * Unavailable technician state.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
