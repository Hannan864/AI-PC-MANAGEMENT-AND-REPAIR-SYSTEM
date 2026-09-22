<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * App\Models\SystemReport
 *
 * A stored system report — a self-contained enterprise JSON envelope
 * capturing the user's full system state at a point in time.
 *
 * Delivered to the technician(s) the customer chose (see the
 * system_report_technicians pivot), with technician_id kept as the first
 * recipient for backward compatibility with the repair-request flow.
 *
 * @property string      $id
 * @property string      $user_id
 * @property string|null $technician_id     first recipient (legacy single-tech field)
 * @property string      $title
 * @property string      $report_type       manual | daily | weekly | monthly
 * @property int|null    $health_score      0-100
 * @property array       $report_data       full report envelope
 * @property string      $source            local | cloud
 */
class SystemReport extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'technician_id',
        'title',
        'report_type',
        'health_score',
        'report_data',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'report_data'   => 'array',
            'health_score'  => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Every technician this report was delivered to (one or many).
     */
    public function technicians(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'system_report_technicians', 'system_report_id', 'technician_id')
            ->withTimestamps();
    }
}
