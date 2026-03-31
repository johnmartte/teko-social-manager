<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFacebookToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token  = $request->header('X-FB-Token');
        $pageId = $request->header('X-FB-Page-Id');

        if (!$token) {
            return response()->json(['error' => 'No autenticado con Facebook.'], 401);
        }

        $request->attributes->set('fb_token', $token);
        $request->attributes->set('fb_page_id', $pageId);

        return $next($request);
    }
}
