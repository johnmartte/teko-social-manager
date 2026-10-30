<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Passkey extends Model
{
    protected $fillable = ['user_id', 'name', 'credential_id', 'record', 'last_used_at'];

    protected $casts = ['last_used_at' => 'datetime'];

    protected $hidden = ['record'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
