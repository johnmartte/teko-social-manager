<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MetaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private MetaApiService $meta,
    ) {}

    // ─── Meta OAuth ───────────────────────────────────────────────────────────

    public function login(Request $request): RedirectResponse
    {
        $state = $request->query('link_token');
        return redirect($this->meta->getAuthUrl($state));
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = config('meta.frontend_url');

        if ($request->has('error') || !$request->has('code')) {
            return redirect("{$frontendUrl}?auth=error");
        }

        try {
            $tokenData = $this->meta->exchangeCodeForToken($request->input('code'));

            $igToken    = $tokenData['access_token'];
            $igUserId   = $tokenData['user_id'] ?? null;
            $fbToken    = null;
            $fbPageId   = null;
            $fbPageName = null;

            // Try to get Facebook page token
            try {
                $pages = $this->meta->getFacebookPages($igToken);
                if (!empty($pages['data'])) {
                    $page = collect($pages['data'])
                        ->first(fn (array $c) => !empty($c['instagram_business_account']['id']))
                        ?? $pages['data'][0];

                    $fbToken    = $page['access_token'];
                    $fbPageId   = $page['id'];
                    $fbPageName = $page['name'];
                    $igUserId   = $page['instagram_business_account']['id'] ?? $igUserId;
                    $igToken    = $page['access_token'];
                }
            } catch (Throwable) {
                // Facebook pages optional
            }

            // ── Find existing user via link_token, or create one ────────────
            $metaId = $igUserId ?? $fbPageId;
            $user = null;

            // If a logged-in user initiated the OAuth, link to that user
            $linkToken = $request->input('state');
            if ($linkToken) {
                $personalToken = \Laravel\Sanctum\PersonalAccessToken::findToken($linkToken);
                if ($personalToken) {
                    $user = $personalToken->tokenable;
                    // Store meta_id on the user for future reference
                    if ($metaId && !$user->meta_id) {
                        $user->update(['meta_id' => $metaId]);
                    }
                }
            }

            // Fallback: find by meta_id or create new user
            if (!$user) {
                $user = User::firstOrCreate(
                    ['meta_id' => $metaId],
                    [
                        'name'     => $fbPageName ?? "User {$metaId}",
                        'email'    => "{$metaId}@meta.teko.internal",
                        'password' => bcrypt(Str::uuid()),
                    ]
                );

                // Update name if we have better info now
                if ($fbPageName && $user->name !== $fbPageName) {
                    $user->update(['name' => $fbPageName]);
                }
            }

            // ── Store credentials in DB ──────────────────────────────────────
            if ($igToken && $igUserId) {
                $user->socialCredentials()->updateOrCreate(
                    ['platform' => 'instagram'],
                    [
                        'access_token'   => $igToken,
                        'meta_user_id'   => $igUserId,
                        'meta_username'  => null,
                    ]
                );
            }

            if ($fbToken && $fbPageId) {
                $user->socialCredentials()->updateOrCreate(
                    ['platform' => 'facebook'],
                    [
                        'access_token'  => $fbToken,
                        'meta_user_id'  => $fbPageId,
                        'meta_username' => $fbPageName,
                    ]
                );
            }

            // ── Issue Sanctum token ──────────────────────────────────────────
            // Revoke old tokens to keep sessions clean
            $user->tokens()->delete();
            $appToken = $user->createToken('teko-social')->plainTextToken;

            $params = http_build_query([
                'auth'      => 'success',
                'app_token' => $appToken,
                'user_name' => $user->name,
            ]);

            return redirect("{$frontendUrl}?{$params}");
        } catch (Throwable $e) {
            \Log::error('OAuth callback error: ' . $e->getMessage());
            return redirect("{$frontendUrl}?auth=error&reason=" . urlencode($e->getMessage()));
        }
    }

    // ─── Auth status (reads from DB if Sanctum, fallback headers) ─────────────

    public function status(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();

        if ($user) {
            $user->load('socialCredentials');
            $ig = $user->socialCredential('instagram');
            $fb = $user->socialCredential('facebook');

            return response()->json([
                'instagram' => [
                    'connected' => $ig !== null,
                    'userId'    => $ig?->meta_user_id,
                ],
                'facebook' => [
                    'connected' => $fb !== null,
                    'pageId'    => $fb?->meta_user_id,
                    'pageName'  => $fb?->meta_username,
                ],
            ]);
        }

        // Fallback: read from headers (backward compat)
        $igToken    = $request->header('X-IG-Token');
        $igUserId   = $request->header('X-IG-User-Id');
        $fbToken    = $request->header('X-FB-Token');
        $fbPageId   = $request->header('X-FB-Page-Id');
        $fbPageName = $request->header('X-FB-Page-Name');

        return response()->json([
            'instagram' => [
                'connected' => !empty($igToken) && !empty($igUserId),
                'userId'    => $igUserId ?: null,
            ],
            'facebook' => [
                'connected' => !empty($fbToken),
                'pageId'    => $fbPageId ?: null,
                'pageName'  => $fbPageName ?: null,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $user->load('socialCredentials');
        $ig = $user->socialCredential('instagram');
        $fb = $user->socialCredential('facebook');

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'instagram' => [
                'connected' => $ig !== null,
                'userId'    => $ig?->meta_user_id,
            ],
            'facebook' => [
                'connected' => $fb !== null,
                'pageId'    => $fb?->meta_user_id,
                'pageName'  => $fb?->meta_username,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        if ($user) {
            $request->user()?->currentAccessToken()?->delete();
        }
        return response()->json(['success' => true]);
    }
}
