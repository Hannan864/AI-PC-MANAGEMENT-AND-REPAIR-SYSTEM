<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\TechnicianProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeder: UserSeeder
 *
 * Creates exactly 3 demo accounts for testing:
 *   - 1 Admin
 *   - 1 Technician (with profile)
 *   - 1 Customer
 *
 * Password for all: "password"
 *
 * These match the demo login buttons in the frontend.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ----------------------------------------------------------------
        // Admin account (1)
        // ----------------------------------------------------------------
        User::create([
            'id'                => Str::uuid(),
            'name'              => 'Admin User',
            'email'             => 'admin@smartpchub.test',
            'password'          => Hash::make('password'),
            'role'              => 'admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // ----------------------------------------------------------------
        // Technician account (1) with profile
        // ----------------------------------------------------------------
        $tech = User::create([
            'id'                => Str::uuid(),
            'name'              => 'Ali Hassan',
            'email'             => 'ali.hassan@smartpchub.test',
            'password'          => Hash::make('password'),
            'role'              => 'technician',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        TechnicianProfile::create([
            'user_id'        => $tech->id,
            'specialty'      => 'Hardware Repair',
            'bio'            => 'Specialized in motherboard diagnostics, GPU swaps, and RAM troubleshooting. 5 years experience.',
            'rating'         => 4.80,
            'is_available'   => true,
            'jobs_completed' => 0,
        ]);

        // ----------------------------------------------------------------
        // Customer account (1)
        // ----------------------------------------------------------------
        User::create([
            'id'                => Str::uuid(),
            'name'              => 'Test Customer',
            'email'             => 'customer1@smartpchub.test',
            'password'          => Hash::make('password'),
            'role'              => 'user',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
    }
}
