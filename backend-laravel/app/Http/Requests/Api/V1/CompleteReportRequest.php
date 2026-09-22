<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: CompleteReportRequest
 *
 * Validates payloads for submitting a completion report.
 * Requires issue summary, root cause, parts list, and labor cost.
 */
class CompleteReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'issue_summary'       => ['required', 'string', 'max:2000'],
            'root_cause'          => ['required', 'string', 'max:2000'],
            'parts_replaced'      => ['nullable', 'array'],
            'parts_replaced.*.name'  => ['required_with:parts_replaced', 'string', 'max:255'],
            'parts_replaced.*.cost'  => ['required_with:parts_replaced', 'numeric', 'min:0'],
            'parts_replaced.*.qty'   => ['nullable', 'integer', 'min:1'],
            'labor_cost'          => ['required', 'numeric', 'min:0'],
            'work_notes'          => ['nullable', 'string', 'max:2000'],
            'time_spent_minutes'  => ['required', 'integer', 'min:1'],
            'completion_images'   => ['nullable', 'array', 'max:10'],
            'completion_images.*' => ['file', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'issue_summary.required'         => 'Issue summary is required.',
            'root_cause.required'            => 'Root cause analysis is required.',
            'labor_cost.required'            => 'Labor cost is required.',
            'labor_cost.numeric'             => 'Labor cost must be a number.',
            'time_spent_minutes.required'    => 'Time spent is required.',
            'time_spent_minutes.integer'     => 'Time spent must be a whole number.',
            'time_spent_minutes.min'         => 'Time spent must be at least 1 minute.',
            'completion_images.*.image'      => 'Each file must be an image.',
            'completion_images.*.mimes'      => 'Only JPEG, PNG, GIF, and WebP images are allowed.',
            'completion_images.*.max'        => 'Each image must be less than 5MB.',
            'parts_replaced.*.name.required_with' => 'Part name is required when parts are listed.',
            'parts_replaced.*.cost.required_with' => 'Part cost is required when parts are listed.',
        ];
    }
}
