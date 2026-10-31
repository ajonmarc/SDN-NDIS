<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Disaster;
use App\Models\DisasterType;
use App\Models\Municipality;
use Inertia\Inertia;
use Inertia\Response;

class DisasterController extends Controller
{
    public function index(): Response
    {
        $municipalities = Municipality::query()
            ->select('id', 'municipality_name')
            ->orderBy('municipality_name')
            ->get();

        $disasterTypes = DisasterType::query()
            ->select('id', 'type_name')
            ->orderBy('type_name')
            ->get();

        $disasters = Disaster::query()
            ->with([
                'municipality',
                'disasterType',
                'updates' => fn ($q) => $q->with('creator')->latest('published_at'),
            ])
            ->latest('occurred_at')
            ->get()
            ->map(fn (Disaster $disaster) => [
                'id' => $disaster->id,
                'title' => $disaster->title,
                'description' => $disaster->description,
                'municipality_id' => $disaster->municipality_id,
                'municipality_name' => $disaster->municipality?->municipality_name ?? 'N/A',
                'disaster_type_id' => $disaster->disaster_type_id,
                'disaster_type_name' => $disaster->disasterType?->type_name ?? 'N/A',
                'latitude' => $disaster->latitude,
                'longitude' => $disaster->longitude,
                'occurred_at' => $disaster->occurred_at?->format('M d, Y h:i A') ?? 'N/A',
                'severity' => $disaster->severity,
                'status' => $disaster->status,
                'updates' => $disaster->updates->map(fn ($update) => [
                    'id' => $update->id,
                    'message' => $update->message,
                    'published_at' => $update->published_at?->format('M d, Y h:i A') ?? 'N/A',
                    'author' => $update->creator?->name ?? 'PDRRMO',
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return Inertia::render('guest/disasters/Index', [
            'municipalities' => $municipalities,
            'disasterTypes' => $disasterTypes,
            'disasters' => $disasters,
        ]);
    }
}
