<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationScript extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'trigger_condition', 'actions', 'status', 'last_run', 'last_result'];

    protected $casts = [
        'actions' => 'array',
        'last_run' => 'datetime',
    ];
}
