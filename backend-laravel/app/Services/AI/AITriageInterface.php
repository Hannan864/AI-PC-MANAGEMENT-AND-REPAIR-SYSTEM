<?php

declare(strict_types=1);

namespace App\Services\AI;

/**
 * Interface: AITriageInterface
 *
 * Defines the contract for all AI triage service implementations.
 * By coding to this interface (not concrete classes), the AI driver
 * can be swapped out via .env without changing any controller code.
 *
 * Implementations:
 *   - GeminiTriageService        (AI_DRIVER=gemini in .env)
 *   - LocalRuleBasedTriageService (AI_DRIVER=local or AI_ENABLED=false)
 *
 * @see App\Providers\AppServiceProvider for binding registration
 */
interface AITriageInterface
{
    /**
     * Analyze a repair request and return triage recommendations.
     *
     * @param  array $repairData  Validated repair request payload
     *                            (issue_description, system_specifications, severity_level)
     * @return array              {
     *                              severity_suggestion: 'low'|'medium'|'high',
     *                              category_suggestion: string,
     *                              priority_score: int (0-100),
     *                              analysis_notes: string,
     *                              is_ai_generated: bool
     *                            }
     */
    public function triageRequest(array $repairData): array;
}
