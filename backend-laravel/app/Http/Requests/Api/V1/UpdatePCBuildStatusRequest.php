<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: UpdatePCBuildStatusRequest
 *
 * Validates payloads for updating a PC build's workflow status.
 *
 * Full lifecycle:
 *   draft → submitted_review → under_review → reviewed → in_progress → completed
 *   any review stage ──────────────────────────────────────────────→ rejected
 */
class UpdatePCBuildStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'           => ['required', 'string', 'in:draft,submitted_review,under_review,reviewed,rejected,in_progress,completed'],
            'technician_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Please specify the new status.',
            'status.in'       => 'The selected status is not valid for this operation.',
        ];
    }
}
