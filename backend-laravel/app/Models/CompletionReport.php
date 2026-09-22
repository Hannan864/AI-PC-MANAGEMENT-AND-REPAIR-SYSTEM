<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\CompletionReport
 *
 * Filed by a technician when closing out a repair request.
 * Maps to the TypeScript ServiceCompletionReport interface.
 *
 * PKR is the primary currency for all cost fields.
 *
 * parts_replaced JSON structure:
 *   [{ "name": string, "price_pkr": number, "quantity": number }]
 *
 * @property string $id                 UUID PK
 * @property string $repair_request_id  UUID FK → repair_requests.id
 * @property string $issue_summary
 * @property string $root_cause
 * @property array  $parts_replaced
 * @property float  $labor_cost
 * @property float  $total_cost
 * @property string|null $work_notes
 * @property int    $time_spent_minutes
 */
class CompletionReport extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'repair_request_id',
        'issue_summary',
        'root_cause',
        'parts_replaced',
        'labor_cost',
        'total_cost',
        'work_notes',
        'time_spent_minutes',
    ];

    protected function casts(): array
    {
        return [
            'parts_replaced'     => 'array',
            'labor_cost'         => 'decimal:2',
            'total_cost'         => 'decimal:2',
            'time_spent_minutes' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The repair request this report closes out.
     */
    public function repairRequest(): BelongsTo
    {
        return $this->belongsTo(RepairRequest::class, 'repair_request_id');
    }
}
