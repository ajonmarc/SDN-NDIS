<?php

namespace App\Http\Controllers;

use App\Models\AccessLog;
use App\Models\Disaster;
use App\Models\DisasterUpdate;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function index(Request $request): Response
    {
        if (! $request->session()->has('guest_visit_logged') && Schema::hasTable('access_logs')) {
            AccessLog::create([
                'user_id' => $request->user()?->id,
                'event_type' => 'GUEST_VISIT',
                'ip_address' => $request->ip(),
                'accessed_at' => now(),
            ]);

            $request->session()->put('guest_visit_logged', true);
        }

        $hasDisasters = Schema::hasTable('disasters');
        $hasCenters = Schema::hasTable('evacuation_centers');
        $hasUpdates = Schema::hasTable('disaster_updates');
        $hasMunicipalities = Schema::hasTable('municipalities');

        $stats = [
            'total_disasters' => $hasDisasters ? Disaster::count() : 0,
            'active_disasters' => $hasDisasters
                ? Disaster::whereIn('status', ['Active', 'Monitoring'])->count()
                : 0,
            'total_centers' => $hasCenters ? EvacuationCenter::count() : 0,
            'open_centers' => $hasCenters
                ? EvacuationCenter::where('status', 'Open')->count()
                : 0,
            'total_occupancy' => $hasCenters ? (int) EvacuationCenter::sum('current_occupancy') : 0,
            'total_capacity' => $hasCenters ? (int) EvacuationCenter::sum('capacity') : 0,
            'total_municipalities' => $hasMunicipalities ? Municipality::count() : 0,
            'total_updates' => $hasUpdates ? DisasterUpdate::count() : 0,
        ];

        $disasters = $hasDisasters
            ? Disaster::query()
                ->with(['municipality', 'disasterType'])
                ->latest('occurred_at')
                ->limit(6)
                ->get()
                ->map(fn (Disaster $disaster) => [
                    'id' => $disaster->id,
                    'title' => $disaster->title,
                    'description' => $disaster->description,
                    'municipality_name' => $disaster->municipality?->municipality_name ?? 'N/A',
                    'disaster_type_name' => $disaster->disasterType?->type_name ?? 'N/A',
                    'severity' => $disaster->severity,
                    'status' => $disaster->status,
                    'occurred_at' => $disaster->occurred_at?->format('M d, Y h:i A') ?? 'N/A',
                ])
                ->values()
                ->all()
            : [];

        $updates = $hasUpdates
            ? DisasterUpdate::query()
                ->with('disaster.municipality')
                ->latest('published_at')
                ->limit(6)
                ->get()
                ->map(fn (DisasterUpdate $update) => [
                    'id' => $update->id,
                    'disaster_title' => $update->disaster?->title ?? 'General Advisory',
                    'municipality_name' => $update->disaster?->municipality?->municipality_name ?? 'Surigao del Norte',
                    'message' => $update->message,
                    'published_at' => $update->published_at?->format('M d, Y h:i A') ?? 'N/A',
                ])
                ->values()
                ->all()
            : [];

        $evacuationCenters = $hasCenters
            ? EvacuationCenter::query()
                ->with('municipality')
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (EvacuationCenter $center) => [
                    'id' => $center->id,
                    'center_name' => $center->center_name,
                    'address' => $center->address,
                    'municipality_name' => $center->municipality?->municipality_name ?? 'N/A',
                    'image' => $center->image,
                    'capacity' => $center->capacity,
                    'current_occupancy' => $center->current_occupancy,
                    'status' => $center->status,
                ])
                ->values()
                ->all()
            : [];

        return Inertia::render('Welcome', [
            'stats' => $stats,
            'disasters' => $disasters,
            'updates' => $updates,
            'evacuationCenters' => $evacuationCenters,
        ]);
    }
}

