<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Disaster extends Model
{
    protected $fillable = [
        'municipality_id',
        'disaster_type_id',
        'created_by',
        'title',
        'description',
        'latitude',
        'longitude',
        'occurred_at',
        'severity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'occurred_at' => 'datetime',
        ];
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class, 'municipality_id');
    }

    public function disasterType(): BelongsTo
    {
        return $this->belongsTo(DisasterType::class, 'disaster_type_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(DisasterUpdate::class, 'disaster_id');
    }
}

