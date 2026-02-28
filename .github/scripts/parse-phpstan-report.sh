#!/bin/bash

# Parse PHPStan JSON report and create readable error file
# Usage: ./parse-phpstan-report.sh

if [ ! -f "phpstan-report.json" ]; then
    echo "✅ No PHPStan errors found. Code passes static analysis at level 5." > phpstan-errors-readable.txt
    exit 0
fi

php -d memory_limit=512M << 'PHPCODE'
<?php
$raw = file_get_contents("phpstan-report.json");

// PHPStan outputs "Note: Using configuration file..." before JSON
// Extract just the JSON part (starts with '{')
$jsonStart = strpos($raw, '{');
if ($jsonStart !== false) {
    $raw = substr($raw, $jsonStart);
}

$json = json_decode($raw, true);

if ($json === null) {
    file_put_contents("phpstan-errors-readable.txt", "PHPStan output (non-JSON):\n" . $raw . "\n");
    echo $raw;
    exit(0);
}

$output = "";
$totalErrors = 0;

if (isset($json["files"])) {
    foreach ($json["files"] as $file => $data) {
        if (isset($data["messages"]) && !empty($data["messages"])) {
            $output .= "FILE: " . $file . "\n";
            
            foreach ($data["messages"] as $msg) {
                $totalErrors++;
                $output .= "  Line " . $msg["line"] . ": " . $msg["message"] . "\n";
            }
            $output .= "\n";
        }
    }
}

$totals = $json["totals"]["errors"] ?? $totalErrors;

if ($totals === 0) {
    $output = "✅ No PHPStan errors found. Code passes static analysis at level 5.\n";
} else {
    $output .= "TOTAL ERRORS: " . $totals . "\n";
}

file_put_contents("phpstan-errors-readable.txt", $output);
echo $output;
?>
PHPCODE

if [ $? -ne 0 ]; then
    echo "⚠️ PHPStan completed but error report generation failed. Check phpstan-report.json for details." > phpstan-errors-readable.txt
    exit 0
fi
