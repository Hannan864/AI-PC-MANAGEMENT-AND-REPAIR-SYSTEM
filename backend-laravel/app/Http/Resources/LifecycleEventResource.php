<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: LifecycleEventResource
 *
 * Transforms a LifecycleEvent model into a standardized JSON representation.
 * Immutable events — never exposes updated_at.
 */
class LifecycleEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'repairRequestId' => $this->repair_request_id,
            'status'          => $this->status,
            'updatedBy'       => $this->updated_by,
            'actor'           => new UserResource($this->whenLoaded('actor')),
            'note'            => $this->note,
            'createdAt'       => $this->created_at?->toIso8601String(),
            'timestamp'       => $this->created_at?->timestamp * 1000,
        ];
    }
}
