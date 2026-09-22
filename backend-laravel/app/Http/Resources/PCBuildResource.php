<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: PCBuildResource
 *
 * Transforms a PCBuild model into a standardized JSON representation.
 * Ensures consistent output format for both React and Flutter clients.
 * Cost estimates are included when available.
 */
class PCBuildResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'buildName'           => $this->build_name,
            'userId'              => $this->user_id,
            'technicianId'        => $this->technician_id,

            // Component selections
            'cpu'                 => $this->cpu,
            'gpu'                 => $this->gpu,
            'motherboard'         => $this->motherboard,
            'ram'                 => $this->ram,
            'storage'             => $this->storage,
            'powerSupply'         => $this->power_supply,
            'chassis'             => $this->chassis,

            // Cost estimates
            'estimatedCostUsd'    => $this->estimated_cost_usd !== null
                ? (float) $this->estimated_cost_usd
                : null,
            'estimatedCostPkr'    => $this->estimated_cost_pkr !== null
                ? (float) $this->estimated_cost_pkr
                : null,

            // Compatibility engine output
            'compatibilityStatus' => $this->compatibility_status,
            'performanceScore'    => $this->performance_score,
            'issues'              => $this->issues ?? [],
            'bottlenecks'         => $this->bottlenecks ?? [],

            // Workflow status
            'status'              => $this->status,
            'userNotes'           => $this->user_notes,
            'technicianNotes'     => $this->technician_notes,

            // Timestamps
            'createdAt'           => $this->created_at?->toIso8601String(),
            'updatedAt'           => $this->updated_at?->toIso8601String(),
        ];
    }
}
