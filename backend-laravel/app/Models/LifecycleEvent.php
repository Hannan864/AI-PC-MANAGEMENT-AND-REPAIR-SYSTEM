<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\LifecycleEvent
 *
 * Append-only audit trail for repair request status transitions.
 * Every status change on a RepairRequest records one LifecycleEvent.
 * Records are never updated or deleted — only inserted.
 *
 * No `updated_at` column — these events are immutable by design.
 *
 * @property int    $id
 * @property string $repair_request_id  UUID FK → repair_requests.id
 * @property string $status             New status set at this event
 * @property string $updated_by         UUID FK → users.id
 * @property string|null $note          Optional context note
 * @property \Illuminate\Support\Carbon $created_at
 */
class LifecycleEvent extends Model
{
    use HasFactory;

    /**
     * Disable updated_at — lifecycle events are immutable.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'repair_request_id',
        'status',
        'updated_by',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The repair request this event belongs to.
     */
    public function repairRequest(): BelongsTo
    {
        return $this->belongsTo(RepairRequest::class, 'repair_request_id');
    }

    /**
     * The user (admin/technician/customer) who triggered this status change.
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
