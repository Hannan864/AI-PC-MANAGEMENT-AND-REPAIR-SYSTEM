<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'          => ['sometimes', 'string', 'max:255'],
            'description'    => ['sometimes', 'string', 'max:2000'],
            'category'       => ['sometimes', 'string', 'in:Hardware,Software,Network,Full Repair'],
            'price'          => ['sometimes', 'numeric', 'min:0'],
            'estimated_time' => ['sometimes', 'string', 'max:100'],
            'is_available'   => ['sometimes', 'boolean'],
        ];
    }
}
