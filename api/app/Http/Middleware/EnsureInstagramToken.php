<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstagramToken
{
    public function handle(Request $request, \Closure $next): Response
    {
        $token  = $request->header('X-IG-Token');
        $userId = $request->header('X-IG-User-Id');

        if (!$token || !$userId) {
            return response()->json(['error' => 'No autenticado con Instagram.'], 401);
        }

        $request->attributes->set('ig_token', $token);
        $request->attributes->set('ig_user_id', $userId);

        return $next($request);
    }
}
