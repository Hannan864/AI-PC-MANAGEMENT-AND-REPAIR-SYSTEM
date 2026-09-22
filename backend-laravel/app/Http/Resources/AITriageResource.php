<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource: AITriageResource
 *
 * Transforms AI triage analysis results into a standardized JSON response.
 * Includes metadata about the AI driver used and confidence indicators.
 */
class AITriageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'severitySuggestion'  => $this->resource['severity_suggestion'] ?? 'medium',
            'categorySuggestion'  => $this->resource['category_suggestion'] ?? 'Other',
            'priorityScore'       => $this->resource['priority_score'] ?? 50,
            'analysisNotes'       => $this->resource['analysis_notes'] ?? '',
            'isAiGenerated'       => $this->resource['is_ai_generated'] ?? false,
            'driverUsed'          => $this->resource['driver_used'] ?? 'local',
        ];
    }
}
