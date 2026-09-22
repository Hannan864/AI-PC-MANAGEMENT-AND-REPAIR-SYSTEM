<?php
$path = "C:\\";
$dirs = array();
$out = array();
exec("dir /AD /B /S \"$path\" 2>NUL", $out);
$count = 0;
foreach ($out as $line) { $count++; }
echo "Total folders in C:\\: " . $count . PHP_EOL;
$out2 = array();
exec("dir /A-D /B /S \"$path\" 2>NUL", $out2);
$count2 = 0;
foreach ($out2 as $line) { $count2++; }
echo "Total files in C:\\: " . $count2 . PHP_EOL;

