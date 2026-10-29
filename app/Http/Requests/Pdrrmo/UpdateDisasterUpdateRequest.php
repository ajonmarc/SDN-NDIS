<?php

namespace App\Http\Requests\Pdrrmo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDisasterUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'disaster_id' => ['required', 'integer', Rule::exists('disasters', 'id')],
            'message' => ['required', 'string'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}

