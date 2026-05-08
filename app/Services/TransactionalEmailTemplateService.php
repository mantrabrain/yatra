<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Central transactional emails (booking, payment, cancellation, reminder).
 * Content is editable under Email → Templates (settings-backed) or overridden by Pro Email Automation DB templates via filter.
 */
class TransactionalEmailTemplateService
{
    public const TYPE_BOOKING_CONFIRMATION = 'booking_confirmation';

    public const TYPE_PAYMENT_CONFIRMATION = 'payment_confirmation';

    public const TYPE_BOOKING_CANCELLATION = 'booking_cancellation';

    public const TYPE_BOOKING_REMINDER = 'booking_reminder';

    public const TYPE_ADMIN_NEW_BOOKING = 'admin_new_booking';

    public const TYPE_ADMIN_PAYMENT_RECEIVED = 'admin_payment_received';

    public const TYPE_ADMIN_BOOKING_CANCELLED = 'admin_booking_cancelled_notice';

    /** Trip consent request (Yatra Pro Trip Consent module). */
    public const TYPE_TRIP_CONSENT_REQUEST = 'trip_consent_request';

    /** Customer account email verification (e.g. checkout registration). */
    public const TYPE_CUSTOMER_EMAIL_VERIFICATION = 'customer_email_verification';

    public const TYPE_BOOKING_COMPLETED = 'booking_completed';

    public const TYPE_BOOKING_EXPIRED_CUSTOMER = 'booking_expired_customer';

    public const TYPE_ADMIN_BOOKING_EXPIRED = 'admin_booking_expired';

    public const TYPE_SCHEDULED_PAYMENT_REMINDER = 'scheduled_payment_reminder';

    public const TYPE_SCHEDULED_PAYMENT_SUCCEEDED = 'scheduled_payment_succeeded';

    public const TYPE_SCHEDULED_PAYMENT_FAILED = 'scheduled_payment_failed';

    public const TYPE_ADMIN_SCHEDULED_PAYMENT_FAILED = 'admin_scheduled_payment_failed';

    public const TYPE_ENQUIRY_ADMIN = 'enquiry_admin';

    public const TYPE_ENQUIRY_CUSTOMER_RECEIVED = 'enquiry_received';

    public const TYPE_ENQUIRY_CUSTOMER_RESPONSE = 'enquiry_response';

    public const TYPE_REVIEW_REQUEST = 'review_request';

    /** Abandoned checkout recovery (Yatra Pro); 3-stage sequence. */
    public const TYPE_ABANDONED_BOOKING_RECOVERY_FIRST = 'abandoned_booking_recovery_first';
    public const TYPE_ABANDONED_BOOKING_RECOVERY_SECOND = 'abandoned_booking_recovery_second';
    public const TYPE_ABANDONED_BOOKING_RECOVERY_FINAL = 'abandoned_booking_recovery_final';

    /**
     * Map catalog / settings UI keys to internal render types.
     */
    public static function coreTemplateKeyToType(string $templateKey): ?string
    {
        $map = [
            'booking_confirmation' => self::TYPE_BOOKING_CONFIRMATION,
            'payment_received' => self::TYPE_PAYMENT_CONFIRMATION,
            'booking_cancelled' => self::TYPE_BOOKING_CANCELLATION,
            'trip_reminder' => self::TYPE_BOOKING_REMINDER,
            'admin_new_booking' => self::TYPE_ADMIN_NEW_BOOKING,
            'admin_payment_received' => self::TYPE_ADMIN_PAYMENT_RECEIVED,
            'admin_booking_cancelled' => self::TYPE_ADMIN_BOOKING_CANCELLED,
            'trip_consent_request' => self::TYPE_TRIP_CONSENT_REQUEST,
            'customer_email_verification' => self::TYPE_CUSTOMER_EMAIL_VERIFICATION,
            'booking_completed' => self::TYPE_BOOKING_COMPLETED,
            'booking_expired_customer' => self::TYPE_BOOKING_EXPIRED_CUSTOMER,
            'admin_booking_expired' => self::TYPE_ADMIN_BOOKING_EXPIRED,
            'scheduled_payment_reminder' => self::TYPE_SCHEDULED_PAYMENT_REMINDER,
            'scheduled_payment_succeeded' => self::TYPE_SCHEDULED_PAYMENT_SUCCEEDED,
            'scheduled_payment_failed' => self::TYPE_SCHEDULED_PAYMENT_FAILED,
            'admin_scheduled_payment_failed' => self::TYPE_ADMIN_SCHEDULED_PAYMENT_FAILED,
            'enquiry_admin' => self::TYPE_ENQUIRY_ADMIN,
            'enquiry_received' => self::TYPE_ENQUIRY_CUSTOMER_RECEIVED,
            'enquiry_response' => self::TYPE_ENQUIRY_CUSTOMER_RESPONSE,
            'review_request' => self::TYPE_REVIEW_REQUEST,
            'abandoned_booking_recovery_first' => self::TYPE_ABANDONED_BOOKING_RECOVERY_FIRST,
            'abandoned_booking_recovery_second' => self::TYPE_ABANDONED_BOOKING_RECOVERY_SECOND,
            'abandoned_booking_recovery_final' => self::TYPE_ABANDONED_BOOKING_RECOVERY_FINAL,
        ];

        return $map[$templateKey] ?? null;
    }

