<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DisasterUpdateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disaster-updates/Index');
    }
}

