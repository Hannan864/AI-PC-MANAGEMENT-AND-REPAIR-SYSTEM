<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: UserHistoryResource
 *
 * Transforms a UserHistory model into the legacy IndexedDB UserHistory format.
 * Includes numeric timestamps for backward compatibility.
 */
class UserHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'historyId'   => $this->id,
            'userId'      => $this->user_id,
            'type'        => $this->type,
            'referenceId' => $this->reference_id,
            'title'       => $this->title,
            'summary'     => $this->summary,
            'timestamp'   => $this->event_timestamp?->timestamp * 1000,
        ];
    }
}
