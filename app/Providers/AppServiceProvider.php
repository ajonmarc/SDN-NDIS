<?php

namespace App\Providers;

use App\Models\AccessLog;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAccessLogging();

        Route::macro('filterableResource', function (string $name, string $controller) {
            Route::resource($name, $controller);
            Route::post("{$name}-filter", [$controller, 'updateFilters'])->name("{$name}.filter");
        });
    }

    /**
     * Record login and logout events in ACCESS_LOGS.
     */
    protected function configureAccessLogging(): void
    {
        Event::listen(Login::class, function (Login $event): void {
            if (! Schema::hasTable('access_logs')) {
                return;
            }

            AccessLog::create([
                'user_id' => $event->user->getAuthIdentifier(),
                'event_type' => 'LOGIN',
                'ip_address' => request()->ip(),
                'accessed_at' => now(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event): void {
            if (! $event->user || ! Schema::hasTable('access_logs')) {
                return;
            }

            AccessLog::create([
                'user_id' => $event->user->getAuthIdentifier(),
                'event_type' => 'LOGOUT',
                'ip_address' => request()->ip(),
                'accessed_at' => now(),
            ]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }
}
