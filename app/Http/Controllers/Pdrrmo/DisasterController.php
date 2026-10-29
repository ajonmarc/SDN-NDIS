<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreDisasterRequest;
use App\Http\Requests\Pdrrmo\UpdateDisasterRequest;
use App\Models\Disaster;
use App\Models\DisasterType;
use App\Models\Municipality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class DisasterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disasters/Index', [
            'municipalities' => Municipality::query()
                ->select('id', 'municipality_name')
                ->orderBy('municipality_name')
                ->get(),
            'disasterTypes' => DisasterType::query()
                ->select('id', 'type_name')
                ->orderBy('type_name')
                ->get(),
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        $query = Disaster::query()
            ->with(['municipality', 'disasterType', 'creator']);

        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('severity', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('municipality', function ($q) use ($search) {
                        $q->where('municipality_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('disasterType', function ($q) use ($search) {
                        $q->where('type_name', 'like', "%{$search}%");
                    });
            });
        }

        $allowedSorts = ['id', 'title', 'occurred_at', 'severity', 'status', 'created_at'];
        $sort = $request->input('sort');

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $order = $request->input('order', 'asc');
            if (! in_array($order, ['asc', 'desc'], true)) {
                $order = 'asc';
            }
            $query->orderBy($sort, $order);
        } else {
            $query->latest('occurred_at');
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (Disaster $disaster) {
                    return [
                        'id' => $disaster->id,
                        'title' => $disaster->title,
                        'description' => $disaster->description,
                        'municipality_id' => $disaster->municipality_id,
                        'municipality_name' => $disaster->municipality?->municipality_name ?? 'N/A',
                        'disaster_type_id' => $disaster->disaster_type_id,
                        'disaster_type_name' => $disaster->disasterType?->type_name ?? 'N/A',
                        'latitude' => $disaster->latitude,
                        'longitude' => $disaster->longitude,
                        'coordinates' => ($disaster->latitude !== null && $disaster->longitude !== null)
                            ? "{$disaster->latitude}, {$disaster->longitude}"
                            : 'Not set',
                        'occurred_at' => $disaster->occurred_at?->format('Y-m-d\TH:i'),
                        'occurred_at_formatted' => $disaster->occurred_at?->format('M d, Y h:i A'),
                        'severity' => $disaster->severity,
                        'status' => $disaster->status,
                        'created_by_name' => $disaster->creator?->name ?? 'System',
                    ];
                })
        );
    }

    public function store(StoreDisasterRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        Disaster::create($data);

        Swal::success([
            'title' => 'Disaster Recorded!',
            'text' => 'Disaster record has been saved successfully.',
        ]);

        return redirect()->route('pdrrmo.disasters.index');
    }

    public function update(UpdateDisasterRequest $request, Disaster $disaster): RedirectResponse
    {
        $disaster->update($request->validated());

        Swal::success([
            'title' => 'Disaster Updated!',
            'text' => 'Disaster record has been updated successfully.',
        ]);

        return redirect()->route('pdrrmo.disasters.index');
    }

    public function destroy(Disaster $disaster): RedirectResponse
    {
        $disaster->delete();

        Swal::success([
            'title' => 'Disaster Deleted!',
            'text' => 'Disaster record has been deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.disasters.index');
    }
}
