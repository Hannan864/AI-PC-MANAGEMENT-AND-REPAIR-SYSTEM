<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Resources\UserHistoryResource;
use App\Models\UserHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller: UserHistoryController
 *
 * Returns user action history in the legacy IndexedDB UserHistory format.
 * Aggregates events from repair requests, PC builds, and diagnostics.
 */
class UserHistoryController extends BaseController
{
    /**
     * Get the authenticated user's full history timeline.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserHistory::where('user_id', $request->user()->id)
            ->orderBy('event_timestamp', 'desc');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        $history = $query->paginate($request->integer('per_page', 50));

        return $this->sendResponse(
            $history->through(fn ($h) => new UserHistoryResource($h)),
            'User history retrieved successfully.',
        );
    }
}
