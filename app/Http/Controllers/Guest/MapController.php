<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Disaster;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
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

    public function index(): Response
    {
        $municipalities = Municipality::query()
            ->select('id', 'municipality_name')
            ->orderBy('municipality_name')
            ->get();

        $disasters = Disaster::query()
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
                    'occurred_at' => $disaster->occurred_at?->format('M d, Y h:i A') ?? 'N/A',
                    'severity' => $disaster->severity,
                    'status' => $disaster->status,
                    'updates' => $disaster->updates->map(fn ($u) => [
                        'id' => $u->id,
                        'message' => $u->message,
                        'published_at' => $u->published_at?->format('M d, Y h:i A') ?? 'N/A',
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        $evacuationCenters = EvacuationCenter::query()
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
            ->all();

        return Inertia::render('guest/map/Index', [
            'municipalities' => $municipalities,
            'disasters' => $disasters,
            'evacuationCenters' => $evacuationCenters,
        ]);
    }
}
