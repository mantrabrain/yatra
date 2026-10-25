<?php
/**
 * Notification Service
 *
 * Admin / customer emails for booking lifecycle events. Enable/disable and copy are controlled
 * under Yatra → Email → Templates (settings-backed flags), not Settings → Notifications.
 *
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;

class NotificationService
{
    /**
     * Send booking created notification (admin: {@see TransactionalEmailTemplateService::TYPE_ADMIN_NEW_BOOKING}).
     */
    public static function sendBookingCreatedNotification(int $bookingId, $bookingData): void
    {
        self::notifyAdminNewBooking($bookingId, $bookingData);
    }

    /**
     * Send payment completed notification (admin + customer templates).
     */
    public static function sendPaymentCompletedNotification(array $paymentData): void
    {
        self::notifyAdminPaymentReceived($paymentData);
        self::notifyCustomerPaymentReceived($paymentData);
    }

    /**
     * Send booking cancellation notification (admin template; customer email uses transactional templates from BookingService).
     */
    public static function sendCancellationNotification(int $bookingId, $bookingData): void
    {
        self::notifyAdminCancellation($bookingId, $bookingData);
    }

    /**
     * Resend just the customer payment-received email (part- or full-payment
     * template, exactly as the automated flow chooses it). Public entry for the
     * admin "resend email" action.
     */
    public static function resendCustomerPaymentEmail(array $paymentData): void
    {
        self::notifyCustomerPaymentReceived($paymentData);
    }

    /**
     * Resend just the admin payment-received notification. Public entry for the
     * admin "resend email" action.
     */
    public static function resendAdminPaymentEmail(array $paymentData): void
    {
        self::notifyAdminPaymentReceived($paymentData);
    }

    /**
     * Notify admin of new booking
     */
    private static function notifyAdminNewBooking(int $bookingId, $bookingData): void
    {
        if (!apply_filters('yatra_notify_admin_new_booking', true, $bookingId, $bookingData)) {
            return;
        }

        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $repository = new BookingRepository();
        $booking = $repository->findWithTrip($bookingId);
        if (!$booking) {
            return;
        }

        $adminNotifyContext = [
            'booking_id' => $bookingId,
            'reference' => $booking->reference ?? '',
            'source' => 'yatra_booking_created',
        ];
        if (!apply_filters('yatra_send_checkout_admin_notification', true, $adminNotifyContext)) {
            return;
        }

        $variables = TransactionalEmailTemplateService::variablesFromBooking($booking);

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_NEW_BOOKING,
            $admin_email,
            $variables
        );
    }

    /**
     * Yatra's own reference for the payment this email is about, e.g. PAY-000004.
     *
     * The gateway Transaction ID is empty for anything recorded by hand, so a
     * template that leads on it shows a labelled blank. This is the number the
     * Payments screen, the invoice and the customer account already display, so
     * an operator can quote it and a customer can recognise it.
     *
     * There is no `reference` column: the value is derived from the payment row's
     * id, exactly as {@see PaymentService::formatPayment()} and the invoice do.
     * Keep those three in step — if the format ever changes it must change in
     * all of them or the email will cite a number nothing else shows.
     *
     * Resolved here rather than threaded through the three call paths that reach
     * these notifiers (gateway capture, admin status change, manual resend), so
     * none of their signatures change. An explicit id wins; otherwise the
     * gateway transaction is looked up; otherwise the booking's most recent
     * payment, which is the one this email is about in every flow that omits an
     * id. Returns '' when nothing identifies a payment — the template then
     * renders an empty value, and {@see EmailTemplateLayout::dropUnfilledRows()}
     * removes the row rather than showing a blank one.
     */
    private static function resolvePaymentReference(array $paymentData): string
    {
        $paymentId = (int) ($paymentData['payment_id'] ?? $paymentData['id'] ?? 0);

        if ($paymentId < 1) {
            $repository = new \Yatra\Repositories\PaymentRepository();

            $transactionId = trim((string) ($paymentData['transaction_id'] ?? ''));
            if ($transactionId !== '') {
                $row = $repository->findByTransactionId($transactionId);
                $paymentId = (int) ($row->id ?? 0);
            }

            if ($paymentId < 1) {
                $bookingId = (int) ($paymentData['booking_id'] ?? 0);
                if ($bookingId > 0) {
                    $row = $repository->findLatestByBookingId($bookingId);
                    $paymentId = (int) ($row->id ?? 0);
                }
            }
        }

        return $paymentId > 0 ? sprintf('PAY-%06d', $paymentId) : '';
    }

    /**
     * Notify admin of payment received (template: admin_payment_received).
     */
    private static function notifyAdminPaymentReceived(array $paymentData): void
    {
        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $bookingRepository = new BookingRepository();
        $booking = $bookingRepository->findWithTrip((int) ($paymentData['booking_id'] ?? 0));
        if (!$booking) {
            return;
        }

        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['payment_amount_formatted'] = yatra_format_price((float) ($paymentData['amount'] ?? 0));
        // Name the gateway the way the customer saw it at checkout (the
        // operator's Gateway Title), not its internal id — a Stripe capture
        // passes the slug "stripe" here. A manually recorded payment passes
        // free text ("Credit Card"), which is not a gateway id and is returned
        // unchanged.
        $vars['payment_method'] = yatra_payment_gateway_label(
            isset($paymentData['payment_method']) ? (string) $paymentData['payment_method'] : null,
            __('Online payment', 'yatra')
        );
        $vars['transaction_id'] = (string) ($paymentData['transaction_id'] ?? '');
        $vars['payment_reference'] = self::resolvePaymentReference($paymentData);

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_PAYMENT_RECEIVED,
            $admin_email,
            $vars
        );
    }

    /**
     * Which payment email to send: the part-payment template or the full one.
     *
     * Defaults to the long-standing single template. The part-payment template
     * is used only when ALL of these hold, so an existing site sees no change
     * until its operator opts in:
     *
     *   1. a balance is genuinely still outstanding on the booking,
     *   2. deposits / partial payments are switched on at all, and
     *   3. the operator has enabled the separate part-payment template —
     *      either the free "Partial Payment Received" toggle, or (Pro Email
     *      Automation) the active "Partial Payment Received" DB template. On a
     *      Pro site the Email → Templates switch only writes the Pro row, so
     *      the free toggle stays at its default and must not be the sole gate.
     */
    private static function paymentTemplateTypeFor(object $booking): string
    {
        $full = TransactionalEmailTemplateService::TYPE_PAYMENT_CONFIRMATION;
        $partial = TransactionalEmailTemplateService::TYPE_PARTIAL_PAYMENT_RECEIVED;

        // Nothing left to pay → this is the full-payment confirmation.
        if ((float) ($booking->amount_due ?? 0) <= 0) {
            return $full;
        }

        if (!yatra_partial_payments_enabled()) {
            return $full;
        }

        $partialEnabled = SettingsService::isEnabled('email_template_partial_payment')
            || (bool) apply_filters('yatra_pro_email_automation_owns_transactional_type', false, $partial);

        return $partialEnabled ? $partial : $full;
    }

    /**
     * Notify customer of payment received
     */
    private static function notifyCustomerPaymentReceived(array $paymentData): void
    {
        $bookingRepository = new BookingRepository();
        $booking = $bookingRepository->findWithTrip((int) ($paymentData['booking_id'] ?? 0));

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        $vars = TransactionalEmailTemplateService::variablesFromBooking($booking);
        $vars['payment_amount_formatted'] = yatra_format_price((float) ($paymentData['amount'] ?? 0));
        // Name the gateway the way the customer saw it at checkout (the
        // operator's Gateway Title), not its internal id — a Stripe capture
        // passes the slug "stripe" here. A manually recorded payment passes
        // free text ("Credit Card"), which is not a gateway id and is returned
        // unchanged.
        $vars['payment_method'] = yatra_payment_gateway_label(
            isset($paymentData['payment_method']) ? (string) $paymentData['payment_method'] : null,
            __('Online payment', 'yatra')
        );
        $vars['transaction_id'] = (string) ($paymentData['transaction_id'] ?? '');
        $vars['payment_reference'] = self::resolvePaymentReference($paymentData);

        TransactionalEmailTemplateService::sendIfEnabled(
            self::paymentTemplateTypeFor($booking),
            $booking->contact_email,
            $vars
        );
    }

    /**
     * Notify admin of cancellation
     */
    private static function notifyAdminCancellation(int $bookingId, $bookingData): void
    {
        $admin_email = SettingsService::getString('admin_email', (string) get_option('admin_email', ''));
        if ($admin_email === '' || !is_email($admin_email)) {
            return;
        }

        $repository = new BookingRepository();
        $booking = $repository->findWithTrip($bookingId);
        if (!$booking) {
            return;
        }

        $variables = TransactionalEmailTemplateService::variablesFromBooking($booking);

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_ADMIN_BOOKING_CANCELLED,
            $admin_email,
            $variables
        );
    }
}
