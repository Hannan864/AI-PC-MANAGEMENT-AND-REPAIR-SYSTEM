<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: CompletionReportResource
 *
 * Transforms a CompletionReport model into a standardized JSON representation.
 * Includes parts list, labor cost, and total cost for invoice-ready output.
 */
class CompletionReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'repairRequestId'    => $this->repair_request_id,
            'issueSummary'       => $this->issue_summary,
            'rootCause'          => $this->root_cause,
            'rootCauseAnalysis'  => $this->root_cause,
            'partsReplaced'      => $this->parts_replaced ?? [],
            'laborCost'          => $this->labor_cost !== null ? (float) $this->labor_cost : 0,
            'totalCost'          => $this->total_cost !== null ? (float) $this->total_cost : 0,
            'workNotes'          => $this->work_notes,
            'timeSpentMinutes'   => $this->time_spent_minutes,
            'completedAt'        => $this->created_at?->timestamp * 1000,
            'createdAt'          => $this->created_at?->toIso8601String(),
            'updatedAt'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
