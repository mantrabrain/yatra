<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Helpers\FormatHelper;
use Yatra\Repositories\TripRepository;

/**
 * Single source of truth for the customer-facing itinerary PDF.
 *
 * Two REST routes generate this exact same PDF — `/bookings/{id}/itinerary`
 * (BookingsController, used when the booking has no payment row yet) and
 * `/payments/{id}/itinerary` (PaymentGatewayController, used once payment
 * exists). Before this class, each one composed its own template-data
 * array, fetched its own trip, and re-implemented the same status mapping
 * & date formatting — three subtle drift points where the two PDFs would
 * disagree on the same booking (e.g. the payment-side one passed
 * `default_font: DejaVu Sans` which overrode the locale-aware font,
 * stripping every Nepali glyph in the booking-side PDF; only one path
 * loaded the day-by-day itinerary; etc.).
 *
 * Callers now hand this class a normalized `$source` array — extracted
 * from whichever data shape they have on hand (booking array vs joined
 * payment object) — and we build + render the PDF identically for both.
 */
class ItineraryPdfBuilder
{
    private TripRepository $tripRepository;
    private PdfService $pdfService;

    public function __construct(?TripRepository $tripRepository = null, ?PdfService $pdfService = null)
    {
        $this->tripRepository = $tripRepository ?? new TripRepository();
        $this->pdfService = $pdfService ?? new PdfService();
    }

    public function pdfService(): PdfService
    {
        return $this->pdfService;
    }

    /**
     * Build the PDF binary for an itinerary.
     *
     * @param array<string,mixed> $source Booking-like array with at minimum
     *   `trip_id`, `booking_id`, `travel_date`, `created_at`,
     *   `contact_first_name`, `contact_last_name`, `contact_email`,
     *   `customer_name`, `booking_status`, `total_amount`,
     *   `amount_paid`, `amount_due`, `travelers_count`. Unknown keys
     *   are ignored.
     * @return string Raw PDF bytes.
     */
    public function build(array $source): string
    {
        $tripId  = (int) ($source['trip_id'] ?? 0);
        $trip    = null;
        $itineraryDays = [];
        if ($tripId > 0) {
            // findWithRelations: needed so $trip carries the itinerary-day
            // model for the "About this trip" sidebar. getItineraryDays
            // returns the timeline used by the "Travel Timeline" section.
            $trip = $this->tripRepository->findWithRelations($tripId)
                ?: $this->tripRepository->find($tripId);
            $itineraryDays = $this->tripRepository->getItineraryDays($tripId);
        }

        $bookingId = (int) ($source['booking_id'] ?? 0);
        $bookingRef = $bookingId > 0
            ? 'YTR-' . strtoupper(str_pad((string) $bookingId, 8, '0', STR_PAD_LEFT))
            : '';

        $createdAt    = (string) ($source['created_at'] ?? $source['booking_date'] ?? '');
        $bookingDate  = $createdAt !== '' ? date_i18n(get_option('date_format'), strtotime($createdAt)) : '';
        $travelRaw    = (string) ($source['travel_date'] ?? '');
        $travelDate   = $travelRaw !== '' ? date_i18n(get_option('date_format'), strtotime($travelRaw)) : '';

        $returnDate = '';
        if ($travelRaw !== '' && $trip && !empty($trip->duration)) {
            $returnDate = date_i18n(
                get_option('date_format'),
                strtotime($travelRaw . ' +' . (int) $trip->duration . ' days')
            );
        }

        $statusRaw = strtolower((string) ($source['booking_status'] ?? $source['status'] ?? ''));
        $statusClass = in_array($statusRaw, ['confirmed', 'completed', 'success'], true)
            ? 'confirmed'
            : (in_array($statusRaw, ['cancelled'], true) ? 'cancelled' : 'pending');

        $customerName = trim(
            (string) ($source['contact_first_name'] ?? '')
            . ' '
            . (string) ($source['contact_last_name'] ?? '')
        );
        if ($customerName === '') {
            $customerName = (string) ($source['customer_name'] ?? __('Customer', 'yatra'));
        }

        $currency = SettingsService::getCurrency();

        $tripFallbackTitle = (string) ($source['trip_title'] ?? __('Trip Booking', 'yatra'));

        $templateData = [
            'company_name'    => SettingsService::get('company_name', get_bloginfo('name')),
            'company_address' => SettingsService::get('company_address', ''),
            'company_email'   => SettingsService::get('company_email', get_option('admin_email')),
            'company_phone'   => SettingsService::get('company_phone', ''),
            'customer_name'   => $customerName,
            'customer_email'  => (string) ($source['contact_email'] ?? $source['customer_email'] ?? ''),
            'booking_ref'     => $bookingRef,
            'booking_date'    => $bookingDate,
            'booking_status'  => ucfirst($statusRaw !== '' ? $statusRaw : 'pending'),
            'status_class'    => $statusClass,
            'trip_title'      => $trip ? ((string) ($trip->title ?? $tripFallbackTitle)) : $tripFallbackTitle,
            'trip_description'=> $trip ? (string) ($trip->description ?? $trip->content ?? '') : '',
            /* translators: %d: trip duration in days. */
            'trip_duration'   => ($trip && !empty($trip->duration)) ? sprintf(__('%d days', 'yatra'), (int) $trip->duration) : '',
            'trip_difficulty' => $trip ? (string) ($trip->difficulty_name ?? '') : '',
            'trip_highlights' => $trip ? ($trip->highlights ?? $trip->trip_highlights ?? '') : '',
            'trip_includes'   => $trip ? ($trip->includes ?? $trip->trip_includes ?? '') : '',
            'trip_excludes'   => $trip ? ($trip->excludes ?? $trip->trip_excludes ?? '') : '',
            'departure_location' => $trip ? (string) ($trip->departure_location ?? '') : '',
            'destination'     => $trip ? (string) ($trip->destination ?? '') : (string) ($source['destination'] ?? ''),
            'travel_date'     => $travelDate,
            'return_date'     => $returnDate,
            'currency_symbol' => FormatHelper::getCurrencySymbol($currency),
            'total_amount'    => number_format((float) ($source['total_amount'] ?? 0), 2),
            'amount_paid'     => number_format((float) ($source['amount_paid'] ?? 0), 2),
            'amount_due'      => number_format((float) ($source['amount_due'] ?? 0), 2),
            'traveler_count'  => (int) ($source['travelers_count'] ?? $source['traveler_count'] ?? $source['travelers'] ?? 1),
            'itinerary_days'  => $itineraryDays,
            // Real trip-specific Important Information fields, same
            // ones the single-trip page surfaces in its "Important
            // Information" section. The template renders only the
            // rows that are non-empty — no more hardcoded "Comfortable
            // clothing, walking shoes, sunscreen..." boilerplate.
            'physical_requirements'    => $trip ? (string) ($trip->physical_requirements ?? '') : '',
            'visa_requirements'        => $trip ? (string) ($trip->visa_requirements ?? '') : '',
            'vaccination_requirements' => $trip ? (string) ($trip->vaccination_requirements ?? '') : '',
            'cancellation_policy'      => $trip ? (string) ($trip->cancellation_policy ?? '') : '',
            'age_min'                  => $trip ? ($trip->age_min ?? null) : null,
            'age_max'                  => $trip ? ($trip->age_max ?? null) : null,
            'accommodation_type'       => $trip ? (string) ($trip->accommodation_type ?? '') : '',
            'accommodation_details'    => $trip ? (string) ($trip->accommodation_details ?? '') : '',
            'meal_plan'                => $trip ? (string) ($trip->meal_plan ?? '') : '',
            'transportation_included'  => (bool) ($trip->transportation_included ?? false),
            'pickup_location'          => $trip ? (string) ($trip->pickup_location ?? '') : '',
            'dropoff_location'         => $trip ? (string) ($trip->dropoff_location ?? '') : '',
            'transportation_details'   => $trip ? (string) ($trip->transportation_details ?? '') : '',
        ];

        // Locale-aware font is resolved inside PdfService — do NOT
        // pass a `default_font` override here, otherwise the Nepali /
        // Hindi / Arabic fonts loaded for non-Latin locales get
        // bypassed and we end up with the missing-glyph rectangles
        // this builder was created to eliminate.
        return $this->pdfService->renderTemplateToPdfSafely(
            'pdf/itinerary.php',
            $templateData,
            ['paper' => 'A4', 'orientation' => 'portrait']
        );
    }

