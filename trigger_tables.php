<?php
/**
 * One-time script to trigger Yatra table creation
 * Access this file directly in browser: /wp-content/plugins/yatra/trigger_tables.php
 */

// Bootstrap WordPress
$wp_config_path = dirname(dirname(dirname(__DIR__))) . '/wp-config.php';
if (!file_exists($wp_config_path)) {
    die('WordPress config not found');
}

require_once $wp_config_path;

// Initialize WordPress
require_once(ABSPATH . 'wp-admin/includes/admin.php');

// Check if user is logged in and has admin rights
if (!is_user_logged_in() || !current_user_can('manage_options')) {
    auth_redirect();
}

// Create tables
try {
    // Load the Database class
    require_once __DIR__ . '/app/Core/Database.php';
    
    // Call the createTables method
    \Yatra\Core\Database::createTables();
    
    // Success message
    wp_admin_notice('Yatra database tables created successfully!', 'success');
    
} catch (Exception $e) {
    // Error message
    wp_admin_notice('Error creating tables: ' . $e->getMessage(), 'error');
}

// Redirect to admin dashboard
wp_safe_redirect(admin_url());
exit;
?>
