<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingActivityRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\TravellerRepository;

/**
 * Lets a customer complete or correct their travellers' details from their
 * account after booking (passport-style details often aren't at hand at
 * checkout).
 *
 * Only the fields of the booking form's traveller section (Settings →
 * Booking Form, scoped to the trip) can be written, each sanitised by its
 * type; a required field can't be emptied. Allowed while the booking is open
 * and before the travel date.
 */
class TravellerDetailsService
{
    private const OPEN_STATUSES = ['pending', 'confirmed', 'on_hold', 'processing'];
    private const SKIP_TYPES = ['text_block', 'heading', 'file'];

    /**
     * Editable traveller fields for the booking's trip, in form order.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function fields(object $booking): array
    {
        $tripId = (int) ($booking->trip_id ?? 0);
        $config = SettingsService::getBookingFormConfig($tripId > 0 ? $tripId : null);
        $form = is_array($config['traveler_form'] ?? null) ? $config['traveler_form'] : [];
        if (isset($form['enabled']) && !$form['enabled']) {
            return [];
        }
        $fields = [];
        foreach ((array) ($form['fields'] ?? []) as $field) {
            if (!is_array($field) || empty($field['id']) || empty($field['enabled']) || in_array((string) ($field['type'] ?? ''), self::SKIP_TYPES, true)) {
                continue;
            }
            $options = [];
            foreach ((array) ($field['options'] ?? []) as $opt) {
                if (is_array($opt) && isset($opt['value'])) {
                    $options[] = ['value' => (string) $opt['value'], 'label' => (string) ($opt['label'] ?? $opt['value'])];
                }
            }
            $fields[] = [
                'id' => sanitize_key((string) $field['id']),
                'type' => (string) ($field['type'] ?? 'text'),
                'label' => (string) ($field['label'] ?? $field['id']),
                'required' => !empty($field['required']),
                'applies_to' => ($field['applies_to'] ?? 'all') === 'lead' ? 'lead' : 'all',
                'options' => $options,
                'order' => (int) ($field['order'] ?? 0),
            ];
        }
        usort($fields, static function ($a, $b) {
            return $a['order'] <=> $b['order'];
        });

        return $fields;
    }

    /** @return array{allowed:bool, reason:string} */
    public static function eligibility(object $booking): array
    {
        if (!in_array((string) ($booking->status ?? ''), self::OPEN_STATUSES, true)) {
            return ['allowed' => false, 'reason' => __('This booking can no longer be changed online.', 'yatra')];
        }
        $travel = strtotime((string) ($booking->travel_date ?? '') . ' 00:00:00');
        $today = strtotime(current_time('Y-m-d') . ' 00:00:00');
        if ($travel === false || $today === false || $travel < $today) {
            return ['allowed' => false, 'reason' => __('This trip has already started.', 'yatra')];
        }

        return ['allowed' => true, 'reason' => ''];
    }

    /**
     * Required fields still empty, per traveller.
     *
     * @return array<int, array{traveller:int, fields:string[]}> traveller = 1-based number
     */
    public static function missing(object $booking): array
    {
        $fields = array_filter(self::fields($booking), static function ($f) {
            return $f['required'];
        });
        if ($fields === []) {
            return [];
        }
        $out = [];
        $list = (new TravellerRepository())->getByBookingId((int) $booking->id);
        // Travellers booked but never entered (no record at all) are missing too.
        for ($k = count($list); $k < (int) ($booking->travelers_count ?? 0); $k++) {
            $list[$k] = ['fields' => []];
        }
        foreach ($list as $i => $t) {
            $values = is_array($t['fields'] ?? null) ? $t['fields'] : [];
            $labels = [];
            foreach ($fields as $f) {
                if ($f['applies_to'] === 'lead' && $i > 0) {
                    continue;
                }
                if (trim((string) ($values[$f['id']] ?? '')) === '') {
                    $labels[] = $f['label'];
                }
            }
            if ($labels !== []) {
                $out[] = ['traveller' => $i + 1, 'fields' => $labels];
            }
        }

        return $out;
    }

    /**
     * @param array<int, mixed> $travellers [{id: traveller row id, fields: {field_id: value}}]
     * @return array{success:bool, message:string}
     */
    public function update(int $bookingId, array $travellers, int $userId): array
    {
        $booking = (new BookingRepository())->find($bookingId);
        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }
        $eligibility = self::eligibility($booking);
        if (!$eligibility['allowed']) {
            return ['success' => false, 'message' => $eligibility['reason']];
        }

        $defs = [];
        foreach (self::fields($booking) as $f) {
            $defs[$f['id']] = $f;
        }
        $repo = new TravellerRepository();
        $rows = [];
        foreach ($repo->getByBookingId($bookingId) as $i => $t) {
            $rows[(int) $t['id']] = ['index' => $i, 'fields' => is_array($t['fields'] ?? null) ? $t['fields'] : []];
        }
        // Travellers booked but with no record yet: addressed by position
        // ({id: 0, index: n}), created only if something is filled in.
        $existing = count($rows);
        for ($k = $existing; $k < (int) ($booking->travelers_count ?? 0); $k++) {
            $rows[-1 - $k] = ['index' => $k, 'fields' => [], 'new' => true];
        }

