<?php

namespace App\Http\Controllers;

use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private MetaApiService $meta,
    ) {}

    public function login(): RedirectResponse
    {
        return redirect($this->meta->getAuthUrl());
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = config('meta.frontend_url');

        if ($request->has('error') || !$request->has('code')) {
            return redirect("{$frontendUrl}?auth=error");
        }

        try {
            $tokenData = $this->meta->exchangeCodeForToken($request->input('code'));

            $igToken  = $tokenData['access_token'];
            $igUserId = $tokenData['user_id'] ?? null;
            $fbToken  = null;
            $fbPageId = null;
            $fbPageName = null;

            // Try to get Facebook page token
            try {
                $pages = $this->meta->getFacebookPages($igToken);
                if (!empty($pages['data'])) {
                    $page = collect($pages['data'])
                        ->first(fn (array $candidate) => !empty($candidate['instagram_business_account']['id']))
                        ?? $pages['data'][0];

                    $fbToken    = $page['access_token'];
                    $fbPageId   = $page['id'];
                    $fbPageName = $page['name'];
                    $igUserId   = $page['instagram_business_account']['id'] ?? $igUserId;
                    $igToken    = $page['access_token'];
                }
            } catch (Throwable) {
                // Facebook pages are optional
            }

            $params = http_build_query(array_filter([
                'auth'         => 'success',
                'ig_token'     => $igToken,
                'ig_user_id'   => $igUserId,
                'fb_token'     => $fbToken,
                'fb_page_id'   => $fbPageId,
                'fb_page_name' => $fbPageName,
            ]));

            return redirect("{$frontendUrl}?{$params}");
        } catch (Throwable $e) {
            \Log::error('OAuth callback error: ' . $e->getMessage());
            return redirect("{$frontendUrl}?auth=error&reason=" . urlencode($e->getMessage()));
        }
    }

    public function status(Request $request): JsonResponse
    {
        $igToken = $request->header('X-IG-Token');
        $igUserId = $request->header('X-IG-User-Id');
        $fbToken = $request->header('X-FB-Token');
        $fbPageId = $request->header('X-FB-Page-Id');
        $fbPageName = $request->header('X-FB-Page-Name');

        return response()->json([
            'instagram' => [
                'connected' => !empty($igToken) && !empty($igUserId),
                'userId' => $igUserId ?: null,
            ],
            'facebook' => [
                'connected' => !empty($fbToken),
                'pageId' => $fbPageId ?: null,
                'pageName' => $fbPageName ?: null,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json(['success' => true]);
    }
}
