<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Default subject + HTML for transactional settings (free) and Pro automation seed/backfill.
 * Uses {{merge_tags}} compatible with TransactionalEmailTemplateService and Pro EmailAutomationService.
 */
final class EmailTemplateDefaults
{
    /**
     * Option keys (without yatra_ prefix) for SettingsController / InstallerService.
     *
     * @return array<string, string>
     */
    public static function settingsOptionDefaults(): array
    {
        return [
            'email_tpl_booking_subject' => '✈️ [{{site_name}}] Booking update · {{booking_reference}}',
            'email_tpl_booking_body' => self::htmlBookingCustomer(),
            'email_tpl_payment_subject' => '✅ [{{site_name}}] Payment received · {{booking_reference}}',
            'email_tpl_payment_body' => self::htmlPaymentCustomer(),
            'email_tpl_cancellation_subject' => '📋 [{{site_name}}] Booking cancelled · {{booking_reference}}',
            'email_tpl_cancellation_body' => self::htmlCancellationCustomer(),
            'email_tpl_reminder_subject' => '🗓️ [{{site_name}}] Your trip is coming up · {{booking_reference}}',
            'email_tpl_reminder_body' => self::htmlReminderCustomer(),
            'email_tpl_admin_booking_subject' => '🔔 [{{site_name}}] New booking · {{booking_reference}} (#{{booking_id}})',
            'email_tpl_admin_booking_body' => self::htmlAdminNewBooking(),
        ];
    }

    /**
     * Full subject + body for Pro system templates (DB). Null = no bundled default for that key.
     *
     * @return array{subject: string, body: string}|null
     */
    public static function proSystemTemplate(string $templateKey): ?array
    {
        $map = [
            'new_booking' => [
                'subject' => '✈️ Booking confirmation · {{booking_reference}}',
                'body' => self::htmlBookingCustomer(),
            ],
            'booking_payment' => [
                'subject' => '✅ Payment received · {{booking_reference}}',
                'body' => self::htmlPaymentCustomer(),
            ],
            'booking_confirmation' => [
                'subject' => '✈️ Your booking · {{booking_reference}}',
                'body' => self::htmlBookingCustomer(),
            ],
            'booking_confirmed' => [
                'subject' => '🎉 You\'re confirmed · {{booking_reference}}',
                'body' => self::htmlBookingConfirmed(),
            ],
            'admin_new_booking' => [
                'subject' => '🔔 New booking · {{booking_reference}} (#{{booking_id}})',
                'body' => self::htmlAdminNewBooking(),
            ],
            'booking_cancelled' => [
                'subject' => '📋 Booking cancelled · {{booking_reference}}',
                'body' => self::htmlCancellationCustomer(),
            ],
            'booking_completed' => [
                'subject' => '🌟 Thanks for traveling with us · {{booking_reference}}',
                'body' => self::htmlTripCompleted(),
            ],
            'payment_received' => [
                'subject' => '✅ Payment received · {{booking_reference}}',
                'body' => self::htmlPaymentCustomer(),
            ],
            'payment_reminder' => [
                'subject' => '💳 Payment reminder · {{booking_reference}}',
                'body' => self::htmlPaymentReminder(),
            ],
            'enquiry_received' => [
                'subject' => '✉️ We received your message',
                'body' => self::htmlEnquiryCustomer(),
            ],
            'enquiry_admin' => [
                'subject' => '💬 New enquiry · {{customer_name}}',
                'body' => self::htmlEnquiryAdmin(),
            ],
            'enquiry_response' => [
                'subject' => '💬 Re: your enquiry',
                'body' => self::htmlEnquiryResponse(),
            ],
            'trip_reminder' => [
                'subject' => '🗓️ Reminder · {{trip_name}}',
                'body' => self::htmlReminderCustomer(),
            ],
            'review_request' => [
                'subject' => '⭐ How was {{trip_name}}?',
                'body' => self::htmlReviewRequest(),
            ],
        ];

        return $map[$templateKey] ?? null;
    }

