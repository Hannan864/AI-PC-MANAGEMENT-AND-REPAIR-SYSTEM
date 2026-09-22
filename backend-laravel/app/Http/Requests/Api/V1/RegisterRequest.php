<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

/**
 * FormRequest: RegisterRequest
 *
 * Validates user registration payloads.
 * Enforces secure password requirements per project standards.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'role'     => ['sometimes', 'string', 'in:user,technician'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'    => 'An account with this email address already exists.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.min'    => 'Password must be at least 8 characters.',
        ];
    }
}
