<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\PaymentGateways\PaymentGatewayRegistry;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\ScheduledPaymentRepository;

/**
 * Payment Gateway REST API Controller
 * 
 * Handles payment gateway operations and payment processing
 */
class PaymentGatewayController extends BaseController
{
    private PaymentGatewayRegistry $registry;
    private BookingRepository $bookingRepository;
    private PaymentRepository $paymentRepository;
    private ScheduledPaymentRepository $scheduledPaymentRepository;

    public function __construct()
    {
        $this->registry = PaymentGatewayRegistry::getInstance();
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
        $this->scheduledPaymentRepository = new ScheduledPaymentRepository();
    }

    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'payment';

        // Get gateway definitions for admin settings
        register_rest_route($namespace, '/' . $base . '/gateways/definitions', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_gateway_definitions'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Get available gateways for checkout
        register_rest_route($namespace, '/' . $base . '/gateways', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_available_gateways'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Save gateway config
        register_rest_route($namespace, '/' . $base . '/gateways/(?P<gateway_id>[a-z_]+)/config', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'save_gateway_config'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Create payment intent
        register_rest_route($namespace, '/' . $base . '/create-intent', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_payment_intent'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Confirm payment
        register_rest_route($namespace, '/' . $base . '/confirm', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'confirm_payment'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Webhook handlers
        register_rest_route($namespace, '/' . $base . '/webhook/(?P<gateway>[a-z_]+)', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'handle_webhook'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Payment callback (for redirect-based payments)
        register_rest_route($namespace, '/' . $base . '/callback/(?P<gateway>[a-z_]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'handle_callback'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Get payment status
        register_rest_route($namespace, '/' . $base . '/status/(?P<booking_id>[\d]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_payment_status'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    /**
     * Check admin permission
     */
    public function check_admin_permission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get gateway definitions for admin settings
     */
    public function get_gateway_definitions(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'gateways' => $this->registry->getDefinitions(),
            'currency' => get_option('yatra_currency', 'USD'),
        ], 200);
    }

    /**
     * Get available gateways for checkout
     */
    public function get_available_gateways(WP_REST_Request $request): WP_REST_Response
    {
        return new WP_REST_Response([
            'gateways' => $this->registry->getForCheckout(),
            'currency' => get_option('yatra_currency', 'USD'),
        ], 200);
    }

    /**
     * Save gateway configuration
     */
    public function save_gateway_config(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $gatewayId = $request->get_param('gateway_id');
        $config = $request->get_json_params();

        $gateway = $this->registry->get($gatewayId);
        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $saved = $gateway->saveConfig($config);

        return new WP_REST_Response([
            'success' => $saved,
            'message' => $saved ? __('Gateway configuration saved', 'yatra') : __('Failed to save configuration', 'yatra'),
        ], $saved ? 200 : 500);
    }

    /**
     * Create payment intent
     */
    public function create_payment_intent(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $gatewayId = sanitize_text_field($request->get_param('gateway'));
        $paymentData = [
            'amount' => (float) $request->get_param('amount'),
            'currency' => sanitize_text_field($request->get_param('currency') ?: get_option('yatra_currency', 'USD')),
            'booking_id' => (int) $request->get_param('booking_id'),
            'trip_id' => (int) $request->get_param('trip_id'),
            'trip_date' => sanitize_text_field($request->get_param('trip_date') ?? ''),
            'customer_email' => sanitize_email($request->get_param('customer_email')),
            'customer_name' => sanitize_text_field($request->get_param('customer_name')),
            'return_url' => esc_url_raw($request->get_param('return_url')),
        ];

        if ($paymentData['amount'] <= 0) {
            return new WP_Error('invalid_amount', __('Invalid payment amount', 'yatra'), ['status' => 400]);
        }

        $result = $this->registry->processPayment($gatewayId, $paymentData);

        if (!$result['success']) {
            return new WP_Error('payment_error', $result['error'] ?? __('Payment failed', 'yatra'), ['status' => 400]);
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * Confirm payment
     */
    public function confirm_payment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $gatewayId = sanitize_text_field($request->get_param('gateway'));
        $transactionId = sanitize_text_field($request->get_param('transaction_id'));
        $bookingId = (int) $request->get_param('booking_id');
        $saveCard = !empty($request->get_param('save_card'));

        $gateway = $this->registry->get($gatewayId);
        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $result = $gateway->verifyPayment($transactionId);

        if ($result['success']) {
            // Get customer and payment method from result
            $customerId = $result['customer_id'] ?? null;
            $paymentMethodId = $result['payment_method_id'] ?? $result['token_id'] ?? $result['vault_id'] ?? null;

            $this->handle_successful_payment(
                $bookingId, 
                $gatewayId, 
                $transactionId, 
                $result['amount'] ?? null, 
                $result['currency'] ?? null,
                $saveCard ? $customerId : null,
                $saveCard ? $paymentMethodId : null
            );
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * Handle webhook
     */
    public function handle_webhook(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $gatewayId = $request->get_param('gateway');
        $gateway = $this->registry->get($gatewayId);

        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $data = $request->get_json_params() ?: [];
        $data['raw_body'] = $request->get_body();
        $data['headers'] = $request->get_headers();

        $result = $gateway->handleWebhook($data);

        return new WP_REST_Response($result, 200);
    }

    /**
     * Handle callback (for redirect-based payments)
     */
    public function handle_callback(WP_REST_Request $request): void
    {
        $gatewayId = $request->get_param('gateway');
        $bookingId = (int) $request->get_param('booking_id');
        $status = $request->get_param('status');

        $gateway = $this->registry->get($gatewayId);

        if (!$gateway) {
            wp_redirect(home_url('/booking-failed/'));
            exit;
        }

        // Get transaction ID from request (varies by gateway)
        $transactionId = $request->get_param('refId') 
            ?? $request->get_param('pidx') 
            ?? $request->get_param('transaction_id') 
            ?? '';

        if ($status === 'success' && !empty($transactionId)) {
            $result = $gateway->verifyPayment($transactionId);

            if ($result['success']) {
                $this->handle_successful_payment($bookingId, $gatewayId, $transactionId);
                wp_redirect(home_url('/booking-success/?booking_id=' . $bookingId));
                exit;
            }
        }

        wp_redirect(home_url('/booking-failed/'));
        exit;
    }

    /**
     * Get payment status
     */
    public function get_payment_status(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $bookingId = (int) $request->get_param('booking_id');

        $payment = $this->paymentRepository->findLatestByBookingId($bookingId);

        if (!$payment) {
            return new WP_Error('payment_not_found', __('Payment not found', 'yatra'), ['status' => 404]);
        }

        return new WP_REST_Response([
            'status' => $payment->status,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'gateway' => $payment->payment_gateway ?? $payment->gateway ?? '',
            'transaction_id' => $payment->transaction_id,
            'created_at' => $payment->created_at,
        ], 200);
    }

    /**
     * Handle successful payment
     */
    private function handle_successful_payment(
        int $bookingId, 
        string $gateway, 
        string $transactionId, 
        ?float $amount = null, 
        ?string $currency = null,
        ?string $customerId = null,
        ?string $paymentMethodId = null
    ): void {
        if ($bookingId <= 0) {
            return;
        }

        // Get booking details
        $booking = $this->bookingRepository->find($bookingId);

        if (!$booking) {
            return;
        }

        $paid_amount = $amount ?? (float) $booking->amount_due;
        $payment_currency = $currency ?? $booking->currency;

        $payment_data = [
            'booking_id' => $bookingId,
            'gateway' => $gateway,
            'transaction_id' => $transactionId,
            'amount' => $paid_amount,
            'currency' => $payment_currency,
            'status' => 'completed',
        ];

        // Create or update payment record
        $this->paymentRepository->create($payment_data);

        // Calculate new amounts
        $new_amount_paid = (float) $booking->amount_paid + $paid_amount;
        $new_amount_due = max(0, (float) $booking->total_amount - $new_amount_paid);

        // Determine payment status
        $payment_status = 'paid';
        if ($new_amount_due > 0) {
            $payment_status = 'partial';
        }

        // Update booking
        $this->bookingRepository->update($bookingId, [
            'amount_paid' => $new_amount_paid,
            'amount_due' => $new_amount_due,
            'payment_status' => $payment_status,
            'status' => 'confirmed',
        ]);

        // Handle scheduled payments for remaining balance
        if ($new_amount_due > 0 && $customerId && $paymentMethodId) {
            $this->createScheduledPaymentsForBooking(
                $bookingId,
                $gateway,
                $customerId,
                $paymentMethodId,
                $new_amount_due,
                $payment_currency
            );
        }

        do_action('yatra_payment_completed', $bookingId, $gateway, $transactionId, [
            'amount' => $paid_amount,
            'remaining' => $new_amount_due,
            'customer_id' => $customerId,
            'payment_method_id' => $paymentMethodId,
        ]);
    }

    /**
     * Create scheduled payments for remaining balance
     */
    private function createScheduledPaymentsForBooking(
        int $bookingId,
        string $gateway,
        string $customerId,
        string $paymentMethodId,
        float $remainingAmount,
        string $currency
    ): void {
        // Get scheduled payment settings
        $settings = \Yatra\Services\SettingsService::getAll();
        
        // Check if auto-scheduled payments is enabled
        if (empty($settings['enable_scheduled_payments'])) {
            return;
        }

        // Save the payment token first
        $tokenId = $this->savePaymentToken($bookingId, $gateway, $customerId, $paymentMethodId);
        
        if (!$tokenId) {
            return;
        }

        // Get schedule configuration from settings
        $schedule = [
            'type' => $settings['scheduled_payment_type'] ?? 'single', // single, installments
            'days_until' => (int) ($settings['scheduled_payment_days'] ?? 15),
            'installments' => (int) ($settings['scheduled_payment_installments'] ?? 1),
            'interval_days' => (int) ($settings['scheduled_payment_interval'] ?? 30),
        ];

        // Create scheduled payments
        \Yatra\Services\ScheduledPaymentService::createScheduledPayments(
            $bookingId,
            $gateway,
            $customerId,
            $tokenId,
            $remainingAmount,
            $currency,
            $schedule
        );
    }

    /**
     * Save payment token for future charges
     */
    private function savePaymentToken(
        int $bookingId,
        string $gateway,
        string $customerId,
        string $paymentMethodId
    ): ?int {
        // Get booking for customer info
        $booking = $this->bookingRepository->find($bookingId);

        if (!$booking) {
            return null;
        }

        $userId = get_current_user_id() ?: 0;

        // Get payment method details from gateway
        $gatewayInstance = $this->registry->get($gateway);
        $cardInfo = [];

        if ($gatewayInstance) {
            $methods = $gatewayInstance->getPaymentMethods($customerId);
            foreach ($methods as $method) {
                if ($method['id'] === $paymentMethodId) {
                    $cardInfo = $method;
                    break;
                }
            }
        }

        // Create token via repository
        $tokenId = $this->scheduledPaymentRepository->createPaymentToken([
            'customer_id' => $userId,
            'user_id' => $userId,
            'gateway' => $gateway,
            'token' => $paymentMethodId,
            'payment_method_id' => $paymentMethodId,
            'card_brand' => $cardInfo['brand'] ?? null,
            'card_last4' => $cardInfo['last4'] ?? null,
            'card_exp_month' => $cardInfo['exp_month'] ?? null,
            'card_exp_year' => $cardInfo['exp_year'] ?? null,
            'is_default' => 1,
        ]);

        return $tokenId ?: null;
    }
}
