<?php
/**
 * Test script to check if icon column exists in attributes table
 */

// Load WordPress
$wp_load_path = dirname(dirname(dirname(__DIR__))) . '/wp-load.php';
if (file_exists($wp_load_path)) {
    require_once $wp_load_path;
} else {
    die('WordPress not found');
}

global $wpdb;

echo "<h2>Checking Icon Column in Attributes Table</h2>";

$table_name = $wpdb->prefix . 'yatra_attributes';

// Check if table exists
$table_exists = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name = %s",
        $table_name
    )
);

echo "<p><strong>Table:</strong> {$table_name}</p>";
echo "<p><strong>Table exists:</strong> " . ($table_exists > 0 ? 'Yes' : 'No') . "</p>";

if ($table_exists > 0) {
    // Check if icon column exists
    $column_exists = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_schema = DATABASE() 
             AND table_name = %s 
             AND column_name = %s",
            $table_name,
            'icon'
        )
    );
    
    echo "<p><strong>Icon column exists:</strong> " . ($column_exists > 0 ? 'Yes' : 'No') . "</p>";
    
    // Show all columns in the table
    $columns = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT column_name, data_type, is_nullable 
             FROM information_schema.columns 
             WHERE table_schema = DATABASE() 
             AND table_name = %s 
             ORDER BY ordinal_position",
            $table_name
        )
    );
    
    echo "<h3>Table Columns:</h3>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Column Name</th><th>Data Type</th><th>Nullable</th></tr>";
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>" . esc_html($column->column_name) . "</td>";
        echo "<td>" . esc_html($column->data_type) . "</td>";
        echo "<td>" . esc_html($column->is_nullable) . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Test a sample record
    $sample = $wpdb->get_row(
        "SELECT * FROM `{$table_name}` LIMIT 1"
    );
    
    if ($sample) {
        echo "<h3>Sample Record:</h3>";
        echo "<pre>";
        print_r($sample);
        echo "</pre>";
    }
} else {
    echo "<p style='color: red;'>Table does not exist. Please run the database creation first.</p>";
}

?>
