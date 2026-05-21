<?php

namespace App\Http\Middleware;

use App\Models\IdeAccessToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateIdeBearer
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();

        if ($plain === null) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $user = IdeAccessToken::resolveBearer($plain);

        if ($user === null) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $request->setUserResolver(fn () => $user);
        auth()->setUser($user);

        return $next($request);
    }
}
