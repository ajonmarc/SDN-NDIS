<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreDisasterUpdateRequest;
use App\Http\Requests\Pdrrmo\UpdateDisasterUpdateRequest;
use App\Models\Disaster;
use App\Models\DisasterUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class DisasterUpdateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disaster-updates/Index', [
            'disasters' => Disaster::query()
                ->select('id', 'title')
                ->latest('occurred_at')
                ->get(),
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        $query = DisasterUpdate::query()
            ->with(['disaster', 'creator']);

        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('message', 'like', "%{$search}%")
                    ->orWhereHas('disaster', function ($q) use ($search) {
                        $q->where('title', 'like', "%{$search}%");
                    });
            });
        }

        $allowedSorts = ['id', 'published_at', 'created_at'];
        $sort = $request->input('sort');

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $order = $request->input('order', 'asc');
            if (! in_array($order, ['asc', 'desc'], true)) {
                $order = 'asc';
            }
            $query->orderBy($sort, $order);
        } else {
            $query->latest('published_at');
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (DisasterUpdate $update) {
                    return [
                        'id' => $update->id,
                        'disaster_id' => $update->disaster_id,
                        'disaster_title' => $update->disaster?->title ?? 'N/A',
                        'message' => $update->message,
                        'published_at' => $update->published_at?->format('Y-m-d\TH:i'),
                        'published_at_formatted' => $update->published_at?->format('M d, Y h:i A') ?? 'Draft',
                        'created_by_name' => $update->creator?->name ?? 'System',
                    ];
                })
        );
    }

    public function store(StoreDisasterUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['published_at'] = $data['published_at'] ?? now();

        DisasterUpdate::create($data);

        Swal::success([
            'title' => 'Update Published!',
            'text' => 'Disaster update has been published successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-updates.index');
    }

    public function update(UpdateDisasterUpdateRequest $request, DisasterUpdate $disasterUpdate): RedirectResponse
    {
        $data = $request->validated();
        $data['published_at'] = $data['published_at'] ?? $disasterUpdate->published_at ?? now();

        $disasterUpdate->update($data);

        Swal::success([
            'title' => 'Update Saved!',
            'text' => 'Disaster update has been updated successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-updates.index');
    }

    public function destroy(DisasterUpdate $disasterUpdate): RedirectResponse
    {
        $disasterUpdate->delete();

        Swal::success([
            'title' => 'Update Deleted!',
            'text' => 'Disaster update has been deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-updates.index');
    }
}
