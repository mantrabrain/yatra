<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\Database\Tables\EnquiriesTable;
use Yatra\Database\Tables\ReviewsTable;

/**
 * Admin sidebar "new since you last looked" counters.
 *
 * Powers the red count badges on the Bookings / Payments / Abandoned Recovery
 * sidebar items. Purely additive and read-only against the existing tables:
 *
 *  - The "last seen" marker for each section lives in `wp_options`
 *    (`yatra_<section>_last_seen_id`). NO existing table is altered.
 *  - A badge count = number of rows in that section's table with `id` greater
 *    than the stored marker (i.e. created after the admin last opened the page).
 *  - Opening a page calls mark-seen, which bumps the marker to the current
 *    MAX(id) so the badge clears.
 *
 * Abandoned Recovery is a Pro feature, so its count/marker are contributed by
 * Pro through the `yatra_admin_new_counts` filter and `yatra_admin_mark_seen`
 * action — this controller knows nothing about Pro.
 */
class NotificationCountsController extends BaseController
{
    /** section => wp_option name (sections handled directly by Free core). */
    private const CORE_SECTIONS = [
        'bookings'  => 'yatra_bookings_last_seen_id',
        'payments'  => 'yatra_payments_last_seen_id',
        'enquiries' => 'yatra_enquiries_last_seen_id',
        'reviews'   => 'yatra_reviews_last_seen_id',
    ];

    public function register_routes(): void
    {
        register_rest_route($this->namespace, '/admin/new-counts', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_counts'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->namespace, '/admin/mark-seen', [
            'methods'             => 'POST',
            'callback'            => [$this, 'mark_seen'],
            'permission_callback' => [$this, 'check_permission'],
            'args'                => [
                'section' => [
                    'required' => true,
                    'type'     => 'string',
                ],
            ],
        ]);
    }

    /**
     * Anyone who can reach the Yatra admin can read these counters. The sidebar
     * already hides items the user lacks the cap for, so unseen-counts for a
     * section they can't view are simply never displayed.
     */
    public function check_permission(?WP_REST_Request $request = null): bool
    {
        $cap = (string) apply_filters('yatra_admin_menu_cap', 'yatra_access_admin');

        return current_user_can($cap) || current_user_can('manage_options');
    }

    /**
     * GET /admin/new-counts → { success, counts: { bookings, payments, abandoned? } }
     */
    public function get_counts(WP_REST_Request $request): WP_REST_Response
    {
        $counts = [
            'bookings'  => $this->newCount(BookingsTable::getTableName(), self::CORE_SECTIONS['bookings']),
            'payments'  => $this->newCount(BookingPaymentsTable::getTableName(), self::CORE_SECTIONS['payments']),
            'enquiries' => $this->newCount(EnquiriesTable::getTableName(), self::CORE_SECTIONS['enquiries']),
            'reviews'   => $this->newCount(ReviewsTable::getTableName(), self::CORE_SECTIONS['reviews']),
        ];

        /**
         * Let Pro (and future modules) contribute their own section counts,
         * e.g. 'abandoned'. Values are normalised to non-negative ints below.
         *
         * @param array<string,int> $counts section => new-row count
         */
        $counts = (array) apply_filters('yatra_admin_new_counts', $counts);

        $counts = array_map(static function ($v): int {
            return max(0, (int) $v);
        }, $counts);

        return new WP_REST_Response(['success' => true, 'counts' => $counts], 200);
    }

    /**
     * POST /admin/mark-seen { section } → bumps that section's marker to MAX(id).
     */
    public function mark_seen(WP_REST_Request $request): WP_REST_Response
    {
        $section = sanitize_key((string) $request->get_param('section'));

        $tableMap = [
            'bookings'  => BookingsTable::getTableName(),
            'payments'  => BookingPaymentsTable::getTableName(),
            'enquiries' => EnquiriesTable::getTableName(),
            'reviews'   => ReviewsTable::getTableName(),
        ];

        if (isset(self::CORE_SECTIONS[$section], $tableMap[$section])) {
            $this->updateMarker(self::CORE_SECTIONS[$section], $tableMap[$section]);
        } else {
            /**
             * Non-core sections (e.g. Pro's 'abandoned') persist their own marker.
             *
             * @param string $section sanitised section key
             */
            do_action('yatra_admin_mark_seen', $section);
        }

        return new WP_REST_Response(['success' => true, 'section' => $section], 200);
    }

    /**
     * New-row count for a section, with two go-live safeguards:
     *
     *  - Missing table (fresh / partial install): returns 0 instead of letting
     *    `SELECT COUNT(*)` raise a "table doesn't exist" DB error into debug.log.
     *  - First run on a site (marker never set): seeds the marker to the current
     *    MAX(id) and returns 0, so pre-existing history is NOT reported as "new".
     *    Only rows created after the feature goes live are counted.
     *
     * Table name comes from our own *Table::getTableName(), never user input.
     */
    private function newCount(string $table, string $option): int
    {
        if (!$this->tableExists($table)) {
            return 0;
        }

        $marker = get_option($option, null);
        if ($marker === null) {
            // Never seen on this site → seed to current max, report nothing new.
            $this->updateMarker($option, $table);
            return 0;
        }

        global $wpdb;

        return (int) $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM `{$table}` WHERE id > %d", (int) $marker)
        );
    }

    /** Bump a section's marker to the current highest id (badge → 0). */
    private function updateMarker(string $option, string $table): void
    {
        if (!$this->tableExists($table)) {
            return;
        }

        global $wpdb;

        $maxId = (int) $wpdb->get_var("SELECT COALESCE(MAX(id), 0) FROM `{$table}`");
        update_option($option, $maxId, false);
    }

    /**
     * Does a table exist? Memoised per request (these endpoints touch the same
     * tables 4–5×) so we never spam SHOW TABLES or COUNT a missing table.
     *
     * @var array<string,bool>
     */
    private static $tableExistsCache = [];

    private function tableExists(string $table): bool
    {
        if (!array_key_exists($table, self::$tableExistsCache)) {
            global $wpdb;
            $found = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
            self::$tableExistsCache[$table] = ($found === $table);
        }

        return self::$tableExistsCache[$table];
    }
}
