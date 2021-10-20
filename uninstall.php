<?php

/**
 * Fired when the plugin is uninstalled.
 *
 * When populating this file, consider the following flow
 * of control:
 *
 * - This method should be static
 * - Check if the $_REQUEST content actually is the plugin name
 * - Run an admin referrer check to make sure it goes through authentication
 * - Verify the output of $_GET makes sense
 * - Repeat with other user roles. Best directly by using the links/query string parameters.
 * - Repeat things for multisite. Once for a single site in the network, once sitewide.
 *
 * This file may be updated more in future version of the Boilerplate; however, this is the
 * general skeleton and outline for how the file should work.
 *
 * For more information, see the following discussion:
 * https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/pull/123#issuecomment-28541913
 *
 *
 * @since      1.0.0
 * * @package    Yatra
 */

// If uninstall not called from WordPress, then exit.
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}


if (!defined('YATRA_REMOVE_ALL_DATA')) {

    define('YATRA_REMOVE_ALL_DATA', true);
}

/*
 * Only remove ALL demo importer data if YATRA_REMOVE_ALL_DATA constant is set to true in user's
 * wp-config.php. This is to prevent data loss when deleting the plugin from the backend
 * and to ensure only the site owner can perform this action.
 */
if (defined('YATRA_REMOVE_ALL_DATA') && true === YATRA_REMOVE_ALL_DATA && apply_filters('yatra_remove_all_data_on_uninstall', false)) {

    global $wpdb, $wp_version;


    include_once dirname(__FILE__) . '/includes/class-yatra-install.php';

    Yatra_Install::drop_tables();

}