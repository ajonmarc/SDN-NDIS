<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $roleName = $user?->role?->name;

        $redirectTo = match ($roleName) {
            'Superadmin' => route('superadmin.dashboard'),
            'PDRRMO' => route('pdrrmo.dashboard'),
            'GUEST' => route('guest.dashboard'),
            default => route('home'),
        };

        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended($redirectTo);
    }
}