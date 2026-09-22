<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\StoreGigRequest;
use App\Http\Requests\Api\V1\UpdateGigRequest;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class GigController extends BaseController
{
    /**
     * List gigs. Technicians see their own; users/admins see all available.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Gig::with('technician');

        if ($request->user()->isTechnician()) {
            $query->where('technician_id', $request->user()->id);
        } else {
            $query->available();
        }

        if ($request->has('category') && $request->input('category') !== null) {
            $query->category($request->input('category'));
        }

        $gigs = $query->orderBy('created_at', 'desc')
                       ->paginate($request->integer('per_page', 50));

        return $this->sendResponse(
            GigResource::collection($gigs),
            'Gigs retrieved successfully.',
        );
    }

    /**
     * Store a new gig. Only technicians can create gigs.
     */
    public function store(StoreGigRequest $request): JsonResponse
    {
        // Only technicians may create gigs (matches the original backup contract
        // where gig creation was restricted to the technician role).
        if (! $request->user()->isTechnician()) {
            return $this->sendError('Only technicians can create gigs.', [], 403);
        }

        $validated = $request->validated();
        $validated['technician_id'] = $request->user()->id;

        $gig = Gig::create($validated);

        return $this->sendResponse(
            new GigResource($gig->load('technician')),
            'Gig created successfully.',
            201,
        );
    }

    /**
     * Retrieve a single gig.
     */
    public function show(string $id): JsonResponse
    {
        $gig = Gig::with('technician')->find($id);

        if (! $gig) {
            return $this->sendError('Gig not found.', [], 404);
        }

        return $this->sendResponse(
            new GigResource($gig),
            'Gig retrieved successfully.',
        );
    }

    /**
     * Update a gig. Only the owning technician can update.
     */
    public function update(UpdateGigRequest $request, string $id): JsonResponse
    {
        $gig = Gig::find($id);

        if (! $gig) {
            return $this->sendError('Gig not found.', [], 404);
        }

        Gate::authorize('update', $gig);

        $gig->fill($request->validated());
        $gig->save();

        return $this->sendResponse(
            new GigResource($gig->fresh('technician')),
            'Gig updated successfully.',
        );
    }

    /**
     * Delete a gig. Only the owning technician can delete.
     */
    public function destroy(string $id): JsonResponse
    {
        $gig = Gig::find($id);

        if (! $gig) {
            return $this->sendError('Gig not found.', [], 404);
        }

        Gate::authorize('delete', $gig);

        $gig->delete();

        return $this->sendMessage('Gig deleted successfully.');
    }
}
