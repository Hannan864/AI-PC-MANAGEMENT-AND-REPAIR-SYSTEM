<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Gig;
use App\Models\User;

$gigs = Gig::with('technician')->get();
echo "Total gigs: " . $gigs->count() . PHP_EOL;
foreach ($gigs as $g) {
    echo sprintf('ID: %s | Title: %s | Tech: %s (%s) | Available: %s' . PHP_EOL, 
        $g->id, $g->title, $g->technician->name, $g->technician->email, $g->is_available ? 'yes' : 'no');
}
echo PHP_EOL;
echo '--- By Technician ---' . PHP_EOL;
foreach (User::where('role', 'technician')->get() as $tech) {
    $count = $tech->gigs()->count();
    echo sprintf('%s (%s): %d gigs' . PHP_EOL, $tech->name, $tech->email, $count);
}