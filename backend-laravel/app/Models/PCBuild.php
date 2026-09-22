<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PCBuild
 *
 * Stores a user's custom PC configuration with compatibility analysis.
 * Maps to the TypeScript PCBuild interface.
 *
 * Renamed fields from TypeScript:
 *   - buildId      → id         (UUID, standard PK naming)
 *   - case         → chassis    (reserved keyword avoidance)
 *
 * Compatibility engine populates:
 *   - compatibility_status ('pass' | 'warning' | 'fail')
 *   - performance_score    (0-100)
 *   - issues               JSON array of issue strings
 *   - bottlenecks          JSON array of bottleneck strings
 *
 * @property string      $id
 * @property string      $user_id
 * @property string|null $technician_id
 * @property string      $build_name
 * @property string      $cpu
 * @property string      $gpu
 * @property string      $motherboard
 * @property string      $ram
 * @property string      $storage
 * @property string      $power_supply
 * @property string|null $chassis
 * @property float|null  $estimated_cost_usd
 * @property float|null  $estimated_cost_pkr
 * @property string      $compatibility_status
 * @property int         $performance_score
 * @property array|null  $issues
 * @property array|null  $bottlenecks
 * @property string      $status  (draft|submitted_review|under_review|reviewed|rejected|in_progress|completed)
 * @property string|null $user_notes
 * @property string|null $technician_notes
 */
class PCBuild extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pc_builds';

    protected $fillable = [
        'user_id',
        'technician_id',
        'build_name',
        'cpu',
        'gpu',
        'motherboard',
        'ram',
        'storage',
        'power_supply',
        'chassis',
        'estimated_cost_usd',
        'estimated_cost_pkr',
        'compatibility_status',
        'performance_score',
        'issues',
        'bottlenecks',
        'status',
        'user_notes',
        'technician_notes',
    ];

    protected function casts(): array
    {
        return [
            'estimated_cost_usd'   => 'decimal:2',
            'estimated_cost_pkr'   => 'decimal:2',
            'performance_score'    => 'integer',
            'issues'               => 'array',
            'bottlenecks'          => 'array',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The customer who created this build configuration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The technician reviewing this build (optional).
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function hasCompatibilityIssues(): bool
    {
        return $this->compatibility_status !== 'pass';
    }

    public function isReadyForSubmission(): bool
    {
        return $this->status === 'draft' && $this->compatibility_status === 'pass';
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted(Builder $query): Builder
    {
        return $query->where('status', 'submitted_review');
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeAssignedTo(Builder $query, string $technicianId): Builder
    {
        return $query->where('technician_id', $technicianId);
    }

    public function scopeCompatible(Builder $query): Builder
    {
        return $query->where('compatibility_status', 'pass');
    }
}
