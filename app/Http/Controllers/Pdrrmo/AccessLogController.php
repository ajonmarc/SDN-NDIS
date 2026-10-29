<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AccessLogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/access-logs/Index');
    }
}

