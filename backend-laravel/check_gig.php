<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Gig;

$gig = Gig::find('a27a0454-dd22-4235-844f-124a4ebf08fc');
echo 'is_available: ' . ($gig->is_available ? 'true' : 'false') . PHP_EOL;
echo 'price: ' . $gig->price . PHP_EOL;
echo 'attributes: ' . json_encode($gig->getAttributes()) . PHP_EOL;