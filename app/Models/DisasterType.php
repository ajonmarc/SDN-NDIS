<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DisasterType extends Model
{
    protected $fillable = [
        'type_name',
        'description',
    ];

    public function disasters(): HasMany
    {
        return $this->hasMany(Disaster::class, 'disaster_type_id');
    }
}