    /**
     * Fallback HTML when settings templates are empty (escaped runtime variables).
     *
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalBooking(array $v): string
    {
        $name = esc_html($v['customer_first_name'] ?: $v['customer_name'] ?: __('there', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));

        if (!empty($v['details_html_only'])) {
            $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
                . sprintf(
                    /* translators: %s: customer name */
                    esc_html__('Hello %s,', 'yatra'),
                    $name
                )
                . '</p>'
                . '<p style="margin:0 0 20px;color:#475569;">'
                . esc_html($v['intro_paragraph'] ?? __('Thank you for your booking. Here are your details:', 'yatra'))
                . '</p>'
                . wp_kses_post((string) ($v['details_html'] ?? ''))
                . (!empty($v['footer_note']) ? '<p style="margin:24px 0 0;color:#475569;">' . wp_kses_post((string) $v['footer_note']) . '</p>' : '');

            return EmailTemplateLayout::customer(
                '✈️',
                __('Booking update', 'yatra'),
                $inner,
                $site,
                __('Your booking details are inside.', 'yatra')
            );
        }

        $rows = array_values(array_filter([
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
            ['label' => __('Travelers', 'yatra'), 'value' => esc_html($v['travelers_count'] ?? '')],
            ['label' => __('Total', 'yatra'), 'value' => esc_html($v['total_amount_formatted'] ?? '')],
            ['label' => __('Amount due now', 'yatra'), 'value' => esc_html($v['amount_due_formatted'] ?? '')],
        ], static function (array $row): bool {
            return $row['value'] !== '';
        }));

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(
                esc_html__('Hello %s,', 'yatra'),
                $name
            )
            . '</p>'
            . '<p style="margin:0 0 8px;color:#475569;">'
            . esc_html($v['intro_paragraph'] ?? __('Thank you for your booking. Here are your details:', 'yatra'))
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . (!empty($v['details_html']) ? '<div style="margin:16px 0 0;">' . wp_kses_post((string) $v['details_html']) . '</div>' : '')
            . (!empty($v['footer_note']) ? '<p style="margin:24px 0 0;color:#475569;">' . wp_kses_post((string) $v['footer_note']) . '</p>' : '');

        return EmailTemplateLayout::customer(
            '✈️',
            __('Booking update', 'yatra'),
            $inner,
            $site,
            __('Your booking details are inside.', 'yatra')
        );
    }

    /**
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalPayment(array $v): string
    {
        $name = esc_html($v['customer_first_name'] ?: $v['customer_name'] ?: __('Customer', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $rows = array_values(array_filter([
            ['label' => __('Booking reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Amount paid', 'yatra'), 'value' => esc_html($v['payment_amount_formatted'] ?? '')],
            ['label' => __('Method', 'yatra'), 'value' => esc_html($v['payment_method'] ?? '')],
            ['label' => __('Transaction ID', 'yatra'), 'value' => esc_html($v['transaction_id'] ?? '')],
        ], static function (array $row): bool {
            return $row['value'] !== '';
        }));

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(esc_html__('Dear %s,', 'yatra'), $name)
            . '</p>'
            . '<p style="margin:0 0 8px;color:#475569;">'
            . esc_html__('We’ve received your payment — thank you! Here’s a quick summary.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard($rows);

        return EmailTemplateLayout::customer(
            '✅',
            __('Payment received', 'yatra'),
            $inner,
            $site,
            __('Payment confirmation', 'yatra')
        );
    }

    /**
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalCancellation(array $v): string
    {
        $name = esc_html($v['customer_first_name'] ?: $v['customer_name'] ?: __('Customer', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $rows = array_values(array_filter([
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
        ], static function (array $row): bool {
            return $row['value'] !== '';
        }));

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(esc_html__('Hello %s,', 'yatra'), $name)
            . '</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Your booking has been cancelled as requested. If you have questions, just reply to this email.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard($rows);

        return EmailTemplateLayout::customer(
            '📋',
            __('Booking cancelled', 'yatra'),
            $inner,
            $site,
            __('Booking cancellation notice', 'yatra')
        );
    }

    /**
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalReminder(array $v): string
    {
        $name = esc_html($v['customer_name'] ?: __('Traveler', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $days = esc_html((string) ($v['reminder_days'] ?? $v['days_until_trip'] ?? ''));

        $rows = array_values(array_filter([
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
            ['label' => __('Travelers', 'yatra'), 'value' => esc_html($v['travelers_count'] ?? '')],
        ], static function (array $row): bool {
            return $row['value'] !== '';
        }));

        $balanceRow = (!empty($v['amount_due_formatted']) && isset($v['amount_due_formatted']) && $v['amount_due_formatted'] !== yatra_format_price(0))
            ? [['label' => __('Balance due', 'yatra'), 'value' => esc_html((string) $v['amount_due_formatted'])]]
            : [];
        if ($balanceRow !== []) {
            $rows = array_merge($rows, $balanceRow);
        }

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(esc_html__('Dear %s,', 'yatra'), $name)
            . '</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . ($days !== ''
                ? sprintf(
                    /* translators: %s: number of days */
                    esc_html__('Your adventure starts in %s days — we can’t wait to see you!', 'yatra'),
                    $days
                )
                : esc_html__('Your trip is coming up soon — we look forward to seeing you!', 'yatra'))
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . (!empty($v['reminder_extra_html']) ? '<div style="margin:20px 0 0;">' . wp_kses_post($v['reminder_extra_html']) . '</div>' : '');

        return EmailTemplateLayout::customer(
            '🗓️',
            __('Trip reminder', 'yatra'),
            $inner,
            $site,
            __('Upcoming trip reminder', 'yatra')
        );
    }

    /**
     * Fallback HTML for admin new-booking notice (empty saved template).
     *
     * @param array<string, string> $v
     */
    public static function fallbackAdminNewBooking(array $v): string
    {
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $rows = array_values(array_filter([
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Booking ID', 'yatra'), 'value' => esc_html($v['booking_id'] ?? '')],
            ['label' => __('Customer', 'yatra'), 'value' => esc_html($v['customer_name'] ?? '')],
            ['label' => __('Email', 'yatra'), 'value' => esc_html($v['customer_email'] ?? '')],
            ['label' => __('Phone', 'yatra'), 'value' => esc_html($v['customer_phone'] ?? '')],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
            ['label' => __('Travelers', 'yatra'), 'value' => esc_html($v['travelers_count'] ?? '')],
            ['label' => __('Total', 'yatra'), 'value' => trim(esc_html($v['total_amount_formatted'] ?? '') . ' ' . esc_html($v['currency'] ?? ''))],
            ['label' => __('Booking status', 'yatra'), 'value' => esc_html($v['booking_status'] ?? '')],
            ['label' => __('Payment status', 'yatra'), 'value' => esc_html($v['payment_status'] ?? '')],
        ], static function (array $row): bool {
            return trim((string) ($row['value'] ?? '')) !== '';
        }));

        $adminUrl = esc_url($v['admin_url'] ?? admin_url('admin.php?page=yatra'));
        $siteUrl = esc_url($v['site_url'] ?? home_url('/'));

        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A new booking just landed. Review the snapshot below and open the admin to take action.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="' . $adminUrl . '" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>'
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('Site:', 'yatra') . ' <a href="' . $siteUrl . '" style="color:#2563eb;">' . esc_html($siteUrl) . '</a>'
            . '</p>';

        return EmailTemplateLayout::admin(
            '🔔',
            __('New booking', 'yatra'),
            $inner,
            $site . ' · ' . esc_html__('Admin notification', 'yatra')
        );
    }

    private static function htmlBookingCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">{{intro_paragraph}}</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Travelers', 'value' => '{{travelers_count}}'],
                ['label' => 'Total', 'value' => '{{total_amount_formatted}}'],
                ['label' => 'Amount due now', 'value' => '{{amount_due_formatted}}'],
            ])
            . '{{details_html}}'
            . '<p style="margin:24px 0 0;color:#475569;">{{footer_note}}</p>'
            . '<p style="margin:20px 0 0;"><a href="{{trip_url}}" style="color:#0d9488;font-weight:600;text-decoration:none;">' . esc_html__('View trip details →', 'yatra') . '</a></p>';

        return EmailTemplateLayout::customer(
            '✈️',
            'Booking update',
            $inner,
            '{{site_name}}',
            'Booking update'
        );
    }

    private static function htmlBookingConfirmed(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Great news — your booking is confirmed. Save this email for your records.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Travelers', 'value' => '{{travelers_count}}'],
                ['label' => 'Total', 'value' => '{{total_amount_formatted}}'],
            ])
            . '<p style="margin:20px 0 0;"><a href="{{trip_url}}" style="color:#0d9488;font-weight:600;text-decoration:none;">' . esc_html__('Trip page →', 'yatra') . '</a></p>';

        return EmailTemplateLayout::customer(
            '🎉',
            __("You're all set", 'yatra'),
            $inner,
            '{{site_name}}',
            'Booking confirmed'
        );
    }

    private static function htmlAdminNewBooking(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A new booking just landed. Review the snapshot below and open the admin to take action.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Booking ID', 'value' => '{{booking_id}}'],
                ['label' => 'Customer', 'value' => '{{customer_name}}'],
                ['label' => 'Email', 'value' => '{{customer_email}}'],
                ['label' => 'Phone', 'value' => '{{customer_phone}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Travelers', 'value' => '{{travelers_count}}'],
                ['label' => 'Total', 'value' => '{{total_amount_formatted}} {{currency}}'],
                ['label' => 'Booking status', 'value' => '{{booking_status}}'],
                ['label' => 'Payment status', 'value' => '{{payment_status}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="{{admin_url}}" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>'
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('Site:', 'yatra') . ' <a href="{{site_url}}" style="color:#2563eb;">{{site_url}}</a>'
            . '</p>';

        return EmailTemplateLayout::admin(
            '🔔',
            'New booking',
            $inner,
            '{{site_name}} · ' . esc_html__('Admin notification', 'yatra')
        );
    }

    private static function htmlPaymentCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Dear {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('We’ve successfully received your payment. Thank you — you’re one step closer to takeoff!', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Booking reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Amount paid', 'value' => '{{payment_amount_formatted}}'],
                ['label' => 'Method', 'value' => '{{payment_method}}'],
                ['label' => 'Transaction ID', 'value' => '{{transaction_id}}'],
            ]);

        return EmailTemplateLayout::customer(
            '✅',
            'Payment received',
            $inner,
            '{{site_name}}',
            'Payment received'
        );
    }

    private static function htmlCancellationCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('This email confirms that your booking has been cancelled. If this wasn’t expected, please contact us.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
            ])
            . '<p style="margin:24px 0 0;"><a href="{{trip_url}}" style="color:#0d9488;font-weight:600;text-decoration:none;">' . esc_html__('Browse more trips →', 'yatra') . '</a></p>';

        return EmailTemplateLayout::customer(
            '📋',
            'Booking cancelled',
            $inner,
            '{{site_name}}',
            'Booking cancelled'
        );
    }

    private static function htmlTripCompleted(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('We hope you loved', 'yatra') . ' <strong style="color:#0f172a;">{{trip_name}}</strong>. '
            . esc_html__('Thank you for choosing us — we’d be delighted to host you again.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
            ]);

        return EmailTemplateLayout::customer(
            '🌟',
            'Trip complete',
            $inner,
            '{{site_name}}',
            'Thank you for traveling with us'
        );
    }

    private static function htmlReminderCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Dear {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Friendly heads-up: your departure is in', 'yatra')
            . ' <strong style="color:#0f172a;">{{reminder_days}}</strong> '
            . esc_html__('days. Here’s what you need at a glance.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Travelers', 'value' => '{{travelers_count}}'],
                ['label' => 'Balance due', 'value' => '{{amount_due_formatted}}'],
            ])
            . '{{reminder_extra_html}}';

        return EmailTemplateLayout::customer(
            '🗓️',
            'Trip reminder',
            $inner,
            '{{site_name}}',
            'Trip reminder'
        );
    }

    private static function htmlPaymentReminder(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('This is a gentle nudge about your booking', 'yatra')
            . ' <strong>{{booking_reference}}</strong> '
            . esc_html__('for', 'yatra')
            . ' <strong>{{trip_name}}</strong>. '
            . esc_html__('If a balance remains, please settle it before your travel date ({{travel_date}}).', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Amount due', 'value' => '{{amount_due_formatted}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
            ]);

        return EmailTemplateLayout::customer(
            '💳',
            'Payment reminder',
            $inner,
            '{{site_name}}',
            'Payment reminder'
        );
    }

    private static function htmlEnquiryCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Thanks for reaching out about', 'yatra')
            . ' <strong style="color:#0f172a;">{{trip_name}}</strong>. '
            . esc_html__('We’ve received your message and our team will reply shortly.', 'yatra')
            . '</p>'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;margin:8px 0 0;">'
            . '<tr><td style="padding:16px 20px;font-size:14px;color:#115e59;">✉️ '
            . esc_html__('Typical reply time: within one business day.', 'yatra')
            . '</td></tr></table>';

        return EmailTemplateLayout::customer(
            '✉️',
            'Message received',
            $inner,
            '{{site_name}}',
            'Enquiry received'
        );
    }

    private static function htmlEnquiryAdmin(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Someone submitted an enquiry from your site. Follow up from the details below.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Name', 'value' => '{{customer_name}}'],
                ['label' => 'Email', 'value' => '{{customer_email}}'],
                ['label' => 'Phone', 'value' => '{{customer_phone}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
            ])
            . '<p style="margin:20px 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">'
            . esc_html__('Message', 'yatra')
            . '</p>'
            . '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;color:#334155;line-height:1.65;">{{message}}</div>';

        return EmailTemplateLayout::admin(
            '💬',
            'New enquiry',
            $inner,
            '{{site_name}} · ' . esc_html__('Admin', 'yatra')
        );
    }

    private static function htmlEnquiryResponse(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Here’s our reply to your enquiry:', 'yatra')
            . '</p>'
            . '<div style="background:#f8fafc;border-left:4px solid #0d9488;border-radius:0 12px 12px 0;padding:20px 24px;color:#334155;line-height:1.7;">{{response}}</div>'
            . '<p style="margin:24px 0 0;font-size:14px;color:#64748b;">'
            . esc_html__('Questions? Just reply to this email.', 'yatra')
            . '</p>';

        return EmailTemplateLayout::customer(
            '💬',
            'Our reply',
            $inner,
            '{{site_name}}',
            'Enquiry response'
        );
    }

    private static function htmlReviewRequest(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('We hope', 'yatra')
            . ' <strong>{{trip_name}}</strong> '
            . esc_html__('was unforgettable. Would you share a quick review? It helps other travelers and our team.', 'yatra')
            . '</p>'
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>'
            . '<td style="border-radius:10px;background:#f59e0b;">'
            . '<a href="{{review_url}}" style="display:inline-block;padding:14px 28px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#1c1917;text-decoration:none;border-radius:10px;">'
            . '⭐ ' . esc_html__('Leave a review', 'yatra')
            . '</a></td></tr></table>'
            . '<p style="margin:0;font-size:13px;color:#94a3b8;">'
            . esc_html__('Takes about a minute — thank you!', 'yatra')
            . '</p>';

        return EmailTemplateLayout::customer(
            '⭐',
            'How was your trip?',
            $inner,
            '{{site_name}}',
            'Review request'
        );
    }

    /**
     * Merge-tag variables for enquiry templates (core wp_mail path when Pro does not own the channel).
     *
     * @param object $enquiry Row from EnquiryRepository::findWithTrip()
     */
    private static function enquiryVariablesForTemplates(object $enquiry, string $responsePlain): array
    {
        $trip = trim((string) ($enquiry->trip_title ?? ''));

        return [
            'customer_name' => (string) ($enquiry->name ?? ''),
            'customer_email' => (string) ($enquiry->email ?? ''),
            'customer_phone' => (string) ($enquiry->phone ?? ''),
            'trip_name' => $trip !== '' ? $trip : __('General enquiry', 'yatra'),
            'message' => nl2br(esc_html((string) ($enquiry->message ?? ''))),
            'response' => $responsePlain !== '' ? nl2br(esc_html($responsePlain)) : '',
            'response_message' => $responsePlain !== '' ? nl2br(esc_html($responsePlain)) : '',
        ];
    }

    /**
     * Full HTML body matching Pro/system enquiry_received (for free core sends).
     */
    public static function renderCoreEnquiryCustomerConfirmationHtml(object $enquiry): string
    {
        $vars = self::enquiryVariablesForTemplates($enquiry, '');

        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryCustomer(), $vars);
    }

    /**
     * Full HTML body matching Pro/system enquiry_admin.
     */
    public static function renderCoreEnquiryAdminNotificationHtml(object $enquiry): string
    {
        $vars = self::enquiryVariablesForTemplates($enquiry, '');

        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryAdmin(), $vars);
    }

    /**
     * Full HTML body matching Pro/system enquiry_response.
     */
    public static function renderCoreEnquiryResponseHtml(object $enquiry, string $response): string
    {
        $vars = self::enquiryVariablesForTemplates($enquiry, $response);

        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryResponse(), $vars);
    }

    /**
     * Review reminder (cron): same shell as Pro review_request template.
     */
    public static function renderCoreReviewReminderHtml(string $customerName, string $tripName, string $reviewUrl): string
    {
        $vars = [
            'customer_name' => $customerName,
            'trip_name' => $tripName,
            'review_url' => esc_url($reviewUrl),
        ];

        return TransactionalEmailTemplateService::parseMergeTags(self::htmlReviewRequest(), $vars);
    }
}
