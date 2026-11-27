<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\CustomerRepository;

/**
 * CSV exports for the booking workspace: the bookings list (with the list's
 * own filters), a departure manifest (everyone travelling on one trip on one
 * date) and the customer list.
 *
 * Cells that a spreadsheet would run as a formula (=, +, -, @, tab, CR) are
 * prefixed with a quote, so a booking field typed by a customer can't execute
 * in the operator's spreadsheet (CSV/formula injection).
 */
class BookingExportService
{
    private const MAX_ROWS = 20000;

    /** Bookings whose travellers go on the trip. */
    private const TRAVELLING_STATUSES = ['confirmed', 'pending', 'completed'];

    /**
     * @param array<string, mixed> $filters Same keys as GET /bookings.
     * @return array{filename:string, csv:string, rows:int}
     */
    public function bookingsCsv(array $filters): array
    {
        $repo = new BookingRepository();
        $rows = [[
            __('Reference', 'yatra'), __('Booked on', 'yatra'), __('Trip', 'yatra'), __('Travel date', 'yatra'),
            __('Travellers', 'yatra'), __('Customer', 'yatra'), __('Email', 'yatra'), __('Phone', 'yatra'), __('Country', 'yatra'),
            __('Booking status', 'yatra'), __('Payment status', 'yatra'), __('Payment method', 'yatra'),
            __('Total', 'yatra'), __('Paid', 'yatra'), __('Due', 'yatra'), __('Currency', 'yatra'), __('Coupon', 'yatra'),
        ]];

        $count = 0;
        for ($page = 1; $count < self::MAX_ROWS; $page++) {
            $result = $repo->paginate(array_merge($filters, ['page' => $page, 'per_page' => 100]));
            foreach ((array) ($result['data'] ?? []) as $b) {
                $rows[] = [
                    (string) ($b->reference ?? ''),
                    (string) ($b->created_at ?? ''),
                    (string) ($b->trip_title ?? ''),
                    (string) ($b->travel_date ?? ''),
                    (string) (int) ($b->travelers_count ?? 0),
                    trim((string) ($b->contact_first_name ?? '') . ' ' . (string) ($b->contact_last_name ?? '')),
                    (string) ($b->contact_email ?? ''),
                    (string) ($b->contact_phone ?? ''),
                    (string) ($b->contact_country ?? ''),
                    self::statusLabel((string) ($b->status ?? '')),
                    self::statusLabel((string) ($b->payment_status ?? '')),
                    $this->gatewayLabel((string) ($b->payment_gateway ?? '')),
                    number_format((float) ($b->total_amount ?? 0), 2, '.', ''),
                    number_format((float) ($b->amount_paid ?? 0), 2, '.', ''),
                    number_format((float) ($b->amount_due ?? 0), 2, '.', ''),
                    (string) ($b->currency ?? ''),
                    (string) ($b->discount_code ?? ''),
                ];
                $count++;
            }
            if ($page >= (int) ($result['total_pages'] ?? 1) || empty($result['data'])) {
                break;
            }
        }

        return [
            'filename' => 'yatra-bookings-' . current_time('Y-m-d') . '.csv',
            'csv' => self::toCsv($rows),
            'rows' => $count,
            'truncated' => $count >= self::MAX_ROWS,
        ];
    }

