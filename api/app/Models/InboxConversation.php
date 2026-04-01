<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InboxConversation extends Model
{
    protected $fillable = [
        'channel',
        'from_name',
        'message',
        'priority_level',
        'is_resolved',
        'last_activity_at',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
        'last_activity_at' => 'datetime',
    ];
}
