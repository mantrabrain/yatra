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

        if ($templateKey === 'trip_consent_request') {
            $vars['recipient_name'] = $vars['customer_name'] ?? __('Alex Traveler', 'yatra');
            $vars['form_name'] = __('Trip liability & release', 'yatra');
            $vars['consent_link'] = home_url('/trip-consent/preview-token/');
            $vars['expiry_notice_html'] = '<strong>' . esc_html__('This link expires soon.', 'yatra') . '</strong> '
                . esc_html__('Request a new email from the operator if needed.', 'yatra');
            $vars['consent_test_notice_html'] = '';
        }

        if ($templateKey === 'customer_email_verification') {
            $previewTok = defined('YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN')
                ? (string) YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN
                : 'preview-verify-token';
            $vars['verification_link'] = function_exists('yatra_get_email_verification_url')
                ? yatra_get_email_verification_url($previewTok)
                : home_url('/?yatra_verify_email=' . rawurlencode($previewTok));
            $vars['intro_paragraph'] = __('Thank you for registering. Click the button below to verify your email and activate your account.', 'yatra');
            $vars['footer_note'] = __('If you did not create an account, you can ignore this email.', 'yatra');
            $vars['expiry_notice_html'] = esc_html(
                sprintf(
                    /* translators: %d: hours */
                    __('This verification link expires in %d hours for your security.', 'yatra'),
                    24
                )
            );
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
            'expiry_policy_note' => __('Unpaid bookings are released after the deadline.', 'yatra'),
            'scheduled_amount_formatted' => yatra_format_price(750.0, $currency),
            'scheduled_date_formatted' => date_i18n(get_option('date_format'), strtotime('+5 days')),
            'payment_type_label' => __('Installment', 'yatra'),
            'scheduled_payment_id' => '9',
            'balance_after_formatted' => yatra_format_price(1749.0, $currency),
            'failure_reason' => __('Card declined (insufficient funds).', 'yatra'),
            'failure_intro_html' => '<p style="margin:0;">'
                . esc_html__('We could not process your scheduled payment.', 'yatra')
                . '</p>',
            'failure_followup_html' => esc_html__(
                'Please update your payment method or contact us so we can retry before your booking is affected.',
                'yatra'
            ),
            'recovery_intro_html' => '<p style="margin:0;">'
                . esc_html__('You left items in your cart — your trip is still available to book.', 'yatra')
                . '</p>',
            'recovery_reminder_label' => __('48 hours left at this price', 'yatra'),
            'recovery_link' => home_url('/book/preview-recovery/'),
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
