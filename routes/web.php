<?php

use App\Models\AccessLog;
use App\Models\Disaster;
use App\Models\DisasterUpdate;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
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

    $stats = [
        'active_disasters' => Schema::hasTable('disasters')
            ? Disaster::whereIn('status', ['Active', 'Monitoring'])->count()
            : 0,
        'open_centers' => Schema::hasTable('evacuation_centers')
            ? EvacuationCenter::where('status', 'Open')->count()
            : 0,
        'total_municipalities' => Schema::hasTable('municipalities')
            ? Municipality::count()
            : 21,
        'total_updates' => Schema::hasTable('disaster_updates')
            ? DisasterUpdate::count()
            : 0,
    ];

    $recentUpdates = Schema::hasTable('disaster_updates')
        ? DisasterUpdate::query()
            ->with('disaster.municipality')
            ->latest('published_at')
            ->limit(3)
            ->get()
            ->map(fn (DisasterUpdate $update) => [
                'id' => $update->id,
                'disaster_title' => $update->disaster?->title ?? 'General Advisory',
                'municipality_name' => $update->disaster?->municipality?->municipality_name ?? 'Surigao del Norte',
                'message' => $update->message,
                'published_at' => $update->published_at?->format('M d, Y h:i A') ?? 'Just now',
            ])
        : [];

    return Inertia::render('Welcome', [
        'stats' => $stats,
        'recentUpdates' => $recentUpdates,
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    require __DIR__.'/head.php';
    require __DIR__.'/pdrrmo.php';
    require __DIR__.'/guest.php';
});

require __DIR__.'/settings.php';
