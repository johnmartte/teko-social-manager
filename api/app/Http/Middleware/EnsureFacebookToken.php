<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFacebookToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('fb_token')) {
            return response()->json(['error' => 'No autenticado con Facebook.'], 401);
        }

        return $next($request);
    }
}
