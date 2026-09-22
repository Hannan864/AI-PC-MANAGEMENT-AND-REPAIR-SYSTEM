<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\StorePCBuildRequest;
use App\Http\Requests\Api\V1\UpdatePCBuildRequest;
use App\Http\Requests\Api\V1\UpdatePCBuildStatusRequest;
use App\Http\Resources\PCBuildCollection;
use App\Http\Resources\PCBuildResource;
use App\Models\PCBuild;
use App\Services\CompatibilityService;
use App\Services\CostEstimationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller: PCBuildController
 *
 * Full CRUD for PC build configurations with server-side
 * compatibility validation and cost estimation.
 *
 * Workflow: draft → submitted_review → under_review → reviewed → in_progress → completed
 *           rejected (returned to customer for changes) → draft → resubmit
 */
class PCBuildController extends BaseController
{
    public function __construct(
        private readonly CompatibilityService $compatibilityService,
        private readonly CostEstimationService $costEstimationService,
    ) {}

    /**
     * List PC builds for the authenticated user.
     * Admins and technicians see all builds; customers see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PCBuild::with(['user', 'technician']);

        if ($request->user()->isTechnician() || $request->user()->isAdmin()) {
            // Techs and admins see all builds (techs need to browse submitted builds for review)
        } elseif ($request->user()->isUser()) {
            $query->where('user_id', $request->user()->id);
        }

        // Optional status filter
        if ($request->has('status') && $request->input('status') !== null) {
            $query->where('status', $request->input('status'));
        }

        $builds = $query->orderBy('created_at', 'desc')
                         ->paginate($request->integer('per_page', 20));

        return $this->sendResponse(
            new PCBuildCollection($builds),
            'PC builds retrieved successfully.',
        );
    }

    /**
     * Create a new PC build configuration.
     * Runs server-side compatibility analysis and cost estimation automatically.
     */
    public function store(StorePCBuildRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['user_id'] = $request->user()->id;

        // Run compatibility analysis
        $analysis = $this->compatibilityService->analyze($validated);
        $validated = array_merge($validated, $analysis);

        // Run cost estimation
        $cost = $this->costEstimationService->estimate($validated);
        $validated['estimated_cost_usd'] = $cost['estimated_cost_usd'];
        $validated['estimated_cost_pkr'] = $cost['estimated_cost_pkr'];

        $build = PCBuild::create($validated);

        return $this->sendResponse(
            (new PCBuildResource($build->load(['user', 'technician']))),
            'PC build created successfully.',
            201,
        );
    }

    /**
     * Retrieve a single PC build by ID.
     */
    public function show(string $id): JsonResponse
    {
        $build = PCBuild::with(['user', 'technician'])->find($id);

        if (! $build) {
            return $this->sendError('PC build not found.', [], 404);
        }

        Gate::authorize('view', $build);

        return $this->sendResponse(
            new PCBuildResource($build),
            'PC build retrieved successfully.',
        );
    }

    /**
     * Update an existing PC build.
     * Component changes are allowed while the build is a 'draft' or has been
     * 'rejected' (returned to the customer for changes). In both cases the
     * compatibility analysis and cost estimate are recalculated server-side.
     * A rejected build returns to 'draft' after an edit so it can be
     * resubmitted for review.
     */
    public function update(UpdatePCBuildRequest $request, string $id): JsonResponse
    {
        $build = PCBuild::find($id);

        if (! $build) {
            return $this->sendError('PC build not found.', [], 404);
        }

        Gate::authorize('update', $build);

        $validated = $request->validated();
        $build->fill($validated);

        // Recompute compatibility if any component field changed
        $componentFields = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'power_supply', 'chassis'];
        $componentChanged = array_intersect_key(array_flip($componentFields), $validated);

        if (! empty($componentChanged) && in_array($build->status, ['draft', 'rejected'], true)) {
            $analysis = $this->compatibilityService->analyze($build->toArray());
            $build->fill($analysis);

            $cost = $this->costEstimationService->estimate($build->toArray());
            $build->estimated_cost_usd = $cost['estimated_cost_usd'];
            $build->estimated_cost_pkr = $cost['estimated_cost_pkr'];
        }

        // Editing a rejected build (even just the name/notes) brings it back to
        // draft so the customer can resubmit for a fresh review.
        if ($build->status === 'rejected') {
            $build->status = 'draft';
        }

        $build->save();

        return $this->sendResponse(
            new PCBuildResource($build->fresh(['user', 'technician'])),
            'PC build updated successfully.',
        );
    }

    /**
     * Delete a PC build. Only draft builds can be deleted.
     */
    public function destroy(string $id): JsonResponse
    {
        $build = PCBuild::find($id);

        if (! $build) {
            return $this->sendError('PC build not found.', [], 404);
        }

        Gate::authorize('delete', $build);

        $build->delete();

        return $this->sendMessage('PC build deleted successfully.');
    }

    /**
     * Submit a compatible draft build for technician review.
     * Builds that pass compatibility checks (or only carry warnings) can be
     * submitted — technicians review the parts before approving.
     */
    public function submitForReview(string $id): JsonResponse
    {
        $build = PCBuild::find($id);

        if (! $build) {
            return $this->sendError('PC build not found.', [], 404);
        }

        Gate::authorize('submitForReview', $build);

        $build->update(['status' => 'submitted_review']);

        return $this->sendResponse(
            new PCBuildResource($build->fresh(['user', 'technician'])),
            'PC build submitted for review successfully.',
        );
    }

    /**
     * Update the workflow status of a PC build (technician/admin review actions).
     * When a technician acts on a build they are recorded as the reviewing
     * technician, and optional feedback notes are stored for the customer.
     */
    public function updateStatus(UpdatePCBuildStatusRequest $request, string $id): JsonResponse
    {
        $build = PCBuild::find($id);

        if (! $build) {
            return $this->sendError('PC build not found.', [], 404);
        }

        Gate::authorize('update', $build);

        $build->status = $request->input('status');

        // Record the technician/admin performing the review action.
        if ($request->user()->isTechnician() || $request->user()->isAdmin()) {
            $build->technician_id = $request->user()->id;
        }

        // Persist optional feedback notes (e.g. rejection reason).
        if ($request->filled('technician_notes')) {
            $build->technician_notes = $request->input('technician_notes');
        }

        $build->save();

        return $this->sendResponse(
            new PCBuildResource($build->fresh(['user', 'technician'])),
            'PC build status updated successfully.',
        );
    }
}
