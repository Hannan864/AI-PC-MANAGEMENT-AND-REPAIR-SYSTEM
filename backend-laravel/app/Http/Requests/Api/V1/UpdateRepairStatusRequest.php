<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: UpdateRepairStatusRequest
 *
 * Validates payloads for updating a repair request's status.
 */
class UpdateRepairStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize status to lowercase before validation.
     * Frontend sends UPPERCASE (e.g. 'ACCEPTED', 'IN_PROGRESS') but
     * the database stores lowercase values.
     */
    public function prepareForValidation(): void
    {
        if ($this->has('status')) {
            $status = strtolower($this->input('status'));
            // The API resource exposes the assigned state as TECHNICIAN_ASSIGNED;
            // map it back to the canonical stored value before validation.
            if ($status === 'technician_assigned') {
                $status = 'assigned';
            }
            $this->merge(['status' => $status]);
        }
    }

    public function rules(): array
    {
        return [
            // 'submitted' is included so an admin can persist severity/note
            // changes on a still-submitted request (same-status update).
            'status' => ['required', 'string', 'in:submitted,assigned,accepted,in_progress,waiting_parts,testing,completed,cancelled'],
            'note'   => ['nullable', 'string', 'max:1000'],
            'severity_level' => ['nullable', 'string', 'in:low,medium,high'],
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
