<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MetaApiService
{
    protected string $igApi;
    protected string $fbApi;
    protected string $oauthProvider;

    public function __construct()
    {
        $version = config('meta.graph_api_version', 'v20.0');
        $this->fbApi = "https://graph.facebook.com/{$version}";
        $this->igApi = $this->fbApi;
        $this->oauthProvider = (string) config('meta.oauth_provider', 'instagram');
    }

    // ─── AUTH ─────────────────────────────────────────────

    public function getAuthUrl(?string $state = null): string
    {
        $query = [
            'client_id' => config('meta.app_id'),
            'redirect_uri' => config('meta.redirect_uri'),
            'scope' => \implode(',', config('meta.instagram_scopes')),
            'response_type' => 'code',
        ];

        if ($state) {
            $query['state'] = $state;
        }

        $params = \http_build_query($query);

        if ($this->oauthProvider === 'facebook') {
            return "https://www.facebook.com/" . config('meta.graph_api_version', 'v20.0') . "/dialog/oauth?{$params}";
        }

        return "https://www.instagram.com/oauth/authorize?{$params}";
    }

    public function exchangeCodeForToken(string $code): array
    {
        if ($this->oauthProvider !== 'facebook') {
            $shortResponse = Http::asForm()->post('https://api.instagram.com/oauth/access_token', [
                'client_id' => config('meta.app_id'),
                'client_secret' => config('meta.app_secret'),
                'grant_type' => 'authorization_code',
                'redirect_uri' => config('meta.redirect_uri'),
                'code' => $code,
            ]);

            $short = $shortResponse->json();

            if ($shortResponse->failed() || empty($short['access_token'])) {
                $message = $short['error_message'] ?? $short['error']['message'] ?? 'No se pudo intercambiar el code por access token.';
                throw new \RuntimeException("Meta OAuth error: {$message}");
            }

            $longResponse = Http::get('https://graph.instagram.com/access_token', [
                'grant_type' => 'ig_exchange_token',
                'client_secret' => config('meta.app_secret'),
                'access_token' => $short['access_token'],
            ]);

            $long = $longResponse->json();

            if ($longResponse->failed() || empty($long['access_token'])) {
                return [
                    'access_token' => $short['access_token'],
                    'user_id' => isset($short['user_id']) ? (string) $short['user_id'] : null,
                    'expires_in' => $short['expires_in'] ?? null,
                ];
            }

            return [
                'access_token' => $long['access_token'],
                'user_id' => isset($short['user_id']) ? (string) $short['user_id'] : null,
                'expires_in' => $long['expires_in'] ?? null,
            ];
        }

        $shortResponse = Http::get("{$this->fbApi}/oauth/access_token", [
            'client_id' => config('meta.app_id'),
            'client_secret' => config('meta.app_secret'),
            'redirect_uri' => config('meta.redirect_uri'),
            'code' => $code,
        ]);

        $short = $shortResponse->json();

        if ($shortResponse->failed() || empty($short['access_token'])) {
            $message = $short['error']['message'] ?? 'No se pudo intercambiar el code por access token.';
            throw new \RuntimeException("Meta OAuth error: {$message}");
        }

        $longResponse = Http::get("{$this->fbApi}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => config('meta.app_id'),
            'client_secret' => config('meta.app_secret'),
            'fb_exchange_token' => $short['access_token'],
        ]);

        $long = $longResponse->json();

        if ($longResponse->failed() || empty($long['access_token'])) {
            return [
                'access_token' => $short['access_token'],
                'expires_in' => $short['expires_in'] ?? null,
            ];
        }

        return [
            'access_token' => $long['access_token'],
            'expires_in' => $long['expires_in'] ?? null,
        ];
    }

    // ─── INSTAGRAM ────────────────────────────────────────

    public function getInstagramProfile(string $userId, string $token): array
    {
        return Http::get("{$this->igApi}/{$userId}", [
            'fields' => 'id,username,name,biography,followers_count,media_count,profile_picture_url,website',
            'access_token' => $token,
        ])->json();
    }

    public function getInstagramMedia(string $userId, string $token, int $limit = 12): array
    {
        return Http::get("{$this->igApi}/{$userId}/media", [
            'fields' => 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count',
            'limit' => $limit,
            'access_token' => $token,
        ])->json();
    }

    /**
     * Get account-level insights (reach, impressions, follower_count, profile_views).
     * Requests 30 days of daily data so the frontend can chart trends.
     */
    public function getInstagramInsights(string $userId, string $token, string $period = 'day'): array
    {
        // Meta API allows max 30 days (2592000s). Use 28 days to stay safe.
        $now   = now();
        $since = $now->copy()->subDays(28)->timestamp;
        $until = $now->timestamp;

        $metricSets = [
            'impressions,reach,follower_count,profile_views',
            'impressions,reach,follower_count',
            'reach,follower_count',
            'reach',
        ];

        // Try with 28-day date range
        foreach ($metricSets as $metrics) {
            $response = Http::get("{$this->igApi}/{$userId}/insights", [
                'metric' => $metrics,
                'period' => 'day',
                'since'  => $since,
                'until'  => $until,
                'access_token' => $token,
            ]);

            $data = $response->json();

            if (!isset($data['error'])) {
                return $data;
            }
        }

        // Fallback: no date range (returns default ~2 days)
        foreach ($metricSets as $metrics) {
            $response = Http::get("{$this->igApi}/{$userId}/insights", [
                'metric' => $metrics,
                'period' => 'day',
                'access_token' => $token,
            ]);

            $data = $response->json();

            if (!isset($data['error'])) {
                return $data;
            }
        }

        return $data ?? ['data' => []];
    }

    /**
     * Get audience demographics: gender-age, city, country, locale.
     * These use period=lifetime.
     */
    public function getInstagramAudience(string $userId, string $token): array
    {
        $metricSets = [
            'audience_gender_age,audience_city,audience_country,audience_locale',
            'audience_gender_age,audience_city,audience_country',
            'audience_gender_age,audience_city',
            'audience_gender_age',
        ];

        foreach ($metricSets as $metrics) {
            $response = Http::get("{$this->igApi}/{$userId}/insights", [
                'metric' => $metrics,
                'period' => 'lifetime',
                'access_token' => $token,
            ]);

            $data = $response->json();

            if (!isset($data['error'])) {
                return $data;
            }
        }

        return $data ?? ['data' => []];
    }

    /**
     * Get online_followers (hourly activity breakdown for each day).
     * Uses period=lifetime.
     */
    public function getInstagramOnlineFollowers(string $userId, string $token): array
    {
        $response = Http::get("{$this->igApi}/{$userId}/insights", [
            'metric' => 'online_followers',
            'period' => 'lifetime',
            'access_token' => $token,
        ]);

        $data = $response->json();

        if (isset($data['error'])) {
            return ['data' => []];
        }

        return $data;
    }

    public function getMediaInsights(string $mediaId, string $token): array
    {
        // Try multiple metric sets — some metrics may not be available for all media types
        $metricSets = [
            'impressions,reach,saved,likes,comments,shares',
            'impressions,reach,engagement,saved',
            'impressions,reach,saved',
            'impressions,reach',
        ];

        foreach ($metricSets as $metrics) {
            $response = Http::get("{$this->igApi}/{$mediaId}/insights", [
                'metric' => $metrics,
                'access_token' => $token,
            ]);

            $data = $response->json();

            if (!isset($data['error'])) {
                return $data;
            }
        }

        return $data ?? ['data' => []];
    }

    public function publishPhoto(string $userId, string $token, string $imageUrl, string $caption = ''): array
    {
        $container = Http::post("{$this->igApi}/{$userId}/media", [
            'image_url' => $imageUrl,
            'caption' => $caption,
            'access_token' => $token,
        ])->json();

        if (empty($container['id'])) {
            $msg = $container['error']['message'] ?? json_encode($container);
            throw new \RuntimeException("Instagram container error: {$msg}");
        }

        $this->waitForContainerReady((string) $container['id'], $token);

        return $this->publishContainerWithRetry($userId, $token, (string) $container['id']);
    }

    public function publishReel(string $userId, string $token, string $videoUrl, string $caption = ''): array
    {
        $container = Http::post("{$this->igApi}/{$userId}/media", [
            'media_type' => 'REELS',
            'video_url' => $videoUrl,
            'caption' => $caption,
            'access_token' => $token,
        ])->json();

        if (empty($container['id'])) {
            $msg = $container['error']['message'] ?? json_encode($container);
            throw new \RuntimeException("Instagram container error: {$msg}");
        }

        $this->waitForContainerReady((string) $container['id'], $token);

        return $this->publishContainerWithRetry($userId, $token, (string) $container['id']);
    }

    public function publishCarousel(string $userId, string $token, array $imageUrls, string $caption = ''): array
    {
        $itemIds = [];
        foreach ($imageUrls as $url) {
            $resp = Http::post("{$this->igApi}/{$userId}/media", [
                'image_url' => $url,
                'is_carousel_item' => true,
                'access_token' => $token,
            ])->json();
            if (empty($resp['id'])) {
                $msg = $resp['error']['message'] ?? json_encode($resp);
                throw new \RuntimeException("Instagram carousel item error: {$msg}");
            }
            $itemIds[] = $resp['id'];
        }

        $carousel = Http::post("{$this->igApi}/{$userId}/media", [
            'media_type' => 'CAROUSEL',
            'children' => \implode(',', $itemIds),
            'caption' => $caption,
            'access_token' => $token,
        ])->json();

        if (empty($carousel['id'])) {
            $msg = $carousel['error']['message'] ?? json_encode($carousel);
            throw new \RuntimeException("Instagram carousel error: {$msg}");
        }

        $this->waitForContainerReady((string) $carousel['id'], $token);

        return $this->publishContainerWithRetry($userId, $token, (string) $carousel['id']);
    }

    private function waitForContainerReady(string $creationId, string $token, int $maxAttempts = 12): void
    {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $status = Http::get("{$this->igApi}/{$creationId}", [
                'fields' => 'status_code,status',
                'access_token' => $token,
            ])->json();

            $code = strtoupper((string) ($status['status_code'] ?? $status['status'] ?? ''));

            if (in_array($code, ['FINISHED', 'PUBLISHED'], true)) {
                return;
            }

            if (in_array($code, ['ERROR', 'EXPIRED'], true)) {
                $msg = $status['error']['message'] ?? json_encode($status);
                throw new \RuntimeException("Instagram container status error: {$msg}");
            }

            usleep(2_000_000);
        }
    }

    private function publishContainerWithRetry(string $userId, string $token, string $creationId, int $maxAttempts = 6): array
    {
        $lastMessage = 'Unknown Instagram publish error';

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $publish = Http::post("{$this->igApi}/{$userId}/media_publish", [
                'creation_id' => $creationId,
                'access_token' => $token,
            ])->json();

            if (!empty($publish['id'])) {
                return $publish;
            }

            $lastMessage = (string) ($publish['error']['message'] ?? json_encode($publish));

            if (stripos($lastMessage, 'Media ID is not available') === false) {
                throw new \RuntimeException("Instagram publish error: {$lastMessage}");
            }

            usleep(2_000_000);
        }

        throw new \RuntimeException("Instagram publish error: {$lastMessage}");
    }

    public function getComments(string $mediaId, string $token): array
    {
        return Http::get("{$this->igApi}/{$mediaId}/comments", [
            'fields' => 'id,text,username,timestamp',
            'access_token' => $token,
        ])->json();
    }

    public function replyToComment(string $mediaId, string $token, string $message): array
    {
        return Http::post("{$this->igApi}/{$mediaId}/replies", [
            'message' => $message,
            'access_token' => $token,
        ])->json();
    }

    public function hideComment(string $commentId, string $token, bool $hide = true): array
    {
        return Http::post("{$this->igApi}/{$commentId}", [
            'hide' => $hide,
            'access_token' => $token,
        ])->json();
    }

    public function deleteComment(string $commentId, string $token): array
    {
        return Http::delete("{$this->igApi}/{$commentId}", [
            'access_token' => $token,
        ])->json();
    }

    // ─── FACEBOOK ─────────────────────────────────────────

    public function getFacebookPages(string $token): array
    {
        return Http::get("{$this->fbApi}/me/accounts", [
            'fields' => 'id,name,access_token,fan_count,followers_count,picture,instagram_business_account{id,username}',
            'access_token' => $token,
        ])->json();
    }

    public function getPageInfo(string $pageId, string $pageToken): array
    {
        return Http::get("{$this->fbApi}/{$pageId}", [
            'fields' => 'id,name,fan_count,followers_count,about,picture,cover,website',
            'access_token' => $pageToken,
        ])->json();
    }

    public function getPagePosts(string $pageId, string $pageToken, int $limit = 10): array
    {
        return Http::get("{$this->fbApi}/{$pageId}/feed", [
            'fields' => 'id,message,story,created_time,full_picture,attachments,likes.summary(true),comments.summary(true)',
            'limit' => $limit,
            'access_token' => $pageToken,
        ])->json();
    }

    public function publishPagePost(string $pageId, string $pageToken, string $message, ?string $link = null): array
    {
        $params = [
            'message' => $message,
            'access_token' => $pageToken,
        ];
        if ($link) {
            $params['link'] = $link;
        }

        $result = Http::post("{$this->fbApi}/{$pageId}/feed", $params)->json();

        if (isset($result['error'])) {
            throw new \RuntimeException("Facebook post error: " . ($result['error']['message'] ?? json_encode($result)));
        }

        return $result;
    }

    public function publishPagePhoto(string $pageId, string $pageToken, string $imageUrl, string $caption = ''): array
    {
        $result = Http::post("{$this->fbApi}/{$pageId}/photos", [
            'url' => $imageUrl,
            'caption' => $caption,
            'access_token' => $pageToken,
        ])->json();

        if (isset($result['error'])) {
            throw new \RuntimeException("Facebook photo error: " . ($result['error']['message'] ?? json_encode($result)));
        }

        return $result;
    }

    public function getPageInsights(string $pageId, string $pageToken, string $period = 'day'): array
    {
        $now   = now();
        $since = $now->copy()->subDays(28)->timestamp;
        $until = $now->timestamp;

        $metricSets = [
            'page_impressions,page_reach,page_fans,page_views_total,page_post_engagements',
            'page_impressions,page_reach,page_fans',
            'page_impressions,page_reach',
        ];

        foreach ($metricSets as $metrics) {
            $response = Http::get("{$this->fbApi}/{$pageId}/insights", [
                'metric' => $metrics,
                'period' => $period,
                'since'  => $since,
                'until'  => $until,
                'access_token' => $pageToken,
            ]);

            $data = $response->json();

            if (!isset($data['error'])) {
                return $data;
            }
        }

        return $data ?? ['data' => []];
    }

    public function deletePost(string $postId, string $pageToken): array
    {
        return Http::delete("{$this->fbApi}/{$postId}", [
            'access_token' => $pageToken,
        ])->json();
    }

    public function updatePagePost(string $postId, string $pageToken, string $message): array
    {
        return Http::post("{$this->fbApi}/{$postId}", [
            'message' => $message,
            'access_token' => $pageToken,
        ])->json();
    }
}
