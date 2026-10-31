<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use Inertia\Inertia;
use Inertia\Response;

class EvacuationCenterController extends Controller
{
    public function index(): Response
    {
        $municipalities = Municipality::query()
            ->select('id', 'municipality_name')
            ->orderBy('municipality_name')
            ->get();

        $evacuationCenters = EvacuationCenter::query()
            ->with('municipality')
            ->latest()
            ->get()
            ->map(fn (EvacuationCenter $center) => [
                'id' => $center->id,
                'center_name' => $center->center_name,
                'address' => $center->address,
                'municipality_id' => $center->municipality_id,
                'municipality_name' => $center->municipality?->municipality_name ?? 'N/A',
                'image' => $center->image,
                'latitude' => $center->latitude,
                'longitude' => $center->longitude,
                'capacity' => (int) $center->capacity,
                'current_occupancy' => (int) $center->current_occupancy,
                'available_slots' => max((int) $center->capacity - (int) $center->current_occupancy, 0),
                'status' => $center->status,
            ])
            ->values()
            ->all();

        return Inertia::render('guest/evacuation-centers/Index', [
            'municipalities' => $municipalities,
            'evacuationCenters' => $evacuationCenters,
        ]);
    }
}
