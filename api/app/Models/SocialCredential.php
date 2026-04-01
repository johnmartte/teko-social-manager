<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialCredential extends Model
{
    protected $fillable = [
        'user_id',
        'platform',
        'access_token',
        'refresh_token',
        'meta_user_id',
        'meta_username',
        'expira_en',
        'metadata',
    ];

    protected $casts = [
        'access_token'  => 'encrypted',
        'refresh_token' => 'encrypted',
        'expira_en'     => 'datetime',
        'metadata'      => 'array',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
