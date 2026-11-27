<?php
/**
 * Booking fee (3.3): a fixed amount or a percentage of the trip price added
 * to every new booking, shown as its own line ("Booking fee").
 *
 * Settings → Payment → Booking fee: booking_fee_type (none|fixed|percent),
 * booking_fee_amount, booking_fee_label. The fee is part of the subtotal, so
 * coupons, tax and deposits treat it like the rest of the price. A booking
 * keeps the fee it was made with (meta `_booking_fee`); changing the setting
 * never changes existing bookings.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class BookingFeeService
{
    public const ROW_ID = -7002;

    private static bool $booted = false;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_filter('yatra_calculate_subtotal', [self::class, 'addToSubtotal'], 15, 2);
        add_filter('yatra_after_calculation_result', [self::class, 'addRow'], 9, 2);
        add_filter('yatra_booking_get_services', [self::class, 'bookingServices'], 30, 2);
    }

    /** @return array{type:string,amount:float,label:string} */
    public static function settings(): array
    {
        $type = (string) SettingsService::get('booking_fee_type', 'none');
        $type = in_array($type, ['none', 'fixed', 'percent'], true) ? $type : 'none';
        $amount = max(0.0, (float) SettingsService::get('booking_fee_amount', 0));
        if ($type === 'percent') {
            $amount = min(100.0, $amount);
        }
        $label = trim((string) SettingsService::get('booking_fee_label', ''));

        return [
            'type' => $amount > 0 ? $type : 'none',
            'amount' => $amount,
            'label' => $label !== '' ? $label : __('Booking fee', 'yatra'),
        ];
    }

    /** The fee for a booking whose trip price (before discounts) is $baseAmount. */
    public static function feeFor(float $baseAmount, int $tripId = 0): float
    {
        $s = self::settings();
        $fee = 0.0;
        if ($s['type'] === 'fixed') {
            $fee = $s['amount'];
        } elseif ($s['type'] === 'percent') {
            $fee = $baseAmount * $s['amount'] / 100;
        }

        /**
         * The booking fee for a booking.
         *
         * @since 3.3.0
         * @param float $fee        Fee from the settings.
         * @param float $baseAmount Trip price before discounts.
         * @param int   $tripId     Trip.
         */
        return max(0.0, round((float) apply_filters('yatra_booking_fee', $fee, $baseAmount, $tripId), 2));
    }

    /** @param mixed $subtotal @param mixed $context */
    public static function addToSubtotal($subtotal, $context = [])
    {
        $context = is_array($context) ? $context : [];
        $base = (float) ($context['base_amount'] ?? $subtotal);
        if ($base <= 0) {
            return $subtotal;
        }

        return round((float) $subtotal + self::feeFor($base, (int) ($context['trip_id'] ?? 0)), 2);
    }

    /** @param mixed $pricing @param mixed $params */
    public static function addRow($pricing, $params = [])
    {
        if (!is_array($pricing)) {
            return $pricing;
        }
        $base = (float) ($pricing['base_amount'] ?? 0);
        if ($base <= 0) {
            return $pricing;
        }
        $fee = self::feeFor($base, (int) ($pricing['trip_id'] ?? 0));
        if ($fee <= 0) {
            return $pricing;
        }
        $pricing['booking_fee'] = $fee;
        $services = is_array($pricing['additional_services'] ?? null) ? $pricing['additional_services'] : [];
        $services[] = [
            'id' => self::ROW_ID,
            'name' => self::settings()['label'],
            'price' => $fee,
            'calculated_price' => $fee,
            'selected' => true,
            'is_required' => false,
            'is_included' => false,
            'is_booking_fee' => true,
        ];
        $pricing['additional_services'] = $services;

        return $pricing;
    }

    /** Store the fee a checkout booking was made with. */
    public static function saveOnBooking(int $bookingId, float $fee, string $label): void
    {
        global $wpdb;
        if ($bookingId <= 0 || $fee <= 0) {
            return;
        }
        $table = \Yatra\Database\Tables\BookingsTable::getTableName();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", $bookingId));
        $decoded = is_string($meta) && $meta !== '' ? json_decode($meta, true) : [];
        $decoded = is_array($decoded) ? $decoded : [];
        $decoded['_booking_fee'] = ['amount' => round($fee, 2), 'label' => $label];
        $wpdb->update($table, ['meta' => wp_json_encode($decoded)], ['id' => $bookingId], ['%s'], ['%d']);
    }

    /** @param mixed $services @param mixed $bookingId */
    public static function bookingServices($services, $bookingId = 0)
    {
        global $wpdb;
        $services = is_array($services) ? $services : [];
        $bookingId = (int) $bookingId;
        if ($bookingId <= 0) {
            return $services;
        }
        $table = \Yatra\Database\Tables\BookingsTable::getTableName();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", $bookingId));
        $decoded = is_string($meta) ? json_decode($meta, true) : null;
        $fee = is_array($decoded) ? ($decoded['_booking_fee'] ?? null) : null;
        if (!is_array($fee) || (float) ($fee['amount'] ?? 0) <= 0) {
            return $services;
        }
        $amount = (float) $fee['amount'];
        $label = (string) ($fee['label'] ?? __('Booking fee', 'yatra'));
        $services[] = [
            'id' => self::ROW_ID,
            'service_id' => self::ROW_ID,
            'name' => $label,
            'service_name' => $label,
            'quantity' => 1,
            'unit_price' => $amount,
            'price' => $amount,
            'total_price' => $amount,
            'calculated_price' => $amount,
            'is_booking_fee' => true,
        ];

        return $services;
    }
}
