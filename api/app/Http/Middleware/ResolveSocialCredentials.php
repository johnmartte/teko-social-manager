<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves social media credentials for the current request.
 *
 * Priority 1: Sanctum-authenticated user → reads from social_credentials table
 * Priority 2: Fallback to custom headers (X-IG-Token, X-FB-Token, …) for
 *             backward compat during migration
 *
 * Usage in routes:
 *   ->middleware('social:instagram')   // requires IG
 *   ->middleware('social:facebook')    // requires FB
 *   ->middleware('social:instagram,facebook') // requires both
 */
class ResolveSocialCredentials
{
    public function handle(Request $request, Closure $next, string ...$required): Response
    {
        $user = auth('sanctum')->user();

        if ($user) {
            // ── DB-backed path ────────────────────────────────────────────────
            $user->load('socialCredentials');

            $ig = $user->socialCredential('instagram');
            $fb = $user->socialCredential('facebook');

            if ($ig) {
                $request->attributes->set('ig_token',   $ig->access_token);
                $request->attributes->set('ig_user_id', $ig->meta_user_id);
            }

            if ($fb) {
                $request->attributes->set('fb_token',   $fb->access_token);
                $request->attributes->set('fb_page_id', $fb->meta_user_id);
            }
        } else {
            // ── Header fallback (backward compat) ─────────────────────────────
            $igToken  = $request->header('X-IG-Token');
            $igUserId = $request->header('X-IG-User-Id');
            $fbToken  = $request->header('X-FB-Token');
            $fbPageId = $request->header('X-FB-Page-Id');

            if ($igToken)  $request->attributes->set('ig_token',   $igToken);
            if ($igUserId) $request->attributes->set('ig_user_id', $igUserId);
            if ($fbToken)  $request->attributes->set('fb_token',   $fbToken);
            if ($fbPageId) $request->attributes->set('fb_page_id', $fbPageId);
        }

        // ── Enforce required platforms ────────────────────────────────────────
        foreach ($required as $platform) {
            $platform = strtolower(trim($platform));

            if ($platform === 'instagram') {
                if (!$request->attributes->get('ig_token') || !$request->attributes->get('ig_user_id')) {
                    return response()->json(['error' => 'No autenticado con Instagram.'], 401);
                }
            }

            if ($platform === 'facebook') {
                if (!$request->attributes->get('fb_token')) {
                    return response()->json(['error' => 'No autenticado con Facebook.'], 401);
                }
            }
        }

        return $next($request);
    }
}
