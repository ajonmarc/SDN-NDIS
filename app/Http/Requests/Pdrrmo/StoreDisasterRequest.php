<?php

namespace App\Http\Requests\Pdrrmo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisasterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'municipality_id' => ['required', 'integer', Rule::exists('municipalities', 'id')],
            'disaster_type_id' => ['required', 'integer', Rule::exists('disaster_types', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'occurred_at' => ['required', 'date'],
            'severity' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'max:50'],
        ];
    }
}