        $pending = [];
        $changed = [];
        foreach ($travellers as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $tid = (int) ($entry['id'] ?? 0);
            if ($tid <= 0 && isset($entry['index'])) {
                $tid = -1 - (int) $entry['index'];
            }
            if (!isset($rows[$tid])) {
                // Not a traveller of this booking.
                return ['success' => false, 'message' => __('Traveller not found on this booking.', 'yatra')];
            }
            $number = $rows[$tid]['index'] + 1;
            $clean = [];
            foreach ((array) ($entry['fields'] ?? []) as $fid => $raw) {
                $fid = sanitize_key((string) $fid);
                if (!isset($defs[$fid]) || is_array($raw) || is_object($raw)) {
                    continue; // Only the form's own fields.
                }
                $def = $defs[$fid];
                $stored = (string) ($rows[$tid]['fields'][$fid] ?? '');
                // Unchanged values aren't re-validated, so a traveller the
                // customer didn't touch (still empty, or holding an older
                // value) never blocks saving the others.
                if (trim((string) $raw) === $stored) {
                    continue;
                }
                $value = self::sanitizeValue($def, (string) $raw);
                if ($value === null) {
                    return ['success' => false, 'message' => sprintf(
                        /* translators: 1: traveller number, 2: field label. */
                        __('Traveller %1$d: %2$s is not valid.', 'yatra'),
                        $number,
                        $def['label']
                    )];
                }
                $requiredHere = $def['required'] && ($def['applies_to'] !== 'lead' || $number === 1);
                $isEmpty = $value === '' || ($def['type'] === 'checkbox' && $value === '0');
                if ($isEmpty && $requiredHere && $stored !== '') {
                    return ['success' => false, 'message' => sprintf(
                        /* translators: 1: traveller number, 2: field label. */
                        __('Traveller %1$d: %2$s is required.', 'yatra'),
                        $number,
                        $def['label']
                    )];
                }
                if ($stored !== $value) {
                    $clean[$fid] = $value;
                    $changed[$number][] = $def['label'];
                }
            }
            if ($clean !== []) {
                $pending[$tid] = $clean;
            }
        }

        if ($pending === []) {
            return ['success' => true, 'message' => __('Nothing to change.', 'yatra')];
        }
        foreach ($pending as $tid => $clean) {
            if (!empty($rows[$tid]['new'])) {
                $index = (int) $rows[$tid]['index'];
                $repo->create($bookingId, $index, $index === 0, $clean);
            } else {
                $repo->updateFields($tid, $clean);
            }
        }

        $parts = [];
        ksort($changed);
        foreach ($changed as $number => $labels) {
            /* translators: 1: traveller number, 2: comma-separated field labels. */
            $parts[] = sprintf(__('Traveller %1$d: %2$s', 'yatra'), $number, implode(', ', $labels));
        }
        (new BookingActivityRepository())->add(
            $bookingId,
            BookingActivityService::TYPE_EDIT,
            sprintf(
                /* translators: %s: what changed, e.g. "Traveller 2: Date of Birth, Nationality". */
                __('Traveller details updated by the customer — %s', 'yatra'),
                implode('; ', $parts)
            ),
            ['source' => 'customer'],
            $userId
        );

        /**
         * A customer completed or corrected traveller details from their account.
         *
         * @param int                              $bookingId
         * @param array<int, array<string,string>> $pending   traveller id => changed fields
         */
        do_action('yatra_customer_travellers_updated', $bookingId, $pending);

        return ['success' => true, 'message' => __('Traveller details saved. Thank you!', 'yatra')];
    }

    /**
     * Sanitise one value by field type; null when it isn't valid.
     *
     * @param array<string, mixed> $def
     */
    private static function sanitizeValue(array $def, string $raw): ?string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return '';
        }
        switch ($def['type']) {
            case 'email':
                $v = sanitize_email($raw);
                return $v !== '' && is_email($v) ? $v : null;
            case 'date':
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                    return null;
                }
                [$y, $m, $d] = array_map('intval', explode('-', $raw));
                return checkdate($m, $d, $y) ? $raw : null;
            case 'number':
                return is_numeric($raw) ? (string) (0 + $raw) : null;
            case 'select':
            case 'radio':
                if ($def['options'] === []) {
                    return sanitize_text_field($raw);
                }
                return in_array($raw, array_column($def['options'], 'value'), true) ? $raw : null;
            case 'checkbox':
                return in_array(strtolower($raw), ['1', 'true', 'yes', 'on'], true) ? '1' : '0';
            case 'textarea':
                return mb_substr(sanitize_textarea_field($raw), 0, 2000);
            case 'country':
                $v = strtoupper(sanitize_text_field($raw));
                return preg_match('/^[A-Z]{2}$/', $v) ? $v : sanitize_text_field($raw);
            default:
                return mb_substr(sanitize_text_field($raw), 0, 500);
        }
    }
}
