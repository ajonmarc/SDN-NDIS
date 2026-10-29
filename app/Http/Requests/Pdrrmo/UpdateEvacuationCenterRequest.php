<?php

namespace App\Http\Requests\Pdrrmo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvacuationCenterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'municipality_id' => ['required', 'exists:municipalities,id'],
            'center_name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'capacity' => ['required', 'integer', 'min:1'],
            'current_occupancy' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'string', 'max:50'],
        ];
    }
}

