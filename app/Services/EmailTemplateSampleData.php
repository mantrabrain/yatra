<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;

/**
 * Sample merge-tag data for email previews and tests.
 * Trip context: pass {@see self::forTemplateKey()} a trip ID to hydrate trip_* tags from the database.
 *
 * @see apply_filters('yatra_email_template_preview_variables', ...)
 * @see apply_filters('yatra_email_template_trip_variables', ...)
 */
final class EmailTemplateSampleData
{
    /**
     * @param int|null $tripId Optional Yatra trip ID to merge real trip_name, trip_url, trip_id
     * @return array<string, string>
     */
    public static function forTemplateKey(string $templateKey, ?int $tripId = null): array
    {
        $vars = self::baseSamples();
        if ($tripId !== null && $tripId > 0) {
            $vars = self::mergeTripContext($tripId, $vars);
        }

        /** @var array<string, string> $filtered */
        $filtered = apply_filters('yatra_email_template_preview_variables', $vars, $templateKey, $tripId);

        return TransactionalEmailTemplateService::mergeTemplateVariables($filtered);
    }

    /**
     * @return array<string, string>
     */
    private static function baseSamples(): array
    {
        $currency = SettingsService::getCurrency();
        $travelSample = date_i18n(get_option('date_format'), strtotime('+14 days'));

        return [
            'customer_name' => __('Alex Traveler', 'yatra'),
            'customer_first_name' => 'Alex',
            'customer_last_name' => __('Traveler', 'yatra'),
            'customer_email' => 'alex@example.com',
            'customer_phone' => '+1 555 0100',
            'booking_reference' => 'YTR-PREVIEW-001',
            'booking_id' => '42',
            'trip_id' => '101',
            'trip_name' => __('Sample Mountain Trek', 'yatra'),
            'travel_date' => $travelSample,
            'travelers_count' => '2',
            'total_amount_formatted' => yatra_format_price(2499.0, $currency),
            'amount_due_formatted' => yatra_format_price(499.0, $currency),
            'currency' => $currency,
            'booking_status' => __('confirmed', 'yatra'),
            'payment_status' => __('pending', 'yatra'),
            'intro_paragraph' => __('Thank you for your booking. This preview uses sample data.', 'yatra'),
            'details_html' => '<p><strong>' . esc_html__('Note', 'yatra') . ':</strong> ' . esc_html__('Optional line items appear here.', 'yatra') . '</p>',
            'footer_note' => __('We look forward to hosting you.', 'yatra'),
            'payment_amount_formatted' => yatra_format_price(500.0, $currency),
            'payment_method' => __('Credit card', 'yatra'),
            'transaction_id' => 'txn_preview_001',
            'reminder_days' => '7',
            'days_until_trip' => '7',
            'reminder_extra_html' => '<p>' . esc_html__('Reminder: check your packing list before departure.', 'yatra') . '</p>',
            'trip_url' => home_url('/'),
            'review_url' => home_url('/#reviews'),
            'admin_url' => admin_url('admin.php?page=yatra'),
            'booking_url' => home_url('/my-account/bookings/42'),
            'message' => __('Could you confirm whether airport pickup is included on day one?', 'yatra'),
            'response' => __('Hi Alex, yes — pickup is included for all guests. Safe travels!', 'yatra'),
            'original_message' => __('Interested in the April departure dates.', 'yatra'),
        ];
    }

    /**
     * @param array<string, string> $vars
     * @return array<string, string>
     */
    private static function mergeTripContext(int $tripId, array $vars): array
    {
        try {
            $repo = new TripRepository();
            $trip = $repo->findWithRelations($tripId, true);
            if ($trip && !empty($trip->id)) {
                $vars['trip_id'] = (string) (int) $trip->id;
                if (!empty($trip->title)) {
                    $vars['trip_name'] = (string) $trip->title;
                }
                if (!empty($trip->slug)) {
                    $vars['trip_url'] = home_url('/' . SettingsService::getTripBase() . '/' . rawurlencode((string) $trip->slug) . '/');
                }
            }
        } catch (\Throwable $e) {
            // Leave sample trip_* as-is
        }

        /** @var array<string, string> */
        return apply_filters('yatra_email_template_trip_variables', $vars, $tripId);
    }

    public static function isPreviewableTemplateKey(string $templateKey): bool
    {
        if (TransactionalEmailTemplateService::coreTemplateKeyToType($templateKey) !== null) {
            return true;
        }

        return EmailTemplateDefaults::proSystemTemplate($templateKey) !== null;
    }
}
