<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstagramToken
{
    public function handle(Request $request, \Closure $next): Response
    {
        if (!session()->has('ig_token') || !session()->has('ig_user_id')) {
            return response()->json(['error' => 'No autenticado con Instagram.'], 401);
        }

        return $next($request);
    }
}
