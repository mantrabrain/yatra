<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Stripe;

use Yatra\PaymentGateways\AbstractPaymentGateway;

class StripeGateway extends AbstractPaymentGateway
{
    protected string $id = 'stripe';
    protected string $title = 'Stripe';
    protected string $description = 'Accept credit and debit cards via Stripe';
    protected string $icon = 'icon.svg';
    protected array $supports = ['credit_card', 'debit_card', 'refunds', 'recurring', 'subscriptions', 'scheduled_payments'];

    private string $apiBase = 'https://api.stripe.com/v1';
    
    /**
     * Subscription/Recurring payment is handled by STRIPE, not by Yatra.
     * We create a Stripe Subscription or Payment Schedule, and Stripe charges the customer.
     * Yatra receives webhooks about payment success/failure.
     */

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'api_key',
                'type' => 'text',
                'label' => __('Publishable Key', 'yatra'),
                'description' => __('Your Stripe publishable API key', 'yatra'),
                'placeholder' => 'pk_test_...',
                'default' => '',
            ],
            [
                'id' => 'api_secret',
                'type' => 'password',
                'label' => __('Secret Key', 'yatra'),
                'description' => __('Your Stripe secret API key (keep this secure)', 'yatra'),
                'placeholder' => 'sk_test_...',
                'default' => '',
            ],
            [
                'id' => 'webhook_secret',
                'type' => 'password',
                'label' => __('Webhook Secret', 'yatra'),
                'description' => __('Stripe webhook signing secret for payment verification', 'yatra'),
                'placeholder' => 'whsec_...',
                'default' => '',
            ],
            [
                'id' => 'test_mode',
                'type' => 'checkbox',
                'label' => __('Test Mode', 'yatra'),
                'description' => __('Use test API keys for development', 'yatra'),
                'default' => true,
            ],
            [
                'id' => 'save_cards',
                'type' => 'checkbox',
                'label' => __('Allow Saving Cards', 'yatra'),
                'description' => __('Allow customers to save cards for future payments and recurring charges', 'yatra'),
                'default' => true,
            ],
        ];
    }

    /**
     * Process initial payment with option to save card
     */
    public function processPayment(array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = strtolower($paymentData['currency'] ?? 'usd');
        $bookingId = $paymentData['booking_id'] ?? 0;
        $customerEmail = $paymentData['customer_email'] ?? '';
        $customerName = $paymentData['customer_name'] ?? '';
        $saveCard = !empty($paymentData['save_card']) && !empty($this->config['save_cards']);
        $customerId = $paymentData['stripe_customer_id'] ?? null;

        // Create or get customer if saving card
        if ($saveCard && !$customerId && $customerEmail) {
            $customerResult = $this->createCustomer([
                'email' => $customerEmail,
                'name' => $customerName,
                'metadata' => ['booking_id' => $bookingId],
            ]);
            
            if ($customerResult['success']) {
                $customerId = $customerResult['customer_id'];
            }
        }

        $body = [
            'amount' => $amount,
            'currency' => $currency,
            'metadata[booking_id]' => $bookingId,
            'receipt_email' => $customerEmail,
            'automatic_payment_methods[enabled]' => 'true',
        ];

        if ($customerId) {
            $body['customer'] = $customerId;
            if ($saveCard) {
                $body['setup_future_usage'] = 'off_session'; // Allow future charges
            }
        }

        $response = $this->makeRequest("{$this->apiBase}/payment_intents", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => $body,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to create payment intent', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'client_secret' => $response['body']['client_secret'],
            'payment_intent_id' => $response['body']['id'],
            'publishable_key' => $this->config['api_key'] ?? '',
            'customer_id' => $customerId,
            'save_card' => $saveCard,
        ];
    }

    /**
     * Create a Stripe customer
     */
    public function createCustomer(array $customerData): array
    {
        $body = [
            'email' => $customerData['email'] ?? '',
            'name' => $customerData['name'] ?? '',
        ];

        if (!empty($customerData['metadata'])) {
            foreach ($customerData['metadata'] as $key => $value) {
                $body["metadata[{$key}]"] = $value;
            }
        }

        $response = $this->makeRequest("{$this->apiBase}/customers", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => $body,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to create customer', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'customer_id' => $response['body']['id'],
            'data' => $response['body'],
        ];
    }

    /**
     * Save payment method for future use
     */
    public function savePaymentMethod(string $customerId, array $paymentMethodData): array
    {
        $paymentMethodId = $paymentMethodData['payment_method_id'] ?? '';
        
        if (empty($paymentMethodId)) {
            return [
                'success' => false,
                'error' => __('Payment method ID is required', 'yatra'),
            ];
        }

        // Attach payment method to customer
        $response = $this->makeRequest("{$this->apiBase}/payment_methods/{$paymentMethodId}/attach", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => ['customer' => $customerId],
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['body']['error']['message'] ?? __('Failed to save payment method', 'yatra'),
            ];
        }

        $pm = $response['body'];

        // Set as default if requested
        if (!empty($paymentMethodData['set_default'])) {
            $this->makeRequest("{$this->apiBase}/customers/{$customerId}", [
                'method' => 'POST',
                'headers' => $this->getHeaders(),
                'body' => [
                    'invoice_settings[default_payment_method]' => $paymentMethodId,
                ],
            ]);
        }

        return [
            'success' => true,
            'payment_method_id' => $pm['id'],
            'card_brand' => $pm['card']['brand'] ?? null,
            'card_last4' => $pm['card']['last4'] ?? null,
            'card_exp_month' => $pm['card']['exp_month'] ?? null,
            'card_exp_year' => $pm['card']['exp_year'] ?? null,
            'type' => $pm['type'] ?? 'card',
        ];
    }

    /**
     * Charge a saved payment method (for scheduled payments)
     */
    public function chargePaymentMethod(string $customerId, string $paymentMethodId, array $paymentData): array
    {
        $amount = (int) (($paymentData['amount'] ?? 0) * 100);
        $currency = strtolower($paymentData['currency'] ?? 'usd');

        $body = [
            'amount' => $amount,
            'currency' => $currency,
            'customer' => $customerId,
            'payment_method' => $paymentMethodId,
            'off_session' => 'true',
            'confirm' => 'true',
        ];

        if (!empty($paymentData['description'])) {
            $body['description'] = $paymentData['description'];
        }

        if (!empty($paymentData['metadata'])) {
            foreach ($paymentData['metadata'] as $key => $value) {
                $body["metadata[{$key}]"] = $value;
            }
        }

        if (!empty($paymentData['booking_id'])) {
            $body['metadata[booking_id]'] = $paymentData['booking_id'];
        }

        $response = $this->makeRequest("{$this->apiBase}/payment_intents", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => $body,
        ]);

        if (!$response['success']) {
            $error = $response['body']['error'] ?? [];
            
            // Handle specific error cases
            if (($error['code'] ?? '') === 'authentication_required') {
                return [
                    'success' => false,
                    'requires_action' => true,
                    'error' => __('Payment requires customer authentication', 'yatra'),
                    'client_secret' => $error['payment_intent']['client_secret'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => $error['message'] ?? __('Payment failed', 'yatra'),
            ];
        }

        $pi = $response['body'];

        if ($pi['status'] === 'succeeded') {
            return [
                'success' => true,
                'transaction_id' => $pi['id'],
                'amount' => $pi['amount'] / 100,
                'currency' => strtoupper($pi['currency']),
                'status' => 'completed',
            ];
        }

        if ($pi['status'] === 'requires_action' || $pi['status'] === 'requires_confirmation') {
            return [
                'success' => false,
                'requires_action' => true,
                'error' => __('Payment requires additional action', 'yatra'),
                'client_secret' => $pi['client_secret'],
            ];
        }

        return [
            'success' => false,
            'error' => __('Payment was not successful', 'yatra'),
            'status' => $pi['status'],
        ];
    }

    /**
     * Create a Stripe Subscription for scheduled payments
     * STRIPE handles all charging - Yatra just receives webhooks
     * 
     * @param string $customerId Stripe customer ID
     * @param string $paymentMethodId Default payment method
     * @param array $scheduleData Schedule configuration
     * @return array Result with subscription_id
     */
    public function createSubscriptionSchedule(string $customerId, string $paymentMethodId, array $scheduleData): array
    {
        $amount = (int) (($scheduleData['amount'] ?? 0) * 100);
        $currency = strtolower($scheduleData['currency'] ?? 'usd');
        $startDate = strtotime($scheduleData['start_date'] ?? '+15 days');
        $bookingId = $scheduleData['booking_id'] ?? 0;
        $installments = (int) ($scheduleData['installments'] ?? 1);
        $intervalDays = (int) ($scheduleData['interval_days'] ?? 30);

        // Create a Price for this specific payment (one-time price)
        $priceResponse = $this->makeRequest("{$this->apiBase}/prices", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'unit_amount' => $amount,
                'currency' => $currency,
                'recurring[interval]' => 'day',
                'recurring[interval_count]' => $intervalDays,
                'product_data[name]' => sprintf(__('Booking %s - Scheduled Payment', 'yatra'), $bookingId),
                'metadata[booking_id]' => $bookingId,
            ],
        ]);

        if (!$priceResponse['success']) {
            return [
                'success' => false,
                'error' => $priceResponse['body']['error']['message'] ?? __('Failed to create price', 'yatra'),
            ];
        }

        $priceId = $priceResponse['body']['id'];

        // Set customer's default payment method
        $this->makeRequest("{$this->apiBase}/customers/{$customerId}", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'invoice_settings[default_payment_method]' => $paymentMethodId,
            ],
        ]);

        // Create Subscription Schedule (for deferred start and limited iterations)
        $scheduleResponse = $this->makeRequest("{$this->apiBase}/subscription_schedules", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'customer' => $customerId,
                'start_date' => $startDate,
                'end_behavior' => 'cancel', // Cancel after all phases complete
                'default_settings[default_payment_method]' => $paymentMethodId,
                'default_settings[collection_method]' => 'charge_automatically',
                'phases[0][items][0][price]' => $priceId,
                'phases[0][items][0][quantity]' => 1,
                'phases[0][iterations]' => $installments, // Number of payments
                'metadata[booking_id]' => $bookingId,
                'metadata[payment_type]' => $scheduleData['payment_type'] ?? 'scheduled',
            ],
        ]);

        if (!$scheduleResponse['success']) {
            return [
                'success' => false,
                'error' => $scheduleResponse['body']['error']['message'] ?? __('Failed to create subscription schedule', 'yatra'),
            ];
        }

        $schedule = $scheduleResponse['body'];

        return [
            'success' => true,
            'schedule_id' => $schedule['id'],
            'subscription_id' => $schedule['subscription'] ?? null,
            'status' => $schedule['status'],
            'start_date' => date('Y-m-d H:i:s', $startDate),
            'phases' => $schedule['phases'] ?? [],
        ];
    }

    /**
     * Create a single future payment using Stripe Invoicing
     * Stripe charges the customer automatically on the due date
     */
    public function createScheduledInvoice(string $customerId, string $paymentMethodId, array $invoiceData): array
    {
        $amount = (int) (($invoiceData['amount'] ?? 0) * 100);
        $currency = strtolower($invoiceData['currency'] ?? 'usd');
        $dueDate = strtotime($invoiceData['due_date'] ?? '+15 days');
        $bookingId = $invoiceData['booking_id'] ?? 0;
        $description = $invoiceData['description'] ?? sprintf(__('Payment for Booking #%s', 'yatra'), $bookingId);

        // Set customer's default payment method
        $this->makeRequest("{$this->apiBase}/customers/{$customerId}", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'invoice_settings[default_payment_method]' => $paymentMethodId,
            ],
        ]);

        // Create Invoice Item
        $itemResponse = $this->makeRequest("{$this->apiBase}/invoiceitems", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'customer' => $customerId,
                'amount' => $amount,
                'currency' => $currency,
                'description' => $description,
                'metadata[booking_id]' => $bookingId,
            ],
        ]);

        if (!$itemResponse['success']) {
            return [
                'success' => false,
                'error' => $itemResponse['body']['error']['message'] ?? __('Failed to create invoice item', 'yatra'),
            ];
        }

        // Create Invoice
        $invoiceResponse = $this->makeRequest("{$this->apiBase}/invoices", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'customer' => $customerId,
                'collection_method' => 'charge_automatically',
                'auto_advance' => 'true',
                'due_date' => $dueDate,
                'default_payment_method' => $paymentMethodId,
                'metadata[booking_id]' => $bookingId,
                'metadata[payment_type]' => $invoiceData['payment_type'] ?? 'scheduled',
            ],
        ]);

        if (!$invoiceResponse['success']) {
            return [
                'success' => false,
                'error' => $invoiceResponse['body']['error']['message'] ?? __('Failed to create invoice', 'yatra'),
            ];
        }

        $invoice = $invoiceResponse['body'];

        // Finalize the invoice (makes it ready for payment)
        $finalizeResponse = $this->makeRequest("{$this->apiBase}/invoices/{$invoice['id']}/finalize", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => true,
            'invoice_id' => $invoice['id'],
            'invoice_number' => $finalizeResponse['body']['number'] ?? $invoice['number'] ?? null,
            'status' => $finalizeResponse['body']['status'] ?? $invoice['status'],
            'due_date' => date('Y-m-d H:i:s', $dueDate),
            'amount' => $amount / 100,
            'currency' => strtoupper($currency),
            'hosted_invoice_url' => $finalizeResponse['body']['hosted_invoice_url'] ?? null,
        ];
    }

    /**
     * Cancel a subscription schedule
     */
    public function cancelSubscriptionSchedule(string $scheduleId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/subscription_schedules/{$scheduleId}/cancel", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => $response['success'],
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }

    /**
     * Cancel a subscription
     */
    public function cancelSubscription(string $subscriptionId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/subscriptions/{$subscriptionId}", [
            'method' => 'DELETE',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => $response['success'],
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }

    /**
     * Void an unpaid invoice
     */
    public function voidInvoice(string $invoiceId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/invoices/{$invoiceId}/void", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => $response['success'],
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }

    /**
     * Get customer's saved payment methods
     */
    public function getPaymentMethods(string $customerId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/payment_methods", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
            'body' => [
                'customer' => $customerId,
                'type' => 'card',
            ],
        ]);

        if (!$response['success']) {
            return [];
        }

        $methods = [];
        foreach ($response['body']['data'] ?? [] as $pm) {
            $methods[] = [
                'id' => $pm['id'],
                'type' => $pm['type'],
                'brand' => $pm['card']['brand'] ?? null,
                'last4' => $pm['card']['last4'] ?? null,
                'exp_month' => $pm['card']['exp_month'] ?? null,
                'exp_year' => $pm['card']['exp_year'] ?? null,
            ];
        }

        return $methods;
    }

    /**
     * Delete a saved payment method
     */
    public function deletePaymentMethod(string $paymentMethodId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/payment_methods/{$paymentMethodId}/detach", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
        ]);

        return [
            'success' => $response['success'],
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        $response = $this->makeRequest("{$this->apiBase}/payment_intents/{$transactionId}", [
            'method' => 'GET',
            'headers' => $this->getHeaders(),
        ]);

        if (!$response['success']) {
            return ['success' => false, 'error' => 'Verification failed'];
        }

        $pi = $response['body'];
        
        // Check for saved payment method
        $paymentMethodId = null;
        if (!empty($pi['payment_method'])) {
            $paymentMethodId = $pi['payment_method'];
        }

        return [
            'success' => $pi['status'] === 'succeeded',
            'status' => $pi['status'],
            'amount' => ($pi['amount'] ?? 0) / 100,
            'currency' => strtoupper($pi['currency'] ?? 'USD'),
            'customer_id' => $pi['customer'] ?? null,
            'payment_method_id' => $paymentMethodId,
        ];
    }

    public function processRefund(string $transactionId, float $amount): array
    {
        $response = $this->makeRequest("{$this->apiBase}/refunds", [
            'method' => 'POST',
            'headers' => $this->getHeaders(),
            'body' => [
                'payment_intent' => $transactionId,
                'amount' => (int) ($amount * 100),
            ],
        ]);

        return [
            'success' => $response['success'],
            'refund_id' => $response['body']['id'] ?? null,
            'error' => $response['body']['error']['message'] ?? null,
        ];
    }

    /**
     * Handle Stripe webhook
     */
    public function handleWebhook(array $data): array
    {
        $payload = $data['raw_body'] ?? '';
        $sigHeader = $data['headers']['stripe_signature'][0] ?? '';
        $webhookSecret = $this->config['webhook_secret'] ?? '';

        // Verify webhook signature if secret is configured
        if ($webhookSecret && $sigHeader) {
            $timestamp = null;
            $signature = null;

            foreach (explode(',', $sigHeader) as $item) {
                [$key, $value] = explode('=', $item, 2);
                if ($key === 't') $timestamp = $value;
                if ($key === 'v1') $signature = $value;
            }

            if ($timestamp && $signature) {
                $signedPayload = "{$timestamp}.{$payload}";
                $expectedSignature = hash_hmac('sha256', $signedPayload, $webhookSecret);
                
                if (!hash_equals($expectedSignature, $signature)) {
                    $this->log('Webhook signature verification failed');
                    return ['success' => false, 'error' => 'Invalid signature'];
                }
            }
        }

        $event = json_decode($payload, true);
        $eventType = $event['type'] ?? '';
        $object = $event['data']['object'] ?? [];

        // Handle webhook events - STRIPE charges customer, we just update our records
        switch ($eventType) {
            // Direct payment succeeded
            case 'payment_intent.succeeded':
                do_action('yatra_stripe_payment_succeeded', $object);
                break;
                
            case 'payment_intent.payment_failed':
                do_action('yatra_stripe_payment_failed', $object);
                break;
            
            // Invoice events - THIS IS WHERE SCHEDULED PAYMENTS ARE TRACKED
            case 'invoice.paid':
                // Invoice was successfully paid - update booking
                $this->handleInvoicePaid($object);
                do_action('yatra_stripe_invoice_paid', $object);
                break;
                
            case 'invoice.payment_failed':
                // Invoice payment failed - notify customer
                $this->handleInvoicePaymentFailed($object);
                do_action('yatra_stripe_invoice_payment_failed', $object);
                break;
                
            case 'invoice.upcoming':
                // Invoice will be charged soon - send reminder
                do_action('yatra_stripe_invoice_upcoming', $object);
                break;
                
            // Subscription events
            case 'customer.subscription.created':
                do_action('yatra_stripe_subscription_created', $object);
                break;
                
            case 'customer.subscription.updated':
                do_action('yatra_stripe_subscription_updated', $object);
                break;
                
            case 'customer.subscription.deleted':
                $this->handleSubscriptionCancelled($object);
                do_action('yatra_stripe_subscription_deleted', $object);
                break;
                
            // Subscription schedule events
            case 'subscription_schedule.completed':
                do_action('yatra_stripe_schedule_completed', $object);
                break;
                
            case 'subscription_schedule.canceled':
                do_action('yatra_stripe_schedule_canceled', $object);
                break;
        }

        return ['success' => true, 'event_type' => $eventType];
    }

    /**
     * Handle invoice paid webhook - update booking payment status
     */
    private function handleInvoicePaid(array $invoice): void
    {
        global $wpdb;
        
        $bookingId = (int) ($invoice['metadata']['booking_id'] ?? 0);
        if ($bookingId <= 0) {
            return;
        }

        $amount = ($invoice['amount_paid'] ?? 0) / 100;
        $transactionId = $invoice['payment_intent'] ?? $invoice['id'];
        
        // Create payment record
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        $wpdb->insert(
            $payments_table,
            [
                'booking_id' => $bookingId,
                'transaction_id' => $transactionId,
                'gateway' => 'stripe',
                'amount' => $amount,
                'currency' => strtoupper($invoice['currency'] ?? 'USD'),
                'status' => 'completed',
                'payment_type' => $invoice['metadata']['payment_type'] ?? 'scheduled',
                'gateway_response' => wp_json_encode($invoice),
                'notes' => __('Automatically charged by Stripe', 'yatra'),
                'processed_at' => current_time('mysql'),
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        // Update booking amounts
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$bookings_table} WHERE id = %d",
            $bookingId
        ));

        if ($booking) {
            $new_amount_paid = (float) $booking->amount_paid + $amount;
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
                ['id' => $bookingId],
                ['%f', '%f', '%s', '%s'],
                ['%d']
            );

            // Update scheduled payment record if exists
            $scheduled_table = $wpdb->prefix . 'yatra_scheduled_payments';
            $wpdb->update(
                $scheduled_table,
                [
                    'status' => 'completed',
                    'updated_at' => current_time('mysql'),
                ],
                [
                    'booking_id' => $bookingId,
                    'gateway' => 'stripe',
                    'status' => 'pending',
                ],
                ['%s', '%s'],
                ['%d', '%s', '%s']
            );
        }
    }

    /**
     * Handle invoice payment failed webhook
     */
    private function handleInvoicePaymentFailed(array $invoice): void
    {
        global $wpdb;
        
        $bookingId = (int) ($invoice['metadata']['booking_id'] ?? 0);
        if ($bookingId <= 0) {
            return;
        }

        // Update scheduled payment record
        $scheduled_table = $wpdb->prefix . 'yatra_scheduled_payments';
        $wpdb->query($wpdb->prepare(
            "UPDATE {$scheduled_table} 
             SET status = 'failed', 
                 last_error = %s, 
                 last_attempt_at = %s,
                 attempt_count = attempt_count + 1,
                 updated_at = %s
             WHERE booking_id = %d AND gateway = 'stripe' AND status = 'pending'",
            $invoice['last_finalization_error']['message'] ?? __('Payment failed', 'yatra'),
            current_time('mysql'),
            current_time('mysql'),
            $bookingId
        ));

        // Get booking info for notification
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$bookings_table} WHERE id = %d",
            $bookingId
        ));

        if ($booking && $booking->contact_email) {
            // Send notification email
            $site_name = get_bloginfo('name');
            $subject = sprintf(__('[%s] Payment Failed - Action Required', 'yatra'), $site_name);
            $message = sprintf(
                __("Hello %s,\n\nWe were unable to process your scheduled payment for booking %s.\n\nAmount: %s %s\nError: %s\n\nStripe will automatically retry the payment. If you'd like to update your payment method, please contact us.\n\nBest regards,\n%s", 'yatra'),
                $booking->contact_first_name,
                $booking->reference,
                number_format(($invoice['amount_due'] ?? 0) / 100, 2),
                strtoupper($invoice['currency'] ?? 'USD'),
                $invoice['last_finalization_error']['message'] ?? __('Payment declined', 'yatra'),
                $site_name
            );
            
            wp_mail($booking->contact_email, $subject, $message, ['Content-Type: text/plain; charset=UTF-8']);
        }
    }

    /**
     * Handle subscription cancelled webhook
     */
    private function handleSubscriptionCancelled(array $subscription): void
    {
        global $wpdb;
        
        $bookingId = (int) ($subscription['metadata']['booking_id'] ?? 0);
        if ($bookingId <= 0) {
            return;
        }

        // Mark all pending scheduled payments as cancelled
        $scheduled_table = $wpdb->prefix . 'yatra_scheduled_payments';
        $wpdb->update(
            $scheduled_table,
            [
                'status' => 'cancelled',
                'notes' => __('Subscription cancelled in Stripe', 'yatra'),
                'updated_at' => current_time('mysql'),
            ],
            [
                'booking_id' => $bookingId,
                'gateway' => 'stripe',
                'status' => 'pending',
            ],
            ['%s', '%s', '%s'],
            ['%d', '%s', '%s']
        );
    }

    /**
     * Get API headers
     */
    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . ($this->config['api_secret'] ?? ''),
            'Content-Type' => 'application/x-www-form-urlencoded',
        ];
    }
}

