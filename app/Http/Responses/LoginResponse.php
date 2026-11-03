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
            'HEAD' => route('head.dashboard', absolute: false),
            'PDRRMO' => route('pdrrmo.dashboard', absolute: false),
            'GUEST' => route('guest.dashboard', absolute: false),
            default => route('home', absolute: false),
        };

        // Clear any stale http:// intended URL that could trigger Mixed Content blocks on HTTPS tunnels
        $intended = $request->session()->pull('url.intended');
        if (is_string($intended) && $intended !== '') {
            $parsedPath = parse_url($intended, PHP_URL_PATH);
            if (is_string($parsedPath) && str_starts_with($parsedPath, '/') && $parsedPath !== '/login') {
                $redirectTo = $parsedPath;
            }
        }

        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->to($redirectTo);
    }
}