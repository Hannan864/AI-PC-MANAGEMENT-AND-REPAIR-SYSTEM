<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * App\Models\User
 *
 * Core authentication model. Role enum enforces three-actor system:
 *   - user:       customer who submits repair requests and builds
 *   - technician: assigned to repair jobs by admin
 *   - admin:      manages users, technicians, and request assignments
 *
 * @property string      $id            UUID primary key
 * @property string      $name
 * @property string      $email
 * @property string      $password      Bcrypt hashed
 * @property string      $role          'user' | 'technician' | 'admin'
 * @property string      $status        'active' | 'suspended'
 * @property string|null $profile_image
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'profile_image',
    ];

    /**
     * The attributes that should be hidden for serialization.
     * Password and token are never exposed in API responses.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // -------------------------------------------------------------------------
    // Role Helpers
    // -------------------------------------------------------------------------

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTechnician(): bool
    {
        return $this->role === 'technician';
    }

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * PC builds created by this user (customer).
     */
    public function pcBuilds(): HasMany
    {
        return $this->hasMany(PCBuild::class, 'user_id');
    }

    /**
     * PC builds assigned to this technician for review.
     */
    public function assignedBuilds(): HasMany
    {
        return $this->hasMany(PCBuild::class, 'technician_id');
    }

    /**
     * Repair requests submitted by this user (customer).
     */
    public function repairRequests(): HasMany
    {
        return $this->hasMany(RepairRequest::class, 'user_id');
    }

    /**
     * Repair requests assigned to this technician.
     */
    public function assignedRepairs(): HasMany
    {
        return $this->hasMany(RepairRequest::class, 'technician_id');
    }

    /**
     * Extended profile data (technician-only).
     */
    public function technicianProfile(): HasOne
    {
        return $this->hasOne(TechnicianProfile::class, 'user_id');
    }

    /**
     * Service gigs offered by this technician.
     */
    public function gigs(): HasMany
    {
        return $this->hasMany(Gig::class, 'technician_id');
    }
}
