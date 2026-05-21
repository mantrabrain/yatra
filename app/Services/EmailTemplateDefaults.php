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
            'email_tpl_admin_payment_subject' => '✅ [{{site_name}}] Payment received · {{booking_reference}} (#{{booking_id}})',
            'email_tpl_admin_payment_body' => self::htmlAdminPaymentReceived(),
            'email_tpl_admin_cancellation_subject' => '📋 [{{site_name}}] Booking cancelled · {{booking_reference}} (#{{booking_id}})',
            'email_tpl_admin_cancellation_body' => self::htmlAdminBookingCancelled(),
            'email_tpl_trip_consent_subject' => '📝 [{{site_name}}] Action required · {{form_name}}',
            'email_tpl_trip_consent_body' => self::htmlTripConsentRequest(),
            'email_tpl_customer_verification_subject' => '✉️ [{{site_name}}] Verify your email address',
            'email_tpl_customer_verification_body' => self::htmlCustomerEmailVerification(),
            'email_tpl_booking_completed_subject' => '🌟 [{{site_name}}] Thanks for traveling · {{booking_reference}}',
            'email_tpl_booking_completed_body' => self::htmlTripCompleted(),
            'email_tpl_booking_expired_customer_subject' => '⏱️ [{{site_name}}] Booking expired · {{booking_reference}}',
            'email_tpl_booking_expired_customer_body' => self::htmlBookingExpiredCustomer(),
            'email_tpl_admin_booking_expired_subject' => '⏱️ [{{site_name}}] Booking expired · {{booking_reference}} (#{{booking_id}})',
            'email_tpl_admin_booking_expired_body' => self::htmlAdminBookingExpired(),
            'email_tpl_scheduled_payment_reminder_subject' => '💳 [{{site_name}}] Upcoming payment · {{booking_reference}}',
            'email_tpl_scheduled_payment_reminder_body' => self::htmlScheduledPaymentReminder(),
            'email_tpl_scheduled_payment_succeeded_subject' => '✅ [{{site_name}}] Scheduled payment received · {{booking_reference}}',
            'email_tpl_scheduled_payment_succeeded_body' => self::htmlScheduledPaymentSucceeded(),
            'email_tpl_scheduled_payment_failed_subject' => '⚠️ [{{site_name}}] Payment issue · {{booking_reference}}',
            'email_tpl_scheduled_payment_failed_body' => self::htmlScheduledPaymentFailed(),
            'email_tpl_admin_scheduled_payment_failed_subject' => '⚠️ [{{site_name}}] Scheduled payment failed · {{booking_reference}}',
            'email_tpl_admin_scheduled_payment_failed_body' => self::htmlAdminScheduledPaymentFailed(),
            'email_tpl_enquiry_admin_subject' => '💬 [{{site_name}}] New enquiry · {{customer_name}}',
            'email_tpl_enquiry_admin_body' => self::htmlEnquiryAdmin(),
            'email_tpl_enquiry_received_subject' => '✉️ [{{site_name}}] We received your message',
            'email_tpl_enquiry_received_body' => self::htmlEnquiryCustomer(),
            'email_tpl_enquiry_response_subject' => '💬 [{{site_name}}] Re: your enquiry',
            'email_tpl_enquiry_response_body' => self::htmlEnquiryResponse(),
            'email_tpl_review_request_subject' => '⭐ [{{site_name}}] How was {{trip_name}}?',
            'email_tpl_review_request_body' => self::htmlReviewRequest(),
            'email_tpl_abandoned_booking_recovery_first_subject' => '🛒 [{{site_name}}] Complete your booking',
            'email_tpl_abandoned_booking_recovery_first_body' => self::htmlAbandonedBookingRecoveryFirst(),
            'email_tpl_abandoned_booking_recovery_second_subject' => '⏳ [{{site_name}}] Still interested? Your booking is waiting',
            'email_tpl_abandoned_booking_recovery_second_body' => self::htmlAbandonedBookingRecoverySecond(),
            'email_tpl_abandoned_booking_recovery_final_subject' => '⚠️ [{{site_name}}] Final reminder: complete your booking',
            'email_tpl_abandoned_booking_recovery_final_body' => self::htmlAbandonedBookingRecoveryFinal(),
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
            'trip_consent_request' => [
                'subject' => '📝 [{{site_name}}] Action required · {{form_name}}',
                'body' => self::htmlTripConsentRequest(),
            ],
            'customer_email_verification' => [
                'subject' => '✉️ [{{site_name}}] Verify your email address',
                'body' => self::htmlCustomerEmailVerification(),
            ],
            'booking_expired_customer' => [
                'subject' => '⏱️ [{{site_name}}] Booking expired · {{booking_reference}}',
                'body' => self::htmlBookingExpiredCustomer(),
            ],
            'admin_booking_expired' => [
                'subject' => '⏱️ [{{site_name}}] Booking expired · {{booking_reference}} (#{{booking_id}})',
                'body' => self::htmlAdminBookingExpired(),
            ],
            'scheduled_payment_reminder' => [
                'subject' => '💳 [{{site_name}}] Upcoming payment · {{booking_reference}}',
                'body' => self::htmlScheduledPaymentReminder(),
            ],
            'scheduled_payment_succeeded' => [
                'subject' => '✅ [{{site_name}}] Scheduled payment received · {{booking_reference}}',
                'body' => self::htmlScheduledPaymentSucceeded(),
            ],
            'scheduled_payment_failed' => [
                'subject' => '⚠️ [{{site_name}}] Payment issue · {{booking_reference}}',
                'body' => self::htmlScheduledPaymentFailed(),
            ],
            'admin_scheduled_payment_failed' => [
                'subject' => '⚠️ [{{site_name}}] Scheduled payment failed · {{booking_reference}}',
                'body' => self::htmlAdminScheduledPaymentFailed(),
            ],
            'abandoned_booking_recovery_first' => [
                'subject' => '🛒 [{{site_name}}] Complete your booking',
                'body' => self::htmlAbandonedBookingRecoveryFirst(),
            ],
            'abandoned_booking_recovery_second' => [
                'subject' => '⏳ [{{site_name}}] Still interested? Your booking is waiting',
                'body' => self::htmlAbandonedBookingRecoverySecond(),
            ],
            'abandoned_booking_recovery_final' => [
                'subject' => '⚠️ [{{site_name}}] Final reminder: complete your booking',
                'body' => self::htmlAbandonedBookingRecoveryFinal(),
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
                /* translators: %s: customer name */
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
            . sprintf(
                /* translators: %s: customer name */
                esc_html__('Dear %s,', 'yatra'),
                $name
            )
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
            . sprintf(
                /* translators: %s: customer name */
                esc_html__('Hello %s,', 'yatra'),
                $name
            )
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
            . sprintf(
                /* translators: %s: customer name */
                esc_html__('Dear %s,', 'yatra'),
                $name
            )
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
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalTripConsent(array $v): string
    {
        $recipient = esc_html($v['recipient_name'] ?: __('Traveler', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $formNameRaw = (string) ($v['form_name'] ?? '');
        $formNameEsc = esc_html($formNameRaw);
        $link = esc_url((string) ($v['consent_link'] ?? home_url('/')));
        $rows = array_values(array_filter([
            ['label' => __('Form', 'yatra'), 'value' => $formNameEsc],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
            ['label' => __('Booking reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
        ], static function (array $row): bool {
            return $row['value'] !== '';
        }));

        $notice = !empty($v['expiry_notice_html'])
            ? '<div style="margin:16px 0 0;padding:12px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:14px;color:#9a3412;">'
            . wp_kses_post((string) $v['expiry_notice_html'])
            . '</div>'
            : '';

        $testBlock = !empty($v['consent_test_notice_html'])
            ? '<div style="margin:0 0 20px;padding:12px 16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;font-size:14px;color:#115e59;">'
            . wp_kses_post((string) $v['consent_test_notice_html'])
            . '</div>'
            : '';

        $inner = $testBlock
            . '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(
                /* translators: %s: customer name */
                esc_html__('Hello %s,', 'yatra'),
                $recipient
            )
            . '</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . sprintf(
                /* translators: %s: consent form title */
                esc_html__('Please complete and sign “%s” before your trip.', 'yatra'),
                $formNameRaw !== '' ? $formNameEsc : esc_html__('your consent form', 'yatra')
            )
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . $notice
            . EmailTemplateLayout::button($link, __('Sign consent form', 'yatra'))
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('If the button does not work, copy this link into your browser:', 'yatra')
            . '</p>'
            . '<p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="' . $link . '" style="color:#0d9488;">' . $link . '</a></p>';

        return EmailTemplateLayout::customer(
            '📝',
            __('Consent required', 'yatra'),
            $inner,
            $site,
            __('Sign your trip consent form', 'yatra')
        );
    }

    /**
     * @param array<string, string> $v
     */
    public static function fallbackTransactionalCustomerEmailVerification(array $v): string
    {
        $firstRaw = (string) ($v['customer_first_name'] ?? '');
        if ($firstRaw === '') {
            $firstRaw = (string) ($v['customer_name'] ?? '');
        }
        $first = esc_html($firstRaw !== '' ? $firstRaw : __('there', 'yatra'));
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $link = esc_url((string) ($v['verification_link'] ?? home_url('/')));
        $intro = isset($v['intro_paragraph']) ? esc_html((string) $v['intro_paragraph']) : '';
        $footer = isset($v['footer_note']) ? esc_html((string) $v['footer_note']) : '';
        $expiryInner = !empty($v['expiry_notice_html'])
            ? wp_kses_post((string) $v['expiry_notice_html'])
            : esc_html(
                sprintf(
                    /* translators: %d: hours until link expiry */
                    __('This verification link expires in %d hours for your security.', 'yatra'),
                    24
                )
            );
        $expiry = '<div style="margin:20px 0 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#475569;">'
            . $expiryInner
            . '</div>';

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">'
            . sprintf(
                /* translators: %s: customer name */
                esc_html__('Hello %s,', 'yatra'),
                $first
            )
            . '</p>'
            . ($intro !== '' ? '<p style="margin:0 0 20px;color:#475569;">' . $intro . '</p>' : '')
            . EmailTemplateLayout::button($link, __('Verify email address', 'yatra'))
            . $expiry
            . ($footer !== '' ? '<p style="margin:24px 0 0;font-size:14px;color:#64748b;">' . $footer . '</p>' : '')
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('If the button does not work, copy this link into your browser:', 'yatra')
            . '</p>'
            . '<p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="' . $link . '" style="color:#0d9488;">' . $link . '</a></p>';

        return EmailTemplateLayout::customer(
            '✉️',
            __('Verify your email', 'yatra'),
            $inner,
            $site,
            __('Account verification', 'yatra')
        );
    }

    /**
     * Fallback HTML for admin new-booking notice (empty saved template).
     *
     * @param array<string, string> $v
     */
    /**
     * Fallback HTML for admin payment-received notice.
     *
     * @param array<string, string> $v
     */
    public static function fallbackAdminPaymentReceived(array $v): string
    {
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $rows = array_values(array_filter([
            ['label' => __('Booking ID', 'yatra'), 'value' => esc_html($v['booking_id'] ?? '')],
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Customer', 'yatra'), 'value' => esc_html($v['customer_name'] ?? '')],
            ['label' => __('Amount', 'yatra'), 'value' => esc_html($v['payment_amount_formatted'] ?? '')],
            ['label' => __('Method', 'yatra'), 'value' => esc_html($v['payment_method'] ?? '')],
            ['label' => __('Transaction ID', 'yatra'), 'value' => esc_html($v['transaction_id'] ?? '')],
        ], static function (array $row): bool {
            return trim((string) ($row['value'] ?? '')) !== '';
        }));

        $adminUrl = esc_url($v['admin_url'] ?? admin_url('admin.php?page=yatra'));

        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A payment was recorded for the booking below.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="' . $adminUrl . '" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '✅',
            __('Payment received', 'yatra'),
            $inner,
            $site . ' · ' . esc_html__('Admin notification', 'yatra')
        );
    }

    /**
     * Fallback HTML for admin booking-cancelled notice.
     *
     * @param array<string, string> $v
     */
    public static function fallbackAdminBookingCancelled(array $v): string
    {
        $site = esc_html($v['site_name'] ?? get_bloginfo('name'));
        $rows = array_values(array_filter([
            ['label' => __('Booking ID', 'yatra'), 'value' => esc_html($v['booking_id'] ?? '')],
            ['label' => __('Reference', 'yatra'), 'value' => esc_html($v['booking_reference'] ?? '')],
            ['label' => __('Customer', 'yatra'), 'value' => esc_html($v['customer_name'] ?? '')],
            ['label' => __('Trip', 'yatra'), 'value' => esc_html($v['trip_name'] ?? '')],
            ['label' => __('Travel date', 'yatra'), 'value' => esc_html($v['travel_date'] ?? '')],
        ], static function (array $row): bool {
            return trim((string) ($row['value'] ?? '')) !== '';
        }));

        $adminUrl = esc_url($v['admin_url'] ?? admin_url('admin.php?page=yatra'));

        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A booking was cancelled. Summary below.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard($rows)
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="' . $adminUrl . '" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '📋',
            __('Booking cancelled', 'yatra'),
            $inner,
            $site . ' · ' . esc_html__('Admin notification', 'yatra')
        );
    }

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

    private static function htmlAdminPaymentReceived(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A payment was recorded for the booking below.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Booking ID', 'value' => '{{booking_id}}'],
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Customer', 'value' => '{{customer_name}}'],
                ['label' => 'Amount', 'value' => '{{payment_amount_formatted}}'],
                ['label' => 'Method', 'value' => '{{payment_method}}'],
                ['label' => 'Transaction ID', 'value' => '{{transaction_id}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="{{admin_url}}" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '✅',
            'Payment received',
            $inner,
            '{{site_name}} · ' . esc_html__('Admin notification', 'yatra')
        );
    }

    private static function htmlAdminBookingCancelled(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A booking was cancelled. Summary below.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Booking ID', 'value' => '{{booking_id}}'],
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Customer', 'value' => '{{customer_name}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="{{admin_url}}" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '📋',
            'Booking cancelled',
            $inner,
            '{{site_name}} · ' . esc_html__('Admin notification', 'yatra')
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

    private static function htmlTripConsentRequest(): string
    {
        $cta = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr>'
            . '<td style="border-radius:10px;background:#0d9488;">'
            . '<a href="{{consent_link}}" style="display:inline-block;padding:14px 28px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Sign consent form', 'yatra')
            . '</a></td></tr></table>';

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{recipient_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Please review and sign the consent form for your upcoming trip.', 'yatra')
            . '</p>'
            . '{{consent_test_notice_html}}'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Form', 'value' => '{{form_name}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Booking reference', 'value' => '{{booking_reference}}'],
            ])
            . '{{expiry_notice_html}}'
            . $cta
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('If the button does not work, copy this link into your browser:', 'yatra')
            . '</p>'
            . '<p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="{{consent_link}}" style="color:#0d9488;">{{consent_link}}</a></p>';

        return EmailTemplateLayout::customer(
            '📝',
            'Consent required',
            $inner,
            '{{site_name}}',
            'Trip consent'
        );
    }

    private static function htmlCustomerEmailVerification(): string
    {
        $cta = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr>'
            . '<td style="border-radius:10px;background:#0d9488;">'
            . '<a href="{{verification_link}}" style="display:inline-block;padding:14px 28px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Verify email address', 'yatra')
            . '</a></td></tr></table>';

        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_first_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">{{intro_paragraph}}</p>'
            . $cta
            . '<div style="margin:20px 0 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#475569;">'
            . '{{expiry_notice_html}}'
            . '</div>'
            . '<p style="margin:24px 0 0;font-size:14px;color:#64748b;">{{footer_note}}</p>'
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('If the button does not work, copy this link into your browser:', 'yatra')
            . '</p>'
            . '<p style="margin:8px 0 0;font-size:13px;word-break:break-all;"><a href="{{verification_link}}" style="color:#0d9488;">{{verification_link}}</a></p>';

        return EmailTemplateLayout::customer(
            '✉️',
            __('Verify your email', 'yatra'),
            $inner,
            '{{site_name}}',
            __('Account verification', 'yatra')
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

    private static function htmlBookingExpiredCustomer(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Your booking was cancelled automatically because payment was not received in time.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Travel date', 'value' => '{{travel_date}}'],
                ['label' => 'Policy', 'value' => '{{expiry_policy_note}}'],
            ])
            . '<p style="margin:24px 0 0;"><a href="{{trip_url}}" style="color:#0d9488;font-weight:600;text-decoration:none;">'
            . esc_html__('Browse trips again →', 'yatra')
            . '</a></p>';

        return EmailTemplateLayout::customer(
            '⏱️',
            __('Booking expired', 'yatra'),
            $inner,
            '{{site_name}}',
            __('Booking expired', 'yatra')
        );
    }

    private static function htmlAdminBookingExpired(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A booking was cancelled automatically due to non-payment (expiry policy).', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Booking ID', 'value' => '{{booking_id}}'],
                ['label' => 'Customer', 'value' => '{{customer_name}}'],
                ['label' => 'Email', 'value' => '{{customer_email}}'],
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="{{admin_url}}" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '⏱️',
            __('Booking expired', 'yatra'),
            $inner,
            '{{site_name}} · ' . esc_html__('Admin', 'yatra')
        );
    }

    private static function htmlScheduledPaymentReminder(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_first_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('This is a reminder that a scheduled payment is coming up for your booking.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Amount', 'value' => '{{scheduled_amount_formatted}}'],
                ['label' => 'Scheduled date', 'value' => '{{scheduled_date_formatted}}'],
                ['label' => 'Type', 'value' => '{{payment_type_label}}'],
            ])
            . '<p style="margin:24px 0 0;font-size:14px;color:#64748b;">'
            . esc_html__('If you need to update your payment method, contact us before the charge date.', 'yatra')
            . '</p>';

        return EmailTemplateLayout::customer(
            '💳',
            __('Upcoming payment', 'yatra'),
            $inner,
            '{{site_name}}',
            __('Scheduled payment reminder', 'yatra')
        );
    }

    private static function htmlScheduledPaymentSucceeded(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_first_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('Your scheduled payment was processed successfully.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Amount charged', 'value' => '{{scheduled_amount_formatted}}'],
                ['label' => 'Type', 'value' => '{{payment_type_label}}'],
                ['label' => 'Balance due now', 'value' => '{{balance_after_formatted}}'],
            ]);

        return EmailTemplateLayout::customer(
            '✅',
            __('Payment received', 'yatra'),
            $inner,
            '{{site_name}}',
            __('Scheduled payment', 'yatra')
        );
    }

    private static function htmlScheduledPaymentFailed(): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_first_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">'
            . '{{failure_intro_html}}'
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Amount', 'value' => '{{scheduled_amount_formatted}}'],
                ['label' => 'Details', 'value' => '{{failure_reason}}'],
            ])
            . '<p style="margin:24px 0 0;font-size:14px;color:#64748b;">{{failure_followup_html}}</p>';

        return EmailTemplateLayout::customer(
            '⚠️',
            __('Payment issue', 'yatra'),
            $inner,
            '{{site_name}}',
            __('Scheduled payment', 'yatra')
        );
    }

    private static function htmlAdminScheduledPaymentFailed(): string
    {
        $inner = '<p style="margin:0 0 20px;color:#475569;">'
            . esc_html__('A scheduled payment permanently failed after retries.', 'yatra')
            . '</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Reference', 'value' => '{{booking_reference}}'],
                ['label' => 'Customer', 'value' => '{{customer_name}}'],
                ['label' => 'Email', 'value' => '{{customer_email}}'],
                ['label' => 'Amount', 'value' => '{{scheduled_amount_formatted}}'],
                ['label' => 'Error', 'value' => '{{failure_reason}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>'
            . '<td style="border-radius:10px;background:#2563eb;">'
            . '<a href="{{admin_url}}" style="display:inline-block;padding:14px 24px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Open in Yatra admin', 'yatra')
            . '</a></td></tr></table>';

        return EmailTemplateLayout::admin(
            '⚠️',
            __('Scheduled payment failed', 'yatra'),
            $inner,
            '{{site_name}} · ' . esc_html__('Admin', 'yatra')
        );
    }

    private static function htmlAbandonedBookingRecoveryBase(string $headline, string $subLabel): string
    {
        $inner = '<p style="margin:0 0 16px;font-size:17px;color:#0f172a;">Hello {{customer_name}},</p>'
            . '<p style="margin:0 0 20px;color:#475569;">{{recovery_intro_html}}</p>'
            . EmailTemplateLayout::detailCard([
                ['label' => 'Trip', 'value' => '{{trip_name}}'],
                ['label' => 'Reminder', 'value' => '{{recovery_reminder_label}}'],
            ])
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr>'
            . '<td style="border-radius:10px;background:#0d9488;">'
            . '<a href="{{recovery_link}}" style="display:inline-block;padding:14px 28px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . esc_html__('Continue booking', 'yatra')
            . '</a></td></tr></table>'
            . '<p style="margin:20px 0 0;font-size:13px;color:#64748b;">'
            . esc_html__('If you did not start this booking, you can ignore this email.', 'yatra')
            . '</p>';

        return EmailTemplateLayout::customer(
            '🛒',
            $headline,
            $inner,
            '{{site_name}}',
            $subLabel
        );
    }

    private static function htmlAbandonedBookingRecoveryFirst(): string
    {
        return self::htmlAbandonedBookingRecoveryBase(
            __('Complete your booking', 'yatra'),
            __('Abandoned checkout · First reminder', 'yatra')
        );
    }

    private static function htmlAbandonedBookingRecoverySecond(): string
    {
        return self::htmlAbandonedBookingRecoveryBase(
            __('Still interested?', 'yatra'),
            __('Abandoned checkout · Second reminder', 'yatra')
        );
    }

    private static function htmlAbandonedBookingRecoveryFinal(): string
    {
        return self::htmlAbandonedBookingRecoveryBase(
            __('Final reminder', 'yatra'),
            __('Abandoned checkout · Final reminder', 'yatra')
        );
    }

    public static function fallbackTransactionalBookingCompleted(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlTripCompleted(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalBookingExpiredCustomer(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlBookingExpiredCustomer(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackAdminBookingExpired(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlAdminBookingExpired(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalScheduledPaymentReminder(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlScheduledPaymentReminder(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalScheduledPaymentSucceeded(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlScheduledPaymentSucceeded(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalScheduledPaymentFailed(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlScheduledPaymentFailed(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackAdminScheduledPaymentFailed(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlAdminScheduledPaymentFailed(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalEnquiryAdmin(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryAdmin(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalEnquiryReceived(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryCustomer(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalEnquiryResponse(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlEnquiryResponse(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalReviewRequest(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlReviewRequest(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalAbandonedBookingRecoveryFirst(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlAbandonedBookingRecoveryFirst(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalAbandonedBookingRecoverySecond(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlAbandonedBookingRecoverySecond(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    public static function fallbackTransactionalAbandonedBookingRecoveryFinal(array $v): string
    {
        return TransactionalEmailTemplateService::parseMergeTags(self::htmlAbandonedBookingRecoveryFinal(), TransactionalEmailTemplateService::mergeTemplateVariables($v));
    }

    /**
     * Merge-tag variables for enquiry templates (core wp_mail path when Pro does not own the channel).
     *
     * @param object $enquiry Row from EnquiryRepository::findWithTrip()
     */
    private static function enquiryVariablesForTemplates(object $enquiry, string $responsePlain): array
    {
        return TransactionalEmailTemplateService::variablesFromEnquiry($enquiry, $responsePlain);
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
