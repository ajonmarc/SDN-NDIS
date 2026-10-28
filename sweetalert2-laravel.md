Inertia.js
You can use Swal::fire() or any of the available helper methods in your Inertia.js controllers to show popups after navigation:

Setup
First, add the SweetAlert2 flash data to your HandleInertiaRequests middleware:

use SweetAlert2\Laravel\Swal;

public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'flash' => [
            Swal::SESSION_KEY => fn () => $request->session()->pull(Swal::SESSION_KEY),
        ],
    ]);
}
Then include the SweetAlert2 template in your Inertia app layout (usually resources/views/app.blade.php or similar):

@include('sweetalert2::index')
Usage
InertiaController.php
use SweetAlert2\Laravel\Swal;
use Inertia\Inertia;

class InertiaController extends Controller
{
    public function store()
    {
        // Your logic here...

        // Show SweetAlert2 popup after redirect
        Swal::success([
            'title' => 'Saved!',
            'text' => 'Your data has been saved successfully.',
        ]);

        return redirect()->route('dashboard');
    }
}
The full list of options can be found in the SweetAlert2 documentation.

Helpers
Available Inertia helper methods (same as Laravel helpers):

// with a custom icon
Swal::success([
    'title' => 'Popup with a success icon',
]);
Swal::error([
    'title' => 'Popup with an error icon',
]);
Swal::warning([
    'title' => 'Popup with a warning icon',
]);
Swal::info([
    'title' => 'Popup with an info icon',
]);
Swal::question([
    'title' => 'Popup with a question icon',
]);

// or a toast
Swal::toast([
    'title' => 'Toast',
]);

// or a toast with a custom icon
Swal::toastSuccess([
    'title' => 'Toast with a success icon',
]);
Swal::toastError([
    'title' => 'Toast with an error icon',
]);
Swal::toastWarning([
    'title' => 'Toast with a warning icon',
]);
Swal::toastInfo([
    'title' => 'Toast with an info icon',
]);
Swal::toastQuestion([
    'title' => 'Toast with a question icon',
]);