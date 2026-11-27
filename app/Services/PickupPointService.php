<?php
/**
 * Pickup points a customer chooses from at checkout.
 *
 * A trip lists its pickup points in custom_fields:
 *   pickup_points   = [{id, name, time, details}, …]
 *   pickup_required = bool (the customer must choose one)
 * The choice is stored on the booking as meta `_pickup_point`
 * ({id, name, time, details} as they were when booked), so renaming or
 * removing a point later never changes an existing booking.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Database\Tables\BookingsTable;

class PickupPointService
{
    public const MAX_POINTS = 50;

    /** @var array<int, array{points: list<array{id:string,name:string,time:string,details:string}>, required: bool}> */
    private static array $cache = [];

    /**
     * The trip's pickup points (clean, in the operator's order).
     *
     * @return list<array{id:string,name:string,time:string,details:string}>
     */
    public static function forTrip(int $tripId): array
    {
        return self::load($tripId)['points'];
    }

    public static function isRequired(int $tripId): bool
    {
        $data = self::load($tripId);

        return $data['required'] && $data['points'] !== [];
    }

    /** @return array{id:string,name:string,time:string,details:string}|null */
    public static function find(int $tripId, string $pointId): ?array
    {
        $pointId = trim($pointId);
        if ($pointId === '') {
            return null;
        }
        foreach (self::forTrip($tripId) as $point) {
            if ($point['id'] === $pointId) {
                return $point;
            }
        }

        return null;
    }

    /**
     * Check a checkout's choice. Returns an error message, or '' when fine.
     */
    public static function validateChoice(int $tripId, string $pointId): string
    {
        if (self::forTrip($tripId) === []) {
            return '';
        }
        if (trim($pointId) === '') {
            return self::isRequired($tripId) ? __('Please choose a pickup point.', 'yatra') : '';
        }

        return self::find($tripId, $pointId) === null
            ? __('That pickup point is no longer available. Please choose another one.', 'yatra')
            : '';
    }

    /**
     * Sanitize a pickup point list as saved from the trip editor.
     *
     * @param mixed $raw
     * @return list<array{id:string,name:string,time:string,details:string}>
     */
    public static function sanitizeList($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($raw)) {
            return [];
        }

        $out = [];
        $seen = [];
        foreach ($raw as $row) {
            if (is_object($row)) {
                $row = (array) $row;
            }
            if (!is_array($row)) {
                continue;
            }
            $name = trim(sanitize_text_field((string) ($row['name'] ?? '')));
            if ($name === '') {
                continue;
            }
            $id = sanitize_key((string) ($row['id'] ?? ''));
            if ($id === '' || isset($seen[$id])) {
                // Stable: the same list always gives the same ids.
                $id = 'p' . substr(md5($name . '|' . count($out)), 0, 8);
            }
            $seen[$id] = true;
            $time = trim((string) ($row['time'] ?? ''));
            if ($time !== '' && !preg_match('/^([01]?\d|2[0-3]):[0-5]\d$/', $time)) {
                $time = '';
            }
            $out[] = [
                'id' => $id,
                'name' => function_exists('mb_substr') ? mb_substr($name, 0, 120) : substr($name, 0, 120),
                'time' => $time,
                'details' => function_exists('mb_substr')
                    ? mb_substr(trim(sanitize_textarea_field((string) ($row['details'] ?? ''))), 0, 500)
                    : substr(trim(sanitize_textarea_field((string) ($row['details'] ?? ''))), 0, 500),
            ];
            if (count($out) >= self::MAX_POINTS) {
                break;
            }
        }

        return $out;
    }

    /** Store the chosen point on a booking (merged into its meta). */
    public static function saveOnBooking(int $bookingId, array $point): void
    {
        global $wpdb;
        if ($bookingId <= 0) {
            return;
        }
        $table = BookingsTable::getTableName();
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", $bookingId));
        $decoded = is_string($meta) && $meta !== '' ? json_decode($meta, true) : [];
        $decoded = is_array($decoded) ? $decoded : [];
        $decoded['_pickup_point'] = [
            'id' => (string) ($point['id'] ?? ''),
            'name' => (string) ($point['name'] ?? ''),
            'time' => (string) ($point['time'] ?? ''),
            'details' => (string) ($point['details'] ?? ''),
        ];
        $wpdb->update($table, ['meta' => wp_json_encode($decoded)], ['id' => $bookingId], ['%s'], ['%d']);
    }

    /**
     * The pickup point chosen for a booking, or null.
     *
     * @param object|int $booking
     * @return array{id:string,name:string,time:string,details:string}|null
     */
    public static function forBooking($booking): ?array
    {
        $meta = null;
        if (is_object($booking) && property_exists($booking, 'meta')) {
            $meta = $booking->meta;
        } elseif (is_object($booking) && !empty($booking->id)) {
            return self::forBooking((int) $booking->id);
        } elseif (is_numeric($booking) && (int) $booking > 0) {
            global $wpdb;
            $table = BookingsTable::getTableName();
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $meta = $wpdb->get_var($wpdb->prepare("SELECT meta FROM `{$table}` WHERE id = %d", (int) $booking));
        }
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        $point = is_array($meta) ? ($meta['_pickup_point'] ?? null) : null;
        if (!is_array($point) || trim((string) ($point['name'] ?? '')) === '') {
            return null;
        }

        return [
            'id' => (string) ($point['id'] ?? ''),
            'name' => (string) $point['name'],
            'time' => (string) ($point['time'] ?? ''),
            'details' => (string) ($point['details'] ?? ''),
        ];
    }

    /** "Hotel Yak & Yeti — 06:30" (time in the site's time format). */
    public static function label(?array $point): string
    {
        if ($point === null) {
            return '';
        }
        $label = (string) $point['name'];
        if ($point['time'] !== '') {
            $ts = strtotime('2000-01-01 ' . $point['time']);
            $label .= ' — ' . ($ts !== false ? date_i18n((string) get_option('time_format', 'H:i'), $ts) : $point['time']);
        }

        return $label;
    }

    public static function flush(): void
    {
        self::$cache = [];
    }

    /** @return array{points: list<array{id:string,name:string,time:string,details:string}>, required: bool} */
    private static function load(int $tripId): array
    {
        if (isset(self::$cache[$tripId])) {
            return self::$cache[$tripId];
        }
        $empty = ['points' => [], 'required' => false];
        if ($tripId <= 0 || !class_exists('\\Yatra\\Repositories\\TripRepository')) {
            return self::$cache[$tripId] = $empty;
        }
        $trip = (new \Yatra\Repositories\TripRepository())->find($tripId);
        $fields = $trip->custom_fields ?? null;
        if (is_string($fields)) {
            $decoded = json_decode($fields, true);
            if (!is_array($decoded)) {
                $decoded = maybe_unserialize($fields);
            }
            $fields = is_array($decoded) ? $decoded : [];
        }
        $fields = is_array($fields) ? $fields : (is_object($fields) ? (array) $fields : []);
        $required = $fields['pickup_required'] ?? false;

        return self::$cache[$tripId] = [
            'points' => self::sanitizeList($fields['pickup_points'] ?? []),
            'required' => $required === true || $required === 1 || $required === '1' || $required === 'true',
        ];
    }
}
