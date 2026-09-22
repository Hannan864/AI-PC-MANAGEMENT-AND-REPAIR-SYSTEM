<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\AssignTechnicianRequest;
use App\Http\Requests\Api\V1\CompleteReportRequest;
use App\Http\Requests\Api\V1\StoreRepairRequestRequest;
use App\Http\Requests\Api\V1\UpdateRepairStatusRequest;
use App\Http\Resources\RepairRequestResource;
use App\Models\RepairRequest;
use App\Models\User;
use App\Services\LifecycleService;
use App\Services\RepairService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Controller: RepairRequestController
 *
 * Full CRUD for repair request management with status workflow,
 * technician assignment, completion reports, and lifecycle tracking.
 */
class RepairRequestController extends BaseController
{
    public function __construct(
        private readonly RepairService $repairService,
        private readonly LifecycleService $lifecycleService,
    ) {}

    /**
     * List unassigned repair requests (technicians and admins can see these).
     */
    public function unassigned(Request $request): JsonResponse
    {
        $query = RepairRequest::with(['user'])
            ->whereNull('technician_id')
            ->where('status', 'submitted');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('issue_description', 'like', "%{$search}%")
                  ->orWhere('issue_category', 'like', "%{$search}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse(
            $requests->through(fn ($r) => new RepairRequestResource($r)),
            'Unassigned repair requests retrieved successfully.',
        );
    }

    /**
     * List repair requests for the authenticated user.
     * Customers see own requests; technicians see assigned; admins see all.
     * Supports filtering by status, severity, category, and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RepairRequest::with(['user', 'technician', 'completionReport']);

        if ($request->user()->isTechnician()) {
            $query->where('technician_id', $request->user()->id);
        } elseif ($request->user()->isUser()) {
            $query->where('user_id', $request->user()->id);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('severity_level')) {
            $query->where('severity_level', $request->input('severity_level'));
        }
        if ($request->filled('issue_category')) {
            $query->where('issue_category', $request->input('issue_category'));
        }

        // Search by description
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('issue_description', 'like', "%{$search}%")
                  ->orWhere('issue_category', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortField = $request->input('sort', 'created_at');
        $sortDir   = $request->input('direction', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'status', 'severity_level'];
        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $requests = $query->paginate($request->integer('per_page', 20));

        return $this->sendResponse(
            $requests->through(fn ($r) => new RepairRequestResource($r)),
            'Repair requests retrieved successfully.',
        );
    }

    /**
     * Create a new repair request with optional image uploads.
     */
    public function store(StoreRepairRequestRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $images    = $request->hasFile('user_images')
            ? $request->file('user_images')
            : null;

        // Remove images from validated data (handled separately)
        unset($validated['user_images'], $validated['pc_build_id']);

        $repairRequest = $this->repairService->createRepairRequest(
            $validated,
            $request->user(),
            $images,
        );

        return $this->sendResponse(
            new RepairRequestResource($repairRequest),
            'Repair request submitted successfully.',
            201,
        );
    }

    /**
     * Retrieve a single repair request with full timeline.
     */
    public function show(string $id): JsonResponse
    {
        $request = RepairRequest::with(['user', 'technician', 'lifecycleEvents.actor', 'completionReport'])
            ->find($id);

        if (! $request) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        Gate::authorize('view', $request);

        $slaData = $this->repairService->calculateSLA($request);

        return $this->sendResponse([
            'request' => new RepairRequestResource($request),
            'sla'     => $slaData,
        ], 'Repair request retrieved successfully.');
    }

    /**
     * Assign a technician to a repair request (admin only).
     */
    public function assign(AssignTechnicianRequest $request, string $id): JsonResponse
    {
        $repairRequest = RepairRequest::find($id);

        if (! $repairRequest) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        Gate::authorize('assign', $repairRequest);

        $technician = User::findOrFail($request->input('technician_id'));

        $updated = $this->repairService->assignTechnician(
            $repairRequest,
            $technician,
            $request->user(),
            $request->input('note'),
        );

        return $this->sendResponse(
            new RepairRequestResource($updated),
            'Technician assigned successfully.',
        );
    }

