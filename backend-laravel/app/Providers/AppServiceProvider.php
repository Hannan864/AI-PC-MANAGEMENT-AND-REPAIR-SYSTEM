<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\AI\AITriageInterface;
use App\Services\AI\GeminiTriageService;
use App\Services\AI\LocalRuleBasedTriageService;
use App\Services\SystemSnapshot;
use Illuminate\Support\ServiceProvider;

/**
 * AppServiceProvider
 *
 * Registers core service bindings including the modular AI triage interface.
 *
 * AI driver selection is entirely controlled by .env:
 *   AI_ENABLED=false    → always uses LocalRuleBasedTriageService
 *   AI_DRIVER=gemini    → uses GeminiTriageService (requires GEMINI_API_KEY)
 *   AI_DRIVER=local     → uses LocalRuleBasedTriageService
 *
 * Adding a new AI driver (e.g. OpenAI) requires:
 *   1. Create App\Services\AI\OpenAITriageService implementing AITriageInterface
 *   2. Add a new case in the match() below
 *   3. Set AI_DRIVER=openai in .env
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SystemSnapshot::class);

        $this->app->bind(AITriageInterface::class, function ($app) {
            $fallback = new LocalRuleBasedTriageService();

            // Hard-disabled via .env — always use local rules
            if (! config('ai.enabled', false)) {
                return $fallback;
            }

            return match (config('ai.driver', 'local')) {
                'gemini' => new GeminiTriageService(
                    apiKey: config('ai.keys.gemini', ''),
                    fallback: $fallback,
                ),
                default => $fallback,
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
