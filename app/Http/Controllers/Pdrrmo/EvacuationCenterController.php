<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreEvacuationCenterRequest;
use App\Http\Requests\Pdrrmo\UpdateEvacuationCenterRequest;
use App\Models\EvacuationCenter;
use App\Models\Municipality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class EvacuationCenterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/evacuation-centers/Index', [
            'municipalities' => Municipality::query()
                ->select('id', 'municipality_name')
                ->orderBy('municipality_name')
                ->get(),
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        $query = EvacuationCenter::query()
            ->with(['municipality', 'creator']);

        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('center_name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('municipality', function ($q) use ($search) {
                        $q->where('municipality_name', 'like', "%{$search}%");
                    });
            });
        }

        $allowedSorts = ['id', 'center_name', 'capacity', 'current_occupancy', 'status', 'created_at'];
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
                ->through(function (EvacuationCenter $center) {
                    return [
                        'id' => $center->id,
                        'center_name' => $center->center_name,
                        'address' => $center->address,
                        'municipality_id' => $center->municipality_id,
                        'municipality_name' => $center->municipality?->municipality_name ?? 'N/A',
                        'image' => $center->image,
                        'latitude' => $center->latitude,
                        'longitude' => $center->longitude,
                        'coordinates' => ($center->latitude !== null && $center->longitude !== null)
                            ? "{$center->latitude}, {$center->longitude}"
                            : 'Not set',
                        'capacity' => $center->capacity,
                        'current_occupancy' => $center->current_occupancy,
                        'occupancy_display' => "{$center->current_occupancy} / {$center->capacity}",
                        'status' => $center->status,
                        'created_by_name' => $center->creator?->name ?? 'System',
                    ];
                })
        );
    }

    public function store(StoreEvacuationCenterRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image']);
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadImage($request->file('image'));
        }

        EvacuationCenter::create($data);

        Swal::success([
            'title' => 'Evacuation Center Created!',
            'text' => 'Evacuation center has been added successfully.',
        ]);

        return redirect()->route('pdrrmo.evacuation-centers.index');
    }

    public function update(UpdateEvacuationCenterRequest $request, EvacuationCenter $evacuationCenter): RedirectResponse
    {
        $data = $request->safe()->except(['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($evacuationCenter->image);
            $data['image'] = $this->uploadImage($request->file('image'));
        }

        $evacuationCenter->update($data);

        Swal::success([
            'title' => 'Evacuation Center Updated!',
            'text' => 'Evacuation center details have been updated successfully.',
        ]);

        return redirect()->route('pdrrmo.evacuation-centers.index');
    }

    public function destroy(EvacuationCenter $evacuationCenter): RedirectResponse
    {
        $this->deleteImage($evacuationCenter->image);
        $evacuationCenter->delete();

        Swal::success([
            'title' => 'Evacuation Center Deleted!',
            'text' => 'Evacuation center has been deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.evacuation-centers.index');
    }

    private function uploadImage(UploadedFile $file): string
    {
        $directory = public_path('uploads/evacuation-centers');

        if (! File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = uniqid('evac_', true).'.'.$file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return '/uploads/evacuation-centers/'.$filename;
    }

    private function deleteImage(?string $imagePath): void
    {
        if (! $imagePath || ! str_starts_with($imagePath, '/uploads/evacuation-centers/')) {
            return;
        }

        $fullPath = public_path(ltrim($imagePath, '/'));

        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
