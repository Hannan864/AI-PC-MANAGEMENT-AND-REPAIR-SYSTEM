<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'uid',
        'rule_code',
        'category',
        'severity',
        'title',
        'description',
        'status',
        'source_module',
        'recommended_action',
        'suggested_fix',
        'fix_route',
        'context_data',
        'detected_at',
        'last_updated_at',
        'acknowledged_at',
        'resolved_at',
    ];

    protected $casts = [
        'context_data' => 'array',
        'detected_at' => 'datetime',
        'last_updated_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeBySeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
