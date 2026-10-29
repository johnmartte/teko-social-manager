<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    protected $fillable = [
        'name',
        'color',
        'description',
        'profile_name',
        'profile_bio',
        'profile_website',
        'starts_on',
        'ends_on',
    ];

    protected $casts = [
        'starts_on' => 'date:Y-m-d',
        'ends_on' => 'date:Y-m-d',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }
}
