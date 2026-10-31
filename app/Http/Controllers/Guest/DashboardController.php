<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Disaster;
use App\Models\DisasterUpdate;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalDisasters = Disaster::count();
        $activeDisasters = Disaster::whereIn('status', ['Active', 'Monitoring'])->count();
        $criticalDisasters = Disaster::whereIn('severity', ['Critical', 'High'])
            ->whereIn('status', ['Active', 'Monitoring'])
            ->count();

        $totalCenters = EvacuationCenter::count();
        $openCenters = EvacuationCenter::where('status', 'Open')->count();
        $totalOccupancy = (int) EvacuationCenter::sum('current_occupancy');
        $totalCapacity = (int) EvacuationCenter::sum('capacity');
        $availableSlots = max($totalCapacity - $totalOccupancy, 0);

        $totalUpdates = DisasterUpdate::count();
        $totalMunicipalities = Municipality::count();

        $recentDisasters = Disaster::query()
            ->with(['municipality', 'disasterType'])
            ->latest('occurred_at')
            ->limit(5)
            ->get()
            ->map(fn (Disaster $disaster) => [
                'id' => $disaster->id,
                'title' => $disaster->title,
                'municipality_name' => $disaster->municipality?->municipality_name ?? 'N/A',
                'disaster_type_name' => $disaster->disasterType?->type_name ?? 'N/A',
                'severity' => $disaster->severity,
                'status' => $disaster->status,
                'occurred_at' => $disaster->occurred_at?->format('M d, Y h:i A') ?? 'N/A',
            ])
            ->values()
            ->all();

        $evacuationCenters = EvacuationCenter::query()
            ->with('municipality')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (EvacuationCenter $center) => [
                'id' => $center->id,
                'center_name' => $center->center_name,
                'municipality_name' => $center->municipality?->municipality_name ?? 'N/A',
                'capacity' => (int) $center->capacity,
                'current_occupancy' => (int) $center->current_occupancy,
                'available_slots' => max((int) $center->capacity - (int) $center->current_occupancy, 0),
                'status' => $center->status,
            ])
            ->values()
            ->all();

        $recentUpdates = DisasterUpdate::query()
            ->with('disaster.municipality')
            ->latest('published_at')
            ->limit(3)
            ->get()
            ->map(fn (DisasterUpdate $update) => [
                'id' => $update->id,
                'disaster_title' => $update->disaster?->title ?? 'General Advisory',
                'municipality_name' => $update->disaster?->municipality?->municipality_name ?? 'Surigao del Norte',
                'message' => $update->message,
                'published_at' => $update->published_at?->format('M d, Y h:i A') ?? 'N/A',
            ])
            ->values()
            ->all();

        return Inertia::render('guest/Dashboard', [
            'stats' => [
                'total_disasters' => $totalDisasters,
                'active_disasters' => $activeDisasters,
                'critical_disasters' => $criticalDisasters,
                'total_centers' => $totalCenters,
                'open_centers' => $openCenters,
                'total_occupancy' => $totalOccupancy,
                'total_capacity' => $totalCapacity,
                'available_slots' => $availableSlots,
                'total_updates' => $totalUpdates,
                'total_municipalities' => $totalMunicipalities,
            ],
            'recentDisasters' => $recentDisasters,
            'evacuationCenters' => $evacuationCenters,
            'recentUpdates' => $recentUpdates,
        ]);
    }
}