    /**
     * Sample merge-tag values for admin preview (core templates).
     *
     * @return array<string, string>
     */
    public static function sampleVariablesForCoreTemplateKey(string $templateKey): array
    {
        return EmailTemplateSampleData::forTemplateKey($templateKey);
    }

    /**
     * @param array<string, string|int|float> $variables
     * @return array<string, string>
     */
    public static function mergeTemplateVariables(array $variables): array
    {
        return self::mergeDefaultVariables($variables);
    }

    /**
     * Replace {{word}} placeholders (used by previews and extensions).
     *
     * @param array<string, string|int|float> $variables
     */
    public static function parseMergeTags(string $template, array $variables): string
    {
        $variables = self::mergeDefaultVariables($variables);

        return self::parseTemplate($template, $variables);
    }

    /**
     * Render using explicit subject/body templates (e.g. unsaved editor content). Empty strings use built-in defaults.
     *
     * @param array<string, string|int|float> $variables
     * @return array{subject: string, body: string}
     */
    public static function renderWithStringTemplates(string $type, string $subjectTpl, string $bodyTpl, array $variables): array
    {
        $variables = self::mergeDefaultVariables($variables);
        $variables = self::normalizeVariablesForType($type, $variables);
        $map = self::typeToSettingsKeys();
        if (!isset($map[$type])) {
            return ['subject' => '', 'body' => ''];
        }

        if ($subjectTpl === '') {
            $subject = self::defaultSubject($type, $variables);
        } else {
            $subject = self::parseTemplate($subjectTpl, $variables);
        }

        if ($bodyTpl === '') {
            $body = self::defaultBody($type, $variables);
        } else {
            $body = self::parseTemplate($bodyTpl, $variables);
        }

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function typeToSettingsKeys(): array
    {
        return [
            self::TYPE_BOOKING_CONFIRMATION => [
                'flag' => 'email_template_booking',
                'subject' => 'email_tpl_booking_subject',
                'body' => 'email_tpl_booking_body',
            ],
            self::TYPE_PAYMENT_CONFIRMATION => [
                'flag' => 'email_template_confirmation',
                'subject' => 'email_tpl_payment_subject',
                'body' => 'email_tpl_payment_body',
            ],
            self::TYPE_BOOKING_CANCELLATION => [
                'flag' => 'email_template_cancellation',
                'subject' => 'email_tpl_cancellation_subject',
                'body' => 'email_tpl_cancellation_body',
            ],
            self::TYPE_BOOKING_REMINDER => [
                'flag' => 'email_template_reminder',
                'subject' => 'email_tpl_reminder_subject',
                'body' => 'email_tpl_reminder_body',
            ],
            self::TYPE_ADMIN_NEW_BOOKING => [
                'flag' => 'email_template_admin_new_booking',
                'subject' => 'email_tpl_admin_booking_subject',
                'body' => 'email_tpl_admin_booking_body',
            ],
            self::TYPE_ADMIN_PAYMENT_RECEIVED => [
                'flag' => 'email_template_admin_payment',
                'subject' => 'email_tpl_admin_payment_subject',
                'body' => 'email_tpl_admin_payment_body',
            ],
            self::TYPE_ADMIN_BOOKING_CANCELLED => [
                'flag' => 'email_template_admin_cancellation',
                'subject' => 'email_tpl_admin_cancellation_subject',
                'body' => 'email_tpl_admin_cancellation_body',
            ],
            self::TYPE_TRIP_CONSENT_REQUEST => [
                'flag' => 'email_template_trip_consent',
                'subject' => 'email_tpl_trip_consent_subject',
                'body' => 'email_tpl_trip_consent_body',
            ],
            self::TYPE_CUSTOMER_EMAIL_VERIFICATION => [
                'flag' => 'email_template_customer_verification',
                'subject' => 'email_tpl_customer_verification_subject',
                'body' => 'email_tpl_customer_verification_body',
            ],
            self::TYPE_BOOKING_COMPLETED => [
                'flag' => 'email_template_booking_completed',
                'subject' => 'email_tpl_booking_completed_subject',
                'body' => 'email_tpl_booking_completed_body',
            ],
            self::TYPE_BOOKING_EXPIRED_CUSTOMER => [
                'flag' => 'email_template_booking_expired_customer',
                'subject' => 'email_tpl_booking_expired_customer_subject',
                'body' => 'email_tpl_booking_expired_customer_body',
            ],
            self::TYPE_ADMIN_BOOKING_EXPIRED => [
                'flag' => 'email_template_admin_booking_expired',
                'subject' => 'email_tpl_admin_booking_expired_subject',
                'body' => 'email_tpl_admin_booking_expired_body',
            ],
            self::TYPE_SCHEDULED_PAYMENT_REMINDER => [
                'flag' => 'email_template_scheduled_payment_reminder',
                'subject' => 'email_tpl_scheduled_payment_reminder_subject',
                'body' => 'email_tpl_scheduled_payment_reminder_body',
            ],
            self::TYPE_SCHEDULED_PAYMENT_SUCCEEDED => [
                'flag' => 'email_template_scheduled_payment_succeeded',
                'subject' => 'email_tpl_scheduled_payment_succeeded_subject',
                'body' => 'email_tpl_scheduled_payment_succeeded_body',
            ],
            self::TYPE_SCHEDULED_PAYMENT_FAILED => [
                'flag' => 'email_template_scheduled_payment_failed',
                'subject' => 'email_tpl_scheduled_payment_failed_subject',
                'body' => 'email_tpl_scheduled_payment_failed_body',
            ],
            self::TYPE_ADMIN_SCHEDULED_PAYMENT_FAILED => [
                'flag' => 'email_template_admin_scheduled_payment_failed',
                'subject' => 'email_tpl_admin_scheduled_payment_failed_subject',
                'body' => 'email_tpl_admin_scheduled_payment_failed_body',
            ],
            self::TYPE_ENQUIRY_ADMIN => [
                'flag' => 'email_template_enquiry_admin',
                'subject' => 'email_tpl_enquiry_admin_subject',
                'body' => 'email_tpl_enquiry_admin_body',
            ],
            self::TYPE_ENQUIRY_CUSTOMER_RECEIVED => [
                'flag' => 'email_template_enquiry_received',
                'subject' => 'email_tpl_enquiry_received_subject',
                'body' => 'email_tpl_enquiry_received_body',
            ],
            self::TYPE_ENQUIRY_CUSTOMER_RESPONSE => [
                'flag' => 'email_template_enquiry_response',
                'subject' => 'email_tpl_enquiry_response_subject',
                'body' => 'email_tpl_enquiry_response_body',
            ],
            self::TYPE_REVIEW_REQUEST => [
                'flag' => 'email_template_review_request',
                'subject' => 'email_tpl_review_request_subject',
                'body' => 'email_tpl_review_request_body',
            ],
            self::TYPE_ABANDONED_BOOKING_RECOVERY_FIRST => [
                'flag' => 'email_template_abandoned_booking_recovery_first',
                'subject' => 'email_tpl_abandoned_booking_recovery_first_subject',
                'body' => 'email_tpl_abandoned_booking_recovery_first_body',
            ],
            self::TYPE_ABANDONED_BOOKING_RECOVERY_SECOND => [
                'flag' => 'email_template_abandoned_booking_recovery_second',
                'subject' => 'email_tpl_abandoned_booking_recovery_second_subject',
                'body' => 'email_tpl_abandoned_booking_recovery_second_body',
            ],
            self::TYPE_ABANDONED_BOOKING_RECOVERY_FINAL => [
                'flag' => 'email_template_abandoned_booking_recovery_final',
                'subject' => 'email_tpl_abandoned_booking_recovery_final_subject',
                'body' => 'email_tpl_abandoned_booking_recovery_final_body',
            ],
        ];
    }

    /**
     * Send if the type is enabled in settings. Pro may handle via {@see 'yatra_send_transactional_email'}.
     *
     * Optional string `transactional_context` (e.g. `booking_created`, `status_confirmed`) is passed through
     * to the filter so Pro can choose a different template row for the same TYPE_BOOKING_CONFIRMATION.
     *
     * @param array<string, string|int|float> $variables Merge tags: {{key}}
     */
    public static function sendIfEnabled(string $type, string $to, array $variables = []): bool
    {
        $to = sanitize_email($to);
        if ($to === '' || !is_email($to)) {
            return false;
        }

        $map = self::typeToSettingsKeys();
        if (!isset($map[$type])) {
            return false;
        }

        $flag = $map[$type]['flag'];
        $proOwnsType = (bool) apply_filters('yatra_pro_email_automation_owns_transactional_type', false, $type);

        if (!$proOwnsType && !SettingsService::isEnabled($flag)) {
            return false;
        }

        $variables = self::mergeDefaultVariables($variables);
        $variables = self::normalizeVariablesForType($type, $variables);

        /**
         * Allow Yatra Pro (or extensions) to send instead of core templates.
         * Return null to use core; true/false if handled.
         */
        $handled = apply_filters('yatra_send_transactional_email', null, $type, $to, $variables);
        if ($handled !== null) {
            return (bool) $handled;
        }

        if (!SettingsService::isEnabled($flag)) {
            return false;
        }

        $rendered = self::render($type, $variables);

        return EmailService::send(
            $to,
            $rendered['subject'],
            $rendered['body'],
            ['Content-Type: text/html; charset=UTF-8']
        );
    }

    /**
     * @param array<string, string|int|float> $variables
     * @return array{subject: string, body: string}
     */
    public static function render(string $type, array $variables): array
    {
        $map = self::typeToSettingsKeys();
        if (!isset($map[$type])) {
            return ['subject' => '', 'body' => ''];
        }

        $subjectKey = $map[$type]['subject'];
        $bodyKey = $map[$type]['body'];

        $subjectTpl = SettingsService::getString($subjectKey, '');
        $bodyTpl = SettingsService::getString($bodyKey, '');

        return self::renderWithStringTemplates($type, $subjectTpl, $bodyTpl, $variables);
    }

    /**
     * @param array<string, string|int|float> $variables
     * @return array<string, string>
     */
    private static function mergeDefaultVariables(array $variables): array
    {
        $defaults = [
            'site_name' => get_bloginfo('name'),
            'site_url' => home_url('/'),
            'admin_email' => SettingsService::getString('admin_email', get_option('admin_email')),
        ];

        $out = [];
        foreach (array_merge($defaults, $variables) as $k => $v) {
            $out[(string) $k] = is_scalar($v) ? (string) $v : '';
        }

        return $out;
    }

    /**
     * Ensure templates always have safe, meaningful defaults for commonly-used tags.
     *
     * This prevents "blank sections" when a caller supplies only the core booking variables
     * (e.g. status-change emails) while the template contains richer optional sections.
     *
     * @param array<string, string> $variables
     * @return array<string, string>
     */
    private static function normalizeVariablesForType(string $type, array $variables): array
    {
        // Booking confirmation is sent from multiple contexts (checkout + admin status changes).
        // If the caller didn't include the rich "intro/details/footer" blocks, provide a minimal,
        // data-driven fallback so the email still looks correct.
        if ($type === self::TYPE_BOOKING_CONFIRMATION) {
            if (!isset($variables['intro_paragraph']) || trim($variables['intro_paragraph']) === '') {
                $variables['intro_paragraph'] = __('Thank you for your booking.', 'yatra');
            }
            if (!isset($variables['details_html']) || trim($variables['details_html']) === '') {
                $variables['details_html'] = self::fallbackBookingDetailsHtml($variables);
            }
            if (!isset($variables['footer_note']) || trim($variables['footer_note']) === '') {
                $variables['footer_note'] = sprintf(__('— %s', 'yatra'), get_bloginfo('name'));
            }
        }

        // Shared defaults that are safe for most templates if included.
        if (!isset($variables['intro_paragraph'])) {
            $variables['intro_paragraph'] = '';
        }
        if (!isset($variables['footer_note'])) {
            $variables['footer_note'] = '';
        }
        if (!isset($variables['details_html'])) {
            $variables['details_html'] = '';
        }

        return $variables;
    }

    /**
     * Minimal booking details block for confirmation emails when caller doesn't provide `details_html`.
     *
     * @param array<string, string> $v
     */
    private static function fallbackBookingDetailsHtml(array $v): string
    {
        $trip = $v['trip_name'] ?? '';
        $date = $v['travel_date'] ?? '';
        $pax = $v['travelers_count'] ?? '';
        $total = $v['total_amount_formatted'] ?? '';
        $due = $v['amount_due_formatted'] ?? '';

        $rows = [];
        if ($trip !== '') {
            $rows[] = ['label' => __('Trip', 'yatra'), 'value' => esc_html($trip)];
        }
        if ($date !== '') {
            $rows[] = ['label' => __('Departure', 'yatra'), 'value' => esc_html($date)];
        }
        if ($pax !== '') {
            $rows[] = ['label' => __('Travelers', 'yatra'), 'value' => esc_html($pax)];
        }
        if ($total !== '') {
            $rows[] = ['label' => __('Total', 'yatra'), 'value' => esc_html($total)];
        }
        if ($due !== '') {
            $rows[] = ['label' => __('Amount due', 'yatra'), 'value' => esc_html($due)];
        }

        if (empty($rows)) {
            return '';
        }

        return EmailTemplateLayout::detailCard($rows);
    }

    /**
     * @param array<string, string> $variables
     */
    private static function parseTemplate(string $template, array $variables): string
    {
        $rendered = (string) preg_replace_callback(
            // Allow optional whitespace: {{trip_name}} and {{ trip_name }} both work.
            '/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/',
            static function (array $m) use ($variables): string {
                $key = $m[1];

                // Never leak raw merge-tags into real emails. If a variable is
                // missing, replace it with an empty string rather than
                // returning the original {{tag}} token.
                return $variables[$key] ?? '';
            },
            $template
        );

        // Hard-strip any remaining merge-tags (defense-in-depth).
        $rendered = (string) preg_replace('/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/', '', $rendered);

        // Users sometimes paste helper text from the editor into the template.
        // If that happens, strip common helper headings so they don't appear in
        // production emails.
        $rendered = (string) preg_replace(
            '/^.*(Available Variables|Available placeholders|Available Placeholders|Merge tags).*$/mi',
            '',
            $rendered
        );

        return $rendered;
    }

    /**
     * @param array<string, string> $v
     */
    private static function defaultSubject(string $type, array $v): string
    {
        $site = $v['site_name'] ?? get_bloginfo('name');
        $ref = $v['booking_reference'] ?? $v['booking_id'] ?? '';

        switch ($type) {
            case self::TYPE_BOOKING_CONFIRMATION:
                return sprintf(__('✈️ [%s] Booking update · %s', 'yatra'), $site, $ref);

            case self::TYPE_PAYMENT_CONFIRMATION:
                return sprintf(__('✅ [%s] Payment received · %s', 'yatra'), $site, $ref);

            case self::TYPE_BOOKING_CANCELLATION:
                return sprintf(__('📋 [%s] Booking cancelled · %s', 'yatra'), $site, $ref);

            case self::TYPE_BOOKING_REMINDER:
                return sprintf(__('🗓️ [%s] Your trip is coming up · %s', 'yatra'), $site, $ref);

            case self::TYPE_ADMIN_NEW_BOOKING:
                return sprintf(__('🔔 [%s] New booking · %s (#%s)', 'yatra'), $site, $ref, $v['booking_id'] ?? '');

            case self::TYPE_ADMIN_PAYMENT_RECEIVED:
                return sprintf(__('✅ [%s] Payment received · %s (#%s)', 'yatra'), $site, $ref, $v['booking_id'] ?? '');

            case self::TYPE_ADMIN_BOOKING_CANCELLED:
                return sprintf(__('📋 [%s] Booking cancelled · %s (#%s)', 'yatra'), $site, $ref, $v['booking_id'] ?? '');

            case self::TYPE_TRIP_CONSENT_REQUEST:
                $formName = $v['form_name'] ?? __('consent form', 'yatra');

                return sprintf(__('📝 [%s] Action required · %s', 'yatra'), $site, $formName);

            case self::TYPE_CUSTOMER_EMAIL_VERIFICATION:
                return sprintf(__('✉️ [%s] Verify your email address', 'yatra'), $site);

            case self::TYPE_BOOKING_COMPLETED:
                return sprintf(__('🌟 [%s] Trip complete · %s', 'yatra'), $site, $ref);

            case self::TYPE_BOOKING_EXPIRED_CUSTOMER:
                return sprintf(__('⏱️ [%s] Booking expired · %s', 'yatra'), $site, $ref);

            case self::TYPE_ADMIN_BOOKING_EXPIRED:
                return sprintf(__('⏱️ [%s] Booking expired · %s (#%s)', 'yatra'), $site, $ref, $v['booking_id'] ?? '');

            case self::TYPE_SCHEDULED_PAYMENT_REMINDER:
                return sprintf(__('💳 [%s] Upcoming payment · %s', 'yatra'), $site, $ref);

            case self::TYPE_SCHEDULED_PAYMENT_SUCCEEDED:
                return sprintf(__('✅ [%s] Scheduled payment received · %s', 'yatra'), $site, $ref);

            case self::TYPE_SCHEDULED_PAYMENT_FAILED:
                return sprintf(__('⚠️ [%s] Payment issue · %s', 'yatra'), $site, $ref);

            case self::TYPE_ADMIN_SCHEDULED_PAYMENT_FAILED:
                return sprintf(__('⚠️ [%s] Scheduled payment failed · %s', 'yatra'), $site, $ref);

            case self::TYPE_ENQUIRY_ADMIN:
                $who = $v['customer_name'] ?? __('Customer', 'yatra');

                return sprintf(__('💬 [%s] New enquiry · %s', 'yatra'), $site, $who);

            case self::TYPE_ENQUIRY_CUSTOMER_RECEIVED:
                return sprintf(__('✉️ [%s] We received your message', 'yatra'), $site);

            case self::TYPE_ENQUIRY_CUSTOMER_RESPONSE:
                return sprintf(__('💬 [%s] Re: your enquiry', 'yatra'), $site);

            case self::TYPE_REVIEW_REQUEST:
                $trip = $v['trip_name'] ?? __('your trip', 'yatra');

                return sprintf(__('⭐ [%s] How was %s?', 'yatra'), $site, $trip);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_FIRST:
                return sprintf(__('🛒 [%s] Complete your booking', 'yatra'), $site);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_SECOND:
                return sprintf(__('⏳ [%s] Still interested? Your booking is waiting', 'yatra'), $site);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_FINAL:
                return sprintf(__('⚠️ [%s] Final reminder: complete your booking', 'yatra'), $site);

            default:
                return sprintf(__('✉️ [%s] Notification', 'yatra'), $site);
        }
    }

    /**
     * @param array<string, string> $v
     */
    private static function defaultBody(string $type, array $v): string
    {
        switch ($type) {
            case self::TYPE_BOOKING_CONFIRMATION:
                return EmailTemplateDefaults::fallbackTransactionalBooking($v);

            case self::TYPE_PAYMENT_CONFIRMATION:
                return EmailTemplateDefaults::fallbackTransactionalPayment($v);

            case self::TYPE_BOOKING_CANCELLATION:
                return EmailTemplateDefaults::fallbackTransactionalCancellation($v);

            case self::TYPE_BOOKING_REMINDER:
                return EmailTemplateDefaults::fallbackTransactionalReminder($v);

            case self::TYPE_ADMIN_NEW_BOOKING:
                return EmailTemplateDefaults::fallbackAdminNewBooking($v);

            case self::TYPE_ADMIN_PAYMENT_RECEIVED:
                return EmailTemplateDefaults::fallbackAdminPaymentReceived($v);

            case self::TYPE_ADMIN_BOOKING_CANCELLED:
                return EmailTemplateDefaults::fallbackAdminBookingCancelled($v);

            case self::TYPE_TRIP_CONSENT_REQUEST:
                return EmailTemplateDefaults::fallbackTransactionalTripConsent($v);

            case self::TYPE_CUSTOMER_EMAIL_VERIFICATION:
                return EmailTemplateDefaults::fallbackTransactionalCustomerEmailVerification($v);

            case self::TYPE_BOOKING_COMPLETED:
                return EmailTemplateDefaults::fallbackTransactionalBookingCompleted($v);

            case self::TYPE_BOOKING_EXPIRED_CUSTOMER:
                return EmailTemplateDefaults::fallbackTransactionalBookingExpiredCustomer($v);

            case self::TYPE_ADMIN_BOOKING_EXPIRED:
                return EmailTemplateDefaults::fallbackAdminBookingExpired($v);

            case self::TYPE_SCHEDULED_PAYMENT_REMINDER:
                return EmailTemplateDefaults::fallbackTransactionalScheduledPaymentReminder($v);

            case self::TYPE_SCHEDULED_PAYMENT_SUCCEEDED:
                return EmailTemplateDefaults::fallbackTransactionalScheduledPaymentSucceeded($v);

            case self::TYPE_SCHEDULED_PAYMENT_FAILED:
                return EmailTemplateDefaults::fallbackTransactionalScheduledPaymentFailed($v);

            case self::TYPE_ADMIN_SCHEDULED_PAYMENT_FAILED:
                return EmailTemplateDefaults::fallbackAdminScheduledPaymentFailed($v);

            case self::TYPE_ENQUIRY_ADMIN:
                return EmailTemplateDefaults::fallbackTransactionalEnquiryAdmin($v);

            case self::TYPE_ENQUIRY_CUSTOMER_RECEIVED:
                return EmailTemplateDefaults::fallbackTransactionalEnquiryReceived($v);

            case self::TYPE_ENQUIRY_CUSTOMER_RESPONSE:
                return EmailTemplateDefaults::fallbackTransactionalEnquiryResponse($v);

            case self::TYPE_REVIEW_REQUEST:
                return EmailTemplateDefaults::fallbackTransactionalReviewRequest($v);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_FIRST:
                return EmailTemplateDefaults::fallbackTransactionalAbandonedBookingRecoveryFirst($v);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_SECOND:
                return EmailTemplateDefaults::fallbackTransactionalAbandonedBookingRecoverySecond($v);

            case self::TYPE_ABANDONED_BOOKING_RECOVERY_FINAL:
                return EmailTemplateDefaults::fallbackTransactionalAbandonedBookingRecoveryFinal($v);

            default:
                return EmailTemplateLayout::customer(
                    '✉️',
                    __('Notification', 'yatra'),
                    '<p style="margin:0;color:#475569;">' . esc_html__('This is an automated message from your travel site.', 'yatra') . '</p>',
                    esc_html($v['site_name'] ?? get_bloginfo('name'))
                );
        }
    }

    /**
     * Build variables from a booking row (admin / cron).
     *
     * Includes rich tags from {@see BookingEmailRichMergeTags::forBooking()}:
     * `payment_gateway`, `payment_gateway_label`, `payment_schedule`, `payment_schedule_label`,
     * `travelers_list`, `travelers_list_html`, `traveler_custom_fields_html`, `booking_custom_fields_html`,
     * `special_requests`, `special_requests_html`.
     *
     * Note: `{{payment_method}}` on payment emails is the instrument label (e.g. Card) merged by callers;
     * gateway/slug labels use `payment_gateway` / `payment_gateway_label`. Deposit vs full uses `payment_schedule*`.
     *
     * @return array<string, string> Filter: `yatra_booking_email_variables`.
     */
    public static function variablesFromBooking(object $booking): array
    {
        $currency = $booking->currency ?? SettingsService::getCurrency();
        $travelDate = !empty($booking->travel_date)
            ? date_i18n(get_option('date_format'), strtotime((string) $booking->travel_date))
            : '';

        $base = [
            'customer_name' => trim((string) (($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? ''))),
            'customer_first_name' => (string) ($booking->contact_first_name ?? ''),
            'customer_last_name' => (string) ($booking->contact_last_name ?? ''),
            'customer_email' => (string) ($booking->contact_email ?? ''),
            'customer_phone' => (string) ($booking->contact_phone ?? ''),
            'booking_reference' => (string) ($booking->reference ?? ''),
            'booking_id' => (string) (int) ($booking->id ?? 0),
            'trip_name' => (string) ($booking->trip_title ?? ''),
            'trip_url' => !empty($booking->trip_slug)
                ? home_url('/' . SettingsService::getTripBase() . '/' . rawurlencode((string) $booking->trip_slug) . '/')
                : home_url('/'),
            'travel_date' => $travelDate,
            'travelers_count' => (string) (int) ($booking->travelers_count ?? 0),
            'total_amount_formatted' => yatra_format_price((float) ($booking->total_amount ?? 0)),
            'amount_due_formatted' => yatra_format_price((float) ($booking->amount_due ?? 0)),
            'currency' => $currency,
            'booking_status' => (string) ($booking->status ?? ''),
            'payment_status' => (string) ($booking->payment_status ?? ''),
            'admin_url' => admin_url('admin.php?page=yatra'),
        ];

        $rich = BookingEmailRichMergeTags::forBooking($booking);

        /** @var array<string, string> $merged */
        $merged = array_merge($base, $rich);

        return apply_filters('yatra_booking_email_variables', $merged, $booking);
    }

    /**
     * Merge tags for enquiry emails (row from EnquiryRepository::findWithTrip()).
     *
     * @param object $enquiry Row with name, email, phone, message, trip_title, etc.
     * @return array<string, string>
     */
    public static function variablesFromEnquiry(object $enquiry, string $responsePlain = ''): array
    {
        $trip = trim((string) ($enquiry->trip_title ?? ''));
        $tripSlug = (string) ($enquiry->trip_slug ?? '');
        $tripId = isset($enquiry->trip_id) ? (int) $enquiry->trip_id : 0;

        // Defense-in-depth: if repository join didn't provide trip_title/slug but we do have a trip_id,
        // resolve the trip directly so {{trip_name}} doesn't fall back to "General enquiry".
        if (($trip === '' || $tripSlug === '') && $tripId > 0) {
            try {
                $repo = new \Yatra\Repositories\TripRepository();
                $tripRow = $repo->find($tripId);
                if ($tripRow) {
                    if ($trip === '' && !empty($tripRow->title)) {
                        $trip = trim((string) $tripRow->title);
                    }
                    if ($tripSlug === '' && !empty($tripRow->slug)) {
                        $tripSlug = (string) $tripRow->slug;
                    }
                }
            } catch (\Throwable $e) {
                // Ignore: keep existing values/fallback.
            }
        }

        $tripUrl = $tripSlug !== ''
            ? home_url('/' . SettingsService::getTripBase() . '/' . rawurlencode($tripSlug) . '/')
            : home_url('/');

        return [
            'customer_name' => (string) ($enquiry->name ?? ''),
            'customer_email' => (string) ($enquiry->email ?? ''),
            'customer_phone' => (string) ($enquiry->phone ?? ''),
            'trip_name' => $trip !== '' ? $trip : __('General enquiry', 'yatra'),
            'trip_url' => $tripUrl,
            'message' => nl2br(esc_html((string) ($enquiry->message ?? ''))),
            'response' => $responsePlain !== '' ? nl2br(esc_html($responsePlain)) : '',
            'response_message' => $responsePlain !== '' ? nl2br(esc_html($responsePlain)) : '',
        ];
    }

    /**
     * @param object $booking Booking row (contact_*, reference, …)
     * @param array<string, string> $extra e.g. expiry_hours, expiry_notice_html
     * @return array<string, string>
     */
    public static function variablesFromBookingWithExtras(object $booking, array $extra = []): array
    {
        return array_merge(self::variablesFromBooking($booking), $extra);
    }

    /**
     * @param object $booking      Booking row
     * @param object $scheduledRow Scheduled payment row (amount, currency, scheduled_date, payment_type, …)
     * @param array<string, string> $extra failure_reason, balance_after_formatted, permanent_failure, …
     * @return array<string, string>
     */
    public static function variablesFromScheduledPayment(object $booking, object $scheduledRow, array $extra = []): array
    {
        $currency = (string) ($scheduledRow->currency ?? $booking->currency ?? SettingsService::getCurrency());
        $amount = (float) ($scheduledRow->amount ?? 0);
        $schedDate = !empty($scheduledRow->scheduled_date)
            ? date_i18n(get_option('date_format'), strtotime((string) $scheduledRow->scheduled_date))
            : '';

        $base = self::variablesFromBooking($booking);
        $base['scheduled_amount_formatted'] = yatra_format_price($amount, $currency);
        $base['scheduled_date_formatted'] = $schedDate;
        $base['payment_type_label'] = (string) ($scheduledRow->payment_type ?? '');
        $base['scheduled_payment_id'] = (string) (int) ($scheduledRow->id ?? 0);

        return array_merge($base, $extra);
    }
}
