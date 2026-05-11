<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class SlackController extends Controller
{
    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('slack')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $slack = Socialite::driver('slack')->user();
        $plainToken = Str::random(48);

        $user = User::updateOrCreate(
            ['slack_user_id' => $slack->getId()],
            [
                'name' => $slack->getName() ?? $slack->getNickname(),
                'email' => $slack->getEmail() ?? $slack->getId().'@slack.local',
                'slack_handle' => $slack->getNickname(),
                'display_name' => $slack->getName(),
                'avatar_url' => $slack->getAvatar(),
                'hook_token' => hash('sha256', $plainToken),
            ]
        );

        session()->put('hook_token_plain', $plainToken);
        auth()->login($user);

        return redirect('/profile');
    }
}
