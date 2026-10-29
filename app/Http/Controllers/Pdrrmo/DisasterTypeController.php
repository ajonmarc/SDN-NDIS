<?php

namespace App\Http\Controllers\Pdrrmo;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DisasterTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('pdrrmo/disaster-types/Index');
    }
}

