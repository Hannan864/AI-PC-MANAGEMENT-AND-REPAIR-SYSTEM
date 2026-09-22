<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Triage Configuration
    |--------------------------------------------------------------------------
    |
    | Controls the modular AI triage service layer.
    | Set AI_ENABLED=false to always use the local rule-based service.
    | Set AI_DRIVER=gemini to activate the Gemini API integration.
    |
    */

    'enabled' => env('AI_ENABLED', false),

    'driver' => env('AI_DRIVER', 'local'),

    'keys' => [
        'gemini' => env('GEMINI_API_KEY', ''),
    ],

];
