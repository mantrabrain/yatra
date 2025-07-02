<?php
/**
 * Uninstall Yatra Plugin
 * 
 * This file is executed when the plugin is deleted from WordPress.
 * It removes all plugin data including database tables, options, and files.
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Include the installer class to use its cleanup methods
require_once plugin_dir_path(__FILE__) . 'src/Core/Installer.php';

// Run the uninstall process
\Yatra\Core\Installer::uninstall();

// Additional cleanup
global $wpdb;

// Remove any remaining options that might not be in the installer
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'yatra_%'");

// Remove any user meta related to Yatra
$wpdb->query("DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'yatra_%'");

// Remove any post meta related to Yatra
$wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE 'yatra_%'");

// Remove any terms related to Yatra
$wpdb->query("DELETE FROM {$wpdb->terms} WHERE slug LIKE 'yatra_%'");

// Clear any cached data
wp_cache_flush();

// Remove uploaded files (optional - uncomment if you want to remove all Yatra uploads)
/*
$upload_dir = wp_upload_dir();
$yatra_upload_dir = $upload_dir['basedir'] . '/yatra/';
if (is_dir($yatra_upload_dir)) {
    require_once(ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php');
    require_once(ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php');
    $filesystem = new WP_Filesystem_Direct(null);
    $filesystem->rmdir($yatra_upload_dir, true);
}
*/

// Log the uninstall for debugging
error_log('Yatra plugin uninstalled successfully'); 