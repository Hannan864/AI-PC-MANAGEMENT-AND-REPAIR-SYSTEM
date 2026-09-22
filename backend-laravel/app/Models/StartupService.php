<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StartupService extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'impact', 'enabled', 'boot_time_s'];
    protected $casts = ['enabled' => 'boolean', 'boot_time_s' => 'float'];
}
