<?php

declare(strict_types=1);

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service: GeminiTriageService
 *
 * Google Gemini API integration for AI-powered repair request triage.
 * Activated when AI_DRIVER=gemini and AI_ENABLED=true in .env.
 *
 * Falls back to LocalRuleBasedTriageService if the API call fails,
 * ensuring the system never breaks due to external API downtime.
 *
 * Configuration (.env):
 *   AI_ENABLED=true
 *   AI_DRIVER=gemini
 *   GEMINI_API_KEY=your_api_key_here
 */
class GeminiTriageService implements AITriageInterface
{
    private const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct(
        private readonly string $apiKey,
        private readonly LocalRuleBasedTriageService $fallback,
    ) {}

    public function triageRequest(array $repairData): array
    {
        try {
            $prompt = $this->buildPrompt($repairData);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(15)->post(self::GEMINI_API_URL . '?key=' . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
            ]);

            if ($response->failed()) {
                Log::warning('GeminiTriageService: API call failed.', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return $this->fallback->triageRequest($repairData);
            }

            return $this->parseGeminiResponse($response->json());
        } catch (\Throwable $e) {
            Log::error('GeminiTriageService: Exception during API call.', [
                'error' => $e->getMessage(),
            ]);
            // Graceful fallback — never break the request flow
            return $this->fallback->triageRequest($repairData);
        }
    }

    private function buildPrompt(array $repairData): string
    {
        $description = $repairData['issue_description'] ?? 'No description provided.';
        $specs       = json_encode($repairData['system_specifications'] ?? [], JSON_PRETTY_PRINT);

        return <<<PROMPT
You are a PC repair triage assistant for Smart PC Hub.

Analyze the following repair request and return a JSON object with this exact structure:
{
  "severity_suggestion": "low" | "medium" | "high",
  "category_suggestion": "Hardware" | "Software" | "Networking" | "Storage" | "Other",
  "priority_score": integer from 0 to 100,
  "analysis_notes": "brief explanation of the triage decision"
}

Issue Description:
{$description}

System Specifications:
{$specs}

Return ONLY valid JSON. No markdown. No explanation.
PROMPT;
    }

    private function parseGeminiResponse(array $responseJson): array
    {
        $rawText = $responseJson['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (! $rawText) {
            throw new \RuntimeException('Empty response from Gemini API.');
        }

        // Strip any potential markdown code fences
        $cleanText = trim(preg_replace('/```(?:json)?|```/', '', $rawText));
        $parsed    = json_decode($cleanText, associative: true, flags: JSON_THROW_ON_ERROR);

        return [
            'severity_suggestion' => $parsed['severity_suggestion'] ?? 'medium',
            'category_suggestion' => $parsed['category_suggestion'] ?? 'Other',
            'priority_score'      => (int) ($parsed['priority_score'] ?? 50),
            'analysis_notes'      => $parsed['analysis_notes'] ?? '',
            'is_ai_generated'     => true,
        ];
    }
}
