<?php

return [
    'app_id' => env('META_APP_ID'),
    'app_secret' => env('META_APP_SECRET'),
    'redirect_uri' => env('META_REDIRECT_URI', 'http://localhost:8000/auth/callback'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'oauth_provider' => env('META_OAUTH_PROVIDER', 'instagram'),
    'verify_ssl' => env('META_VERIFY_SSL', true),

    'instagram_scopes' => [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'pages_show_list',
        'pages_read_engagement',
        'business_management',
    ],

    'graph_api_version' => 'v20.0',
];
