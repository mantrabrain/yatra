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
 * Is Yatra Pro still installed on this site?
 *
 * Deleting the free plugin must not take Pro's settings and scheduled work with
 * it while Pro is still sitting there: Pro keeps its own tables through its own
 * uninstall.php, so wiping its configuration here would leave it half removed.
 * Once Pro has gone too, there is nothing left to protect and the sweep below
 * takes everything, so nothing is orphaned either way.
 */
function yatra_uninstall_pro_still_installed(): bool
{
    return file_exists(WP_PLUGIN_DIR . '/yatra-pro/yatra-pro.php');
}

/**
 * Pro-owned options that do not carry the `yatra_pro_` prefix.
 *
 * Mirrors yatra_pro_uninstall_extra_option_names() in Yatra Pro. Repeated here
 * because uninstall.php runs with no autoloader and cannot read the other
 * plugin, the same reason both files hard-code their table lists.
 */
function yatra_uninstall_pro_owned_options(): array
{
    return [
        'yatra_license',
        'yatra_abandoned_last_seen_id',
        'yatra_abandoned_recovery_settings',
        'yatra_ai_chat_limits',
        'yatra_ai_trip_chat_enabled',
        'yatra_dynamic_pricing_settings',
        'yatra_facebook_pixel_event_log',
        'yatra_facebook_pixel_settings',
        'yatra_google_analytics_event_log',
        'yatra_google_analytics_settings',
        'yatra_mailchimp_settings',
        'yatra_mailchimp_sync_log',
        'yatra_team_keep_access_on_module_disable',
    ];
}

/**
 * Pro cron hooks registered under the plain `yatra_` prefix.
 *
 * Mirrors yatra_pro_uninstall_cron_hooks(). Without this the free plugin's
 * prefix test matched all of them and unscheduled Pro's queue, demand scores,
 * reminders and consent runs while Pro was still installed and relying on them.
 */
function yatra_uninstall_pro_owned_cron_hooks(): array
{
    return [
        'yatra_ai_audit_retention_tick',
        'yatra_calculate_demand_scores',
        'yatra_cleanup_abandoned_bookings',
        'yatra_consent_daily_cron',
        'yatra_process_email_queue',
        'yatra_process_recovery_emails',
        'yatra_send_payment_reminders',
        'yatra_sync_scheduled_payments',
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
    $protectPro = yatra_uninstall_pro_still_installed();
    $proHooks = yatra_uninstall_pro_owned_cron_hooks();
    foreach ((array) _get_cron_array() as $timestamp => $hooks) {
        foreach ((array) $hooks as $hook => $events) {
            $hook = (string) $hook;
            if (strpos($hook, 'yatra') !== 0) {
                continue;
            }
            if ($protectPro && (strpos($hook, 'yatra_pro') === 0 || in_array($hook, $proHooks, true))) {
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
    $proOptions = $protectPro ? yatra_uninstall_pro_owned_options() : [];
    foreach ((array) $options as $option) {
        if ($proOptions && in_array($option, $proOptions, true)) {
            continue;
        }
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
