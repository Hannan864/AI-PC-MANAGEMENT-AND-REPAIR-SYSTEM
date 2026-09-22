<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: UpdatePCBuildRequest
 *
 * Validates payloads for updating an existing PC build configuration.
 * All component fields are optional — only provided fields are updated.
 * The build must be in 'draft' status to allow component changes.
 */
class UpdatePCBuildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'build_name'   => ['sometimes', 'string', 'max:255'],
            'cpu'          => ['sometimes', 'string', 'max:255'],
            'gpu'          => ['sometimes', 'string', 'max:255'],
            'motherboard'  => ['sometimes', 'string', 'max:255'],
            'ram'          => ['sometimes', 'string', 'max:255'],
            'storage'      => ['sometimes', 'string', 'max:255'],
            'power_supply' => ['sometimes', 'string', 'max:255'],
            'chassis'      => ['nullable', 'string', 'max:255'],
            'user_notes'   => ['nullable', 'string', 'max:2000'],
        ];
    }
}
