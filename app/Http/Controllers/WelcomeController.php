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
    /**
     * Default municipality center coordinates in Surigao del Norte
     * used as a fallback when a record does not have explicit GPS coordinates yet.
     *
     * @var array<string, array{0: float, 1: float}>
     */
    private const MUNICIPALITY_COORDINATES = [
        'Surigao City' => [9.78440000, 125.49500000],
        'Alegria' => [9.46860000, 125.57690000],
        'Bacuag' => [9.60830000, 125.63780000],
        'Burgos' => [10.02110000, 126.07360000],
        'Claver' => [9.57250000, 125.73310000],
        'Dapa' => [9.75940000, 126.05310000],
        'Del Carmen' => [9.86940000, 125.97080000],
        'General Luna' => [9.78250000, 126.15580000],
        'Gigaquit' => [9.59580000, 125.69750000],
        'Mainit' => [9.53720000, 125.52310000],
        'Malimono' => [9.61940000, 125.40280000],
        'Pilar' => [9.86500000, 126.09890000],
        'Placer' => [9.65420000, 125.60250000],
        'San Benito' => [9.95750000, 126.00560000],
        'San Francisco (Anao-Aon)' => [9.71360000, 125.43060000],
        'San Isidro' => [9.93670000, 126.08580000],
        'Santa Monica (Sapao)' => [10.01970000, 126.03810000],
        'Sison' => [9.66170000, 125.52940000],
        'Socorro' => [9.62140000, 125.96670000],
        'Tagana-an' => [9.69720000, 125.58190000],
        'Tubod' => [9.56670000, 125.56670000],
    ];

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

        $municipalities = $hasMunicipalities
            ? Municipality::query()
                ->select('id', 'municipality_name')
                ->orderBy('municipality_name')
                ->get()
            : [];

        $disasters = $hasDisasters
            ? Disaster::query()
                ->with([
                    'municipality',
                    'disasterType',
                    'updates' => fn ($q) => $q->latest('published_at'),
                ])
                ->latest('occurred_at')
                ->get()
                ->map(function (Disaster $disaster) {
                    $muniName = $disaster->municipality?->municipality_name ?? 'Surigao City';
                    $hasExactCoords = $disaster->latitude !== null && $disaster->longitude !== null;
                    [$fallbackLat, $fallbackLng] = self::MUNICIPALITY_COORDINATES[$muniName] ?? [9.78440000, 125.49500000];

                    return [
                        'id' => $disaster->id,
                        'title' => $disaster->title,
                        'description' => $disaster->description,
                        'municipality_id' => $disaster->municipality_id,
                        'municipality_name' => $muniName,
                        'disaster_type_name' => $disaster->disasterType?->type_name ?? 'N/A',
                        'latitude' => $hasExactCoords ? (float) $disaster->latitude : $fallbackLat,
                        'longitude' => $hasExactCoords ? (float) $disaster->longitude : $fallbackLng,
                        'has_exact_coordinates' => $hasExactCoords,
                        'severity' => $disaster->severity,
                        'status' => $disaster->status,
                        'occurred_at' => $disaster->occurred_at?->format('M d, Y h:i A') ?? 'N/A',
                        'updates' => $disaster->updates->map(fn ($u) => [
                            'id' => $u->id,
                            'message' => $u->message,
                            'published_at' => $u->published_at?->format('M d, Y h:i A') ?? 'N/A',
                        ])->values()->all(),
                    ];
                })
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
                ->get()
                ->map(function (EvacuationCenter $center) {
                    $muniName = $center->municipality?->municipality_name ?? 'Surigao City';
                    $hasExactCoords = $center->latitude !== null && $center->longitude !== null;
                    [$fallbackLat, $fallbackLng] = self::MUNICIPALITY_COORDINATES[$muniName] ?? [9.78440000, 125.49500000];

                    return [
                        'id' => $center->id,
                        'center_name' => $center->center_name,
                        'address' => $center->address,
                        'municipality_id' => $center->municipality_id,
                        'municipality_name' => $muniName,
                        'image' => $center->image,
                        'latitude' => $hasExactCoords ? (float) $center->latitude : $fallbackLat,
                        'longitude' => $hasExactCoords ? (float) $center->longitude : $fallbackLng,
                        'has_exact_coordinates' => $hasExactCoords,
                        'capacity' => (int) $center->capacity,
                        'current_occupancy' => (int) $center->current_occupancy,
                        'status' => $center->status,
                    ];
                })
                ->values()
                ->all()
            : [];

        return Inertia::render('Welcome', [
            'stats' => $stats,
            'municipalities' => $municipalities,
            'disasters' => $disasters,
            'updates' => $updates,
            'evacuationCenters' => $evacuationCenters,
        ]);
    }
}

