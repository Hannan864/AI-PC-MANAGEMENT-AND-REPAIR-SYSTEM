<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'frequency',
        'next_run',
        'active',
        'category',
    ];

    protected $casts = [
        'active' => 'boolean',
        'last_run_at' => 'datetime',
    ];
}
