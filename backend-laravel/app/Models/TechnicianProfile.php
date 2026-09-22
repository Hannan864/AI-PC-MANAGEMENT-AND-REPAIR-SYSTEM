<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\TechnicianProfile
 *
 * Stores technician-specific extended data.
 * Kept separate from users to respect SRP (SOLID).
 * Only created/populated for users with role='technician'.
 *
 * @property int         $id
 * @property string      $user_id       UUID FK → users.id
 * @property string|null $specialty     e.g. Hardware, Software, Network
 * @property float       $rating        0.00 – 5.00
 * @property bool        $is_available
 * @property string|null $bio
 * @property int         $jobs_completed
 */
class TechnicianProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty',
        'rating',
        'is_available',
        'bio',
        'jobs_completed',
    ];

    protected function casts(): array
    {
        return [
            'rating'         => 'float',
            'is_available'   => 'boolean',
            'jobs_completed' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The technician user account owning this profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
