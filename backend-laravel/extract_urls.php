<?php
$lock = json_decode(file_get_contents("composer.lock"), true);
$urls = [];
foreach (["packages","packages-dev"] as $section) {
    foreach ($lock[$section] ?? [] as $pkg) {
        if (isset($pkg["dist"]["url"]) && $pkg["dist"]["type"] === "zip") {
            $urls[] = [
                "name" => $pkg["name"],
                "version" => $pkg["version"],
                "url" => $pkg["dist"]["url"]
            ];
        }
    }
}
file_put_contents("C:\\Users\\CORE\\Desktop\\0FYP\\APP\\backend-laravel\\composer_urls.json", json_encode($urls, JSON_PRETTY_PRINT));
echo "Extracted " . count($urls) . " package URLs\n";
