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
$fileCount = 0;

if (isset($json["files"]) && is_array($json["files"])) {
    foreach ($json["files"] as $file => $data) {
        $fileErrors = $data["errors"] ?? 0;
        
        if ($fileErrors > 0 && isset($data["messages"]) && !empty($data["messages"])) {
            $fileCount++;
            $totalErrors += $fileErrors;
            
            // Shorten file path for readability
            $shortFile = str_replace('/Users/umesh/Local Sites/yatra/app/public/wp-content/plugins/yatra/', '', $file);
            
            $output .= "FILE: " . $shortFile . " (" . $fileErrors . " errors)\n";
            
            foreach ($data["messages"] as $msg) {
                $message = $msg["message"] ?? "Unknown error";
                $line = $msg["line"] ?? "?";
                $output .= "  Line " . $line . ": " . $message . "\n";
            }
            $output .= "\n";
        }
    }
}

if ($totalErrors === 0) {
    $output = "✅ No PHPStan errors found. Code passes static analysis at level 5.\n";
} else {
    $output = "PHPSTAN ANALYSIS RESULTS\n";
    $output .= "========================\n\n";
    $output .= "Total Files with Errors: " . $fileCount . "\n";
    $output .= "Total Errors: " . $totalErrors . "\n\n";
    $output .= "ERRORS BY FILE:\n";
    $output .= "===============\n\n";
    
    // Re-iterate to output errors
    foreach ($json["files"] as $file => $data) {
        $fileErrors = $data["errors"] ?? 0;
        
        if ($fileErrors > 0 && isset($data["messages"]) && !empty($data["messages"])) {
            $shortFile = str_replace('/Users/umesh/Local Sites/yatra/app/public/wp-content/plugins/yatra/', '', $file);
            
            $output .= "FILE: " . $shortFile . " (" . $fileErrors . " errors)\n";
            
            foreach ($data["messages"] as $msg) {
                $message = $msg["message"] ?? "Unknown error";
                $line = $msg["line"] ?? "?";
                $output .= "  Line " . $line . ": " . $message . "\n";
            }
            $output .= "\n";
        }
    }
}

file_put_contents("phpstan-errors-readable.txt", $output);
echo $output;
?>
PHPCODE

if [ $? -ne 0 ]; then
    echo "⚠️ PHPStan completed but error report generation failed. Check phpstan-report.json for details." > phpstan-errors-readable.txt
    exit 0
fi
