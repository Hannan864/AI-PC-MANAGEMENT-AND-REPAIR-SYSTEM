<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest: StorePCBuildRequest
 *
 * Validates payloads for creating a new PC build configuration.
 * All component fields are required to ensure the compatibility
 * engine can perform a full analysis on submission.
 */
class StorePCBuildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'build_name'   => ['required', 'string', 'max:255'],
            'cpu'          => ['required', 'string', 'max:255'],
            'gpu'          => ['required', 'string', 'max:255'],
            'motherboard'  => ['required', 'string', 'max:255'],
            'ram'          => ['required', 'string', 'max:255'],
            'storage'      => ['required', 'string', 'max:255'],
            'power_supply' => ['required', 'string', 'max:255'],
            'chassis'      => ['nullable', 'string', 'max:255'],
            'user_notes'   => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'build_name.required'   => 'Build name is required.',
            'cpu.required'          => 'CPU selection is required.',
            'gpu.required'          => 'GPU selection is required.',
            'motherboard.required'  => 'Motherboard selection is required.',
            'ram.required'          => 'RAM selection is required.',
            'storage.required'      => 'Storage selection is required.',
            'power_supply.required' => 'Power supply selection is required.',
        ];
    }
}
