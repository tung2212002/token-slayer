<?php

namespace App\Http\Controllers;

use App\Models\Boss;
use Illuminate\Contracts\View\View;

class HistoryController extends Controller
{
    public function index(): View
    {
        $bosses = Boss::with('killingBlowUser')
            ->where('status', 'defeated')
            ->orderByDesc('number')
            ->paginate(50);

        return view('history', compact('bosses'));
    }
}
