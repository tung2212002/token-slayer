<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateHookToken
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $user = User::where('hook_token', hash('sha256', $token))->first();

        if (! $user) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $request->setUserResolver(fn ($guard = null) => $guard === 'hook' ? $user : null);

        return $next($request);
    }
}
