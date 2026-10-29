<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreMunicipalityRequest;
use App\Http\Requests\Pdrrmo\UpdateMunicipalityRequest;
use App\Models\Municipality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class MunicipalityController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/municipalities/Index');
    }

    public function getData(Request $request): JsonResponse
    {
        $query = Municipality::query()
            ->withCount(['disasters', 'evacuationCenters']);

        if ($search = $request->input('search')) {
            $query->where('municipality_name', 'like', "%{$search}%");
        }

        $allowedSorts = ['id', 'municipality_name', 'disasters_count', 'evacuation_centers_count', 'created_at'];
        $sort = $request->input('sort');

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $order = $request->input('order', 'asc');
            if (! in_array($order, ['asc', 'desc'], true)) {
                $order = 'asc';
            }
            $query->orderBy($sort, $order);
        } else {
            $query->orderBy('municipality_name');
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (Municipality $municipality) {
                    return [
                        'id' => $municipality->id,
                        'municipality_name' => $municipality->municipality_name,
                        'disasters_count' => $municipality->disasters_count,
                        'evacuation_centers_count' => $municipality->evacuation_centers_count,
                    ];
                })
        );
    }

    public function store(StoreMunicipalityRequest $request): RedirectResponse
    {
        Municipality::create($request->validated());

        Swal::success([
            'title' => 'Municipality Created!',
            'text' => 'Municipality has been added successfully.',
        ]);

        return redirect()->route('pdrrmo.municipalities.index');
    }

    public function update(UpdateMunicipalityRequest $request, Municipality $municipality): RedirectResponse
    {
        $municipality->update($request->validated());

        Swal::success([
            'title' => 'Municipality Updated!',
            'text' => 'Municipality details have been updated successfully.',
        ]);

        return redirect()->route('pdrrmo.municipalities.index');
    }

    public function destroy(Municipality $municipality): RedirectResponse
    {
        $municipality->delete();

        Swal::success([
            'title' => 'Municipality Deleted!',
            'text' => 'Municipality has been deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.municipalities.index');
    }
}
