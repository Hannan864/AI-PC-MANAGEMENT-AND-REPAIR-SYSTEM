<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Api\V1\AITriageRequest;
use App\Http\Resources\AITriageResource;
use App\Services\AIManager;
use Illuminate\Http\JsonResponse;

/**
 * Controller: AIController
 *
 * Handles AI-powered triage analysis for repair requests.
 * Delegates ALL AI logic to AIManager — never calls AITriageInterface directly.
 *
 * Phase 7 deliverable — fully implemented.
 */
class AIController extends BaseController
{
    public function __construct(
        private readonly AIManager $aiManager,
    ) {}

    /**
     * POST /api/v1/ai/triage
     *
     * Analyzes a repair request payload and returns AI-powered
     * triage recommendations (severity, category, priority, notes).
     *
     * Works even when AI_ENABLED=false (uses local rule-based fallback).
     */
    public function triage(AITriageRequest $request): JsonResponse
    {
        $result = $this->aiManager->triageRepairRequest($request->validated());

        return $this->sendResponse(
            new AITriageResource($result),
            'AI triage analysis completed.',
        );
    }
}
