<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * App\Models\RepairRequest
 *
 * The central ticket entity for the Admin Assignment Workflow:
 *   User submits → Admin assigns Technician → Technician updates status → Completed
 *
 * Gig/marketplace fields are intentionally absent per approved FYP scope.
 *
 * @property string      $id                   UUID PK
 * @property string      $user_id              FK → users.id (customer)
 * @property string|null $technician_id        FK → users.id (assigned technician)
 * @property string|null $issue_category
 * @property string      $issue_description
 * @property string      $severity_level       low | medium | high
 * @property string      $status               see enum in migration
 * @property array|null  $system_specifications Static hardware context
 * @property array|null  $user_images          Stored file paths
 * @property array|null  $tech_images          Stored file paths
 */
class RepairRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'technician_id',
        'gig_title',
        'issue_category',
        'issue_description',
        'severity_level',
        'status',
        'system_specifications',
        'user_images',
        'tech_images',
    ];

    protected function casts(): array
    {
        return [
            'system_specifications' => 'array',
            'user_images'           => 'array',
            'tech_images'           => 'array',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The customer who submitted this request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The technician assigned by admin (nullable).
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Ordered status history log (append-only).
     */
    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(LifecycleEvent::class, 'repair_request_id')
                    ->orderBy('created_at', 'asc');
    }

    /**
     * The completion report filed by the technician (1:1, nullable).
     */
    public function completionReport(): HasOne
    {
        return $this->hasOne(CompletionReport::class, 'repair_request_id');
    }

    // -------------------------------------------------------------------------
    // Status Helpers
    // -------------------------------------------------------------------------

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isAssigned(): bool
    {
        return $this->technician_id !== null;
    }
}
