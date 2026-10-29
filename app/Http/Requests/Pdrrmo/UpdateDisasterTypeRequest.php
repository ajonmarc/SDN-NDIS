<?php

namespace App\Http\Requests\Pdrrmo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDisasterTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $disasterTypeId = $this->route('disasterType')->id;

        return [
            'type_name' => ['required', 'string', 'max:100', Rule::unique('disaster_types', 'type_name')->ignore($disasterTypeId)],
            'description' => ['nullable', 'string'],
        ];
    }
}

