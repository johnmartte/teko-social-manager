<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutomationRule extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'enabled',
        'keywords',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'keywords' => 'array',
    ];
}