    /**
     * Convenience: normalize a `$payment` joined record (the shape
     * PaymentRepository returns for itinerary endpoints — payment row
     * with booking columns joined in) into the `$source` array `build()`
     * accepts. Saves the caller from duplicating field mapping logic.
     */
    public function buildFromPaymentRecord(object $payment): string
    {
        return $this->build([
            'trip_id'             => $payment->trip_id ?? 0,
            'booking_id'          => $payment->booking_id ?? 0,
            'created_at'          => $payment->created_at ?? null,
            'travel_date'         => $payment->travel_date ?? null,
            // Use the BOOKING status, not the payment status. Payment
            // status can be "completed" while the booking itself is
            // still "pending" admin confirmation — the itinerary
            // header should reflect the booking, not the transaction.
            'booking_status'      => $payment->booking_status ?? $payment->status ?? null,
            'contact_first_name'  => $payment->contact_first_name ?? null,
            'contact_last_name'   => $payment->contact_last_name ?? null,
            'contact_email'       => $payment->contact_email ?? $payment->customer_email ?? null,
            'customer_name'       => $payment->customer_name ?? null,
            'trip_title'          => $payment->trip_title ?? null,
            'destination'         => $payment->destination ?? null,
            'total_amount'        => $payment->booking_total_amount ?? $payment->amount ?? 0,
            'amount_paid'         => $payment->booking_amount_paid ?? $payment->amount ?? 0,
            'amount_due'          => $payment->booking_amount_due ?? 0,
            'travelers_count'     => $payment->traveler_count ?? $payment->travelers_count ?? $payment->travelers ?? 1,
        ]);
    }
}
