<?php

return [
    'app_id' => env('META_APP_ID'),
    'app_secret' => env('META_APP_SECRET'),
    'redirect_uri' => env('META_REDIRECT_URI', 'http://localhost:8000/auth/callback'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'oauth_provider' => env('META_OAUTH_PROVIDER', 'instagram'),
    'verify_ssl' => env('META_VERIFY_SSL', true),

    'instagram_scopes' => [
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_manage_engagement',
        'pages_read_user_content',
        'instagram_basic',
        'instagram_manage_insights',
        'instagram_business_manage_insights',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_contents',
        'instagram_manage_messages',
        'instagram_business_manage_messages',
        'business_management',
    ],

    'graph_api_version' => 'v20.0',
];
