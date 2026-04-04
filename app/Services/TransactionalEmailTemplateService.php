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

        /**
         * Allow Yatra Pro (or extensions) to send instead of core templates.
         * Return null to use core; true/false if handled.
         *
         * @param null|bool $handled
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
     * @param array<string, string> $variables
     */
    private static function parseTemplate(string $template, array $variables): string
    {
        return (string) preg_replace_callback(
            '/\{\{(\w+)\}\}/',
            static function (array $m) use ($variables): string {
                $key = $m[1];

                return $variables[$key] ?? $m[0];
            },
            $template
        );
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
     */
    public static function variablesFromBooking(object $booking): array
    {
        $currency = $booking->currency ?? SettingsService::getCurrency();
        $travelDate = !empty($booking->travel_date)
            ? date_i18n(get_option('date_format'), strtotime((string) $booking->travel_date))
            : '';

        return [
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
    }
}
