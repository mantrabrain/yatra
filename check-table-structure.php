<?php
/**
 * Check yatra_trips table structure
 */

require_once __DIR__ . '/../../../wp-load.php';

global $wpdb;

echo "=== CHECKING YATRA_TRIPS TABLE STRUCTURE ===\n\n";

$table = $wpdb->prefix . 'yatra_trips';

// Check if table exists
$tableExists = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");

if (!$tableExists) {
    echo "ERROR: Table {$table} does not exist!\n";
    exit;
}

echo "Table exists: {$table}\n\n";

// Get table structure
$columns = $wpdb->get_results("DESCRIBE {$table}");

echo "Columns in {$table}:\n";
echo str_repeat("-", 80) . "\n";
printf("%-30s %-20s %-10s %-10s\n", "Field", "Type", "Null", "Key");
echo str_repeat("-", 80) . "\n";

foreach ($columns as $column) {
    printf("%-30s %-20s %-10s %-10s\n", 
        $column->Field, 
        $column->Type, 
        $column->Null, 
        $column->Key
    );
}

echo "\n=== CHECKING OLD TOUR DATA ===\n\n";

// Check old tours
$oldTrips = $wpdb->get_results(
    "SELECT ID, post_title, post_status, post_date 
     FROM {$wpdb->posts} 
     WHERE post_type = 'tour' 
     AND post_status IN ('publish', 'draft')
     LIMIT 3"
);

echo "Sample old trips:\n";
foreach ($oldTrips as $trip) {
    echo "- ID: {$trip->ID}, Title: {$trip->post_title}, Status: {$trip->post_status}\n";
}

echo "\n=== TESTING INSERT ===\n\n";

// Try a simple insert
$testData = [
    'name' => 'Test Trip',
    'slug' => 'test-trip-' . time(),
    'description' => 'Test description',
    'status' => 'inactive',
    'created_at' => current_time('mysql'),
    'updated_at' => current_time('mysql'),
];

echo "Attempting to insert test data...\n";
$result = $wpdb->insert($table, $testData);

if ($result === false) {
    echo "ERROR: Insert failed!\n";
    echo "Error: " . $wpdb->last_error . "\n";
} else {
    echo "SUCCESS: Test insert worked! ID: " . $wpdb->insert_id . "\n";
    
    // Clean up
    $wpdb->delete($table, ['id' => $wpdb->insert_id]);
    echo "Test record cleaned up.\n";
}
