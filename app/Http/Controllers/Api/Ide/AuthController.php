<?php

namespace App\Http\Controllers\Api\Ide;

use App\Http\Controllers\Controller;
use App\Models\IdeAccessToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    public function exchange(Request $request): JsonResponse|Response
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'state' => ['required', 'string'],
        ]);

        $user = IdeAccessToken::consumeOneTime($data['token'], $data['state']);

        if ($user === null) {
            return response()->json(['error' => 'token_invalid_or_expired'], 410);
        }

        [$bearer] = IdeAccessToken::issueBearer($user);

        return response()->json(['bearer' => $bearer]);
    }

    public function revoke(Request $request): Response
    {
        $plain = $request->bearerToken();

        if ($plain !== null) {
            $token = IdeAccessToken::query()
                ->where('kind', 'bearer')
                ->where('token_hash', hash('sha256', $plain))
                ->first();

            $token?->revoke();
        }

        return response()->noContent();
    }
}
