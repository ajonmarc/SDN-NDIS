<?php

namespace App\Http\Controllers\Head;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\Disaster;
use App\Models\DisasterType;
use App\Models\DisasterUpdate;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $managedUsersQuery = User::query()
            ->where('email', '!=', 'ricoadolfo@gmail.com')
            ->whereDoesntHave('role', fn ($q) => $q->where('name', 'HEAD'));

        $totalUsers = (clone $managedUsersQuery)->count();
        $pdrrmoCount = (clone $managedUsersQuery)
            ->whereHas('role', fn ($q) => $q->where('name', 'PDRRMO'))
            ->count();
        $guestCount = (clone $managedUsersQuery)
            ->whereHas('role', fn ($q) => $q->where('name', 'GUEST'))
            ->count();

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

        $recentUsers = (clone $managedUsersQuery)
            ->with('role')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_name' => $user->role?->name ?? 'None',
                'created_at' => $user->created_at?->format('M d, Y') ?? 'N/A',
            ]);

        $recentAccessLogs = AccessLog::query()
            ->with('user.role')
            ->orderByDesc('accessed_at')
            ->limit(5)
            ->get()
            ->map(fn (AccessLog $log) => [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_name' => $log->user?->name ?? 'Anonymous Visitor',
                'user_role' => $log->user?->role?->name,
                'event_type' => $log->event_type,
                'ip_address' => $log->ip_address ?? 'Unknown',
                'accessed_at' => $log->accessed_at?->format('M d, Y h:i A') ?? 'N/A',
            ]);

        return Inertia::render('head/Dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'pdrrmo_count' => $pdrrmoCount,
                'guest_count' => $guestCount,
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
            'recentUsers' => $recentUsers,
            'recentAccessLogs' => $recentAccessLogs,
        ]);
    }
}
