<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreGigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'          => ['required', 'string', 'max:255'],
            'description'    => ['required', 'string', 'max:2000'],
            'category'       => ['required', 'string', 'in:Hardware,Software,Network,Full Repair'],
            'price'          => ['required', 'numeric', 'min:0'],
            'estimated_time' => ['required', 'string', 'max:100'],
        ];
    }
}
