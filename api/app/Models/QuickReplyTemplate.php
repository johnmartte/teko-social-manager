<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuickReplyTemplate extends Model
{
    protected $fillable = [
        'content',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
