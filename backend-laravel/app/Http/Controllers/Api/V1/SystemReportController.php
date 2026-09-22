<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Models\SystemReport;
use App\Models\User;
use App\Services\SystemReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Controller: SystemReportController
 *
 * The "PC Medical Dossier" endpoints.
 *
 *   - Customer : capture a dossier, view own reports, configure the
 *                daily / weekly / monthly delivery schedule.
 *   - Technician: patient list of every user whose dossiers were delivered
 *                to them (plus users with an active assigned job), each with
 *                the full medical-chart style report.
 *   - Admin    : overview of every customer's latest dossier + schedule.
 *
 * Reports are stored locally (source = 'local') and are cloud-ready — the
 * envelope can be shipped to an external backend later without changes.
 */
class SystemReportController extends BaseController
{
    public function __construct(
        private readonly SystemReportService $service,
    ) {}

    /**
     * Customer: list own dossiers (newest first).
     */
    public function index(Request $request): JsonResponse
    {
        $reports = $this->service->userReports($request->user(), $request->integer('per_page', 20));

        return $this->sendResponse(
            $reports->through(fn (SystemReport $r) => $this->service->shapeReport($r)),
            'System reports retrieved successfully.',
        );
    }

    /**
     * Customer: capture a fresh report right now.
     * It is delivered to the customer's chosen technician(s), falling back
     * to the technician assigned to their active repair request.
     */
    public function capture(Request $request): JsonResponse
    {
        $report = $this->service->capture($request->user(), 'manual');

        return $this->sendResponse(
            $this->service->shapeReport($report),
            'System report captured successfully.',
            201,
        );
    }

    /**
     * Customer: list technicians they can send their report to.
     */
    public function technicians(Request $request): JsonResponse
    {
        $technicians = User::where('role', 'technician')
            ->where('status', 'active')
            ->with('technicianProfile')
            ->orderBy('name')
            ->get();

        return $this->sendResponse(
            $technicians->map(fn (User $t) => [
                'id'            => $t->id,
                'name'          => $t->name,
                'email'         => $t->email,
                'specialty'     => $t->technicianProfile?->specialty,
                'rating'        => $t->technicianProfile?->rating,
                'isAvailable'   => $t->technicianProfile?->is_available,
                'jobsCompleted' => $t->technicianProfile?->jobs_completed,
            ])->values(),
            'Technicians retrieved successfully.',
        );
    }

    /**
     * Customer: capture a fresh report and deliver it directly to the
     * technician(s) they picked. The choice is saved so scheduled
     * daily / weekly / monthly captures keep going to the same people.
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'technician_ids'   => ['required', 'array', 'min:1'],
            'technician_ids.*' => ['required', 'string', 'distinct', Rule::exists('users', 'id')],
        ]);

        $ids = $this->service->validTechnicianIds($validated['technician_ids']);
        if (count($ids) === 0) {
            return $this->sendError('Select at least one technician to send your report to.', [], 422);
        }

        $this->service->setPreferredTechnicians($request->user(), $ids);
        $report = $this->service->capture($request->user(), 'manual', $ids);

        return $this->sendResponse(
            $this->service->shapeReport($report),
            'System report captured and sent to your technician(s).',
            201,
        );
    }

    /**
     * Customer: view the latest dossier.
     */
    public function latest(Request $request): JsonResponse
    {
        $report = $this->service->latestForUser($request->user());

        if (! $report) {
            return $this->sendError('No system report captured yet.', [], 404);
        }

        return $this->sendResponse(
            $this->service->shapeReport($report),
            'Latest system report retrieved successfully.',
        );
    }

    /**
     * Customer: view the current delivery schedule.
     */
    public function getSchedule(Request $request): JsonResponse
    {
        return $this->sendResponse(
            $this->service->getSchedule($request->user()),
            'Report schedule retrieved successfully.',
        );
    }

    /**
     * Customer: set the delivery schedule (off | daily | weekly | monthly).
     */
    public function updateSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'frequency' => ['required', 'string', 'in:off,daily,weekly,monthly'],
        ]);

        return $this->sendResponse(
            $this->service->updateSchedule($request->user(), $validated['frequency']),
            'Report schedule updated successfully.',
        );
    }

    /**
     * Technician: patient list — every user whose dossiers were delivered to
     * this technician, plus users with an active assigned repair job.
     */
    public function technicianPatients(Request $request): JsonResponse
    {
        return $this->sendResponse(
            $this->service->dossiersForTechnician($request->user()),
            'Patient dossiers retrieved successfully.',
        );
    }

    /**
     * Technician: open one full medical-chart dossier by id.
     *
     * Access is granted when the dossier was delivered to this technician OR
     * belongs to a user with an active repair request currently assigned to
     * them (covers dossiers captured before the admin assigned the tech).
     */
    public function technicianShow(Request $request, string $id): JsonResponse
    {
        $report = SystemReport::with(['user', 'technician'])->find($id);

        if (! $report) {
            return $this->sendError('System report not found.', [], 404);
        }

        $delivered  = $report->technician_id === $request->user()->id
            || $report->technicians()->whereKey($request->user()->id)->exists();
        $assignedTo = $report->user
            && \App\Models\RepairRequest::where('user_id', $report->user_id)
                ->where('technician_id', $request->user()->id)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->exists();

        if (! $delivered && ! $assignedTo) {
            return $this->sendError('This report is not assigned to you.', [], 403);
        }

        return $this->sendResponse(
            $this->service->shapeReport($report),
            'System dossier retrieved successfully.',
        );
    }

    /**
     * Admin: overview of every customer's latest dossier and schedule.
     */
    public function adminOverview(): JsonResponse
    {
        return $this->sendResponse(
            $this->service->adminOverview(),
            'Dossier overview retrieved successfully.',
        );
    }
}
