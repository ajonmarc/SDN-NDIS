<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterUpdate extends Model
{
    protected $fillable = [
        'disaster_id',
        'created_by',
        'message',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function disaster(): BelongsTo
    {
        return $this->belongsTo(Disaster::class, 'disaster_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

