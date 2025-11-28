<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\PaymentGateways\PaymentGatewayRegistry;
use Yatra\Repositories\ScheduledPaymentRepository;
use Yatra\Repositories\BookingRepository;

/**
 * Scheduled Payment Service
 * 
 * IMPORTANT: This service does NOT charge customers directly.
 * It creates subscriptions/invoices in the payment gateway (Stripe, PayPal, etc.)
 * and the GATEWAY handles charging the customer automatically.
 * 
 * Yatra receives webhooks from the gateway about payment success/failure.
 */
class ScheduledPaymentService
{
    private const CRON_HOOK = 'yatra_sync_scheduled_payments';
    private const REMINDER_HOOK = 'yatra_send_payment_reminders';

    /**
     * Get the scheduled payment repository instance
     *
     * @return ScheduledPaymentRepository
     */
    private static function getRepository(): ScheduledPaymentRepository
    {
        static $repository = null;
        if ($repository === null) {
            $repository = new ScheduledPaymentRepository();
        }
        return $repository;
    }

    /**
     * Get the booking repository instance
     *
     * @return BookingRepository
     */
    private static function getBookingRepository(): BookingRepository
    {
        static $repository = null;
        if ($repository === null) {
            $repository = new BookingRepository();
        }
        return $repository;
    }
    
