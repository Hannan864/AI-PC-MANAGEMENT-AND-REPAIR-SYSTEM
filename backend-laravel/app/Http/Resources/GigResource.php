<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'technicianId'    => $this->technician_id,
            'technicianName'  => $this->technician?->name ?? 'Unknown',
            'title'           => $this->title,
            'description'     => $this->description,
            'category'        => $this->category,
            'price'           => (float) $this->price,
            'estimatedTime'   => $this->estimated_time,
            'isAvailable'     => $this->is_available,
            'createdAt'       => $this->created_at?->toIso8601String(),
            'updatedAt'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
