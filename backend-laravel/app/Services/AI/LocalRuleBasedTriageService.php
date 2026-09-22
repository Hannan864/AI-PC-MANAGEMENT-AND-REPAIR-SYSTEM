<?php

declare(strict_types=1);

namespace App\Services\AI;

/**
 * Service: LocalRuleBasedTriageService
 *
 * Default AI triage implementation using deterministic keyword-matching rules.
 * Zero external dependencies — runs without network access.
 *
 * Activated when:
 *   AI_ENABLED=false  (in .env)
 *   AI_DRIVER=local   (in .env)
 *
 * This ensures the system degrades gracefully if the Gemini API is unavailable
 * or if AI features are intentionally disabled for a deployment.
 */
class LocalRuleBasedTriageService implements AITriageInterface
{
    /**
     * High-severity keyword triggers.
     * These map to 'high' severity and priority score 80-100.
     */
    private const HIGH_SEVERITY_KEYWORDS = [
        'no post', 'wont boot', "won't boot", 'black screen', 'does not start',
        'data loss', 'clicking sound', 'grinding', 'overheating', 'shutdown',
        'blue screen', 'bsod', 'not detected', 'no display', 'burning smell',
    ];

    /**
     * Medium-severity keyword triggers.
     * Priority score 40-79.
     */
    private const MEDIUM_SEVERITY_KEYWORDS = [
        'slow', 'lag', 'freeze', 'crash', 'restart', 'update', 'driver',
        'wifi', 'network', 'connect', 'disconnects', 'drops', 'high cpu',
        'high memory', 'fan noise', 'loud fan',
    ];

    /**
     * Category keyword map — maps issue keywords to categories.
     */
    private const CATEGORY_KEYWORDS = [
        'Hardware'   => ['post', 'boot', 'motherboard', 'ram', 'gpu', 'cpu', 'fan', 'overheating', 'clicking', 'grinding', 'power supply', 'screen'],
        'Software'   => ['slow', 'update', 'driver', 'windows', 'install', 'uninstall', 'virus', 'malware', 'corrupt', 'freeze', 'crash'],
        'Networking' => ['wifi', 'network', 'internet', 'ethernet', 'router', 'dns', 'connect', 'disconnects', 'bandwidth'],
        'Storage'    => ['hard drive', 'ssd', 'nvme', 'clicking', 'data loss', 'disk', 'storage', 'backup'],
    ];

    public function triageRequest(array $repairData): array
    {
        $description = strtolower($repairData['issue_description'] ?? '');
        $systemSpecs = $repairData['system_specifications'] ?? [];

        $severity  = $this->determineSeverity($description);
        $category  = $this->determineCategory($description);
        $priority  = $this->calculatePriorityScore($severity, $description, $systemSpecs);

        return [
            'severity_suggestion' => $severity,
            'category_suggestion' => $category,
            'priority_score'      => $priority,
            'analysis_notes'      => $this->buildAnalysisNotes($severity, $category, $description),
            'is_ai_generated'     => false,
        ];
    }

    private function determineSeverity(string $description): string
    {
        foreach (self::HIGH_SEVERITY_KEYWORDS as $keyword) {
            if (str_contains($description, $keyword)) {
                return 'high';
            }
        }

        foreach (self::MEDIUM_SEVERITY_KEYWORDS as $keyword) {
            if (str_contains($description, $keyword)) {
                return 'medium';
            }
        }

        return 'low';
    }

    private function determineCategory(string $description): string
    {
        $scores = [];

        foreach (self::CATEGORY_KEYWORDS as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (str_contains($description, $keyword)) {
                    $score++;
                }
            }
            $scores[$category] = $score;
        }

        arsort($scores);
        $topCategory = array_key_first($scores);

        return ($scores[$topCategory] > 0) ? $topCategory : 'Other';
    }

    private function calculatePriorityScore(string $severity, string $description, array $systemSpecs): int
    {
        return match($severity) {
            'high'   => random_int(80, 100),
            'medium' => random_int(40, 79),
            default  => random_int(10, 39),
        };
    }

    private function buildAnalysisNotes(string $severity, string $category, string $description): string
    {
        $notes = "Local rule-based analysis (no AI). ";
        $notes .= "Detected category: {$category}. ";
        $notes .= "Estimated severity: {$severity}. ";
        $notes .= "For enhanced AI analysis, enable AI_DRIVER=gemini in .env.";
        return $notes;
    }
}
