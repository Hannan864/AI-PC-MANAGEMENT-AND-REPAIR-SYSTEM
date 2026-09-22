<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: StoreRepairRequestRequest
 *
 * Validates payloads for creating a new repair request.
 * Enforces required fields and optional system specification profile.
 */
class StoreRepairRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gig_title'               => ['nullable', 'string', 'max:255'],
            'issue_category'          => ['sometimes', 'string', 'max:255'],
            'issue_description'       => ['required', 'string', 'min:10', 'max:5000'],
            'severity_level'          => ['sometimes', 'string', 'in:low,medium,high'],
            'system_specifications'   => ['nullable', 'array'],
            'system_specifications.cpu'     => ['nullable', 'string', 'max:255'],
            'system_specifications.gpu'     => ['nullable', 'string', 'max:255'],
            'system_specifications.ram'     => ['nullable', 'string', 'max:255'],
            'system_specifications.storage' => ['nullable', 'string', 'max:255'],
            'system_specifications.os'      => ['nullable', 'string', 'max:255'],
            'user_images'             => ['nullable', 'array', 'max:10'],
            'user_images.*'           => ['file', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'pc_build_id'             => ['nullable', 'uuid', 'exists:pc_builds,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'issue_description.required' => 'Please describe the issue you are experiencing.',
            'issue_description.min'      => 'Issue description must be at least 10 characters.',
            'severity_level.in'          => 'Severity must be low, medium, or high.',
            'user_images.*.image'        => 'Each file must be an image.',
            'user_images.*.mimes'        => 'Only JPEG, PNG, GIF, and WebP images are allowed.',
            'user_images.*.max'          => 'Each image must be less than 5MB.',
            'pc_build_id.exists'         => 'The selected PC build does not exist.',
        ];
    }
}
