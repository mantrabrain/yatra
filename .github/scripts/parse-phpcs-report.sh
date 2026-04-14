#!/bin/bash

# Parse PHPCS JSON report and create readable error file
# Usage: ./parse-phpcs-report.sh

if [ ! -f "phpcs-report.json" ]; then
    # No report file - create empty file so CI knows it ran successfully
    touch phpcs-errors-readable.txt
    exit 0
fi

php -d memory_limit=512M << 'PHPCODE'
<?php
$json = json_decode(file_get_contents("phpcs-report.json"), true);
$output = "";
$totalErrors = 0;
$totalWarnings = 0;

if (isset($json["files"])) {
    foreach ($json["files"] as $file => $data) {
        $totalErrors += $data["errors"] ?? 0;
        $totalWarnings += $data["warnings"] ?? 0;
        
        if (isset($data["messages"]) && !empty($data["messages"])) {
            $output .= "FILE: " . $file . " (Errors: " . ($data["errors"] ?? 0) . ", Warnings: " . ($data["warnings"] ?? 0) . ")\n";
            
            foreach ($data["messages"] as $msg) {
                $type = $msg["type"] === "ERROR" ? "ERROR" : "WARNING";
                $output .= "  Line " . $msg["line"] . " [" . $type . "]: " . $msg["message"] . " (" . $msg["source"] . ")\n";
            }
            $output .= "\n";
        }
    }
}

if ($totalErrors === 0 && $totalWarnings === 0) {
    // No errors - create empty file so CI knows it ran successfully
    $output = "";
} else {
    $output .= "TOTAL: " . $totalErrors . " errors, " . $totalWarnings . " warnings\n";
}

file_put_contents("phpcs-errors-readable.txt", $output);
echo $output;
?>
PHPCODE

if [ $? -ne 0 ]; then
    echo "⚠️ PHPCS completed but error report generation failed. Check phpcs-report.txt for details." > phpcs-errors-readable.txt
    exit 0
fi
