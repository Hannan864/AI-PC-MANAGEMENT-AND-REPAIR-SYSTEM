<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Resource: PCBuildCollection
 *
 * Wraps paginated PCBuild results with metadata for list endpoints.
 * Provides consistent pagination structure across the API.
 */
class PCBuildCollection extends ResourceCollection
{
    public $collects = PCBuildResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data'  => $this->collection,
            'meta'  => [
                'total'   => $this->resource->total(),
                'page'    => $this->resource->currentPage(),
                'perPage' => $this->resource->perPage(),
                'lastPage' => $this->resource->lastPage(),
            ],
        ];
    }
}
