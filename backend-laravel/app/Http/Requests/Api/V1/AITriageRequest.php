<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: AITriageRequest
 *
 * Validates payloads for the AI triage endpoint.
 * Accepts repair request data for analysis.
 */
class AITriageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'issue_description'       => ['required', 'string', 'min:5', 'max:5000'],
            'system_specifications'   => ['nullable', 'array'],
            'system_specifications.cpu'     => ['nullable', 'string', 'max:255'],
            'system_specifications.gpu'     => ['nullable', 'string', 'max:255'],
            'system_specifications.ram'     => ['nullable', 'string', 'max:255'],
            'system_specifications.storage' => ['nullable', 'string', 'max:255'],
            'system_specifications.os'      => ['nullable', 'string', 'max:255'],
            'severity_level'          => ['sometimes', 'string', 'in:low,medium,high'],
        ];
    }

    public function messages(): array
    {
        return [
            'issue_description.required' => 'Issue description is required for AI analysis.',
            'issue_description.min'      => 'Issue description must be at least 5 characters.',
        ];
    }
}
