<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Generates an iCalendar (.ics) "add to calendar" file for a booking.
 *
 * Pure/stateless: it only formats a booking into a VCALENDAR string — it never
 * queries or authorises anything. Callers are responsible for loading the
 * booking and confirming the requester may see it.
 *
 * Tours are date-based, so the event is emitted as an ALL-DAY event
 * (DTSTART/DTEND with VALUE=DATE). Per RFC 5545 the all-day DTEND is exclusive,
 * so it is set to the day AFTER the trip's last day.
 *
 * @package Yatra\Services
 * @since 3.0.9
 */
class IcsService
{
    /**
     * Build the .ics contents for a booking. Returns an empty string when the
     * booking has no usable date (nothing sensible to put on a calendar).
     *
     * @param object      $booking A booking row (expects reference, trip_title/
     *                             trip_id, start_date|travel_date, end_date).
     * @param object|null $trip    Optional trip row for title / meeting point.
     */
    public static function forBooking(object $booking, ?object $trip = null): string
    {
        $startRaw = (string) ($booking->start_date ?? ($booking->travel_date ?? ''));
        $startTs = $startRaw !== '' ? strtotime($startRaw) : false;
        if ($startTs === false) {
            return '';
        }

        $endRaw = (string) ($booking->end_date ?? '');
        $endTs = $endRaw !== '' ? strtotime($endRaw) : false;
        if ($endTs === false || $endTs < $startTs) {
            $endTs = $startTs;
        }
        // All-day DTEND is exclusive → day after the last trip day.
        $dtEndExclusive = $endTs + DAY_IN_SECONDS;

        $title = (string) ($booking->trip_title ?? ($trip->title ?? ''));
        if ($title === '') {
            $title = __('Your trip', 'yatra');
        }
        $reference = (string) ($booking->reference ?? '');

        $descriptionParts = [];
        if ($reference !== '') {
            /* translators: %s: booking reference. */
            $descriptionParts[] = sprintf(__('Booking reference: %s', 'yatra'), $reference);
        }
        $descriptionParts[] = get_bloginfo('name');
        $description = implode('\n', $descriptionParts);

        $location = '';
        foreach (['meeting_point', 'location', 'meeting_location'] as $field) {
            $candidate = is_object($trip) ? (string) ($trip->$field ?? '') : '';
            if ($candidate !== '') {
                $location = $candidate;
                break;
            }
        }

        $siteHost = (string) wp_parse_url(home_url(), PHP_URL_HOST);
        $uid = 'yatra-' . ($reference !== '' ? $reference : ('booking-' . (int) ($booking->id ?? 0)))
            . '@' . ($siteHost !== '' ? $siteHost : 'yatra');

        // current_time('timestamp', true) → UTC now for DTSTAMP.
        $stamp = gmdate('Ymd\THis\Z', (int) current_time('timestamp', true));

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Yatra//Booking//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' . self::escapeText($uid),
            'DTSTAMP:' . $stamp,
            'DTSTART;VALUE=DATE:' . gmdate('Ymd', $startTs),
            'DTEND;VALUE=DATE:' . gmdate('Ymd', $dtEndExclusive),
            'SUMMARY:' . self::escapeText($title),
            'DESCRIPTION:' . self::escapeText($description),
        ];
        if ($location !== '') {
            $lines[] = 'LOCATION:' . self::escapeText($location);
        }
        $lines[] = 'STATUS:CONFIRMED';
        $lines[] = 'END:VEVENT';
        $lines[] = 'END:VCALENDAR';

        // RFC 5545 requires CRLF line breaks.
        return implode("\r\n", array_map([self::class, 'foldLine'], $lines)) . "\r\n";
    }

    /**
     * A filesystem-safe download filename for the booking's .ics.
     */
    public static function filename(object $booking): string
    {
        $reference = (string) ($booking->reference ?? '');
        $slug = $reference !== '' ? sanitize_file_name($reference) : ('booking-' . (int) ($booking->id ?? 0));
        return 'yatra-' . $slug . '.ics';
    }

    /**
     * Escape a text value per RFC 5545 (backslash, comma, semicolon, newlines).
     */
    private static function escapeText(string $value): string
    {
        $value = str_replace('\\', '\\\\', $value);
        $value = str_replace(["\r\n", "\r", "\n"], '\n', $value);
        $value = str_replace([',', ';'], ['\,', '\;'], $value);
        return $value;
    }

    /**
     * Fold lines longer than 75 octets per RFC 5545 (continuation lines start
     * with a single space).
     */
    private static function foldLine(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }
        $folded = '';
        while (strlen($line) > 75) {
            $folded .= substr($line, 0, 75) . "\r\n ";
            $line = substr($line, 75);
        }
        return $folded . $line;
    }
}