    /**
     * Register cron jobs
     */
    public static function register(): void
    {
        // Sync scheduled payment status from gateways (doesn't charge, just syncs)
        add_action(self::CRON_HOOK, [self::class, 'syncScheduledPaymentStatus']);
        
        // Send payment reminders before due dates
        add_action(self::REMINDER_HOOK, [self::class, 'sendPaymentReminders']);
        
        // Schedule cron jobs if not already scheduled
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'twicedaily', self::CRON_HOOK);
        }
        
        if (!wp_next_scheduled(self::REMINDER_HOOK)) {
            wp_schedule_event(time(), 'daily', self::REMINDER_HOOK);
        }
    }
    
    /**
     * Unregister cron jobs
     */
    public static function unregister(): void
    {
        wp_clear_scheduled_hook(self::CRON_HOOK);
        wp_clear_scheduled_hook(self::REMINDER_HOOK);
    }
    
    /**
     * Sync scheduled payment status from gateways
     * This does NOT charge - it just syncs status from what the gateway has done
     */
    public static function syncScheduledPaymentStatus(): void
    {
        $repository = self::getRepository();

        // Get processing payments that might have been updated by gateway webhook
        $processing_payments = $repository->getProcessingPayments();

        // For each, check gateway status if we have a gateway reference
        foreach ($processing_payments as $payment) {
            if (!empty($payment->gateway_subscription_id)) {
                self::syncPaymentFromGateway($payment);
            }
        }
    }
    
    /**
     * Sync a single payment status from gateway
     */
    private static function syncPaymentFromGateway(object $payment): void
    {
        // Gateway webhooks should handle most updates
        // This is just a backup sync mechanism
        $registry = PaymentGatewayRegistry::getInstance();
        $gateway = $registry->get($payment->gateway);
        
        if (!$gateway) {
            return;
        }
        
        // Log that we're syncing (gateway webhooks should be primary)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf('[Yatra] Syncing scheduled payment %d status from %s', $payment->id, $payment->gateway));
        }
    }
    
    /**
     * Send payment reminders before scheduled payments
     */
    public static function sendPaymentReminders(): void
    {
        $repository = self::getRepository();

        $reminder_days = (int) SettingsService::get('scheduled_payment_reminder_days', 3);

        // Get pending payments coming up that haven't had reminders sent
        $upcoming = $repository->getPendingForReminders($reminder_days);

        foreach ($upcoming as $payment) {
            self::sendPaymentReminder($payment);

            // Mark reminder as sent
            $repository->markReminded($payment->id);
        }
    }
    
    /**
     * Send payment reminder email
     */
    private static function sendPaymentReminder(object $payment): void
    {
        if (empty($payment->contact_email)) {
            return;
        }
        
        $site_name = get_bloginfo('name');
        $subject = sprintf(__('[%s] Upcoming Payment Reminder', 'yatra'), $site_name);
        
        $scheduled_date = date_i18n(get_option('date_format'), strtotime($payment->scheduled_date));
        
        $message = sprintf(
            __("Hello %s,\n\nThis is a reminder that your scheduled payment is coming up.\n\nBooking Reference: %s\nAmount: %s %s\nScheduled Date: %s\n\nThe payment will be charged automatically to your saved payment method. If you need to update your payment details, please contact us before the scheduled date.\n\nBest regards,\n%s", 'yatra'),
            $payment->contact_first_name,
            $payment->reference,
            number_format((float) $payment->amount, 2),
            $payment->currency,
            $scheduled_date,
            $site_name
        );
        
        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        wp_mail($payment->contact_email, $subject, $message, $headers);
    }
    
    /**
     * Process a scheduled payment manually (admin action)
     * 
     * This creates an invoice in the payment gateway (e.g., Stripe Invoice)
     * The GATEWAY charges the customer and sends us a webhook when complete.
     * We don't charge directly from Yatra.
     */
    public static function processScheduledPayment(object $scheduled_payment, bool $is_retry = false): array
    {
        global $wpdb;
        
        $table = $wpdb->prefix . 'yatra_scheduled_payments';
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $tokens_table = $wpdb->prefix . 'yatra_payment_tokens';
        
        // Mark as processing
        $wpdb->update(
            $table,
            [
                'status' => 'processing',
                'last_attempt_at' => current_time('mysql'),
                'attempt_count' => $scheduled_payment->attempt_count + 1,
            ],
            ['id' => $scheduled_payment->id],
            ['%s', '%s', '%d'],
            ['%d']
        );
        
        // Get the payment token
        $token = null;
        if ($scheduled_payment->payment_token_id) {
            $token = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$tokens_table} WHERE id = %d AND is_active = 1",
                $scheduled_payment->payment_token_id
            ));
        }
        
        if (!$token && $scheduled_payment->gateway_customer_id) {
            $token = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$tokens_table} 
                 WHERE gateway_customer_id = %s 
                 AND gateway = %s 
                 AND is_active = 1 
                 ORDER BY is_default DESC, id DESC 
                 LIMIT 1",
                $scheduled_payment->gateway_customer_id,
                $scheduled_payment->gateway
            ));
        }
        
        if (!$token) {
            $wpdb->update(
                $table,
                [
                    'status' => 'failed',
                    'last_error' => __('No valid payment method found', 'yatra'),
                ],
                ['id' => $scheduled_payment->id],
                ['%s', '%s'],
                ['%d']
            );
            
            self::notifyPaymentFailed($scheduled_payment, __('No valid payment method found. Please update your payment details.', 'yatra'));
            
            return [
                'success' => false,
                'error' => __('No valid payment method found', 'yatra'),
            ];
        }
        
        // Get gateway
        $registry = PaymentGatewayRegistry::getInstance();
        $gateway = $registry->get($scheduled_payment->gateway);
        
        if (!$gateway) {
            $wpdb->update(
                $table,
                [
                    'status' => 'failed',
                    'last_error' => __('Payment gateway not available', 'yatra'),
                ],
                ['id' => $scheduled_payment->id],
                ['%s', '%s'],
                ['%d']
            );
            
            return [
                'success' => false,
                'error' => __('Payment gateway not available', 'yatra'),
            ];
        }
        
        if (!$gateway->supportsRecurring()) {
            $wpdb->update(
                $table,
                [
                    'status' => 'failed',
                    'last_error' => __('Gateway does not support automatic payments', 'yatra'),
                ],
                ['id' => $scheduled_payment->id],
                ['%s', '%s'],
                ['%d']
            );
            
            return [
                'success' => false,
                'error' => __('Gateway does not support automatic payments', 'yatra'),
            ];
        }
        
        // Get booking info
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$bookings_table} WHERE id = %d",
            $scheduled_payment->booking_id
        ));
        
        // Create invoice in gateway (gateway will charge and send webhook)
        // For Stripe, this creates an invoice that auto-charges
        if ($scheduled_payment->gateway === 'stripe' && method_exists($gateway, 'createScheduledInvoice')) {
            $result = $gateway->createScheduledInvoice(
                $token->gateway_customer_id,
                $token->gateway_payment_method_id,
                [
                    'amount' => (float) $scheduled_payment->amount,
                    'currency' => $scheduled_payment->currency,
                    'booking_id' => $scheduled_payment->booking_id,
                    'due_date' => 'now', // Immediate charge
                    'description' => sprintf(
                        __('Payment for Booking %s', 'yatra'),
                        $booking ? $booking->reference : '#' . $scheduled_payment->booking_id
                    ),
                    'payment_type' => $scheduled_payment->payment_type,
                ]
            );
            
            if ($result['success']) {
                // Invoice created - gateway will charge and send webhook
                // Update status to show invoice was created (webhook will mark as completed)
                $wpdb->update(
                    $table,
                    [
                        'gateway_invoice_id' => $result['invoice_id'] ?? null,
                        'notes' => __('Invoice created in Stripe. Awaiting payment confirmation.', 'yatra'),
                        'updated_at' => current_time('mysql'),
                    ],
                    ['id' => $scheduled_payment->id],
                    ['%s', '%s', '%s'],
                    ['%d']
                );
                
                return [
                    'success' => true,
                    'message' => __('Payment invoice created. The gateway will process the charge.', 'yatra'),
                    'invoice_id' => $result['invoice_id'] ?? null,
                ];
            } else {
                $wpdb->update(
                    $table,
                    [
                        'status' => 'failed',
                        'last_error' => $result['error'] ?? __('Failed to create invoice', 'yatra'),
                        'updated_at' => current_time('mysql'),
                    ],
                    ['id' => $scheduled_payment->id],
                    ['%s', '%s', '%s'],
                    ['%d']
                );
                
                return [
                    'success' => false,
                    'error' => $result['error'] ?? __('Failed to create invoice', 'yatra'),
                ];
            }
        }
        
        // Fallback for other gateways - they may still use direct charge
        // but this is not recommended for production
        $result = $gateway->chargePaymentMethod(
            $token->gateway_customer_id,
            $token->gateway_payment_method_id,
            [
                'amount' => (float) $scheduled_payment->amount,
                'currency' => $scheduled_payment->currency,
                'booking_id' => $scheduled_payment->booking_id,
                'booking_reference' => $booking ? $booking->reference : '',
                'description' => sprintf(
                    __('Scheduled payment for booking %s', 'yatra'),
                    $booking ? $booking->reference : '#' . $scheduled_payment->booking_id
                ),
                'metadata' => [
                    'scheduled_payment_id' => $scheduled_payment->id,
                    'payment_type' => $scheduled_payment->payment_type,
                ],
            ]
        );
        
        // Note: This direct charge is only for non-Stripe gateways
        // Ideally all gateways should use their invoice/subscription system
        if ($result['success']) {
            $payments_table = $wpdb->prefix . 'yatra_booking_payments';
            
            $wpdb->insert(
                $payments_table,
                [
                    'booking_id' => $scheduled_payment->booking_id,
                    'transaction_id' => $result['transaction_id'] ?? null,
                    'gateway' => $scheduled_payment->gateway,
                    'amount' => $scheduled_payment->amount,
                    'currency' => $scheduled_payment->currency,
                    'status' => 'completed',
                    'payment_type' => $scheduled_payment->payment_type,
                    'gateway_response' => wp_json_encode($result),
                    'notes' => __('Manual payment triggered by admin', 'yatra'),
                    'processed_at' => current_time('mysql'),
                    'created_at' => current_time('mysql'),
                ],
                ['%d', '%s', '%s', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
            );
            
            $payment_id = $wpdb->insert_id;
            
            $wpdb->update(
                $table,
                [
                    'status' => 'completed',
                    'payment_id' => $payment_id,
                    'updated_at' => current_time('mysql'),
                ],
                ['id' => $scheduled_payment->id],
                ['%s', '%d', '%s'],
                ['%d']
            );
            
            if ($booking) {
                $new_amount_paid = (float) $booking->amount_paid + (float) $scheduled_payment->amount;
                $new_amount_due = max(0, (float) $booking->total_amount - $new_amount_paid);
                $payment_status = $new_amount_due <= 0 ? 'paid' : 'partial';
                
                $wpdb->update(
                    $bookings_table,
                    [
                        'amount_paid' => $new_amount_paid,
                        'amount_due' => $new_amount_due,
                        'payment_status' => $payment_status,
                        'updated_at' => current_time('mysql'),
                    ],
                    ['id' => $booking->id],
                    ['%f', '%f', '%s', '%s'],
                    ['%d']
                );
            }
            
            self::notifyPaymentSuccess($scheduled_payment, $result);
            do_action('yatra_scheduled_payment_completed', $scheduled_payment->id, $payment_id, $result);
            
            return [
                'success' => true,
                'payment_id' => $payment_id,
                'transaction_id' => $result['transaction_id'] ?? null,
            ];
        } else {
            // Payment failed
            $error_message = $result['error'] ?? __('Payment processing failed', 'yatra');
            
            $new_status = 'failed';
            if ($scheduled_payment->attempt_count + 1 >= $scheduled_payment->max_attempts) {
                $new_status = 'failed'; // Permanently failed
                
                // Notify about permanent failure
                self::notifyPaymentFailed($scheduled_payment, $error_message, true);
            } else {
                // Notify about temporary failure
                self::notifyPaymentFailed($scheduled_payment, $error_message, false);
            }
            
            $wpdb->update(
                $table,
                [
                    'status' => $new_status,
                    'last_error' => $error_message,
                    'updated_at' => current_time('mysql'),
                ],
                ['id' => $scheduled_payment->id],
                ['%s', '%s', '%s'],
                ['%d']
            );
            
            // Trigger action for extensions
            do_action('yatra_scheduled_payment_failed', $scheduled_payment->id, $error_message);
            
            return [
                'success' => false,
                'error' => $error_message,
            ];
        }
    }
    
    /**
     * Create scheduled payments for a booking
     * 
     * @param int $bookingId Booking ID
     * @param string $gateway Payment gateway
     * @param string $gatewayCustomerId Gateway customer ID
     * @param int|null $paymentTokenId Payment token ID
     * @param float $remainingAmount Remaining amount to schedule
     * @param string $currency Currency
     * @param array $schedule Payment schedule configuration
     */
    /**
     * Create scheduled payments using the GATEWAY's subscription/invoice system
     * 
     * The gateway (Stripe, PayPal, etc.) will handle charging the customer
     * automatically on the scheduled dates. Yatra receives webhooks for
     * payment confirmations.
     */
    public static function createScheduledPayments(
        int $bookingId,
        string $gatewayId,
        string $gatewayCustomerId,
        ?int $paymentTokenId,
        float $remainingAmount,
        string $currency,
        array $schedule
    ): array {
        global $wpdb;
        
        $table = $wpdb->prefix . 'yatra_scheduled_payments';
        $tokens_table = $wpdb->prefix . 'yatra_payment_tokens';
        $created_ids = [];
        
        // Get gateway instance
        $registry = PaymentGatewayRegistry::getInstance();
        $gateway = $registry->get($gatewayId);
        
        if (!$gateway || !$gateway->supportsRecurring()) {
            return [];
        }
        
        // Get payment method ID
        $paymentMethodId = null;
        if ($paymentTokenId) {
            $token = $wpdb->get_row($wpdb->prepare(
                "SELECT gateway_payment_method_id FROM {$tokens_table} WHERE id = %d",
                $paymentTokenId
            ));
            if ($token) {
                $paymentMethodId = $token->gateway_payment_method_id;
            }
        }
        
        if (!$paymentMethodId) {
            return [];
        }
        
        // Schedule configuration
        $schedule_type = $schedule['type'] ?? 'single';
        $days_until = (int) ($schedule['days_until'] ?? 15);
        $installments = (int) ($schedule['installments'] ?? 1);
        $interval_days = (int) ($schedule['interval_days'] ?? 30);
        
        // For Stripe: Use Subscription Schedule or Invoices
        if ($gatewayId === 'stripe' && method_exists($gateway, 'createSubscriptionSchedule')) {
            if ($schedule_type === 'installments' && $installments > 1) {
                // Create a subscription schedule in Stripe
                $result = $gateway->createSubscriptionSchedule($gatewayCustomerId, $paymentMethodId, [
                    'amount' => round($remainingAmount / $installments, 2),
                    'currency' => $currency,
                    'start_date' => date('Y-m-d H:i:s', strtotime("+{$days_until} days")),
                    'installments' => $installments,
                    'interval_days' => $interval_days,
                    'booking_id' => $bookingId,
                    'payment_type' => 'installment',
                ]);
                
                if ($result['success']) {
                    // Create local tracking record
                    $wpdb->insert(
                        $table,
                        [
                            'booking_id' => $bookingId,
                            'customer_id' => get_current_user_id() ?: null,
                            'gateway' => $gatewayId,
                            'gateway_customer_id' => $gatewayCustomerId,
                            'payment_token_id' => $paymentTokenId,
                            'amount' => $remainingAmount,
                            'currency' => $currency,
                            'scheduled_date' => date('Y-m-d H:i:s', strtotime("+{$days_until} days")),
                            'status' => 'pending',
                            'payment_type' => 'installment',
                            'max_attempts' => 3,
                            'notes' => sprintf(
                                __('Stripe subscription schedule created: %s (%d installments)', 'yatra'),
                                $result['schedule_id'],
                                $installments
                            ),
                            'metadata' => wp_json_encode([
                                'stripe_schedule_id' => $result['schedule_id'],
                                'stripe_subscription_id' => $result['subscription_id'] ?? null,
                                'total_installments' => $installments,
                                'managed_by_gateway' => true,
                            ]),
                            'created_at' => current_time('mysql'),
                        ],
                        ['%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s']
                    );
                    $created_ids[] = $wpdb->insert_id;
                }
            } else {
                // Single payment - create Stripe Invoice for future date
                $scheduled_date = date('Y-m-d H:i:s', strtotime("+{$days_until} days"));
                
                $result = $gateway->createScheduledInvoice($gatewayCustomerId, $paymentMethodId, [
                    'amount' => $remainingAmount,
                    'currency' => $currency,
                    'due_date' => $scheduled_date,
                    'booking_id' => $bookingId,
                    'description' => sprintf(__('Final payment for Booking #%d', 'yatra'), $bookingId),
                    'payment_type' => 'final',
                ]);
                
                if ($result['success']) {
                    $wpdb->insert(
                        $table,
                        [
                            'booking_id' => $bookingId,
                            'customer_id' => get_current_user_id() ?: null,
                            'gateway' => $gatewayId,
                            'gateway_customer_id' => $gatewayCustomerId,
                            'payment_token_id' => $paymentTokenId,
                            'amount' => $remainingAmount,
                            'currency' => $currency,
                            'scheduled_date' => $scheduled_date,
                            'status' => 'pending',
                            'payment_type' => 'final',
                            'max_attempts' => 3,
                            'notes' => sprintf(
                                __('Stripe invoice created: %s - will auto-charge on %s', 'yatra'),
                                $result['invoice_id'],
                                $scheduled_date
                            ),
                            'metadata' => wp_json_encode([
                                'stripe_invoice_id' => $result['invoice_id'],
                                'managed_by_gateway' => true,
                            ]),
                            'created_at' => current_time('mysql'),
                        ],
                        ['%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s']
                    );
                    $created_ids[] = $wpdb->insert_id;
                }
            }
            
            return $created_ids;
        }
        
        // Fallback for other gateways - create local tracking records
        // These gateways may need manual processing or different subscription APIs
        if ($schedule_type === 'single') {
            $scheduled_date = date('Y-m-d H:i:s', strtotime("+{$days_until} days"));
            
            $wpdb->insert(
                $table,
                [
                    'booking_id' => $bookingId,
                    'customer_id' => get_current_user_id() ?: null,
                    'gateway' => $gatewayId,
                    'gateway_customer_id' => $gatewayCustomerId,
                    'payment_token_id' => $paymentTokenId,
                    'amount' => $remainingAmount,
                    'currency' => $currency,
                    'scheduled_date' => $scheduled_date,
                    'status' => 'pending',
                    'payment_type' => 'final',
                    'max_attempts' => 3,
                    'notes' => sprintf(__('Remaining balance payment scheduled for %s', 'yatra'), $scheduled_date),
                    'created_at' => current_time('mysql'),
                ],
                ['%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s', '%s', '%d', '%s', '%s']
            );
            
            $created_ids[] = $wpdb->insert_id;
        } elseif ($schedule_type === 'installments') {
            $amount_per_installment = round($remainingAmount / $installments, 2);
            $last_installment = $remainingAmount - ($amount_per_installment * ($installments - 1));
            
            for ($i = 0; $i < $installments; $i++) {
                $days = $days_until + ($i * $interval_days);
                $scheduled_date = date('Y-m-d H:i:s', strtotime("+{$days} days"));
                $amount = ($i === $installments - 1) ? $last_installment : $amount_per_installment;
                $payment_type = ($i === $installments - 1) ? 'final' : 'installment';
                
                $wpdb->insert(
                    $table,
                    [
                        'booking_id' => $bookingId,
                        'customer_id' => get_current_user_id() ?: null,
                        'gateway' => $gatewayId,
                        'gateway_customer_id' => $gatewayCustomerId,
                        'payment_token_id' => $paymentTokenId,
                        'amount' => $amount,
                        'currency' => $currency,
                        'scheduled_date' => $scheduled_date,
                        'status' => 'pending',
                        'payment_type' => $payment_type,
                        'max_attempts' => 3,
                        'notes' => sprintf(
                            __('Installment %d of %d scheduled for %s', 'yatra'),
                            $i + 1,
                            $installments,
                            $scheduled_date
                        ),
                        'metadata' => wp_json_encode([
                            'installment_number' => $i + 1,
                            'total_installments' => $installments,
                        ]),
                        'created_at' => current_time('mysql'),
                    ],
                    ['%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s']
                );
                
                $created_ids[] = $wpdb->insert_id;
            }
        }
        
        return $created_ids;
    }
    
    /**
     * Cancel scheduled payments for a booking
     */
    public static function cancelScheduledPayments(int $bookingId): int
    {
        $repository = self::getRepository();
        return $repository->cancelByBookingId($bookingId);
    }
    
    /**
     * Get scheduled payments for a booking
     */
    public static function getScheduledPayments(int $bookingId): array
    {
        $repository = self::getRepository();
        $results = $repository->getByBookingId($bookingId);

        return array_map(function ($item) {
            return (array) $item;
        }, $results);
    }

    /**
     * Get upcoming scheduled payments (for admin dashboard)
     */
    public static function getUpcomingPayments(int $days = 7, int $limit = 20): array
    {
        $repository = self::getRepository();
        $results = $repository->getUpcoming($days, $limit);

        return array_map(function ($item) {
            return (array) $item;
        }, $results);
    }

    /**
     * Notify customer of successful payment
     */
    private static function notifyPaymentSuccess(object $scheduled_payment, array $result): void
    {
        $bookingRepository = self::getBookingRepository();
        $booking = $bookingRepository->find($scheduled_payment->booking_id);

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        $site_name = get_bloginfo('name');
        $subject = sprintf(__('[%s] Payment Successful - %s', 'yatra'), $site_name, $booking->reference);

        $message = sprintf(
            __("Hello %s,\n\nYour scheduled payment has been processed successfully.\n\nBooking Reference: %s\nAmount: %s %s\nPayment Type: %s\n\nYour remaining balance is now: %s %s\n\nThank you for your payment!\n\nBest regards,\n%s", 'yatra'),
            $booking->contact_first_name,
            $booking->reference,
            number_format((float) $scheduled_payment->amount, 2),
            $scheduled_payment->currency,
            ucfirst($scheduled_payment->payment_type),
            number_format(max(0, (float) $booking->amount_due - (float) $scheduled_payment->amount), 2),
            $scheduled_payment->currency,
            $site_name
        );

        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        wp_mail($booking->contact_email, $subject, $message, $headers);
    }

    /**
     * Notify customer of failed payment
     */
    private static function notifyPaymentFailed(object $scheduled_payment, string $error, bool $permanent = false): void
    {
        $bookingRepository = self::getBookingRepository();
        $booking = $bookingRepository->find($scheduled_payment->booking_id);
        
        if (!$booking || empty($booking->contact_email)) {
            return;
        }
        
        $site_name = get_bloginfo('name');
        $subject = sprintf(__('[%s] Payment Failed - Action Required', 'yatra'), $site_name);
        
        if ($permanent) {
            $message = sprintf(
                __("Hello %s,\n\nWe were unable to process your scheduled payment after multiple attempts.\n\nBooking Reference: %s\nAmount: %s %s\n\nError: %s\n\nPlease log in to your account to update your payment method or make a manual payment.\n\nIMPORTANT: Your booking may be cancelled if payment is not received.\n\nBest regards,\n%s", 'yatra'),
                $booking->contact_first_name,
                $booking->reference,
                number_format((float) $scheduled_payment->amount, 2),
                $scheduled_payment->currency,
                $error,
                $site_name
            );
        } else {
            $message = sprintf(
                __("Hello %s,\n\nWe encountered an issue processing your scheduled payment.\n\nBooking Reference: %s\nAmount: %s %s\n\nError: %s\n\nWe will automatically retry the payment. If you'd like to update your payment method, please log in to your account.\n\nBest regards,\n%s", 'yatra'),
                $booking->contact_first_name,
                $booking->reference,
                number_format((float) $scheduled_payment->amount, 2),
                $scheduled_payment->currency,
                $error,
                $site_name
            );
        }
        
        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        wp_mail($booking->contact_email, $subject, $message, $headers);
        
        // Also notify admin
        $admin_email = SettingsService::get('admin_email', get_option('admin_email'));
        if ($admin_email && $permanent) {
            $admin_subject = sprintf(__('[%s] Scheduled Payment Failed - %s', 'yatra'), $site_name, $booking->reference);
            $admin_message = sprintf(
                __("A scheduled payment has permanently failed.\n\nBooking: %s\nCustomer: %s (%s)\nAmount: %s %s\nError: %s\n\nPlease follow up with the customer.", 'yatra'),
                $booking->reference,
                $booking->contact_first_name . ' ' . $booking->contact_last_name,
                $booking->contact_email,
                number_format((float) $scheduled_payment->amount, 2),
                $scheduled_payment->currency,
                $error
            );
            wp_mail($admin_email, $admin_subject, $admin_message, $headers);
        }
    }
}