    /**
     * Update the status of a repair request.
     * Technicians/admin manage transitions; customers may only cancel
     * their own submitted requests (enforced below + by policy).
     */
    public function updateStatus(UpdateRepairStatusRequest $request, string $id): JsonResponse
    {
        $repairRequest = RepairRequest::find($id);

        if (! $repairRequest) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        // Preserve the suspended-account check previously done by RoleMiddleware.
        if (! $request->user()->isActive()) {
            return $this->sendError('Your account has been suspended. Please contact support.', [], 403);
        }

        // Customers may only cancel — all other transitions are
        // technician/admin actions (policy also requires status 'submitted').
        if ($request->user()->isUser() && $request->input('status') !== 'cancelled') {
            return $this->sendError('You are only allowed to cancel this request.', [], 403);
        }

        Gate::authorize('updateStatus', $repairRequest);

          $updated = $this->repairService->updateStatus(
              $repairRequest,
              $request->input('status'),
              $request->user(),
              $request->input('note'),
              $request->input('severity_level'),
          );

        return $this->sendResponse(
            new RepairRequestResource($updated->fresh(['user', 'technician', 'lifecycleEvents'])),
            'Repair request status updated successfully.',
        );
    }

    /**
     * Submit a completion report (technician only).
     */
    public function complete(CompleteReportRequest $request, string $id): JsonResponse
    {
        $repairRequest = RepairRequest::find($id);

        if (! $repairRequest) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        Gate::authorize('complete', $repairRequest);

        $validated = $request->validated();
        $completionImages = $request->hasFile('completion_images')
            ? $request->file('completion_images')
            : null;

        unset($validated['completion_images']);

        $report = $this->repairService->submitCompletionReport(
            $repairRequest,
            $validated,
            $request->user(),
            $completionImages,
        );

        return $this->sendResponse(
            new RepairRequestResource($report->repairRequest->fresh(['user', 'technician', 'lifecycleEvents', 'completionReport'])),
            'Completion report submitted successfully.',
            201,
        );
    }

    /**
     * Delete a repair request (only submitted/unassigned requests).
     */
    public function destroy(string $id): JsonResponse
    {
        $repairRequest = RepairRequest::find($id);

        if (! $repairRequest) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        Gate::authorize('delete', $repairRequest);

        $repairRequest->delete();

        return $this->sendMessage('Repair request deleted successfully.');
    }

    /**
     * Get the user's service history (completed repairs).
     */
    public function serviceHistory(Request $request): JsonResponse
    {
        $history = $this->repairService->getUserServiceHistory($request->user());

        return $this->sendResponse(
            $history->through(fn ($r) => new RepairRequestResource($r)),
            'Service history retrieved successfully.',
        );
    }

    /**
     * Get the technician's service history (assigned repairs).
     */
    public function technicianHistory(Request $request): JsonResponse
    {
        $history = $this->repairService->getTechnicianServiceHistory($request->user());

        return $this->sendResponse(
            $history->through(fn ($r) => new RepairRequestResource($r)),
            'Technician service history retrieved successfully.',
        );
    }

    /**
     * Get admin reporting summary (stats, cost summaries, category breakdown).
     */
    public function adminReport(): JsonResponse
    {
        $report = $this->repairService->getAdminReport();

        return $this->sendResponse($report, 'Admin report retrieved successfully.');
    }

    /**
     * Get the lifecycle timeline for a specific repair request.
     */
    public function timeline(string $id): JsonResponse
    {
        $repairRequest = RepairRequest::with(['lifecycleEvents.actor'])->find($id);

        if (! $repairRequest) {
            return $this->sendError('Repair request not found.', [], 404);
        }

        Gate::authorize('view', $repairRequest);

        $slaData = $this->repairService->calculateSLA($repairRequest);

        return $this->sendResponse($slaData, 'Timeline retrieved successfully.');
    }
}
