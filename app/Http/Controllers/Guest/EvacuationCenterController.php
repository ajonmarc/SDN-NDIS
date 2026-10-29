<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EvacuationCenterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('guest/evacuation-centers/Index');
    }
}

