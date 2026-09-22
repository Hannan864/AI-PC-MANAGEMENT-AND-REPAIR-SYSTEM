<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\ReportSchedule
 *
 * Per-user schedule controlling automatic report captures
 * (daily / weekly / monthly) plus the customer's chosen recipient
 * technician(s) those reports are delivered to.
 */
class ReportSchedule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'frequency',
        'enabled',
        'last_run_at',
        'next_run_at',
        'technician_ids',
    ];

    protected function casts(): array
    {
        return [
            'enabled'         => 'boolean',
            'last_run_at'     => 'datetime',
            'next_run_at'     => 'datetime',
            'technician_ids'  => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
