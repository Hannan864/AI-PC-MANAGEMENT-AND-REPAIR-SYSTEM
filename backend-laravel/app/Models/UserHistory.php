<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\UserHistory
 *
 * Audit trail entry for user actions across the platform.
 * Maps to the TypeScript UserHistory interface from IndexedDB.
 */
class UserHistory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'user_history';

    protected $fillable = [
        'user_id',
        'type',
        'reference_id',
        'title',
        'summary',
        'event_timestamp',
    ];

    protected function casts(): array
    {
        return [
            'event_timestamp' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
