<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduledPost extends Model
{
    protected $fillable = [
        'platform',
        'type',
        'caption',
        'media_urls',
        'scheduled_at',
        'status',
        'error_message',
        'meta_post_id',
        'ig_token',
        'ig_user_id',
        'fb_token',
        'fb_page_id',
    ];

    protected $casts = [
        'media_urls' => 'array',
        'scheduled_at' => 'datetime',
    ];

    protected $hidden = [
        'ig_token',
        'fb_token',
    ];
}
