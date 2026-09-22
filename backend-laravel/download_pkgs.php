<?php
$urls = json_decode(file_get_contents("composer_urls.json"), true);
$cacheBase = "C:\\Users\\CORE\\AppData\\Local\\Composer\\cache\\files\\";

$total = count($urls);
$done = 0;
$skipped = 0;
$failed = 0;

foreach ($urls as $i => $pkg) {
    $parts = explode("/", $pkg["name"], 2);
    $vendor = $parts[0];
    $name = $parts[1];
    $version = $pkg["version"];
    $dir = $cacheBase . $vendor . "\\" . $name . "\\";
    $file = $dir . $version . ".zip";

    if (file_exists($file) && filesize($file) > 0) {
        $skipped++;
        continue;
    }

    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }

    $url = $pkg["url"];
    $cmd = 'curl.exe -L -s -o "' . str_replace("/", "\\", $file) . '" "' . $url . '" --connect-timeout 30 --max-time 300';
    $output = shell_exec($cmd . " 2>&1");
    if (file_exists($file) && filesize($file) > 1000) {
        $done++;
        echo "[" . ($i+1) . "/$total] OK $vendor/$name@$version (" . round(filesize($file)/1024) . " KB)\n";
    } else {
        $failed++;
        echo "[" . ($i+1) . "/$total] FAIL $vendor/$name@$version : $output\n";
    }
}
echo "\n=== DONE=$done SKIPPED=$skipped FAILED=$failed ===\n";
