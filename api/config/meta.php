<?php

return [
    'app_id' => env('META_APP_ID'),
    'app_secret' => env('META_APP_SECRET'),
    'redirect_uri' => env('META_REDIRECT_URI', 'http://localhost:8000/auth/callback'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    'oauth_provider' => env('META_OAUTH_PROVIDER', 'instagram'),
    'verify_ssl' => env('META_VERIFY_SSL', true),

    'instagram_scopes' => [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_manage_metadata',
        'pages_messaging',
        'pages_manage_engagement',
        'pages_read_user_content',
        'business_management',
    ],

    'graph_api_version' => 'v20.0',
];
