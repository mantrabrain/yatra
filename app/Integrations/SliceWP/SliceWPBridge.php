<?php
/**
 * Affiliate commissions for trip bookings with SliceWP (3.3).
 *
 * With SliceWP active and "Yatra" switched on in SliceWP → Settings →
 * Integrations, a booking made through the checkout by a visitor an
 * affiliate referred gets a pending commission (SliceWP's own rate for
 * sales, on the booking total before tax, in SliceWP's currency). It is
 * approved when the booking is fully paid and rejected if the booking is
 * cancelled or refunded. One commission per booking.
 *
 * @package Yatra\Integrations\SliceWP
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Integrations\SliceWP;

class SliceWPBridge
{
    public const ORIGIN = 'yatra';

    private static bool $booted = false;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_filter('slicewp_register_integration', [self::class, 'register'], 200);
        add_filter('slicewp_is_integration_plugin_active_' . self::ORIGIN, '__return_true');
        add_action('yatra_checkout_booking_created', [self::class, 'onBookingCreated'], 20, 4);
        add_action('yatra_booking_status_changed', [self::class, 'onStatusChanged'], 20, 3);
        add_action('yatra_payment_completed', [self::class, 'onPayment'], 20, 1);
        add_action('yatra_booking_payment_refunded', [self::class, 'onRefunded'], 20, 1);
        add_filter('slicewp_list_table_commissions_column_reference', [self::class, 'referenceLink'], 10, 2);
    }

    /** @param mixed $integrations */
    public static function register($integrations)
    {
        $integrations = is_array($integrations) ? $integrations : [];
        require_once __DIR__ . '/YatraSliceWPIntegration.php';
        if (class_exists(YatraSliceWPIntegration::class)) {
            $integrations[self::ORIGIN] = YatraSliceWPIntegration::class;
        }

        return $integrations;
    }

    public static function active(): bool
    {
        foreach (['slicewp_is_integration_active', 'slicewp_insert_commission', 'slicewp_update_commission', 'slicewp_get_commissions',
            'slicewp_get_setting', 'slicewp_is_affiliate_valid', 'slicewp_get_affiliate', 'slicewp_affiliate_has_email',
            'slicewp_calculate_commission_amount', 'slicewp_maybe_convert_amount', 'slicewp_sanitize_amount', 'slicewp_mysql_gmdate'] as $fn) {
            if (!function_exists($fn)) {
                return false; // A SliceWP too old for this integration: do nothing.
            }
        }

        return slicewp_is_integration_active(self::ORIGIN);
    }

    private static function booking(int $id): ?object
    {
        global $wpdb;
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM `{$wpdb->prefix}yatra_bookings` WHERE id = %d", $id));

        return is_object($row) ? $row : null;
    }

    /** @return list<object> */
    private static function commissions(int $bookingId): array
    {
        if (!function_exists('slicewp_get_commissions')) {
            return [];
        }

        return (array) slicewp_get_commissions(['number' => -1, 'reference' => (string) $bookingId, 'origin' => self::ORIGIN]);
    }

    /** @param mixed $bookingId @param mixed $data @param mixed $session @param mixed $linked */
    public static function onBookingCreated($bookingId, $data = [], $session = [], $linked = false): void
    {
        try {
            self::createCommission((int) $bookingId);
        } catch (\Throwable $e) {
            // Never break the customer's checkout over an affiliate commission.
            error_log('Yatra SliceWP: ' . $e->getMessage());
        }
    }

    private static function createCommission(int $bookingId): void
    {
        $bookingId = (int) $bookingId;
        if ($bookingId <= 0 || !self::active() || !function_exists('slicewp_get_referrer_affiliate_id')) {
            return;
        }
        $affiliateId = (int) apply_filters('slicewp_referrer_affiliate_id_' . self::ORIGIN, slicewp_get_referrer_affiliate_id(), $bookingId);
        if ($affiliateId <= 0 || !slicewp_is_affiliate_valid($affiliateId) || self::commissions($bookingId) !== []) {
            return;
        }
        $booking = self::booking($bookingId);
        if ($booking === null) {
            return;
        }
        $email = (string) ($booking->contact_email ?? '');
        if (empty(slicewp_get_setting('affiliate_own_commissions'))) {
            $affiliate = slicewp_get_affiliate($affiliateId);
            if (($affiliate && is_user_logged_in() && (int) get_current_user_id() === (int) $affiliate->get('user_id'))
                || ($email !== '' && slicewp_affiliate_has_email($affiliateId, $email))) {
                return; // An affiliate booking for themselves earns nothing.
            }
        }

        $bookingCurrency = strtoupper((string) ($booking->currency ?? ''));
        $activeCurrency = (string) slicewp_get_setting('active_currency', 'USD');
        $base = max(0.0, (float) ($booking->total_amount ?? 0) - (float) ($booking->tax_amount ?? 0));
        $base = (float) slicewp_maybe_convert_amount($base, $bookingCurrency !== '' ? $bookingCurrency : $activeCurrency, $activeCurrency);
        $amount = (float) slicewp_calculate_commission_amount($base, ['origin' => self::ORIGIN, 'type' => 'sale', 'affiliate_id' => $affiliateId]);
        $amount = (float) apply_filters('yatra_slicewp_commission_amount', $amount, $booking, $affiliateId);
        if ($amount <= 0 && empty(slicewp_get_setting('zero_amount_commissions'))) {
            return;
        }

        $customerId = function_exists('slicewp_process_customer') ? (int) slicewp_process_customer([
            'email' => $email,
            'user_id' => (int) ($booking->user_id ?? 0),
            'first_name' => (string) ($booking->contact_first_name ?? ''),
            'last_name' => (string) ($booking->contact_last_name ?? ''),
            'affiliate_id' => $affiliateId,
        ]) : 0;
        $visitId = function_exists('slicewp_get_referrer_visit_id') ? (int) slicewp_get_referrer_visit_id() : 0;

        $id = slicewp_insert_commission([
            'affiliate_id' => $affiliateId,
            'visit_id' => $visitId,
            'type' => 'sale',
            'status' => 'pending',
            'reference' => (string) $bookingId,
            'reference_amount' => slicewp_sanitize_amount($base),
            'customer_id' => $customerId,
            'origin' => self::ORIGIN,
            'amount' => slicewp_sanitize_amount($amount),
            'currency' => $activeCurrency,
            'date_created' => slicewp_mysql_gmdate(),
            'date_modified' => slicewp_mysql_gmdate(),
        ]);
        if ($id && function_exists('slicewp_add_log')) {
            slicewp_add_log(sprintf('Yatra: pending commission #%d for booking #%d.', (int) $id, $bookingId));
        }
    }

    /** Approve when fully paid. @param mixed $arg */
    public static function onPayment($arg = null): void
    {
        $bookingId = is_array($arg) ? (int) ($arg['booking_id'] ?? 0) : (int) $arg;
        if ($bookingId > 0) {
            self::sync($bookingId);
        }
    }

    /** A full refund changes the payment status only, not the booking status. @param mixed $bookingId */
    public static function onRefunded($bookingId): void
    {
        if ((int) $bookingId > 0) {
            self::sync((int) $bookingId);
        }
    }

    /** @param mixed $bookingId @param mixed $old @param mixed $new */
    public static function onStatusChanged($bookingId, $old = '', $new = ''): void
    {
        self::sync((int) $bookingId);
    }

    /** Bring the booking's commission in line with the booking. */
    public static function sync(int $bookingId): void
    {
        try {
            self::syncCommission($bookingId);
        } catch (\Throwable $e) {
            error_log('Yatra SliceWP: ' . $e->getMessage());
        }
    }

    private static function syncCommission(int $bookingId): void
    {
        if ($bookingId <= 0 || !self::active()) {
            return;
        }
        $commissions = self::commissions($bookingId);
        if ($commissions === []) {
            return;
        }
        $booking = self::booking($bookingId);
        $status = $booking ? (string) $booking->status : 'deleted';
        $paid = $booking && (string) $booking->payment_status === 'paid';
        foreach ($commissions as $commission) {
            $current = (string) $commission->get('status');
            if ($current === 'paid') {
                continue; // Already paid out to the affiliate: leave it to the operator.
            }
            $next = $current;
            if (in_array($status, ['cancelled', 'refunded', 'failed', 'deleted'], true) || ($booking && (string) $booking->payment_status === 'refunded')) {
                $next = 'rejected';
            } elseif ($paid && $current === 'pending') {
                $next = 'unpaid';
            }
            if ($next !== $current) {
                slicewp_update_commission((int) $commission->get('id'), ['status' => $next, 'date_modified' => slicewp_mysql_gmdate()]);
                if ($next === 'rejected' && function_exists('slicewp_update_commission_meta')) {
                    /* translators: %d: booking id */
                    slicewp_update_commission_meta((int) $commission->get('id'), '_rejection_reason', sprintf(__('Rejected because booking #%d was cancelled or refunded.', 'yatra'), $bookingId));
                }
            }
        }
    }

    /** @param mixed $output @param mixed $item */
    public static function referenceLink($output, $item)
    {
        if (!is_array($item) || ($item['origin'] ?? '') !== self::ORIGIN || empty($item['reference'])) {
            return $output;
        }

        return '<a href="' . esc_url(admin_url('admin.php?page=yatra&subpage=bookings&action=view&id=' . (int) $item['reference'])) . '">#' . esc_html((string) $item['reference']) . '</a>';
    }
}
