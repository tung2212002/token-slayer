<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\IdeAccessToken;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class SlackController extends Controller
{
    public function redirect(Request $request): SymfonyRedirectResponse
    {
        if ($request->query('return') === 'ide' && is_string($state = $request->query('state'))) {
            session()->put('ide_oauth', ['state' => $state]);
        }

        return Socialite::driver('slack')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $slack = Socialite::driver('slack')->user();

        $user = User::where('slack_user_id', $slack->getId())->first();

        if ($user === null) {
            $plainToken = Str::random(48);

            $user = User::create([
                'slack_user_id' => $slack->getId(),
                'name' => $slack->getName() ?? $slack->getNickname(),
                'email' => $slack->getEmail() ?? $slack->getId().'@slack.local',
                'slack_handle' => $slack->getNickname(),
                'display_name' => $slack->getName(),
                'avatar_url' => $slack->getAvatar(),
                'hook_token' => hash('sha256', $plainToken),
            ]);

            session()->put('hook_token_plain', $plainToken);
            auth()->login($user);

            if ($ide = $this->consumeIdeFlow()) {
                return $this->redirectToIde($user, $ide['state']);
            }

            return redirect()->route('profile');
        }

        $user->update([
            'name' => $slack->getName() ?? $slack->getNickname(),
            'email' => $slack->getEmail() ?? $slack->getId().'@slack.local',
            'slack_handle' => $slack->getNickname(),
            'display_name' => $slack->getName(),
            'avatar_url' => $slack->getAvatar(),
        ]);

        auth()->login($user);

        if ($ide = $this->consumeIdeFlow()) {
            return $this->redirectToIde($user, $ide['state']);
        }

        return redirect()->route('battlefield');
    }

    /**
     * @return array{state: string}|null
     */
    private function consumeIdeFlow(): ?array
    {
        $ide = session()->pull('ide_oauth');

        if (! is_array($ide) || ! isset($ide['state']) || ! is_string($ide['state'])) {
            return null;
        }

        return ['state' => $ide['state']];
    }

    private function redirectToIde(User $user, string $state): RedirectResponse
    {
        [$plain] = IdeAccessToken::issueOneTime($user, $state, 120);

        $url = 'vscode://aiorg.aiorg/auth?'.http_build_query([
            'token' => $plain,
            'state' => $state,
        ]);

        return redirect()->away($url);
    }
}
