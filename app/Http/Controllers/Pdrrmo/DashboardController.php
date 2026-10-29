<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\Disaster;
use App\Models\DisasterType;
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

        $totalUpdates = DisasterUpdate::count();
        $totalMunicipalities = Municipality::count();
        $totalDisasterTypes = DisasterType::count();
        $totalAccessLogs = AccessLog::count();

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
            ]);

        $evacuationCenters = EvacuationCenter::query()
            ->with('municipality')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (EvacuationCenter $center) => [
                'id' => $center->id,
                'center_name' => $center->center_name,
                'municipality_name' => $center->municipality?->municipality_name ?? 'N/A',
                'capacity' => $center->capacity,
                'current_occupancy' => $center->current_occupancy,
                'status' => $center->status,
            ]);

        return Inertia::render('pdrrmo/Dashboard', [
            'stats' => [
                'total_disasters' => $totalDisasters,
                'active_disasters' => $activeDisasters,
                'critical_disasters' => $criticalDisasters,
                'total_centers' => $totalCenters,
                'open_centers' => $openCenters,
                'total_occupancy' => $totalOccupancy,
                'total_capacity' => $totalCapacity,
                'total_updates' => $totalUpdates,
                'total_municipalities' => $totalMunicipalities,
                'total_disaster_types' => $totalDisasterTypes,
                'total_access_logs' => $totalAccessLogs,
            ],
            'recentDisasters' => $recentDisasters,
            'evacuationCenters' => $evacuationCenters,
        ]);
    }
}
