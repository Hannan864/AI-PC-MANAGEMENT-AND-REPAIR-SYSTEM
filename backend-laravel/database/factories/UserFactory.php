<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * Factory: UserFactory
 *
 * Generates realistic test users for all three roles.
 * Passwords are stored as bcrypt hashes (never plain-text).
 * Default password for all seeded test users: "password"
 *
 * Usage:
 *   User::factory()->create();                        // random user
 *   User::factory()->admin()->create();               // admin user
 *   User::factory()->technician()->create();          // technician
 *   User::factory()->count(5)->create();              // 5 random users
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * @var string Cached hashed password for performance (shared across all definitions).
     */
    protected static ?string $password;

    /**
     * Default state — creates a regular customer user.
     */
    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => static::$password ??= Hash::make('password'),
            'role'              => 'user',
            'status'            => 'active',
            'profile_image'     => null,
            'remember_token'    => \Illuminate\Support\Str::random(10),
        ];
    }

    /**
     * Admin role state.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    /**
     * Technician role state.
     */
    public function technician(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'technician',
        ]);
    }

    /**
     * Suspended account state.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    /**
     * Indicate the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
