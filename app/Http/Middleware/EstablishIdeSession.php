<?php

namespace App\Http\Middleware;

use App\Models\IdeAccessToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * When a request carries `?_t=<one_shot>`, validate it, log the user in for
 * the session, and 302-redirect to the same URL without the token query
 * parameter. The iframe in the VSCode webview lands on the clean URL with
 * a working session cookie.
 *
 * Silently no-ops (without logging in) for invalid/expired tokens — the
 * request still proceeds so public routes like /battlefield remain
 * reachable. Auth-protected routes will redirect to login as today.
 */
class EstablishIdeSession
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->query('_t');

        if (! is_string($token) || $token === '') {
            return $next($request);
        }

        $consumed = IdeAccessToken::consumeSessionUrl($token);

        if ($consumed !== null) {
            auth()->login($consumed['user']);

            $cleanPath = strtok($consumed['redirectPath'], '?');
            $cleanQuery = parse_url($consumed['redirectPath'], PHP_URL_QUERY);

            $location = $cleanQuery
                ? url($cleanPath).'?'.$cleanQuery
                : url($cleanPath);

            return redirect()->to($location);
        }

        return $next($request);
    }
}
