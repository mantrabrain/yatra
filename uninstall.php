<?php
/**
 * Runs when Yatra is deleted from the Plugins screen.
 *
 * Deleting a plugin is not the same as deactivating it, and WordPress only
 * loads this one file — the plugin itself is never bootstrapped, so nothing
 * here may assume an autoloader, a class or a helper exists.
 *
 * Nothing is removed unless the operator has switched on
 * "Delete all data on uninstall" (Yatra → Settings → Uninstall). Left off,
 * which is the default, every table and option survives so the plugin can be
 * reinstalled with its bookings and customers intact.
 *
 * @package Yatra
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

/**
 * Table suffixes owned by the free plugin.
 *
 * Mirrors \Yatra\Services\InstallerService::getRequiredTables(). Hard-coded
 * on purpose: that class is not loaded during uninstall, and a missing
 * autoloader must not leave data half-removed. Yatra Pro removes its own
 * tables from its own uninstall.php.
 */
function yatra_uninstall_free_table_suffixes(): array
{
    return [
        'yatra_trips',
        'yatra_bookings',
        'yatra_booking_payments',
        'yatra_customers',
        'yatra_booking_travellers',
        'yatra_booking_traveller_meta',
        'yatra_booking_departures',
        'yatra_reviews',
        'yatra_discounts',
        'yatra_enquiries',
        'yatra_trip_availability_dates',
        'yatra_trip_availability_rules',
        'yatra_trip_revisions',
        'yatra_trip_departures',
        'yatra_trip_itinerary_days',
        'yatra_trip_itinerary_day_entry',
        'yatra_classifications',
        'yatra_trip_classifications',
        'yatra_trip_content',
        'yatra_tour_dates',
    ];
}

/**
 * Remove Yatra's data for the current site.
 */
function yatra_uninstall_cleanup_site(): void
{
    global $wpdb;

    if (!get_option('yatra_delete_data_on_uninstall')) {
        return;
    }

    // Several of these tables are the target of a foreign key held by another
    // (availability and revisions both point at trips), so a plain DROP fails
    // for whichever one is reached first and that table survives the uninstall.
    // Order should not decide whether data is removed, so the constraints are
    // lifted for the duration.
    $wpdb->query('SET FOREIGN_KEY_CHECKS = 0');

    foreach (yatra_uninstall_free_table_suffixes() as $suffix) {
        $table = $wpdb->prefix . $suffix;
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
    }

    $wpdb->query('SET FOREIGN_KEY_CHECKS = 1');

    // Scheduled work must go too, or WordPress keeps firing hooks for a plugin
    // that is no longer installed.
    foreach ((array) _get_cron_array() as $timestamp => $hooks) {
        foreach ((array) $hooks as $hook => $events) {
            if (strpos((string) $hook, 'yatra') !== 0) {
                continue;
            }
            foreach ((array) $events as $event) {
                wp_unschedule_event($timestamp, $hook, $event['args'] ?? []);
            }
        }
    }

    // Options and transients. `yatra_pro_` is left alone: those belong to Yatra
    // Pro, which removes them from its own uninstall.php, and deleting them
    // here would wipe Pro's settings whenever the free plugin is removed first.
    $options = $wpdb->get_col(
        "SELECT option_name FROM {$wpdb->options}
         WHERE option_name LIKE 'yatra\\_%'
           AND option_name NOT LIKE 'yatra\\_pro\\_%'"
    );
    foreach ((array) $options as $option) {
        delete_option($option);
    }

    $transients = $wpdb->get_col(
        "SELECT option_name FROM {$wpdb->options}
         WHERE option_name LIKE '\\_transient\\_yatra\\_%'
            OR option_name LIKE '\\_transient\\_timeout\\_yatra\\_%'"
    );
    foreach ((array) $transients as $transient) {
        delete_option($transient);
    }

    // User meta Yatra set on customers and staff.
    $wpdb->query("DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'yatra\\_%'");
}

// Network-wide installs keep a separate set of tables and options per site, so
// each one has to be cleaned on its own.
if (is_multisite()) {
    $sites = get_sites(['fields' => 'ids', 'number' => 0]);
    foreach ((array) $sites as $siteId) {
        switch_to_blog((int) $siteId);
        yatra_uninstall_cleanup_site();
        restore_current_blog();
    }
} else {
    yatra_uninstall_cleanup_site();
}
