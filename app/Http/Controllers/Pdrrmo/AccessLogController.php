<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class AccessLogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/access-logs/Index');
    }

    public function getData(Request $request): JsonResponse
    {
        $query = AccessLog::query()
            ->with(['user.roles']);

        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('event_type', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $allowedSorts = ['id', 'event_type', 'ip_address', 'accessed_at'];
        $sort = $request->input('sort');

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $order = $request->input('order', 'asc');
            if (! in_array($order, ['asc', 'desc'], true)) {
                $order = 'asc';
            }
            $query->orderBy($sort, $order);
        } else {
            $query->orderByDesc('accessed_at');
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 100);

        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (AccessLog $log) {
                    return [
                        'id' => $log->id,
                        'user_id' => $log->user_id,
                        'user_name' => $log->user?->name ?? 'Anonymous Visitor',
                        'user_email' => $log->user?->email,
                        'user_role' => $log->user?->roles->first()?->name,
                        'event_type' => $log->event_type,
                        'ip_address' => $log->ip_address ?? 'Unknown',
                        'accessed_at' => $log->accessed_at?->format('M d, Y h:i:s A') ?? 'N/A',
                    ];
                })
        );
    }

    public function destroy(AccessLog $accessLog): RedirectResponse
    {
        $accessLog->delete();

        Swal::success([
            'title' => 'Access Log Deleted!',
            'text' => 'Access log entry has been removed.',
        ]);

        return redirect()->route('pdrrmo.access-logs.index');
    }
}
