<?php

namespace App\Http\Requests\Head;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'full_address' => ['nullable', 'string', 'max:1000'],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')->whereNot('name', 'HEAD')],
        ];
    }
}

