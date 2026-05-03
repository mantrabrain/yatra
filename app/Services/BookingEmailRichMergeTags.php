<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\PaymentGateways\PaymentGatewayRegistry;
use Yatra\Repositories\TravellerRepository;

/**
 * Extra merge tags for booking-based transactional emails: gateway, schedule, travelers, custom fields.
 *
 * @see TransactionalEmailTemplateService::variablesFromBooking()
 */
final class BookingEmailRichMergeTags
{
    /**
     * Keys merged into {@see TransactionalEmailTemplateService::variablesFromBooking()} when booking id > 0.
     *
     * @return array<string, string>
     */
    public static function forBooking(object $booking): array
    {
        $bid = (int) ($booking->id ?? 0);
        if ($bid <= 0) {
            return self::emptyTags();
        }

        $gatewaySlug = trim((string) ($booking->payment_gateway ?? ''));
        $scheduleRaw = trim((string) ($booking->payment_method ?? ''));

        $repo = new TravellerRepository();
        $travellers = $repo->getByBookingId($bid);

        $special = trim((string) ($booking->special_requests ?? ''));

        return [
            'payment_gateway' => $gatewaySlug,
            'payment_gateway_label' => self::gatewayLabel($gatewaySlug),
            'payment_schedule' => $scheduleRaw,
            'payment_schedule_label' => self::paymentScheduleLabel($scheduleRaw),
            'travelers_list' => self::buildTravelersPlainList($travellers),
            'travelers_list_html' => self::buildTravelersListHtml($travellers),
            'traveler_custom_fields_html' => self::buildTravelerCustomFieldsHtml($travellers),
            'booking_custom_fields_html' => self::buildBookingCustomFieldsHtml($booking),
            'special_requests' => $special,
            'special_requests_html' => $special !== '' ? nl2br(esc_html($special)) : '',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function emptyTags(): array
    {
        return [
            'payment_gateway' => '',
            'payment_gateway_label' => '',
            'payment_schedule' => '',
            'payment_schedule_label' => '',
            'travelers_list' => '',
            'travelers_list_html' => '',
            'traveler_custom_fields_html' => '',
            'booking_custom_fields_html' => '',
            'special_requests' => '',
            'special_requests_html' => '',
        ];
    }

    private static function gatewayLabel(string $slug): string
    {
        if ($slug === '') {
            return '';
        }

        $gw = PaymentGatewayRegistry::getInstance()->get($slug);
        if ($gw !== null) {
            return (string) $gw->getTitle();
        }

        return self::humanizeKey($slug);
    }

    private static function paymentScheduleLabel(string $raw): string
    {
        $raw = strtolower($raw);
        switch ($raw) {
            case 'deposit':
                return __('Deposit (balance due later)', 'yatra');
            case 'partial':
                return __('Partial payment', 'yatra');
            case 'full':
                return __('Full payment', 'yatra');
            default:
                return $raw !== '' ? self::humanizeKey($raw) : '';
        }
    }

    /**
     * @param list<array<string, mixed>> $travellers
     */
    private static function buildTravelersPlainList(array $travellers): string
    {
        if ($travellers === []) {
            return '';
        }

        $lines = [];
        $i = 0;
        foreach ($travellers as $row) {
            ++$i;
            $fields = isset($row['fields']) && is_array($row['fields']) ? $row['fields'] : [];
            $name = self::travelerDisplayName($fields);
            $lead = !empty($row['is_lead']);
            $suffix = $lead ? ' (' . __('Lead', 'yatra') . ')' : '';
            $lines[] = sprintf('%d. %s%s', $i, $name, $suffix);
        }

        return implode("\n", $lines);
    }

    /**
     * @param list<array<string, mixed>> $travellers
     */
    private static function buildTravelersListHtml(array $travellers): string
    {
        if ($travellers === []) {
            return '';
        }

        $items = [];
        $i = 0;
        foreach ($travellers as $row) {
            ++$i;
            $fields = isset($row['fields']) && is_array($row['fields']) ? $row['fields'] : [];
            $name = esc_html(self::travelerDisplayName($fields));
            $lead = !empty($row['is_lead']);
            $badge = $lead ? ' <span style="color:#64748b;font-size:12px;">(' . esc_html__('Lead', 'yatra') . ')</span>' : '';
            $items[] = '<li style="margin:4px 0;">' . $name . $badge . '</li>';
        }

        return '<ul style="margin:8px 0;padding-left:20px;">' . implode('', $items) . '</ul>';
    }

    /**
     * Dynamic / non-core traveler meta only (excludes common identity fields duplicated on the booking contact).
     *
     * @param list<array<string, mixed>> $travellers
     */
    private static function buildTravelerCustomFieldsHtml(array $travellers): string
    {
        if ($travellers === []) {
            return '';
        }

        /** @var array<int, string> $skip */
        $skip = apply_filters(
            'yatra_booking_email_traveler_identity_field_keys',
            ['first_name', 'last_name', 'email', 'phone', 'country']
        );
        $skip = array_fill_keys(array_map('strval', $skip), true);

        $blocks = [];
        $i = 0;
        foreach ($travellers as $row) {
            ++$i;
            $fields = isset($row['fields']) && is_array($row['fields']) ? $row['fields'] : [];
            $rows = [];
            foreach ($fields as $key => $value) {
                $k = (string) $key;
                if ($k === '' || (strpos($k, '_') === 0)) {
                    continue;
                }
                if (isset($skip[$k])) {
                    continue;
                }
                $plain = self::scalarToPlain($value);
                if ($plain === '') {
                    continue;
                }
                $label = esc_html(self::humanizeKey($k));
                $val = self::scalarToHtml($value);
                $rows[] = '<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#64748b;width:40%;">'
                    . $label
                    . '</td><td style="padding:4px 0;vertical-align:top;">'
                    . $val
                    . '</td></tr>';
            }
            if ($rows === []) {
                continue;
            }

            $title = sprintf(
                /* translators: %1$d: traveler index, %2$s: traveler display name */
                __('Traveler %1$d — %2$s', 'yatra'),
                $i,
                self::travelerDisplayName($fields)
            );
            $blocks[] = '<div style="margin:12px 0 0;">'
                . '<p style="margin:0 0 6px;font-weight:600;">' . esc_html($title) . '</p>'
                . '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">'
                . implode('', $rows)
                . '</table></div>';
        }

        return implode('', $blocks);
    }

    /**
     * Booking-level JSON meta (excluding internal keys) + additional services snapshot when present.
     */
    private static function buildBookingCustomFieldsHtml(object $booking): string
    {
        $parts = [];

        $snapshotSection = self::formatAdditionalServicesSnapshot(self::decodeBookingMeta($booking));
        if ($snapshotSection !== '') {
            $parts[] = $snapshotSection;
        }

        $meta = self::decodeBookingMeta($booking);
        foreach ($meta as $key => $value) {
            $k = (string) $key;
            if (self::isInternalBookingMetaKey($k)) {
                continue;
            }
            $plain = self::scalarToPlain($value);
            if ($plain === '') {
                continue;
            }
            $label = esc_html(self::humanizeKey($k));
            $val = self::scalarToHtml($value);
            $parts[] = '<div style="margin:8px 0 0;">'
                . '<span style="color:#64748b;">' . $label . ':</span> '
                . $val
                . '</div>';
        }

        return implode('', $parts);
    }

    /**
     * @return array<string, mixed>
     */
    private static function decodeBookingMeta(object $booking): array
    {
        $raw = $booking->meta ?? null;
        if ($raw === null || $raw === '') {
            return [];
        }
        if (is_array($raw)) {
            return $raw;
        }
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    private static function isInternalBookingMetaKey(string $k): bool
    {
        if ($k === '' || strpos($k, '_') === 0) {
            return true;
        }

        return in_array($k, [
            'additional_services',
            'additional_services_updated_at',
            'additional_services_snapshot',
        ], true);
    }

    /**
     * @param array<string, mixed> $meta
     */
    private static function formatAdditionalServicesSnapshot(array $meta): string
    {
        $snap = $meta['additional_services_snapshot'] ?? null;
        if (!is_array($snap) || $snap === []) {
            return '';
        }

        $items = [];
        foreach ($snap as $row) {
            if (!is_array($row)) {
                continue;
            }
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $price = isset($row['price']) ? (float) $row['price'] : 0.0;
            $currency = SettingsService::getCurrency();
            $priceBit = $price > 0 ? ' — ' . esc_html(yatra_format_price($price, $currency)) : '';
            $items[] = '<li style="margin:4px 0;">' . esc_html($name) . $priceBit . '</li>';
        }

        if ($items === []) {
            return '';
        }

        $heading = esc_html__('Additional services', 'yatra');

        return '<div style="margin:12px 0 0;">'
            . '<p style="margin:0 0 6px;font-weight:600;">' . $heading . '</p>'
            . '<ul style="margin:0;padding-left:20px;">' . implode('', $items) . '</ul>'
            . '</div>';
    }

    /**
     * @param array<string, mixed> $fields
     */
    private static function travelerDisplayName(array $fields): string
    {
        $fn = trim((string) ($fields['first_name'] ?? ''));
        $ln = trim((string) ($fields['last_name'] ?? ''));
        $combined = trim($fn . ' ' . $ln);
        if ($combined !== '') {
            return $combined;
        }
        if (!empty($fields['full_name'])) {
            return trim((string) $fields['full_name']);
        }

        return __('Traveler', 'yatra');
    }

    private static function humanizeKey(string $key): string
    {
        $key = str_replace(['-', '.'], '_', $key);

        return ucwords(str_replace('_', ' ', $key));
    }

    /**
     * @param mixed $value
     */
    private static function scalarToPlain($value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        if (is_scalar($value)) {
            return trim((string) $value);
        }
        if (is_array($value)) {
            $enc = wp_json_encode($value);

            return $enc !== false ? $enc : '';
        }

        return '';
    }

    /**
     * @param mixed $value
     */
    private static function scalarToHtml($value): string
    {
        if ($value === null || $value === '') {
            return '';
        }
        if (is_bool($value)) {
            return $value ? esc_html__('Yes', 'yatra') : esc_html__('No', 'yatra');
        }
        if (is_scalar($value)) {
            return nl2br(esc_html(trim((string) $value)));
        }
        if (is_array($value)) {
            if ($value === []) {
                return '';
            }
            $allScalar = true;
            foreach ($value as $v) {
                if (!is_scalar($v) && $v !== null) {
                    $allScalar = false;
                    break;
                }
            }
            if ($allScalar) {
                $lis = [];
                foreach ($value as $k => $v) {
                    if (is_int($k)) {
                        $lis[] = '<li style="margin:2px 0;">' . nl2br(esc_html(trim((string) $v))) . '</li>';
                    } else {
                        $lis[] = '<li style="margin:2px 0;"><strong>' . esc_html(self::humanizeKey((string) $k))
                            . ':</strong> ' . nl2br(esc_html(trim((string) $v))) . '</li>';
                    }
                }

                return '<ul style="margin:4px 0;padding-left:18px;">' . implode('', $lis) . '</ul>';
            }
            $json = wp_json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            return '<pre style="margin:6px 0;padding:8px;background:#f8fafc;border-radius:6px;font-size:12px;white-space:pre-wrap;">'
                . esc_html($json !== false ? $json : '')
                . '</pre>';
        }

        return '';
    }
}
