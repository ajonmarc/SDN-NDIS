<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipality extends Model
{
    protected $fillable = [
        'municipality_name',
    ];

    public function disasters(): HasMany
    {
        return $this->hasMany(Disaster::class, 'municipality_id');
    }

    public function evacuationCenters(): HasMany
    {
        return $this->hasMany(EvacuationCenter::class, 'municipality_id');
    }
}

