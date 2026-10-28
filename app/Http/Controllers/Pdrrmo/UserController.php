<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pdrrmo\StoreUserRequest;
use App\Http\Requests\Pdrrmo\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use SweetAlert2\Laravel\Swal;

class UserController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Index
    |--------------------------------------------------------------------------
    */

    public function index(): Response
    {
        return Inertia::render('pdrrmo/users/Index');
    }


    /*
    |--------------------------------------------------------------------------
    | DataTable
    |--------------------------------------------------------------------------
    */

    public function getData(Request $request): JsonResponse
    {
        $query = User::query()
            ->with('role');


        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }


        // Sorting
        $allowedSorts = [
            'id',
            'name',
            'email',
            'created_at',
        ];

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


        // Pagination
        $perPage = (int) $request->input('per_page', 10);

        $perPage = min(max($perPage, 1), 100);


        // Response
        return response()->json(
            $query
                ->paginate($perPage)
                ->through(function (User $user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role_name' => $user->role?->name ?? 'No Role',
                    ];
                })
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    public function create(): Response
    {
        return Inertia::render('pdrrmo/users/Create', [
            'roles' => Role::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    */

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create(
            $request->validated()
        );

        Swal::success([
            'title' => 'User Created!',
            'text' => 'User created successfully.',
        ]);

        return redirect()->route('pdrrmo.users.index');
    }


    /*
    |--------------------------------------------------------------------------
    | Edit
    |--------------------------------------------------------------------------
    */

    public function edit(User $user): Response
    {
        return Inertia::render('pdrrmo/users/Edit', [
            'user' => $user->only([
                'id',
                'name',
                'email',
                'role_id',
            ]),

            'roles' => Role::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateUserRequest $request,
        User $user
    ): RedirectResponse {
        $data = $request->validated();

        // Keep the existing password when no new password is provided.
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        Swal::success([
            'title' => 'User Updated!',
            'text' => 'User updated successfully.',
        ]);

        return redirect()->route('pdrrmo.users.index');
    }


    /*
    |--------------------------------------------------------------------------
    | Destroy
    |--------------------------------------------------------------------------
    */

    public function destroy(User $user): RedirectResponse
    {
        // Protected users cannot be deleted.
        if ($user->is_protected) {
            Swal::error([
                'title' => 'Action Denied',
                'text' => 'This user is protected and cannot be deleted.',
            ]);

            return redirect()->route('pdrrmo.users.index');
        }


        // Prevent deleting your own account.
        if ($user->id === auth()->id()) {
            Swal::error([
                'title' => 'Action Denied',
                'text' => 'You cannot delete your own account.',
            ]);

            return redirect()->route('pdrrmo.users.index');
        }


        $user->delete();

        Swal::success([
            'title' => 'User Deleted!',
            'text' => 'User deleted successfully.',
        ]);

        return redirect()->route('pdrrmo.users.index');
    }
}