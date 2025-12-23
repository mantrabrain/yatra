<?php
/**
 * Temporary script to create Yatra database tables
 */

// Load WordPress
$wp_load_path = dirname(dirname(dirname(__DIR__))) . '/wp-load.php';
if (file_exists($wp_load_path)) {
    require_once $wp_load_path;
} else {
    // Try alternative path
    $wp_load_path = dirname(dirname(dirname(dirname(__DIR__)))) . '/wp-load.php';
    if (file_exists($wp_load_path)) {
        require_once $wp_load_path;
    } else {
        die('WordPress not found');
    }
}

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Admin access required');
}

// Create tables
if (class_exists('Yatra\Core\Database')) {
    try {
        Yatra\Core\Database::createTables();
        echo '<h2>Yatra Database Tables Created Successfully!</h2>';
        echo '<p>All missing tables have been created.</p>';
        echo '<p><a href="' . admin_url() . '">Go to Admin Dashboard</a></p>';
    } catch (Exception $e) {
        echo '<h2>Error Creating Tables</h2>';
        echo '<p>Error: ' . esc_html($e->getMessage()) . '</p>';
    }
} else {
    echo '<h2>Yatra Database Class Not Found</h2>';
    echo '<p>Please make sure the Yatra plugin is properly activated.</p>';
}
?>
