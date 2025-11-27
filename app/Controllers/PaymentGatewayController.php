<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\PaymentGateways\PaymentGatewayRegistry;

/**
 * Payment Gateway REST API Controller
 * 
 * Handles payment gateway operations and payment processing
 */
class PaymentGatewayController extends BaseController
{
    private PaymentGatewayRegistry $registry;
    private string $payments_table;
    private string $bookings_table;

    public function __construct()
    {
        global $wpdb;
        $this->payments_table = $wpdb->prefix . 'yatra_payments';
        $this->bookings_table = $wpdb->prefix . 'yatra_bookings';
        $this->registry = PaymentGatewayRegistry::getInstance();
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

        $gateway = $this->registry->get($gatewayId);
        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $result = $gateway->verifyPayment($transactionId);

        if ($result['success']) {
            $this->handle_successful_payment($bookingId, $gatewayId, $transactionId, $result['amount'] ?? null, $result['currency'] ?? null);
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
        global $wpdb;

        $bookingId = (int) $request->get_param('booking_id');

        $payment = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->payments_table} WHERE booking_id = %d ORDER BY id DESC LIMIT 1",
            $bookingId
        ));

        if (!$payment) {
            return new WP_Error('payment_not_found', __('Payment not found', 'yatra'), ['status' => 404]);
        }

        return new WP_REST_Response([
            'status' => $payment->status,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'gateway' => $payment->payment_gateway,
            'transaction_id' => $payment->transaction_id,
            'created_at' => $payment->created_at,
        ], 200);
    }

    /**
     * Handle successful payment
     */
    private function handle_successful_payment(int $bookingId, string $gateway, string $transactionId, ?float $amount = null, ?string $currency = null): void
    {
        global $wpdb;

        if ($bookingId <= 0) {
            return;
        }

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->payments_table} WHERE booking_id = %d AND payment_gateway = %s",
            $bookingId, $gateway
        ));

        $payment_data = [
            'status' => 'completed',
            'transaction_id' => $transactionId,
            'paid_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];

        if ($amount !== null) {
            $payment_data['amount'] = $amount;
        }
        if ($currency !== null) {
            $payment_data['currency'] = $currency;
        }

        if ($existing) {
            $wpdb->update($this->payments_table, $payment_data, ['id' => $existing->id]);
        } else {
            $payment_data['booking_id'] = $bookingId;
            $payment_data['payment_gateway'] = $gateway;
            $payment_data['created_at'] = current_time('mysql');
            $wpdb->insert($this->payments_table, $payment_data);
        }

        // Update booking status
        $wpdb->update(
            $this->bookings_table,
            [
                'payment_status' => 'paid',
                'status' => 'confirmed',
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $bookingId]
        );

        do_action('yatra_payment_completed', $bookingId, $gateway, $transactionId);
    }
}