    /**
     * Everyone travelling on a trip on a date: one row per traveller, with
     * the lead contact, emergency contact and the booking's payment state.
     * Cancelled bookings are left out.
     *
     * @return array{filename:string, csv:string, rows:int}
     */
    public function manifestCsv(int $tripId, string $date, int $departureId = 0): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\BookingsTable::getTableName();
        if ($departureId > 0) {
            // Exactly the bookings the departure screen lists (its link table),
            // so two departures on one day stay apart.
            $service = new DepartureService(new \Yatra\Repositories\DepartureRepository());
            $ids = array_map(static function ($b) {
                return (int) $b->id;
            }, array_filter($service->getBookingsForDeparture($departureId), static function ($b) {
                return in_array((string) ($b->status ?? ''), self::TRAVELLING_STATUSES, true);
            }));
        } else {
            $in = implode(',', array_fill(0, count(self::TRAVELLING_STATUSES), '%s'));
            $ids = array_map('intval', (array) $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM {$table} WHERE trip_id = %d AND travel_date = %s AND status IN ({$in}) ORDER BY id ASC",
                array_merge([$tripId, $date], self::TRAVELLING_STATUSES)
            )));
        }

        $rows = [[
            __('Reference', 'yatra'), __('Traveller', 'yatra'), __('First name', 'yatra'), __('Last name', 'yatra'),
            __('Date of birth', 'yatra'), __('Gender', 'yatra'), __('Nationality', 'yatra'), __('Lead contact', 'yatra'),
            __('Email', 'yatra'), __('Phone', 'yatra'), __('Emergency contact', 'yatra'), __('Emergency phone', 'yatra'),
            __('Booking status', 'yatra'), __('Payment status', 'yatra'), __('Due', 'yatra'), __('Special requests', 'yatra'),
            __('Pickup point', 'yatra'), __('Accommodation', 'yatra'), __('Travel insurance', 'yatra'),
        ]];

        $service = new BookingService();
        // Choice fields (gender…) print their label, as the checkout shows them.
        $optionLabels = [];
        $config = SettingsService::getBookingFormConfig($tripId > 0 ? $tripId : null);
        foreach ((array) ($config['traveler_form']['fields'] ?? []) as $field) {
            foreach ((array) ($field['options'] ?? []) as $opt) {
                if (is_array($opt) && isset($opt['value'], $field['id'])) {
                    $optionLabels[(string) $field['id']][(string) $opt['value']] = (string) ($opt['label'] ?? $opt['value']);
                }
            }
        }
        $label = static function (string $fieldId, string $value) use ($optionLabels): string {
            return $optionLabels[$fieldId][$value] ?? $value;
        };
        $count = 0;
        foreach ($ids as $id) {
            $b = $service->getBooking($id);
            if (!is_array($b)) {
                continue;
            }
            $emergency = is_array($b['emergency_contact'] ?? null) ? $b['emergency_contact'] : [];
            $travelers = is_array($b['travelers'] ?? null) ? array_values($b['travelers']) : [];
            if ($travelers === []) {
                $travelers = [['first_name' => (string) ($b['contact_first_name'] ?? ''), 'last_name' => (string) ($b['contact_last_name'] ?? '')]];
            }
            foreach ($travelers as $i => $t) {
                $t = is_array($t) ? $t : (array) $t;
                // Traveller form values live under 'fields'.
                $t = is_array($t['fields'] ?? null) ? array_merge($t, $t['fields']) : $t;
                $rows[] = [
                    (string) ($b['reference'] ?? ''),
                    (string) ($i + 1),
                    (string) ($t['first_name'] ?? ''),
                    (string) ($t['last_name'] ?? ''),
                    (string) ($t['date_of_birth'] ?? ''),
                    $label('gender', (string) ($t['gender'] ?? '')),
                    (string) ($t['nationality'] ?? ''),
                    trim((string) ($b['contact_first_name'] ?? '') . ' ' . (string) ($b['contact_last_name'] ?? '')),
                    (string) ($b['contact_email'] ?? ''),
                    (string) ($b['contact_phone'] ?? ''),
                    (string) ($emergency['name'] ?? ''),
                    (string) ($emergency['phone'] ?? ''),
                    self::statusLabel((string) ($b['booking_status'] ?? $b['status'] ?? '')),
                    self::statusLabel((string) ($b['payment_status'] ?? '')),
                    number_format((float) ($b['amount_due'] ?? 0), 2, '.', ''),
                    (string) ($b['special_requests'] ?? ''),
                    PickupPointService::label(is_array($b['pickup_point'] ?? null) ? $b['pickup_point'] : null),
                    (string) (is_array($b['accommodation'] ?? null) ? ($b['accommodation']['name'] ?? '') : ''),
                    CheckoutChoiceService::insuranceLabel(is_array($b['travel_insurance'] ?? null) ? $b['travel_insurance'] : null),
                ];
                $count++;
            }
        }

        return [
            'filename' => 'yatra-manifest-' . ($departureId > 0 ? 'departure-' . $departureId : $tripId . '-' . $date) . '.csv',
            'csv' => self::toCsv($rows),
            'rows' => $count,
        ];
    }

    /**
     * @return array{filename:string, csv:string, rows:int}
     */
    public function customersCsv(): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\CustomersTable::getTableName();
        $bookings = \Yatra\Database\Tables\BookingsTable::getTableName();
        // "Total spent" = money actually received on their bookings (after
        // refunds), not the sum of booking totals the stored column holds.
        $customers = (array) $wpdb->get_results(
            "SELECT c.*,
                (SELECT COALESCE(SUM(b.amount_paid), 0) FROM {$bookings} b
                  WHERE b.customer_id = c.id OR (b.customer_id IS NULL AND b.contact_email = c.email AND c.email <> '')) AS paid_total,
                (SELECT COUNT(*) FROM {$bookings} b
                  WHERE b.customer_id = c.id OR (b.customer_id IS NULL AND b.contact_email = c.email AND c.email <> '')) AS bookings_total
             FROM {$table} c ORDER BY c.id ASC LIMIT " . (int) self::MAX_ROWS
        );

        $rows = [[
            __('First name', 'yatra'), __('Last name', 'yatra'), __('Email', 'yatra'), __('Phone', 'yatra'),
            __('Country', 'yatra'), __('Bookings', 'yatra'), __('Total spent', 'yatra'), __('Customer since', 'yatra'),
        ]];
        foreach ($customers as $c) {
            $rows[] = [
                (string) ($c->first_name ?? ''),
                (string) ($c->last_name ?? ''),
                (string) ($c->email ?? ''),
                (string) ($c->phone ?? ''),
                (string) ($c->country ?? ''),
                (string) (int) ($c->bookings_total ?? $c->total_bookings ?? 0),
                number_format((float) ($c->paid_total ?? $c->total_spent ?? 0), 2, '.', ''),
                (string) ($c->created_at ?? ''),
            ];
        }

        return [
            'filename' => 'yatra-customers-' . current_time('Y-m-d') . '.csv',
            'csv' => self::toCsv($rows),
            'rows' => count($customers),
        ];
    }

    private function gatewayLabel(string $id): string
    {
        return BookingActivityService::paymentMethodLabel($id);
    }

    private static function statusLabel(string $status): string
    {
        return BookingActivityService::statusLabel($status);
    }

    /**
     * @param array<int, array<int, string>> $rows
     */
    public static function toCsv(array $rows): string
    {
        $out = fopen('php://temp', 'r+');
        if ($out === false) {
            return '';
        }
        // UTF-8 BOM so Excel opens accented names correctly.
        fwrite($out, "\xEF\xBB\xBF");
        foreach ($rows as $row) {
            // No escape character: RFC 4180 doubles quotes, which is what
            // spreadsheets expect (a backslash escape shifted columns in Excel).
            fputcsv($out, array_map([self::class, 'safeCell'], $row), ',', '"', '');
        }
        rewind($out);
        $csv = (string) stream_get_contents($out);
        fclose($out);

        return $csv;
    }

    /** Neutralise spreadsheet formulas. */
    public static function safeCell($value): string
    {
        $value = (string) $value;
        if ($value !== '' && strpos("=+-@\t\r", $value[0]) !== false) {
            // A plain negative number or an international phone number is
            // data, not a formula.
            if (!preg_match('/^-\d+(\.\d+)?$/', $value) && !preg_match('/^\+[\d\s().-]+$/', $value)) {
                return "'" . $value;
            }
        }

        return $value;
    }
}
