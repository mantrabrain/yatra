<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\PaymentGateways\PaymentGatewayRegistry;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Helpers\FormatHelper;
use Yatra\Services\PdfService;
use Yatra\Services\SettingsService;

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
    private TripRepository $tripRepository;

    public function __construct()
    {
        $this->registry = PaymentGatewayRegistry::getInstance();
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
        $this->tripRepository = new TripRepository();
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

        register_rest_route($namespace, '/' . $base . '/remaining', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_remaining_balance_intent'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        register_rest_route($namespace, '/' . $base . '/remaining/session', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'start_remaining_payment_session'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        // Download invoice for a payment
        register_rest_route($namespace, '/' . $base . '/(?P<payment_id>[\d]+)/invoice', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'download_invoice'],
                'permission_callback' => '__return_true', // Auth checked inside callback
            ],
        ]);

        // Download travel voucher for a payment
        register_rest_route($namespace, '/' . $base . '/(?P<payment_id>[\d]+)/voucher', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'download_voucher'],
                'permission_callback' => '__return_true', // Auth checked inside callback
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

    public function check_customer_permission(): bool
    {
        return is_user_logged_in();
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

    public function create_remaining_balance_intent(WP_REST_Request $request)
    {
        $bookingId = (int) $request->get_param('booking_id');
        $method = sanitize_text_field($request->get_param('method') ?: 'stripe');

        if ($bookingId <= 0) {
            return new WP_Error('invalid_booking', __('Invalid booking ID provided.', 'yatra'), ['status' => 400]);
        }

        $booking = $this->bookingRepository->find($bookingId);

        if (!$booking) {
            return new WP_Error('booking_not_found', __('Booking not found.', 'yatra'), ['status' => 404]);
        }

        $currentUser = get_current_user_id();
        if (!$currentUser || (int) $booking->user_id !== $currentUser) {
            return new WP_Error('forbidden', __('You do not have permission to pay for this booking.', 'yatra'), ['status' => 403]);
        }

        $remainingAmount = (float) ($booking->amount_due ?? ($booking->total_amount - $booking->amount_paid));

        if ($remainingAmount <= 0) {
            return new WP_Error('no_balance_due', __('This booking is already fully paid.', 'yatra'), ['status' => 400]);
        }

        $customerEmail = $booking->contact_email ?? ($booking->customer_email ?? '');
        $customerName = trim(($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? ''));

        $paymentData = [
            'amount' => $remainingAmount,
            'currency' => $booking->currency ?? get_option('yatra_currency', 'USD'),
            'booking_id' => $bookingId,
            'customer_email' => $customerEmail,
            'customer_name' => $customerName ?: $customerEmail,
            'return_url' => $this->getConfirmationUrl($booking->reference ?? (string) $bookingId),
            'description' => sprintf(__('Remaining balance for Booking #%s', 'yatra'), $booking->reference ?? $bookingId),
            'cancel_url' => home_url('/my-account?tab=payments&payment=cancelled'),
        ];

        $result = $this->registry->processPayment($method, $paymentData);

        if (!$result['success']) {
            $message = $result['error'] ?? $result['message'] ?? __('Unable to initiate payment.', 'yatra');
            return new WP_Error('payment_error', $message, ['status' => 400]);
        }

        return new WP_REST_Response([ 'success' => true, 'data' => $result ], 200);
    }

    public function start_remaining_payment_session(WP_REST_Request $request)
    {
        if (!function_exists('yatra_start_session')) {
            return new WP_Error('session_unavailable', __('Booking session helpers not loaded.', 'yatra'), ['status' => 500]);
        }

        yatra_start_session();

        $bookingId = (int) $request->get_param('booking_id');

        if ($bookingId <= 0) {
            return new WP_Error('invalid_booking', __('Invalid booking ID provided.', 'yatra'), ['status' => 400]);
        }

        $booking = $this->bookingRepository->findWithTrip($bookingId);

        if (!$booking) {
            return new WP_Error('booking_not_found', __('Booking not found.', 'yatra'), ['status' => 404]);
        }

        $currentUser = get_current_user_id();

        if (!$currentUser || (int) $booking->user_id !== $currentUser) {
            return new WP_Error('forbidden', __('You do not have permission to pay for this booking.', 'yatra'), ['status' => 403]);
        }

        $remainingAmount = (float) ($booking->amount_due ?? ($booking->total_amount - $booking->amount_paid));

        if ($remainingAmount <= 0) {
            return new WP_Error('no_balance_due', __('This booking is already fully paid.', 'yatra'), ['status' => 400]);
        }

        $trip = $this->tripRepository->findPublished((int) $booking->trip_id);

        if (!$trip) {
            return new WP_Error('trip_not_found', __('Trip associated with this booking is unavailable.', 'yatra'), ['status' => 400]);
        }

        $currency = $booking->currency ?? SettingsService::getCurrency();
        $travelersCount = (int) ($booking->travelers_count ?? $booking->travelers ?? 1);
        $travelersCount = max(1, $travelersCount);
        $pricePerPerson = $travelersCount > 0 ? ((float) $booking->total_amount / $travelersCount) : (float) $trip->sale_price;

        // Use dedicated remaining session (separate from booking session)
        $remainingSessionData = [
            'booking_id' => (int) $booking->id,
            'booking_reference' => $booking->reference ?? '',
            'trip_id' => (int) $trip->id,
            'trip_title' => $trip->title,
            'trip_slug' => $trip->slug,
            'trip_price' => $pricePerPerson,
            'trip_featured_image' => $trip->featured_image ?? '',
            'currency' => $currency,
            'travel_date' => $booking->travel_date,
            'travelers' => $travelersCount,
            'remaining_amount' => $remainingAmount,
            'amount_paid' => (float) ($booking->amount_paid ?? 0),
            'total_amount' => (float) ($booking->total_amount ?? 0),
            'contact_first_name' => $booking->contact_first_name ?? '',
            'contact_last_name' => $booking->contact_last_name ?? '',
            'contact_email' => $booking->contact_email ?? $booking->customer_email ?? '',
            'contact_phone' => $booking->contact_phone ?? $booking->customer_phone ?? '',
        ];

        // Clear any existing booking session to avoid confusion
        yatra_clear_booking_session();
        // Set the remaining payment session
        yatra_set_remaining_session($remainingSessionData);

        $checkoutUrl = yatra_get_checkout_url();
        // Custom booking page is a normal WP page: pass trip slug so embedded booking UI can resolve the trip.
        if (!empty($trip->slug) && SettingsService::useCustomBookingPage()) {
            $checkoutUrl = add_query_arg('trip', rawurlencode((string) $trip->slug), $checkoutUrl);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'checkout_url' => $checkoutUrl,
                'booking_reference' => $booking->reference ?? '',
                'return_url' => $this->getConfirmationUrl($booking->reference ?? ''),
            ],
        ]);
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
    public function save_gateway_config(WP_REST_Request $request)
    {
        $gatewayId = $request->get_param('gateway_id');
        $config = $request->get_json_params();

        $gateway = $this->registry->get($gatewayId);
        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $saved = $gateway->saveConfig($config);

        if ($saved) {
            /**
             * Fires after a payment gateway configuration is saved (telemetry / integrations).
             *
             * @param string               $gatewayId Gateway id.
             * @param array<string, mixed> $config    Sanitized-bound request body.
             */
            do_action('yatra_payment_gateway_config_saved', (string) $gatewayId, is_array($config) ? $config : []);
        }

        return new WP_REST_Response([
            'success' => $saved,
            'message' => $saved ? __('Gateway configuration saved', 'yatra') : __('Failed to save configuration', 'yatra'),
        ], $saved ? 200 : 500);
    }

    /**
     * Create payment intent
     */
    public function create_payment_intent(WP_REST_Request $request)
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

        // Enrich payment data with booking context (reference, trip title, cancel URL)
        if ($paymentData['booking_id'] > 0) {
            $booking = $this->bookingRepository->find($paymentData['booking_id']);
            if ($booking) {
                $paymentData['reference'] = $booking->reference ?? '';
                $paymentData['trip_title'] = $booking->trip_title ?? '';
                if (empty($paymentData['trip_id'])) {
                    $paymentData['trip_id'] = (int) ($booking->trip_id ?? 0);
                }
            }
        }

        if (empty($paymentData['return_url'])) {
            $reference = $paymentData['reference'] ?? (string) $paymentData['booking_id'];
            $paymentData['return_url'] = add_query_arg('payment', 'success', $this->getConfirmationUrl($reference));
        }

        $cancelParam = esc_url_raw($request->get_param('cancel_url'));
        $paymentData['cancel_url'] = $cancelParam ?: home_url('/book/?payment=cancelled&ref=' . ($paymentData['reference'] ?? $paymentData['booking_id']));

        if ($paymentData['amount'] <= 0) {
            return new WP_Error('invalid_amount', __('Invalid payment amount', 'yatra'), ['status' => 400]);
        }

        $result = $this->registry->processPayment($gatewayId, $paymentData);

        if (!$result['success']) {
            $errorMessage = $result['error'] ?? $result['message'] ?? __('Payment failed', 'yatra');
            return new WP_Error('payment_error', $errorMessage, ['status' => 400]);
        }

        return new WP_REST_Response($result, 200);
    }

    private function getConfirmationUrl(string $reference): string
    {
        return yatra_get_booking_confirmation_url($reference);
    }

    /**
     * Confirm payment
     */
    public function confirm_payment(WP_REST_Request $request)
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

            $passForSchedule = (bool) apply_filters(
                'yatra_pass_gateway_ids_for_scheduled_payments',
                $saveCard,
                $result,
                $bookingId
            );

            $this->handle_successful_payment(
                $bookingId, 
                $gatewayId, 
                $transactionId, 
                $result['amount'] ?? null, 
                $result['currency'] ?? null,
                ($saveCard || $passForSchedule) ? $customerId : null,
                ($saveCard || $passForSchedule) ? $paymentMethodId : null
            );
        }

        return new WP_REST_Response($result, 200);
    }

    /**
     * Handle webhook
     */
    public function handle_webhook(WP_REST_Request $request)
    {
        $gatewayId = $request->get_param('gateway');
        $gateway = $this->registry->get($gatewayId);

        if (!$gateway) {
            return new WP_Error('invalid_gateway', __('Gateway not found', 'yatra'), ['status' => 404]);
        }

        $data = $request->get_json_params() ?: [];
        $data['raw_body'] = $request->get_body();
        $data['headers'] = $request->get_headers();
        $data['post_data'] = $request->get_body_params(); // For form-encoded data (like PayPal IPN)

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
    public function get_payment_status(WP_REST_Request $request)
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
     * Record a completed charge against an existing booking (initial or remaining balance).
     * Does not create bookings — only PaymentRepository::create + booking amount/status updates.
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
            'customer_id' => $booking->customer_id ? (int) $booking->customer_id : null,
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

        $previousBookingStatus = (string) ($booking->status ?? 'pending');

        // Update booking
        $this->bookingRepository->update($bookingId, [
            'amount_paid' => $new_amount_paid,
            'amount_due' => $new_amount_due,
            'payment_status' => $payment_status,
            'status' => 'confirmed',
        ]);

        \yatra_trigger_booking_confirmed($bookingId, $previousBookingStatus);

        // Clear remaining payment session if this was a remaining payment
        if (function_exists('yatra_has_remaining_session') && yatra_has_remaining_session()) {
            yatra_clear_remaining_session();
        }

        do_action('yatra_payment_completed', $bookingId, $gateway, $transactionId, [
            'amount' => $paid_amount,
            'remaining' => $new_amount_due,
            'customer_id' => $customerId,
            'payment_method_id' => $paymentMethodId,
        ]);
    }

    /**
     * Download invoice PDF for a payment
     */
    public function download_invoice(WP_REST_Request $request)
    {
        $paymentId = (int) $request->get_param('payment_id');
        $isPreview = $request->get_param('preview') === '1';
        $isDownload = $request->get_param('download') === '1';
        $bookingToken = sanitize_text_field((string) ($request->get_param('booking_token') ?? ''));
        $invoiceToken = sanitize_text_field((string) ($request->get_param('invoice_token') ?? ''));

        if ($paymentId <= 0) {
            return new WP_Error('invalid_payment', __('Invalid payment ID.', 'yatra'), ['status' => 400]);
        }

        // Get payment with booking details
        $payment = $this->paymentRepository->findWithBooking($paymentId);

        if (!$payment) {
            return new WP_Error('payment_not_found', __('Payment not found.', 'yatra'), ['status' => 404]);
        }

        // Authorisation:
        //  1. Administrators can always access (no further checks).
        //  2. Logged-in owner of the booking can access.
        //  3. Anyone with a valid signed `invoice_token` (HMAC) can access — used on the
        //     booking-confirmation page so guest checkouts and post-session views work.
        //  4. Legacy guest path: `booking_token` (active checkout transient) — kept for BC.
        $currentUserId = (int) get_current_user_id();
        $bookingUserId = (int) ($payment->booking_user_id ?? $payment->user_id ?? 0);
        $paymentBookingId = (int) ($payment->booking_id ?? 0);
        $isAdmin = current_user_can('manage_options');
        $authorised = false;

        if ($isAdmin) {
            $authorised = true;
        } elseif ($currentUserId && $bookingUserId && $currentUserId === $bookingUserId) {
            $authorised = true;
        } elseif ($invoiceToken !== '' && self::verifyInvoiceToken($invoiceToken, (int) $payment->id, $paymentBookingId)) {
            $authorised = true;
        } elseif ($bookingToken !== '') {
            $guestEnabled = (bool) SettingsService::get('allow_guest_checkout', true);
            if ($guestEnabled) {
                $session = get_transient($bookingToken);
                if (is_array($session)) {
                    $sessionBookingId = (int) ($session['booking_id'] ?? 0);
                    if ($sessionBookingId > 0 && $paymentBookingId > 0 && $sessionBookingId === $paymentBookingId) {
                        $authorised = true;
                    }
                }
            }
        }

        if (!$authorised) {
            if ($currentUserId) {
                return new WP_Error('forbidden', __('You do not have permission to access this invoice.', 'yatra'), ['status' => 403]);
            }
            return new WP_Error('unauthorized', __('You must be logged in to download invoices.', 'yatra'), ['status' => 401]);
        }

        // Get trip details if available
        $trip = null;
        if (!empty($payment->trip_id)) {
            $trip = $this->tripRepository->find((int) $payment->trip_id);
        }

        // Get company settings
        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currency = SettingsService::getCurrency();
        $currencySymbol = FormatHelper::getCurrencySymbol($currency);

        // Format dates
        $paymentDate = !empty($payment->created_at) ? date_i18n(get_option('date_format'), strtotime($payment->created_at)) : '';
        $travelDate = !empty($payment->travel_date) ? date_i18n(get_option('date_format'), strtotime($payment->travel_date)) : '';


        $bookingRef = (string) ($payment->booking_reference ?? $payment->booking_number ?? $payment->reference ?? (string) $paymentId);
        $filename = 'Invoice #' . $bookingRef . '.pdf';


        $pdfService = new PdfService();
        if (!$pdfService->isAvailable()) {
            return new WP_Error(
                'pdf_engine_missing',
                __('Invoice PDF generator is not installed. Please run composer install to install dompdf/dompdf.', 'yatra'),
                ['status' => 500]
            );
        }

        // Get tax breakdown for invoice
        $tax_breakdown = [];
        $tax_amount = 0;
        $subtotal = (float) ($payment->booking_total_amount ?? $payment->amount ?? 0);
        
        if (!empty($payment->tax_details)) {
            $taxes = json_decode($payment->tax_details, true) ?: [];
            foreach ($taxes as $tax) {
                $tax_amount += (float) ($tax['amount'] ?? 0);
                $tax_breakdown[] = [
                    'name' => $tax['name'] ?? 'Tax',
                    'rate' => $tax['rate'] ?? 0,
                    'amount' => $tax['amount'] ?? 0
                ];
            }
            // Adjust subtotal for tax-exclusive pricing
            if (!empty($payment->tax_inclusive) && $payment->tax_inclusive) {
                $subtotal = (float) ($payment->subtotal ?? $subtotal);
            }
        } elseif (!empty($payment->tax_amount) && $payment->tax_amount > 0) {
            // Single tax fallback
            $tax_amount = (float) $payment->tax_amount;
            $tax_breakdown[] = [
                'name' => __('Tax', 'yatra'),
                'rate' => (float) ($payment->tax_rate ?? 0),
                'amount' => $tax_amount
            ];
            // Adjust subtotal for tax-exclusive pricing
            if (!empty($payment->tax_inclusive) && $payment->tax_inclusive) {
                $subtotal = (float) ($payment->subtotal ?? $subtotal);
            } else {
                $subtotal = (float) ($payment->subtotal ?? ($subtotal - $tax_amount));
            }
        }

        $templateData = [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => trim(($payment->contact_first_name ?? '') . ' ' . ($payment->contact_last_name ?? '')) ?: ($payment->customer_name ?? __('Customer', 'yatra')),
            'customer_email' => $payment->contact_email ?? $payment->customer_email ?? '',
            'payment_ref' => $payment->reference ?? '',
            'payment_date' => $paymentDate,
            'payment_status' => ucfirst($payment->status ?? 'paid'),
            'status_class' => in_array(strtolower((string) ($payment->status ?? '')), ['paid', 'completed', 'success'], true) ? 'paid' : 'pending',
            'trip_title' => $trip->title ?? $payment->trip_title ?? __('Trip Booking', 'yatra'),
            'payment_method' => ucfirst($payment->gateway ?? $payment->payment_method ?? 'Online'),
            'booking_ref' => $payment->booking_reference ?? $payment->booking_number ?? '',
            'travel_date' => $travelDate,
            'currency_symbol' => $currencySymbol,
            'amount' => number_format((float) ($payment->amount ?? 0), 2),
            'booking_total' => number_format((float) ($payment->booking_total_amount ?? $payment->amount ?? 0), 2),
            'amount_paid' => number_format((float) ($payment->booking_amount_paid ?? $payment->amount ?? 0), 2),
            'amount_due' => number_format((float) ($payment->booking_amount_due ?? 0), 2),
            'tax_breakdown' => $tax_breakdown,
            'tax_amount' => number_format($tax_amount, 2),
            'subtotal' => number_format($subtotal, 2),
        ];

        $pdfBinary = $pdfService->renderTemplateToPdfSafely('pdf/invoice.php', $templateData, [
            'paper' => 'A4',
            'orientation' => 'portrait',
            'default_font' => 'DejaVu Sans',
        ]);

        if ($isPreview) {
            // For preview, return PDF as inline display
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        } else {
            // For download, output PDF as download
            $pdfService->outputPdfDownload($pdfBinary, $filename);
            exit;
        }
    }

    /**
     * Download travel voucher PDF for a booking
     */
    public function download_voucher(WP_REST_Request $request)
    {
        $paymentId = (int) $request->get_param('payment_id');
        $isPreview = $request->get_param('preview') === '1';
        $isDownload = $request->get_param('download') === '1';

        if ($paymentId <= 0) {
            return new WP_Error('invalid_payment', __('Invalid payment ID.', 'yatra'), ['status' => 400]);
        }

        // Get payment with booking details
        $payment = $this->paymentRepository->findWithBooking($paymentId);

        if (!$payment) {
            return new WP_Error('payment_not_found', __('Payment not found.', 'yatra'), ['status' => 404]);
        }

        // Verify user is logged in and owns this payment (or is admin)
        $currentUserId = get_current_user_id();
        $bookingUserId = (int) ($payment->booking_user_id ?? $payment->user_id ?? 0);
        
        // Must be logged in
        if (!$currentUserId) {
            return new WP_Error('unauthorized', __('You must be logged in to download vouchers.', 'yatra'), ['status' => 401]);
        }
        
        // Must own the booking or be admin
        if ($bookingUserId && $currentUserId !== $bookingUserId && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('You do not have permission to access this voucher.', 'yatra'), ['status' => 403]);
        }

        // Get trip details if available
        $trip = null;
        if (!empty($payment->trip_id)) {
            $trip = $this->tripRepository->find((int) $payment->trip_id);
        }

        // Get company settings
        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currency = SettingsService::getCurrency();
        $currencySymbol = FormatHelper::getCurrencySymbol($currency);

        // Format dates
        $bookingDate = !empty($payment->created_at) ? date_i18n(get_option('date_format'), strtotime($payment->created_at)) : '';
        $travelDate = !empty($payment->travel_date) ? date_i18n(get_option('date_format'), strtotime($payment->travel_date)) : '';
        
        // Calculate return date if duration is available
        $returnDate = '';
        if (!empty($payment->travel_date) && !empty($trip->duration ?? 0)) {
            $returnTimestamp = strtotime($payment->travel_date . ' +' . (int) ($trip->duration ?? 0) . ' days');
            $returnDate = date_i18n(get_option('date_format'), $returnTimestamp);
        }

        $bookingRef = (string) ($payment->booking_reference ?? $payment->booking_number ?? $payment->reference ?? (string) $paymentId);
        $filename = 'Travel Voucher #' . $bookingRef . '.pdf';

        $pdfService = new PdfService();
        if (!$pdfService->isAvailable()) {
            return new WP_Error(
                'pdf_engine_missing',
                __('Voucher PDF generator is not installed. Please run composer install to install dompdf/dompdf.', 'yatra'),
                ['status' => 500]
            );
        }

        $templateData = [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => trim(($payment->contact_first_name ?? '') . ' ' . ($payment->contact_last_name ?? '')) ?: ($payment->customer_name ?? __('Customer', 'yatra')),
            'customer_email' => $payment->contact_email ?? $payment->customer_email ?? '',
            'booking_ref' => $bookingRef,
            'booking_date' => $bookingDate,
            'booking_status' => ucfirst($payment->status ?? 'confirmed'),
            'status_class' => in_array(strtolower((string) ($payment->status ?? '')), ['confirmed', 'completed', 'success'], true) ? 'confirmed' : 
                           (in_array(strtolower((string) ($payment->status ?? '')), ['cancelled'], true) ? 'cancelled' : 'pending'),
            'trip_title' => $trip ? ($trip->title ?? $payment->trip_title ?? __('Trip Booking', 'yatra')) : ($payment->trip_title ?? __('Trip Booking', 'yatra')),
            'trip_duration' => $trip && $trip->duration ? sprintf(__('%d days', 'yatra'), (int) $trip->duration) : '',
            'trip_difficulty' => $trip ? ($trip->difficulty_name ?? '') : '',
            'departure_location' => $trip ? ($trip->departure_location ?? '') : '',
            'destination' => $trip ? ($trip->destination ?? $payment->destination ?? '') : ($payment->destination ?? ''),
            'travel_date' => $travelDate,
            'return_date' => $returnDate,
            'currency_symbol' => $currencySymbol,
            'total_amount' => number_format((float) ($payment->booking_total_amount ?? $payment->amount ?? 0), 2),
            'amount_paid' => number_format((float) ($payment->booking_amount_paid ?? $payment->amount ?? 0), 2),
            'amount_due' => number_format((float) ($payment->booking_amount_due ?? 0), 2),
            'traveler_count' => (int) ($payment->traveler_count ?? 1),
        ];

        $pdfBinary = $pdfService->renderTemplateToPdfSafely('pdf/voucher.php', $templateData, [
            'paper' => 'A4',
            'orientation' => 'portrait',
            'default_font' => 'DejaVu Sans',
        ]);

        if ($isPreview) {
            // For preview, return PDF as inline display
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        } else {
            // For download, output PDF as download
            $pdfService->outputPdfDownload($pdfBinary, $filename);
            exit;
        }
    }

    /**
     * GET /payments/{payment_id}/itinerary - Download travel itinerary for a payment
     */
    public function download_itinerary(WP_REST_Request $request)
    {
        $paymentId = (int) $request->get_param('payment_id');
        $isPreview = $request->get_param('preview') === '1';
        $isDownload = $request->get_param('download') === '1';

        if ($paymentId <= 0) {
            return new WP_Error('invalid_payment', __('Invalid payment ID.', 'yatra'), ['status' => 400]);
        }

        // Get payment with booking details
        $payment = $this->paymentRepository->findWithBooking($paymentId);

        if (!$payment) {
            return new WP_Error('payment_not_found', __('Payment not found.', 'yatra'), ['status' => 404]);
        }

        // Verify user is logged in and owns this payment (or is admin)
        $currentUserId = get_current_user_id();
        $bookingUserId = (int) ($payment->booking_user_id ?? $payment->user_id ?? 0);
        
        // Must be logged in
        if (!$currentUserId) {
            return new WP_Error('unauthorized', __('You must be logged in to download itineraries.', 'yatra'), ['status' => 401]);
        }
        
        // Must own the booking or be admin
        if ($bookingUserId && $currentUserId !== $bookingUserId && !current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('You do not have permission to access this itinerary.', 'yatra'), ['status' => 403]);
        }

        // Get trip details if available
        $trip = null;
        if (!empty($payment->trip_id)) {
            $trip = $this->tripRepository->find((int) $payment->trip_id);
        }

        // Get company settings
        $companyName = SettingsService::get('company_name', get_bloginfo('name'));
        $companyAddress = SettingsService::get('company_address', '');
        $companyEmail = SettingsService::get('company_email', get_option('admin_email'));
        $companyPhone = SettingsService::get('company_phone', '');
        $currency = SettingsService::getCurrency();
        $currencySymbol = FormatHelper::getCurrencySymbol($currency);

        // Format dates
        $bookingDate = !empty($payment->created_at) ? date_i18n(get_option('date_format'), strtotime($payment->created_at)) : '';
        $travelDate = !empty($payment->travel_date) ? date_i18n(get_option('date_format'), strtotime($payment->travel_date)) : '';
        
        // Calculate return date if duration is available
        $returnDate = '';
        if (!empty($payment->travel_date) && !empty($trip->duration ?? 0)) {
            $returnTimestamp = strtotime($payment->travel_date . ' +' . (int) ($trip->duration ?? 0) . ' days');
            $returnDate = date_i18n(get_option('date_format'), $returnTimestamp);
        }

        // Generate booking reference
        $bookingRef = '';
        if (!empty($payment->booking_id)) {
            $bookingRef = 'YTR-' . strtoupper(str_pad((string) $payment->booking_id, 8, '0', STR_PAD_LEFT));
        }

        // Generate PDF using PDF service
        $pdfService = new PdfService();
        $filename = 'Travel-Itinerary-' . $bookingRef . '.pdf';

        // Prepare template data with null-safe access
        $templateData = [
            'company_name' => $companyName,
            'company_address' => $companyAddress,
            'company_email' => $companyEmail,
            'company_phone' => $companyPhone,
            'customer_name' => trim(($payment->contact_first_name ?? '') . ' ' . ($payment->contact_last_name ?? '')) ?: ($payment->customer_name ?? __('Customer', 'yatra')),
            'customer_email' => $payment->contact_email ?? $payment->customer_email ?? '',
            'booking_ref' => $bookingRef,
            'booking_date' => $bookingDate,
            'booking_status' => ucfirst($payment->status ?? 'confirmed'),
            'status_class' => in_array(strtolower((string) ($payment->status ?? '')), ['confirmed', 'completed', 'success'], true) ? 'confirmed' : 
                           (in_array(strtolower((string) ($payment->status ?? '')), ['cancelled'], true) ? 'cancelled' : 'pending'),
            'trip_title' => $trip ? ($trip->title ?? $payment->trip_title ?? __('Trip Booking', 'yatra')) : ($payment->trip_title ?? __('Trip Booking', 'yatra')),
            'trip_description' => $trip ? ($trip->description ?? $trip->content ?? '') : '',
            'trip_duration' => $trip && $trip->duration ? sprintf(__('%d days', 'yatra'), (int) $trip->duration) : '',
            'trip_difficulty' => $trip ? ($trip->difficulty_name ?? '') : '',
            'trip_highlights' => $trip ? ($trip->highlights ?? $trip->trip_highlights ?? '') : '',
            'trip_includes' => $trip ? ($trip->includes ?? $trip->trip_includes ?? '') : '',
            'trip_excludes' => $trip ? ($trip->excludes ?? $trip->trip_excludes ?? '') : '',
            'departure_location' => $trip ? ($trip->departure_location ?? '') : '',
            'destination' => $trip ? ($trip->destination ?? $payment->destination ?? '') : ($payment->destination ?? ''),
            'travel_date' => $travelDate,
            'return_date' => $returnDate,
            'currency_symbol' => $currencySymbol,
            'total_amount' => number_format((float) ($payment->booking_total_amount ?? $payment->amount ?? 0), 2),
            'amount_paid' => number_format((float) ($payment->booking_amount_paid ?? $payment->amount ?? 0), 2),
            'amount_due' => number_format((float) ($payment->booking_amount_due ?? 0), 2),
            'traveler_count' => (int) ($payment->traveler_count ?? 1),
        ];

        $pdfBinary = $pdfService->renderTemplateToPdfSafely('pdf/itinerary.php', $templateData, [
            'paper' => 'A4',
            'orientation' => 'portrait',
            'default_font' => 'DejaVu Sans',
        ]);

        if ($isPreview) {
            // For preview, return PDF as inline display
            return new WP_REST_Response([
                'success' => true,
                'pdf_data' => base64_encode($pdfBinary),
                'filename' => $filename,
            ]);
        } else {
            // For download, output PDF as download
            $pdfService->outputPdfDownload($pdfBinary, $filename);
            exit;
        }
    }

    /**
     * Issue a stateless, signed token that grants access to a single payment's invoice.
     *
     * The token is bound to the payment id + booking id and signed with the WP auth salt,
     * so it cannot be forged without the site secret. It is safe to embed in the
     * confirmation page link so guests (or users who logged out after checkout) can still
     * download their invoice without a session.
     */
    public static function issueInvoiceToken(int $paymentId, int $bookingId): string
    {
        if ($paymentId <= 0 || $bookingId <= 0) {
            return '';
        }
        return hash_hmac('sha256', $paymentId . '|' . $bookingId, wp_salt('auth') . '|yatra_invoice');
    }

    /**
     * Verify a token previously issued by self::issueInvoiceToken().
     */
    public static function verifyInvoiceToken(string $token, int $paymentId, int $bookingId): bool
    {
        if ($token === '' || $paymentId <= 0 || $bookingId <= 0) {
            return false;
        }
        $expected = self::issueInvoiceToken($paymentId, $bookingId);
        return $expected !== '' && hash_equals($expected, $token);
    }
}
