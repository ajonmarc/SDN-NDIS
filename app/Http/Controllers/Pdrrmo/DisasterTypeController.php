<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreDisasterTypeRequest;
use App\Http\Requests\Pdrrmo\UpdateDisasterTypeRequest;
use App\Models\DisasterType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class DisasterTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disaster-types/Index');
    }

    public function getData(Request $request): JsonResponse
    {
        $query = DisasterType::query();

        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('type_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $allowedSorts = ['id', 'type_name', 'description', 'created_at'];
        $sort = $request->input('sort');

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $order = $request->input('order', 'asc');
            if (! in_array($order, ['asc', 'desc'], true)) {
                $order = 'asc';
            }
            $query->orderBy($sort, $order);
        } else {
            $query->latest();
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (DisasterType $type) {
                    return [
                        'id' => $type->id,
                        'type_name' => $type->type_name,
                        'description' => $type->description,
                    ];
                })
        );
    }

    public function store(StoreDisasterTypeRequest $request): RedirectResponse
    {
        DisasterType::create($request->validated());

        Swal::success([
            'title' => 'Disaster Type Created!',
            'text' => 'Disaster type created successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-types.index');
    }

    public function update(UpdateDisasterTypeRequest $request, DisasterType $disasterType): RedirectResponse
    {
        $disasterType->update($request->validated());

        Swal::success([
            'title' => 'Disaster Type Updated!',
            'text' => 'Disaster type updated successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-types.index');
    }

    public function destroy(DisasterType $disasterType): RedirectResponse
    {
        $disasterType->delete();

        Swal::success([
            'title' => 'Disaster Type Deleted!',
            'text' => 'Disaster type deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.disaster-types.index');
    }
}
