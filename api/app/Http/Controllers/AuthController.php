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

            session([
                'ig_token' => $tokenData['access_token'],
                'ig_user_id' => $tokenData['user_id'] ?? null,
            ]);

            // Try to get Facebook page token
            try {
                $pages = $this->meta->getFacebookPages($tokenData['access_token']);
                if (!empty($pages['data'])) {
                    $page = collect($pages['data'])
                        ->first(fn (array $candidate) => !empty($candidate['instagram_business_account']['id']))
                        ?? $pages['data'][0];

                    $instagramBusiness = $page['instagram_business_account']['id'] ?? null;

                    session([
                        'fb_token' => $page['access_token'],
                        'fb_page_id' => $page['id'],
                        'fb_page_name' => $page['name'],
                        'ig_token' => $page['access_token'],
                        'ig_user_id' => $instagramBusiness,
                    ]);
                }
            } catch (Throwable) {
                // Facebook pages are optional
            }

            return redirect("{$frontendUrl}?auth=success");
        } catch (Throwable $e) {
            \Log::error('OAuth callback error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect("{$frontendUrl}?auth=error&reason=" . urlencode($e->getMessage()));
        }
    }

    public function status(): JsonResponse
    {
        return response()->json([
            'instagram' => [
                'connected' => session()->has('ig_token'),
                'userId' => session('ig_user_id'),
            ],
            'facebook' => [
                'connected' => session()->has('fb_token'),
                'pageId' => session('fb_page_id'),
                'pageName' => session('fb_page_name'),
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        session()->flush();

        return response()->json(['success' => true]);
    }
}
