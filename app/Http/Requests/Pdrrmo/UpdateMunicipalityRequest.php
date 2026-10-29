<?php

namespace App\Http\Requests\Pdrrmo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMunicipalityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'municipality_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('municipalities', 'municipality_name')->ignore($this->route('municipality')),
            ],
        ];
    }
}

