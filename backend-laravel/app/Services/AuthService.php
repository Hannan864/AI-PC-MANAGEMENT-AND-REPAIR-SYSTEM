<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Service: AuthService
 *
 * Encapsulates authentication business logic.
 * Keeps controllers thin by extracting registration, login,
 * and token management into a dedicated service class.
 *
 * Uses Laravel Sanctum for stateless API token authentication.
 */
class AuthService
{
    /**
     * Register a new user account.
     *
     * @param  array{name: string, email: string, password: string, role?: string} $data
     * @return array{user: User, plainToken: string}
     */
    public function register(array $data): array
    {
        $user = User::create([
            'id'                => Str::uuid(),
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => Hash::make($data['password']),
            'role'              => $data['role'] ?? 'user',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $plainToken = $user->createToken('auth-token')->plainTextToken;

        return [
            'user'       => $user,
            'plainToken' => $plainToken,
        ];
    }

    /**
     * Authenticate a user with email/password credentials.
     *
     * @param  string $email
     * @param  string $password
     * @return array{user: User, plainToken: string}|null  Null if credentials are invalid.
     */
    public function login(string $email, string $password): ?array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        if (! $user->isActive()) {
            return null;
        }

        // Revoke existing tokens for this device (optional, prevents token bloat)
        // $user->tokens()->delete();

        $plainToken = $user->createToken('auth-token')->plainTextToken;

        return [
            'user'       => $user,
            'plainToken' => $plainToken,
        ];
    }

    /**
     * Logout the authenticated user by revoking the current token.
     * Also purges all other tokens for this user (belt-and-suspenders).
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();

        // Invalidate all other Sanctum tokens for this user
        $user->tokens()->delete();
    }

    /**
     * Update the user's profile fields.
     *
     * @param  User  $user
     * @param  array{name?: string, email?: string, password?: string|null} $data
     * @return User  Updated user model.
     */
    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return $user->fresh();
    }
}
