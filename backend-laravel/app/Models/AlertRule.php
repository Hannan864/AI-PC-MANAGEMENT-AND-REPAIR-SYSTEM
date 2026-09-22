<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlertRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'severity',
        'source_module',
        'snapshot_section',
        'condition_field',
        'condition_operator',
        'condition_value',
        'title_template',
        'description_template',
        'recommended_action',
        'suggested_fix',
        'fix_route',
        'enabled',
        'cooldown_seconds',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'condition_value' => 'float',
        'cooldown_seconds' => 'integer',
    ];

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
