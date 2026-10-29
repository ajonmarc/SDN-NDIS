<?php

use App\Models\AccessLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    if (! $request->session()->has('guest_visit_logged') && Schema::hasTable('access_logs')) {
        AccessLog::create([
            'user_id' => $request->user()?->id,
            'event_type' => 'GUEST_VISIT',
            'ip_address' => $request->ip(),
            'accessed_at' => now(),
        ]);

        $request->session()->put('guest_visit_logged', true);
    }

    return Inertia::render('Welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    require __DIR__.'/head.php';
    require __DIR__.'/pdrrmo.php';
    require __DIR__.'/guest.php';
});

require __DIR__.'/settings.php';
