<?php

declare(strict_types=1);

namespace App\Services;

use App\Services\AI\AITriageInterface;
use Illuminate\Support\Facades\Log;

/**
 * Service: AIManager
 *
 * Central facade for all AI operations. Controllers should ONLY
 * call this service — never interact with AITriageInterface directly.
 *
 * Provides a clean API surface that:
 *   - Respects the AI_ENABLED / AI_DRIVER configuration
 *   - Logs all AI operations for observability
 *   - Returns structured, validated response arrays
 *   - Ensures graceful degradation on any failure
 *
 * Adding new AI capabilities:
 *   1. Add a method here (e.g. analyzeHardware)
 *   2. Define the interface method in AITriageInterface
 *   3. Implement in each driver service
 *   4. Controller only calls AIManager
 */
class AIManager
{
    public function __construct(
        private readonly AITriageInterface $triageService,
    ) {}

    /**
     * Analyze a repair request and return triage recommendations.
     * This is the ONLY method controllers should call for AI triage.
     *
     * @param array{
     *     issue_description: string,
     *     system_specifications?: array,
     *     severity_level?: string,
     * } $repairData
     *
     * @return array{
     *     severity_suggestion: string,
     *     category_suggestion: string,
     *     priority_score: int,
     *     analysis_notes: string,
     *     is_ai_generated: bool,
     *     driver_used: string,
     * }
     */
    public function triageRepairRequest(array $repairData): array
    {
        $driver = config('ai.driver', 'local');
        $enabled = config('ai.enabled', false);

        Log::info('AIManager: Triage request initiated.', [
            'driver'  => $driver,
            'enabled' => $enabled,
        ]);

        $result = $this->triageService->triageRequest($repairData);

        // Enrich with driver metadata
        $result['driver_used'] = $enabled ? $driver : 'local';

        Log::info('AIManager: Triage completed.', [
            'severity' => $result['severity_suggestion'],
            'category' => $result['category_suggestion'],
            'priority' => $result['priority_score'],
            'ai'       => $result['is_ai_generated'],
        ]);

        return $result;
    }

    /**
     * Check if AI features are currently enabled.
     */
    public function isEnabled(): bool
    {
        return config('ai.enabled', false);
    }

    /**
     * Get the currently active AI driver name.
     */
    public function getDriver(): string
    {
        return config('ai.driver', 'local');
    }
}
