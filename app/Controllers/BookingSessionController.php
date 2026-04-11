<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Repositories\TravellerRepository;
use Yatra\Repositories\CustomerRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Services\SettingsService;
use Yatra\Services\TransactionalEmailTemplateService;
use Yatra\Services\EmailService;
use Yatra\Services\DepartureService;
use Yatra\Services\AvailabilityService;
use Yatra\Services\CalculationService;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\BookingDepartureRepository;
use Yatra\PaymentGateways\GatewayUserMessages;
use Yatra\PaymentGateways\PaymentGatewayRegistry;
use Yatra\Utils\Logger;

/**
 * Booking Session REST API Controller
 * Manages booking session data via REST API
 */
class BookingSessionController extends BaseController
{
    /**
     * @var TravellerRepository
     */
    private TravellerRepository $travellerRepository;

    /**
     * @var CustomerRepository
     */
    private CustomerRepository $customerRepository;

    /**
     * @var TripRepository
     */
    private TripRepository $tripRepository;

    /**
     * @var BookingRepository
     */
    private BookingRepository $bookingRepository;

    /**
     * @var DepartureService
     */
    private DepartureService $departureService;

    /**
     * @var AvailabilityService
     */
    private AvailabilityService $availabilityService;

    /**
     * @var \Yatra\Repositories\DiscountRepository
     */
    private $discountRepository;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->travellerRepository = new TravellerRepository();
        $this->customerRepository = new CustomerRepository();
        $this->tripRepository = new TripRepository();
        $this->bookingRepository = new BookingRepository();
        $this->departureService = new DepartureService(
            new DepartureRepository(),
            new \Yatra\Repositories\BookingDepartureRepository(),
            $this->bookingRepository,
            $this->tripRepository
        );
        $this->availabilityService = new AvailabilityService(
            new \Yatra\Repositories\AvailabilityRepository()
        );
        $this->discountRepository = new \Yatra\Repositories\DiscountRepository();
    }

    /**
     * Public permission callback for REST API routes
     * Allows public access to booking endpoints
     * 
     * Removes cookie validation to prevent "Cookie check failed" errors for logged-out users
     */
    public function public_permission_callback(?WP_REST_Request $request = null): bool
    {
        // Remove cookie validation requirement for this endpoint
        // This allows guest users to access the endpoint without nonce validation
        remove_filter('rest_authentication_errors', 'rest_cookie_check_errors', 100);
        return true;
    }

    /**
     * REST API namespace
     */
    protected string $namespace = 'yatra/v1';

    /**
     * Register REST API routes
     */
    public function register_routes(): void
    {
        // Set booking session
        register_rest_route($this->namespace, '/booking/session', [
            'methods' => 'POST',
            'callback' => [$this, 'set_session'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);

        // Get booking session
        register_rest_route($this->namespace, '/booking/session', [
            'methods' => 'GET',
            'callback' => [$this, 'get_session'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);

        // Clear booking session
        register_rest_route($this->namespace, '/booking/session', [
            'methods' => 'DELETE',
            'callback' => [$this, 'clear_session'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);

        // Get trip data for booking
        register_rest_route($this->namespace, '/booking/trip/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_trip_for_booking'],
            'permission_callback' => [$this, 'public_permission_callback'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        // Create booking
        register_rest_route($this->namespace, '/booking/create', [
            'methods' => 'POST',
            'callback' => [$this, 'create_booking'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);
        
        // Apply coupon code
        register_rest_route($this->namespace, '/booking/coupon/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_coupon'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);
        
        // Remove coupon code
        register_rest_route($this->namespace, '/booking/coupon/remove', [
            'methods' => 'POST',
            'callback' => [$this, 'remove_coupon'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);
        
        // Calculate booking summary (AJAX endpoint for dynamic updates)
        register_rest_route($this->namespace, '/booking/summary', [
            'methods' => 'POST',
            'callback' => [$this, 'calculate_summary'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);
        
        // Complete payment for client-side gateways (Square, etc.)
        register_rest_route($this->namespace, '/payment/(?P<gateway>[a-z_]+)/complete', [
            'methods' => 'POST',
            'callback' => [$this, 'complete_gateway_payment'],
            'permission_callback' => [$this, 'public_permission_callback'],
        ]);
    }
    
    /**
     * Complete payment for client-side payment gateways
     * Used by Square, and other gateways that tokenize on client
     */
    public function complete_gateway_payment(WP_REST_Request $request): WP_REST_Response
    {
        $gateway_id = $request->get_param('gateway');
        $data = $request->get_json_params();
        
        $booking_id = $data['booking_id'] ?? 0;
        $source_id = $data['source_id'] ?? '';
        $amount = $data['amount'] ?? 0;
        $currency = $data['currency'] ?? 'USD';
        
        if (empty($booking_id) || empty($source_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Missing required payment data.', 'yatra'),
            ], 400);
        }
        
        // Get the gateway
        $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
        $gateway = $registry->get($gateway_id);
        
        if (!$gateway) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid payment gateway.', 'yatra'),
            ], 400);
        }
        
        // Check if gateway has createPayment method
        if (!method_exists($gateway, 'createPayment')) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Gateway does not support this payment method.', 'yatra'),
            ], 400);
        }
        
        // Create the payment
        $result = $gateway->createPayment([
            'source_id' => $source_id,
            'booking_id' => $booking_id,
            'amount' => $amount,
            'currency' => $currency,
        ]);
        
        if (!$result['success']) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result['error'] ?? __('Payment failed.', 'yatra'),
            ], 400);
        }
        
        // Update booking payment status
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking = $bookingRepository->find($booking_id);
        
        if ($booking) {
            // Record the payment using PaymentRepository
            $paymentRepository = new \Yatra\Repositories\PaymentRepository();
            $paymentRepository->create([
                'booking_id' => $booking_id,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => $gateway_id,
                'transaction_id' => $result['transaction_id'] ?? '',
                'status' => ($result['status'] ?? 'completed') === 'completed' ? 'completed' : 'pending',
            ]);
            
            // Update booking status if payment is complete
            if (($result['status'] ?? 'completed') === 'completed') {
                // Get total paid amount
                $total_paid = $paymentRepository->getTotalPaidForBooking($booking_id);
                $total_amount = (float) $booking->total_amount;
                
                if ($total_paid >= $total_amount) {
                    $bookingRepository->update($booking_id, ['status' => 'confirmed', 'payment_status' => 'paid']);
                } else {
                    $bookingRepository->update($booking_id, ['payment_status' => 'partial']);
                }
            }
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Payment completed successfully.', 'yatra'),
            'data' => [
                'transaction_id' => $result['transaction_id'] ?? '',
                'status' => $result['status'] ?? 'completed',
            ],
        ]);
    }

    /**
     * Set booking session data
     * Supports full creation (requires trip_id) or partial updates (travelers, traveler_counts)
     */
    public function set_session(WP_REST_Request $request): WP_REST_Response
    {
        // Ensure session is started for REST API requests
        yatra_start_session();
        
        $data = $request->get_json_params();
        
        // Check if this is a partial update (updating travelers or services in existing session)
        $existing_session = yatra_get_booking_session();
        $is_partial_update = empty($data['trip_id']) && !empty($existing_session['trip_id']) && 
                             (isset($data['travelers']) || isset($data['traveler_counts']) || isset($data['additional_services']));
        
        if ($is_partial_update) {
            // Partial update: merge new data with existing session
            if (isset($data['travelers'])) {
                $existing_session['travelers'] = max(1, (int) $data['travelers']);
            }
            if (isset($data['traveler_counts']) && is_array($data['traveler_counts'])) {
                $existing_session['traveler_counts'] = $data['traveler_counts'];
                // Recalculate total travelers from counts
                $existing_session['travelers'] = max(1, array_sum(array_map('intval', $data['traveler_counts'])));
            }
            // Handle additional services selection
            if (isset($data['additional_services']) && is_array($data['additional_services'])) {
                $existing_session['additional_services'] = array_map('intval', $data['additional_services']);
            }
            
            // Recalculate taxes for partial updates
            $trip_price = $existing_session['trip_price'];
            $travelers_count = $existing_session['travelers'];
            $additional_services = $existing_session['additional_services'] ?? [];
            
            // Calculate base amount - handle traveler-based pricing
            $base_amount = 0;
            $pricing_type = $existing_session['pricing_type'] ?? 'regular';
            $price_types = $existing_session['price_types'] ?? [];
            $traveler_counts = $existing_session['traveler_counts'] ?? [];
            
            if ($pricing_type === 'traveler_based' && !empty($price_types)) {
                // Calculate for traveler-based pricing
                foreach ($price_types as $pt) {
                    $pt = (array) $pt;
                    $category_id = $pt['category_id'] ?? 0;
                    $pricing_mode = $pt['pricing_mode'] ?? 'per_person';
                    $category_price = isset($pt['effective_price']) ? (float) $pt['effective_price'] : \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice($pt);
                    $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;
                    
                    if ($pricing_mode === 'per_group') {
                        // Per group: charge flat price once if any travelers in this category
                        if ($count > 0) {
                            $base_amount += $category_price;
                        }
                    } else {
                        // Per person: charge per traveler
                        $base_amount += $category_price * $count;
                    }
                }
            } else {
                // Regular pricing
                $base_amount = $trip_price * $travelers_count;
            }
            
            // Calculate additional services cost
            $services_cost = 0;
            if (!empty($additional_services)) {
                foreach ($additional_services as $service_id) {
                    $service = $wpdb->get_row($wpdb->prepare(
                        "SELECT price FROM {$wpdb->prefix}yatra_additional_services WHERE id = %d",
                        $service_id
                    ));
                    if ($service && $service->price) {
                        $services_cost += (float) $service->price;
                    }
                }
            }
            
            // Use CalculationService for pricing (fetches trip data from database)
            $calculationService = new CalculationService();
            $pricing = $calculationService->calculatePricing([
                'trip_id'           => (int) $trip->id,
                'travelers_count'   => $travelers_count,
                'traveler_counts'   => $traveler_counts,
                'travel_date'       => $travel_date,
                'departure_time'    => $departure_time,
                'selected_services' => $additional_services,
                'coupon_code'       => '',
                'payment_method'    => 'full',
            ]);
            $subtotal = $pricing['subtotal'];
            $total_with_tax = $pricing['final_total'];
            $tax_calculation = $pricing['tax_calculation'];
            $services_cost = $pricing['services_cost'];
            
            // Note: Pricing is calculated on-demand via CalculationService, not stored in session
            
            $existing_session['timestamp'] = time();
            
            // Save updated session
            yatra_set_booking_session($existing_session);
            
            return new WP_REST_Response([
                'success' => true,
                'message' => __('Booking session updated.', 'yatra'),
                'data' => $existing_session,
            ]);
        }

        if (empty($data['trip_id'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip ID is required.', 'yatra'),
            ], 400);
        }

        // Validate trip exists
        $trip = $this->tripRepository->findPublished((int) $data['trip_id']);

        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }

        global $wpdb;
        
        // Get availability-specific data if date provided
        $availability = null;
        $availability_id = !empty($data['availability_id']) ? sanitize_text_field($data['availability_id']) : null;
        $travel_date = !empty($data['travel_date']) ? sanitize_text_field($data['travel_date']) : '';
        $departure_time = !empty($data['departure_time']) ? sanitize_text_field($data['departure_time']) : '';
        
        // Use centralized AvailabilityResolutionService to get resolved availability
        // Priority: Availability Dates → Recurring Rules → Trip Default (specific rows override patterns)
        // Pass departure_time for day tours with multiple time slots on the same date
        $availability = null;
        if ($travel_date) {
            try {
                $resolutionService = new \Yatra\Services\AvailabilityResolutionService();
                $availability = $resolutionService->resolveAvailabilityForDate(
                    (int) $data['trip_id'],
                    $travel_date,
                    $departure_time ?: null
                );
                
                if ($availability) {
                    $data['availability_id'] = $availability->id;
                    $data['seats_available'] = $availability->seats_available;
                    $data['seats_total'] = $availability->seats_total;
                }
            } catch (\Exception $e) {
                error_log('Yatra Booking: Error resolving availability - ' . $e->getMessage());
                $availability = null;
            }
        }
        
        // Resolve pricing_type and price_types via centralized TripPricingService
        // Priority: frontend data → availability → trip defaults
        $pricing_type = !empty($data['pricing_type'])
            ? sanitize_text_field($data['pricing_type'])
            : \Yatra\Services\TripPricingService::resolvePricingType($trip);
        
        $price_types = [];
        
        // First priority: price_types sent from frontend (from availability card)
        if (!empty($data['price_types']) && is_array($data['price_types'])) {
            $price_types = $data['price_types'];
        }
        // Second priority: availability price_types (already includes trip fallback from AvailabilityResolutionService)
        elseif ($availability && !empty($availability->price_types)) {
            $price_types = is_array($availability->price_types) ? $availability->price_types : [];
        }
        // Third priority: trip's price_types via centralized normalizer
        if (empty($price_types)) {
            $price_types = \Yatra\Services\TripPricingService::resolvePriceTypes($trip);
        }
        // Auto-detect traveler_based if price_types are present
        if (!empty($price_types) && $pricing_type === 'regular') {
            $pricing_type = 'traveler_based';
        }
        // NOTE: Actual pricing calculation is handled entirely by CalculationService below
        
        // Enrich price_types with category labels if needed (some might already have them from frontend)
        if (!empty($price_types)) {
            $needsEnrichment = false;
            foreach ($price_types as $pt) {
                $pt = (array) $pt;
                if (empty($pt['category_label']) && !empty($pt['category_id'])) {
                    $needsEnrichment = true;
                    break;
                }
            }
            
            if ($needsEnrichment) {
                $categoryIds = array_filter(array_map(function($p) {
                    $p = (array) $p;
                    return isset($p['category_id']) ? (int) $p['category_id'] : null;
                }, $price_types));
                
                if (!empty($categoryIds)) {
                    // Use AvailabilityService to get traveler categories
                    $cats = $this->availabilityService->getTravelerCategories($categoryIds);
                    
                    $catIndex = [];
                    foreach ($cats as $cat) {
                        $catIndex[(int) $cat->id] = $cat;
                    }
                    
                    foreach ($price_types as &$pt) {
                        $pt = (array) $pt;
                        $catId = isset($pt['category_id']) ? (int) $pt['category_id'] : null;
                        if ($catId && isset($catIndex[$catId]) && empty($pt['category_label'])) {
                            $cat = $catIndex[$catId];
                            $pt['category_label'] = $cat->label;
                            $pt['category_slug'] = $cat->slug;
                            $pt['age_min'] = $cat->age_min ? (int) $cat->age_min : null;
                            $pt['age_max'] = $cat->age_max ? (int) $cat->age_max : null;
                        }
                        // Ensure effective price is set via centralized resolver
                        if (!isset($pt['effective_price'])) {
                            $pt['effective_price'] = \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice($pt);
                        }
                    }
                }
            }
        }
        
        // Parse traveler_counts if provided (for traveler-based pricing)
        $traveler_counts = [];
        if (!empty($data['traveler_counts']) && is_array($data['traveler_counts'])) {
            $traveler_counts = $data['traveler_counts'];
        }
        
        // Calculate total travelers
        $travelers_count = isset($data['travelers']) ? (int) $data['travelers'] : 0;
        if (!empty($traveler_counts)) {
            $travelers_count = array_sum(array_map('intval', $traveler_counts));
        }

        if ($travelers_count < 1) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Please select at least 1 traveler to continue.', 'yatra'),
            ], 400);
        }

        // Determine if day trip - prefer frontend value, fallback to trip duration
        $is_day_trip = isset($data['is_day_trip']) ? (bool) $data['is_day_trip'] : (($trip->duration_days ?? 1) <= 1);
        
        // Get additional services from request (selected in popup)
        $additional_services = [];
        if (!empty($data['additional_services']) && is_array($data['additional_services'])) {
            $additional_services = array_map('intval', $data['additional_services']);
        }
        
        // Resolve enabled gateways for this session (use registry to respect availability)
        $gatewayRegistry = PaymentGatewayRegistry::getInstance();
        $availableGateways = $gatewayRegistry->getForCheckout();
        $enabled_gateways = [];
        foreach ($availableGateways as $gateway) {
            if (!empty($gateway['id'])) {
                $enabled_gateways[$gateway['id']] = $gateway;
            }
        }
        // Fallback: if registry returned nothing, use saved settings gateways
        if (empty($enabled_gateways)) {
            $settings_gateways = SettingsService::get('payment_gateways', []);
            if (is_array($settings_gateways)) {
                $enabled_gateways = $settings_gateways;
            }
        }

        // Use CalculationService as single source of truth for all pricing
        $calculationService = new CalculationService();
        $pricing = $calculationService->calculatePricing([
            'trip_id'           => (int) $trip->id,
            'travelers_count'   => $travelers_count,
            'traveler_counts'   => $traveler_counts,
            'travel_date'       => $travel_date,
            'departure_time'    => $departure_time,
            'selected_services' => $additional_services,
            'availability_id'   => $availability_id ? (int) $availability_id : null,
            'coupon_code'       => '',
            'payment_method'    => 'full',
        ]);

        // Prepare session data - essential trip data (pricing fetched from database on-demand)
        $session_data = [
            'trip_id' => (int) $trip->id,
            'trip_title' => $trip->title,
            'trip_slug' => $trip->slug,
            'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
            'min_travelers' => (int) ($trip->min_travelers ?: 1),
            'max_travelers' => (int) ($trip->max_travelers ?: 20),
            'duration_days' => (int) ($trip->duration_days ?: 1),
            'travelers' => $travelers_count,
            'travel_date' => $travel_date,
            'departure_time' => $departure_time,
            'timestamp' => time(),
            // Availability-specific data
            'availability_id' => $availability_id,
            'pricing_type' => $pricing['pricing_type'] ?? $pricing_type,
            'price_types' => $price_types,
            'traveler_counts' => $traveler_counts,
            'is_day_trip' => $is_day_trip,
            // Additional services (selected in popup)
            'additional_services' => $additional_services,
            // Payment gateways available for checkout UI
            'enabled_gateways' => $enabled_gateways,
            // Note: NO pricing data stored - fetched from database on-demand via CalculationService
        ];

        if (!empty($data['is_remaining_payment'])) {
            $session_data['is_remaining_payment'] = true;
            $session_data['existing_booking_id'] = (int) ($data['existing_booking_id'] ?? 0);
            $session_data['booking_reference'] = $data['booking_reference'] ?? '';
            $session_data['remaining_amount'] = isset($data['remaining_amount']) ? (float) $data['remaining_amount'] : null;
            $session_data['amount_paid'] = isset($data['amount_paid']) ? (float) $data['amount_paid'] : null;
            $session_data['total_amount'] = isset($data['total_amount']) ? (float) $data['total_amount'] : null;
        }

        // Reset any previous session to avoid stale flags
        yatra_clear_booking_session();

        // Set session
        yatra_set_booking_session($session_data);
        
        // Get the booking token directly from session (it's added by yatra_set_booking_session)
        yatra_start_session();
        $booking_token = $_SESSION['yatra_booking_token'] ?? null;
        
                
        // Fire hook when trip is added to booking session (for Pro modules)
        do_action('yatra_trip_added_to_session', $session_data['trip_id'], $session_data);

        // Get redirect URL
        $redirect_url = yatra_get_checkout_url();
        
        // Add booking token to URL for REST API → page load session restoration
        if ($booking_token) {
            $redirect_url = add_query_arg('booking_token', $booking_token, $redirect_url);
        }
        
        // Add booking_token to response data for debugging
        $session_data['booking_token'] = $booking_token;

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Booking session created.', 'yatra'),
            'data' => $session_data,
            'redirect_url' => $redirect_url,
        ]);
    }

    /**
     * Get booking session data
     */
    public function get_session(WP_REST_Request $request): WP_REST_Response
    {
        $session_data = yatra_get_booking_session();

        if (empty($session_data) || empty($session_data['trip_id'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No active booking session.', 'yatra'),
                'data' => null,
            ]);
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $session_data,
        ]);
    }

    /**
     * Clear booking session
     */
    public function clear_session(WP_REST_Request $request): WP_REST_Response
    {
        yatra_clear_booking_session();

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Booking session cleared.', 'yatra'),
        ]);
    }

    /**
     * Get trip data for booking page
     */
    public function get_trip_for_booking(WP_REST_Request $request): WP_REST_Response
    {
        $trip_id = (int) $request->get_param('id');

        $trip = $this->tripRepository->findPublished($trip_id);

        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }

        // Format trip data for booking
        $trip_data = [
            'id' => (int) $trip->id,
            'title' => $trip->title,
            'slug' => $trip->slug,
            'featured_image' => $trip->featured_image,
            'duration_days' => (int) $trip->duration_days,
            'duration_nights' => (int) $trip->duration_nights,
            'difficulty_level' => $trip->difficulty_level,
            'min_travelers' => (int) ($trip->min_travelers ?: 1),
            'max_travelers' => (int) ($trip->max_travelers ?: 20),
            'original_price' => (float) $trip->original_price,
            'sale_price' => (float) $trip->sale_price,
            'price' => !empty($trip->discounted_price) ? (float) $trip->discounted_price : (float) $trip->original_price,
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
            'starting_location' => $trip->starting_location,
            'ending_location' => $trip->ending_location,
        ];

        return new WP_REST_Response([
            'success' => true,
            'data' => $trip_data,
        ]);
    }

    /**
     * Create a new booking OR process remaining payment (same REST route).
     *
     * Regular checkout: persists the booking first (BookingService::createBooking), then starts
     * online payment if needed; payment rows are written when the gateway confirms success
     * (confirm endpoint, webhooks, IPN, or recordGatewayPayment for immediate captures).
     *
     * Remaining / balance payment: does not create a booking — only charges the existing row
     * and records a payment on success via the same gateway completion paths.
     */
    public function create_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $data = $request->get_json_params();

        // ========================================
        // REMAINING PAYMENT vs NEW BOOKING
        // ========================================
        // A leftover PHP session from "pay remaining balance" must not hijack a normal
        // checkout POST (full traveler payload). Only treat as remaining-payment when the
        // client is actually on that flow (hidden field) or sends no new-booking travelers.
        // Early return: process_remaining_payment() — no createBooking().
        if (yatra_has_remaining_session()) {
            $is_remaining_checkout = !empty($data['is_remaining_payment']);
            $travelers_payload = $data['travelers'] ?? null;
            $has_new_booking_travelers = is_array($travelers_payload) && count($travelers_payload) > 0;

            if ($is_remaining_checkout) {
                return $this->process_remaining_payment($request);
            }

            if ($has_new_booking_travelers) {
                yatra_clear_remaining_session();
            } else {
                return $this->process_remaining_payment($request);
            }
        }

        // ========================================
        // NEW BOOKING CHECKOUT (not pay-remaining)
        // ========================================
        // Below: createBooking() runs once; payment is initiated afterward if amount_due > 0.

        // ========================================
        // GET BOOKING SETTINGS
        // ========================================
        $settings = [
            'booking_confirmation' => \Yatra\Services\SettingsService::get('booking_confirmation', true),
            'auto_confirm_bookings' => \Yatra\Services\SettingsService::get('auto_confirm_bookings', false),
            'require_login' => \Yatra\Services\SettingsService::get('require_login', false),
            'allow_guest_checkout' => \Yatra\Services\SettingsService::get('allow_guest_checkout', true),
            'cancellation_policy' => \Yatra\Services\SettingsService::get('cancellation_policy', 'full_refund'),
            'cancellation_days' => (int) \Yatra\Services\SettingsService::get('cancellation_days', 7),
            'booking_expiry_hours' => (int) \Yatra\Services\SettingsService::get('booking_expiry_hours', 24),
            'auto_confirm_pay_later' => \Yatra\Services\SettingsService::get('auto_confirm_pay_later', true),
        ];

        // ========================================
        // CHECK LOGIN REQUIREMENT
        // ========================================
        if ($settings['require_login'] && !is_user_logged_in()) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('You must be logged in to make a booking.', 'yatra'),
                'code' => 'login_required',
                'login_url' => wp_login_url(home_url($_SERVER['REQUEST_URI'] ?? '')),
            ], 401);
        }

        // Check guest checkout
        if (!$settings['allow_guest_checkout'] && !is_user_logged_in()) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Guest checkout is not allowed. Please log in or create an account.', 'yatra'),
                'code' => 'guest_not_allowed',
                'login_url' => wp_login_url(home_url($_SERVER['REQUEST_URI'] ?? '')),
            ], 401);
        }

        // Get session data
        $session = yatra_get_booking_session();
        
        // Validate we have session data or direct booking data
        $trip_id = !empty($data['trip_id']) ? (int) $data['trip_id'] : ($session['trip_id'] ?? 0);
        
        if (!$trip_id) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No trip selected for booking.', 'yatra'),
            ], 400);
        }

        // Get contact email - handle both flat and nested formats
        $contact_email = $data['contact_email'] ?? '';
        $contact_phone = $data['contact_phone'] ?? '';
        $contact_first_name = $data['contact_first_name'] ?? '';
        $contact_last_name = $data['contact_last_name'] ?? '';
        $contact_country = $data['contact_country'] ?? '';
        
                $contact_nationality = $data['contact_nationality'] ?? '';
        $contact_address = $data['contact_address'] ?? '';
        
        // Emergency contact
        $emergency_name = $data['emergency_name'] ?? '';
        $emergency_phone = $data['emergency_phone'] ?? '';
        $emergency_relationship = $data['emergency_relationship'] ?? '';
        
        // Travel details
        $travel_date = $data['travel_date'] ?? ($session['travel_date'] ?? '');
        $travelers = $data['travelers'] ?? [];
        
        // Validate required fields
        if (empty($contact_email)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Email address is required.', 'yatra'),
            ], 400);
        }
        
        if (empty($contact_phone)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Phone number is required.', 'yatra'),
            ], 400);
        }
        
        if (empty($travel_date)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Travel date is required.', 'yatra'),
            ], 400);
        }
        
        if (empty($travelers) || !is_array($travelers)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('At least one traveler is required.', 'yatra'),
            ], 400);
        }

        // Validate email
        if (!is_email($contact_email)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid email address.', 'yatra'),
            ], 400);
        }

        // Get trip data
        $trip = $this->tripRepository->findPublished($trip_id);

        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }

        // ========================================
        // PRICING via CalculationService (single source of truth)
        // ========================================
        // Count only actual travelers (exclude contact and emergency contact)
        $travelers_count = 0;
        foreach ($travelers as $traveler) {
            if (isset($traveler['type']) && $traveler['type'] === 'traveler') {
                $travelers_count++;
            }
        }
        // Fallback if no type is set (legacy data)
        if ($travelers_count === 0) {
            $travelers_count = count($travelers);
        }
        
        $payment_method = strtolower(trim(sanitize_text_field($data['payment_method'] ?? ($session['payment_method'] ?? 'full'))));
        if ($payment_method === '') {
            $payment_method = 'full';
        }
        $payment_gateway = strtolower(trim(sanitize_text_field($data['payment_gateway'] ?? 'pay_later')));
        
        // Get coupon code from request OR session
        $coupon_code = sanitize_text_field($data['coupon_code'] ?? '');
        if (empty($coupon_code) && !empty($session['coupon']['code'])) {
            $coupon_code = sanitize_text_field($session['coupon']['code']);
        }
        
        $departure_time = $data['departure_time'] ?? ($session['departure_time'] ?? '');
        $additional_services = $data['additional_services'] ?? ($session['additional_services'] ?? []);
        $availability_id = $data['availability_id'] ?? ($session['availability_id'] ?? null);
        
        // Build traveler_counts from travelers array or session
        $traveler_counts = [];
        if (!empty($data['traveler_counts']) && is_array($data['traveler_counts'])) {
            $traveler_counts = $data['traveler_counts'];
        } elseif (!empty($session['traveler_counts']) && is_array($session['traveler_counts'])) {
            $traveler_counts = $session['traveler_counts'];
        } else {
            // Build from travelers array if category_id is present
            foreach ($travelers as $traveler) {
                $categoryId = $traveler['category_id'] ?? null;
                if ($categoryId) {
                    if (!isset($traveler_counts[$categoryId])) {
                        $traveler_counts[$categoryId] = 0;
                    }
                    $traveler_counts[$categoryId]++;
                }
            }
            if (empty($traveler_counts) && $travelers_count > 0) {
                $traveler_counts['default'] = $travelers_count;
            }
        }
        
        // Use CalculationService as single source of truth
        $calculationService = new CalculationService();
        $pricing = $calculationService->calculatePricing([
            'trip_id'           => $trip_id,
            'travelers_count'   => $travelers_count,
            'traveler_counts'   => $traveler_counts,
            'travel_date'       => $travel_date,
            'departure_time'    => $departure_time,
            'selected_services' => $additional_services,
            'availability_id'   => $availability_id ? (int) $availability_id : null,
            'coupon_code'       => $coupon_code,
            'payment_method'    => $payment_method,
        ]);
        
        // Extract pricing results
        $total_amount           = $pricing['final_total'];
        $amount_due             = $pricing['amount_due'];
        $amount_paid            = $pricing['amount_paid'];
        $tax_calculation        = $pricing['tax_calculation'];
        $tax_breakdown          = $tax_calculation['tax_breakdown'];
        $total_tax_amount       = $tax_calculation['total_tax_amount'];
        
                $tax_inclusive           = $tax_calculation['tax_inclusive'];
        $tax_rate               = $tax_calculation['tax_rate'];
        $subtotal_before_discount = $pricing['subtotal'];
        $discount_amount        = $pricing['total_discount_amount'];
        $discount_code          = $pricing['group_discount']['code'] ?? ($pricing['coupon_discount']['code'] ?? null);

        // ========================================
        // CAPACITY / WAITLIST
        // ========================================
        $resolvedAvailabilityForWaitlist = null;
        if ($travel_date !== '') {
            try {
                $availResolutionSvc = new \Yatra\Services\AvailabilityResolutionService();
                $resolvedAvailabilityForWaitlist = $availResolutionSvc->resolveAvailabilityForDate(
                    $trip_id,
                    $travel_date,
                    $departure_time !== '' ? $departure_time : null
                );
            } catch (\Throwable $e) {
                // Leave null; legacy checkout without strict availability still works
            }
        }

        $isWaitlistCheckout = false;

        if ($resolvedAvailabilityForWaitlist !== null) {
            $availStatus = (string) ($resolvedAvailabilityForWaitlist->status ?? 'available');
            if (in_array($availStatus, ['blocked', 'closed', 'cancelled'], true)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('This departure is not open for booking.', 'yatra'),
                    'code' => 'date_blocked',
                ], 400);
            }
            // Respect explicit sold_out even if seats_available is stale — waitlist only if allowed
            if ($availStatus === 'sold_out') {
                if (\Yatra\Services\WaitlistService::canJoinWaitlist($trip, $resolvedAvailabilityForWaitlist, $travelers_count)) {
                    $isWaitlistCheckout = true;
                } else {
                    return new WP_REST_Response([
                        'success' => false,
                        'message' => __('This departure is sold out.', 'yatra'),
                        'code' => 'sold_out',
                    ], 400);
                }
            }
        }

        if (
            !$isWaitlistCheckout
            && \Yatra\Services\WaitlistService::isInsufficientSeats($resolvedAvailabilityForWaitlist, $travelers_count)
        ) {
            if (\Yatra\Services\WaitlistService::canJoinWaitlist($trip, $resolvedAvailabilityForWaitlist, $travelers_count)) {
                $isWaitlistCheckout = true;
            } else {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('This departure is full. Waitlist is not available for this trip or date.', 'yatra'),
                    'code' => 'sold_out',
                ], 400);
            }
        }

        // Generate booking reference using the same method as BookingService
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $booking_reference = $bookingRepository->generateReference();

        Logger::debug('Yatra booking create: pricing and payment selection', [
            'context' => 'booking_create_rest',
            'trip_id' => $trip_id,
            'booking_reference' => $booking_reference,
            'flexible_payments_enabled' => (bool) apply_filters('yatra_flexible_payments_enabled', false),
            'payment_method' => $payment_method,
            'payment_gateway' => $payment_gateway,
            'total_amount' => round((float) $total_amount, 4),
            'amount_due' => round((float) $amount_due, 4),
            'deposit_percentage' => (int) apply_filters('yatra_deposit_percentage', 20),
            'partial_percentage' => (int) apply_filters('yatra_partial_payment_percentage', 30),
        ]);

        // Prepare contact data
        $contact_data = [
            'first_name' => sanitize_text_field($contact_first_name),
            'last_name' => sanitize_text_field($contact_last_name),
            'email' => sanitize_email($contact_email),
            'phone' => sanitize_text_field($contact_phone),
            'country' => sanitize_text_field($contact_country),
            'nationality' => sanitize_text_field($contact_nationality),
            'address' => sanitize_text_field($contact_address),
        ];
        
        // Prepare emergency contact data
        $emergency_data = [
            'name' => sanitize_text_field($emergency_name),
            'phone' => sanitize_text_field($emergency_phone),
            'relationship' => sanitize_text_field($emergency_relationship),
        ];
        
        // Sanitize travelers data
        $sanitized_travelers = [];
        foreach ($travelers as $traveler) {
            if (is_array($traveler)) {
                $sanitized_traveler = [];
                foreach ($traveler as $key => $value) {
                    $sanitized_traveler[sanitize_key($key)] = sanitize_text_field($value);
                }
                $sanitized_travelers[] = $sanitized_traveler;
            }
        }

        // ========================================
        // CREATE WORDPRESS USER ACCOUNT (if requested)
        // ========================================
        $user_id = get_current_user_id();
        $create_account = !empty($data['create_account']) && !empty($data['account_password']);
        
        if (!$user_id && $create_account && !empty($data['account_password'])) {
            $account_password = sanitize_text_field($data['account_password']);
            $account_password_confirm = sanitize_text_field($data['account_password_confirm'] ?? '');
            
            // Validate password
            if (strlen($account_password) < 8) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('Password must be at least 8 characters long.', 'yatra'),
                ], 400);
            }
            
            if ($account_password !== $account_password_confirm) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('Passwords do not match.', 'yatra'),
                ], 400);
            }
            
            // Check if user already exists
            if (email_exists($contact_email)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => __('An account with this email already exists. Please log in.', 'yatra'),
                ], 400);
            }
            
            // Create WordPress user
            $username = sanitize_user(current(explode('@', $contact_email)));
            $original_username = $username;
            $counter = 1;
            
            while (username_exists($username)) {
                $username = $original_username . $counter;
                $counter++;
            }
            
            $user_id = wp_create_user($username, $account_password, $contact_email);
            
            if (is_wp_error($user_id)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => wp_strip_all_tags($user_id->get_error_message()),
                ], 400);
            }
            
            // Assign Yatra Customer role
            $user = new \WP_User($user_id);
            $user->set_role('yatra_customer');
            
            // Update user meta with contact information
            wp_update_user([
                'ID' => $user_id,
                'first_name' => $contact_data['first_name'],
                'last_name' => $contact_data['last_name'],
                'display_name' => $contact_data['first_name'] . ' ' . $contact_data['last_name'],
            ]);
            
            if (!empty($contact_phone)) {
                update_user_meta($user_id, 'billing_phone', $contact_phone);
                update_user_meta($user_id, 'phone', $contact_phone);
            }
            
            if (!empty($contact_country)) {
                update_user_meta($user_id, 'billing_country', $contact_country);
            }
            
            if (!empty($contact_address)) {
                update_user_meta($user_id, 'billing_address_1', $contact_address);
            }
            
            // Auto-login the user
            wp_set_current_user($user_id);
            wp_set_auth_cookie($user_id);
        }
        
        // ========================================
        // CREATE OR UPDATE CUSTOMER
        // ========================================
        // Customers are separate from WordPress users - this is for CRM purposes
        $customer_id = null;
        try {
            $customer_id = $this->customerRepository->findOrCreate([
                'user_id' => $user_id ?: null,
                'first_name' => $contact_data['first_name'],
                'last_name' => $contact_data['last_name'],
                'email' => $contact_data['email'],
                'phone' => $contact_data['phone'],
                'address' => $contact_data['address'],
                'country' => $contact_data['country'],
                'nationality' => $contact_data['nationality'],
                'emergency_name' => $emergency_data['name'],
                'emergency_phone' => $emergency_data['phone'],
                'emergency_relationship' => $emergency_data['relationship'],
                'newsletter_optin' => !empty($data['subscribe_newsletter']),
                'total_spent' => $total_amount,
                'source' => 'booking',
            ]);
        } catch (\Exception $e) {
            // Log error but continue - customer creation is not critical
            }

        // Create booking using BookingService
        $booking_service = new \Yatra\Services\BookingService();

        $is_offline_gateway = $this->isOfflineGateway($payment_gateway);

        // Always defer createBooking's copy: session sends one rich confirmation at the end, or
        // transactional confirmation before payment redirect (see processPaymentGateway returns).
        $booking_data = [
            'reference' => $booking_reference,
            'trip_id' => $trip_id,
            'customer_id' => $customer_id,
            'user_id' => $user_id ?: null,
            'contact_first_name' => $contact_data['first_name'],
            'contact_last_name' => $contact_data['last_name'],
            'contact_email' => $contact_data['email'],
            'contact_phone' => $contact_data['phone'],
            'contact_country' => $contact_data['country'],
            'contact_data' => wp_json_encode($contact_data),
            'emergency_contact' => wp_json_encode($emergency_data),
            'travel_date' => sanitize_text_field($travel_date),
            'availability_id' => !empty($availability_id) ? (int) $availability_id : null,
            'travelers_count' => $travelers_count,
            'total_amount' => $total_amount,
            'amount_paid' => 0,
            'amount_due' => $amount_due,
            'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
            'discount_amount' => $discount_amount,
            'discount_code' => $discount_code,
            'payment_method' => $payment_method,
            'payment_gateway' => $payment_gateway,
            'status' => 'pending',
            'special_requests' => sanitize_textarea_field($data['special_requests'] ?? ''),
            'newsletter_optin' => !empty($data['subscribe_newsletter']) ? 1 : 0,
            'ip_address' => $this->getClientIp(),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
            // Tax fields
            'subtotal' => $subtotal_before_discount,
            'tax_amount' => $total_tax_amount,
            'tax_rate' => $tax_rate,
            'tax_inclusive' => $tax_inclusive,
            'tax_details' => wp_json_encode($tax_breakdown),
            // Itinerary costs
            'itinerary_costs' => wp_json_encode($pricing['itinerary_costs'] ?? []),
            'itinerary_costs_total' => ($pricing['itinerary_costs_total'] ?? 0),
            'skip_initial_customer_confirmation' => true,
        ];

        if ($isWaitlistCheckout && $resolvedAvailabilityForWaitlist) {
            $booking_data['availability_id'] = (int) $resolvedAvailabilityForWaitlist->id;
            $booking_data['status'] = 'waitlist';
            $booking_data['payment_gateway'] = 'pay_later';
            $booking_data['payment_method'] = 'full';
        }

        try {
            $booking = $booking_service->createBooking($booking_data);
            // BookingService returns ['success'=>bool, 'booking_id'=>int, ...]
            $booking_id = $booking['booking_id'] ?? $booking['id'] ?? null;
            if (empty($booking['success'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => $booking['message'] ?? __('Failed to create booking. Please try again.', 'yatra'),
                    'error'   => $booking['message'] ?? '',
                    'errors'  => $booking['errors'] ?? null,
                ], 500);
            }
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to create booking. Please try again.', 'yatra'),
                'error' => $e->getMessage(),
            ], 500);
        }

        if (empty($booking_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to create booking. Please try again.', 'yatra'),
                'error' => __('Booking ID was not generated.', 'yatra'),
            ], 500);
        }

        if ($isWaitlistCheckout && $resolvedAvailabilityForWaitlist) {
            \Yatra\Services\WaitlistService::incrementAvailabilityWaitlistCount(
                (int) $resolvedAvailabilityForWaitlist->id,
                $travelers_count
            );
        }

        // Get the actual booking reference from database
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $saved_booking = $bookingRepository->find($booking_id);
        if ($saved_booking && !empty($saved_booking->reference)) {
            $booking_reference = $saved_booking->reference;
        }

        // ========================================
        // SAVE ADDITIONAL SERVICES (Premium Feature)
        // ========================================
        /**
         * Action: Save additional services for the booking
         * Allows premium modules to save selected services with the booking
         * 
         * @param int $booking_id The booking ID
         * @param int $trip_id The trip ID
         * @param array $data The booking request data (contains selected_services)
         * @param int $travelers_count Total number of travelers
         * @param int $duration_days Trip duration in days
         * @since 3.0.0
         */
        do_action('yatra_booking_save_services', $booking_id, $trip_id, $data, $travelers_count, (int) ($trip->duration_days ?? 1));

        // ========================================
        // SAVE TRAVELLERS TO NORMALIZED TABLES
        // ========================================
        // Each traveller is saved to yatra_booking_travellers table
        // Their dynamic fields are saved to yatra_booking_traveller_meta table
        foreach ($sanitized_travelers as $index => $traveler_fields) {
            // First traveller (index 0) is always the lead traveller
            $is_lead = ($index === 0);
            
            // Create traveller record with all their fields stored in meta
            $this->travellerRepository->create(
                $booking_id,
                $index,
                $is_lead,
                $traveler_fields
            );
        }

        if ($isWaitlistCheckout && $resolvedAvailabilityForWaitlist) {
            yatra_clear_booking_session();
            if ($settings['booking_confirmation']) {
                $booking_service->sendNewBookingTransactionalConfirmation((int) $booking_id);
            }

            return new WP_REST_Response([
                'success' => true,
                'message' => __('You are on the waitlist. We will contact you if a space opens up.', 'yatra'),
                'data' => [
                    'booking_id' => $booking_id,
                    'reference' => $booking_reference,
                    'status' => 'waitlist',
                    'waitlist' => true,
                    'redirect_url' => $this->getConfirmationUrl($booking_reference),
                    'customer_email' => $contact_data['email'],
                    'customer_name' => trim($contact_data['first_name'] . ' ' . $contact_data['last_name']),
                    'trip_id' => $trip_id,
                    'trip_date' => $travel_date,
                    'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
                    'total_amount' => $total_amount,
                    'amount_due' => $amount_due,
                ],
            ]);
        }

        // Departure link + booked_count: handled inside BookingService::createBooking (and inventory sync hooks).
        // Persist travel window on the booking row for reporting (optional columns).
        if (!empty($travel_date)) {
            try {
                $start_date = $travel_date;
                $duration_days = !empty($trip->duration_days) ? (int) $trip->duration_days : 1;
                $end_date = date('Y-m-d', strtotime($start_date . ' + ' . ($duration_days - 1) . ' days'));
                $bookingColumns = $this->bookingRepository->getTableColumns();
                $bookingUpdateData = [];
                if (in_array('start_date', $bookingColumns, true)) {
                    $bookingUpdateData['start_date'] = $start_date;
                }
                if (in_array('end_date', $bookingColumns, true)) {
                    $bookingUpdateData['end_date'] = $end_date;
                }
                if ($bookingUpdateData !== []) {
                    $this->bookingRepository->update($booking_id, $bookingUpdateData);
                }
            } catch (\Exception $e) {
                // Non-fatal
            }
        }

        // Clear booking session
        yatra_clear_booking_session();

        // Check if this is an offline gateway
        $is_offline = $is_offline_gateway;

        // For online gateways, create payment intent and return redirect URL
        if (!$is_offline && $amount_due > 0) {
            // Build payment params - merge with request data so gateways can access their own tokens
            $payment_params = array_merge($data, [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'amount' => $amount_due,
                'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
                'customer_email' => $contact_data['email'],
                'customer_name' => $contact_data['first_name'] . ' ' . $contact_data['last_name'],
                'trip_title' => $trip->title,
            ]);
            
            // Process payment based on gateway
            $payment_result = $this->processPaymentGateway($payment_gateway, $payment_params);
            
            if ($payment_result['success']) {
                // Handle redirect-based gateways (PayPal, eSewa, Khalti, etc.)
                if (!empty($payment_result['payment_url'])) {
                    if ($settings['booking_confirmation']) {
                        $booking_service->sendNewBookingTransactionalConfirmation((int) $booking_id);
                    }
                    return new WP_REST_Response([
                        'success' => true,
                        'message' => __('Booking created. Redirecting to payment...', 'yatra'),
                        'data' => [
                            'booking_id' => $booking_id,
                            'reference' => $booking_reference,
                            'payment_url' => $payment_result['payment_url'],
                        ],
                    ]);
                }
                
                // Handle client-side payment gateways (Stripe, Razorpay, Square, etc.)
                if (!empty($payment_result['requires_action'])) {
                    if ($settings['booking_confirmation']) {
                        $booking_service->sendNewBookingTransactionalConfirmation((int) $booking_id);
                    }
                    return new WP_REST_Response([
                        'success' => true,
                        'message' => __('Booking created. Complete payment...', 'yatra'),
                        'data' => array_merge([
                            'booking_id' => $booking_id,
                            'reference' => $booking_reference,
                        ], $payment_result),
                    ]);
                }
            }
            
            // If payment processing failed, return error so user can fix the issue
            if (!$payment_result['success']) {
                $errorMessage = $payment_result['error'] ?? $payment_result['message'] ?? __('Payment processing failed. Please try again.', 'yatra');
                return new WP_REST_Response([
                    'success' => false,
                    'message' => $errorMessage,
                    'data' => [
                        'booking_id' => $booking_id,
                        'reference' => $booking_reference,
                        'payment_error' => true,
                    ],
                ]);
            }
        }

        // ========================================
        // DETERMINE BOOKING STATUS
        // ========================================
        // Priority: 
        // 1. auto_confirm_bookings setting (confirms ALL bookings automatically)
        // 2. For pay_later: auto_confirm_pay_later setting
        // 3. For bank_transfer: always pending until verified
        
        $booking_status = 'pending';
        $status_message = __('Booking received!', 'yatra');
        
        // Check if auto-confirm all bookings is enabled
        if ($settings['auto_confirm_bookings']) {
            // Auto-confirm is enabled - confirm immediately regardless of payment
            $booking_status = 'confirmed';
            $status_message = __('Booking confirmed!', 'yatra');
        } elseif ($payment_gateway === 'pay_later') {
            // Pay Later: Check the specific pay_later auto-confirm setting
            if ($settings['auto_confirm_pay_later']) {
                $booking_status = 'confirmed';
                $status_message = __('Booking confirmed! Payment will be collected later.', 'yatra');
            } else {
                $booking_status = 'pending';
                $status_message = __('Booking received! We will contact you to arrange payment.', 'yatra');
            }
        } elseif ($payment_gateway === 'bank_transfer') {
            // Bank Transfer: Always pending until payment is verified by admin
            $booking_status = 'pending';
            $status_message = __('Booking received! Please complete the bank transfer. We will confirm once payment is verified.', 'yatra');
        }
        
        // Calculate booking expiry time for pending bookings
        $expiry_datetime = null;
        if ($booking_status === 'pending' && $settings['booking_expiry_hours'] > 0) {
            $expiry_datetime = date('Y-m-d H:i:s', strtotime('+' . $settings['booking_expiry_hours'] . ' hours'));
        }
        
        // Set confirmed_at if auto-confirmed
        $confirmed_at = ($booking_status === 'confirmed') ? current_time('mysql') : null;
        
        // Update booking status with additional metadata
        $update_data = [
            'status' => $booking_status,
            'payment_status' => 'pending', // No payment made yet for offline gateways
        ];
        
        if ($confirmed_at) {
            $update_data['confirmed_at'] = $confirmed_at;
        }
        
        if ($expiry_datetime) {
            $update_data['expires_at'] = $expiry_datetime;
        }
        
        // Use repository to update booking
        $this->bookingRepository->update($booking_id, $update_data);

        /**
         * yatra_booking_created already fired from BookingService::createBooking — do not fire again here
         * (duplicate admin + Pro automation).
         *
         * Synthetic pending→confirmed on the same request duplicates Pro "booking.confirmed" sequences with the
         * checkout confirmation email. Skip by default; restore with:
         * add_filter('yatra_skip_checkout_autoconfirm_status_changed_event', '__return_false');
         */
        if ($booking_status === 'confirmed') {
            if (!apply_filters('yatra_skip_checkout_autoconfirm_status_changed_event', true, (int) $booking_id, 'pending', 'confirmed')) {
                do_action('yatra_booking_status_changed', (int) $booking_id, 'pending', 'confirmed');
            }
        }

        // ========================================
        // SEND CONFIRMATION EMAIL
        // ========================================
        if ($settings['booking_confirmation']) {
            $this->sendBookingConfirmationEmail($booking_id, $booking_reference, $trip, [
                'contact' => $contact_data,
                'emergency' => $emergency_data,
                'travelers' => $sanitized_travelers,
                'travel_date' => $travel_date,
                'payment_method' => $payment_method,
                'payment_gateway' => $payment_gateway,
                'total_amount' => $total_amount,
                'amount_due' => $amount_due,
                'booking_status' => $booking_status,
                'cancellation_policy' => $settings['cancellation_policy'],
                'cancellation_days' => $settings['cancellation_days'],
                'expiry_datetime' => $expiry_datetime,
            ]);
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => $status_message,
            'data' => [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'status' => $booking_status,
                'payment_status' => 'pending',
                'redirect_url' => $this->getConfirmationUrl($booking_reference),
                'customer_email' => $contact_data['email'],
                'customer_name' => trim($contact_data['first_name'] . ' ' . $contact_data['last_name']),
                'trip_id' => $trip_id,
                'trip_date' => $travel_date,
                'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
                'amount' => $amount_due,
                'subtotal' => $subtotal_before_discount,
                'discount_amount' => $discount_amount,
                'discount_code' => $discount_code,
                'total_amount' => $total_amount,
            ],
        ]);
    }
    
    
    /**
     * Get confirmation page URL (see yatra_get_booking_confirmation_url()).
     */
    private function getConfirmationUrl(string $reference): string
    {
        return yatra_get_booking_confirmation_url($reference);
    }

    /**
     * Whether the gateway completes without an external payment step (registry flag + fallback).
     */
    private function isOfflineGateway(string $gatewayId): bool
    {
        try {
            $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
            $gateway = $registry->get($gatewayId);
            if ($gateway) {
                return $gateway->isOffline();
            }
        } catch (\Throwable $e) {
            // Fall through to legacy IDs
        }

        return in_array($gatewayId, ['pay_later', 'bank_transfer'], true);
    }

    /**
     * Pay balance due on an existing booking only.
     *
     * Does not call BookingService::createBooking() or insert a second booking row.
     * Initiates gateway flow with the stored booking_id; on success, payment is recorded
     * via PaymentGatewayController::handle_successful_payment, webhooks, or recordGatewayPayment
     * — same completion paths as initial checkout.
     */
    private function process_remaining_payment(WP_REST_Request $request): WP_REST_Response
    {
        $data = $request->get_json_params();
        if (!is_array($data)) {
            $data = [];
        }
        $payment_gateway = strtolower(trim(sanitize_text_field($data['payment_gateway'] ?? 'pay_later')));

        $session = yatra_get_remaining_session();

        $booking_id = (int) ($session['booking_id'] ?? 0);
        $booking_reference = (string) ($session['booking_reference'] ?? '');
        $currency = (string) ($session['currency'] ?? '');
        $contact_email = (string) ($session['contact_email'] ?? '');
        $contact_first_name = (string) ($session['contact_first_name'] ?? '');
        $contact_last_name = (string) ($session['contact_last_name'] ?? '');
        $trip_id = (int) ($session['trip_id'] ?? 0);
        $trip_title = (string) ($session['trip_title'] ?? '');
        $travel_date = (string) ($session['travel_date'] ?? '');

        if ($booking_id <= 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid booking for remaining payment.', 'yatra'),
            ], 400);
        }

        $booking = $this->bookingRepository->find($booking_id);
        if (!$booking) {
            yatra_clear_remaining_session();
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
        }

        if ($booking_reference === '' && !empty($booking->reference)) {
            $booking_reference = (string) $booking->reference;
        }

        // Authoritative balance from DB (do not rely on session alone)
        $remaining_amount = (float) ($booking->amount_due ?? 0);
        if ($remaining_amount <= 0 && isset($booking->total_amount)) {
            $remaining_amount = max(
                0,
                (float) $booking->total_amount - (float) ($booking->amount_paid ?? 0)
            );
        }

        if ($remaining_amount <= 0) {
            yatra_clear_remaining_session();
            return new WP_REST_Response([
                'success' => false,
                'message' => __('This booking is already fully paid.', 'yatra'),
            ], 400);
        }

        // Verify user owns this booking
        $current_user = get_current_user_id();
        if ($current_user && (int) $booking->user_id !== $current_user) {
            yatra_clear_remaining_session();
            return new WP_REST_Response([
                'success' => false,
                'message' => __('You do not have permission to pay for this booking.', 'yatra'),
            ], 403);
        }

        if ($currency === '') {
            $currency = (string) ($booking->currency ?? SettingsService::getCurrency());
        }

        // Use contact info from session or booking
        $customer_email = $contact_email !== '' ? $contact_email : (string) ($booking->contact_email ?? $booking->customer_email ?? '');
        $customer_name = trim($contact_first_name . ' ' . $contact_last_name);
        if ($customer_name === '') {
            $customer_name = trim(($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? ''));
        }

        if ($customer_email === '') {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Email address is required.', 'yatra'),
            ], 400);
        }

        $is_offline_gateway = $this->isOfflineGateway($payment_gateway);

        // Online gateways: delegate to the same flow as new-booking checkout (PayPal redirect, Stripe intent, etc.).
        // Do not put confirmation URL in redirect_url here — that caused the browser to skip payment entirely.
        if (!$is_offline_gateway && $remaining_amount > 0) {
            $payment_params = array_merge($data, [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'amount' => $remaining_amount,
                'currency' => $currency,
                'customer_email' => $customer_email,
                'customer_name' => $customer_name !== '' ? $customer_name : $customer_email,
                'trip_title' => $trip_title,
            ]);

            $payment_result = $this->processPaymentGateway($payment_gateway, $payment_params);

            if (!empty($payment_result['success'])) {
                if (!empty($payment_result['payment_url'])) {
                    return new WP_REST_Response([
                        'success' => true,
                        'message' => __('Redirecting to payment...', 'yatra'),
                        'data' => [
                            'booking_id' => $booking_id,
                            'reference' => $booking_reference,
                            'payment_url' => $payment_result['payment_url'],
                            'is_remaining_payment' => true,
                        ],
                    ]);
                }

                if (!empty($payment_result['requires_action'])) {
                    return new WP_REST_Response([
                        'success' => true,
                        'message' => __('Complete payment...', 'yatra'),
                        'data' => array_merge(
                            [
                                'booking_id' => $booking_id,
                                'reference' => $booking_reference,
                                'is_remaining_payment' => true,
                            ],
                            $payment_result
                        ),
                    ]);
                }

                if (!empty($payment_result['redirect_url'])) {
                    return new WP_REST_Response([
                        'success' => true,
                        'message' => __('Payment processed.', 'yatra'),
                        'data' => [
                            'booking_id' => $booking_id,
                            'reference' => $booking_reference,
                            'redirect_url' => $payment_result['redirect_url'],
                            'is_remaining_payment' => true,
                        ],
                    ]);
                }
            }

            $err = $payment_result['message'] ?? $payment_result['error'] ?? __('Payment processing failed. Please try again.', 'yatra');

            return new WP_REST_Response([
                'success' => false,
                'message' => $err,
                'data' => [
                    'payment_error' => true,
                    'booking_id' => $booking_id,
                ],
            ], 400);
        }

        // Offline gateways: no external redirect — confirmation page only
        yatra_clear_remaining_session();

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Continue to confirmation.', 'yatra'),
            'data' => [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'trip_id' => $trip_id,
                'trip_title' => $trip_title,
                'trip_date' => $travel_date,
                'currency' => $currency,
                'amount' => $remaining_amount,
                'customer_email' => $customer_email,
                'customer_name' => $customer_name,
                'redirect_url' => $this->getConfirmationUrl($booking_reference),
                'is_remaining_payment' => true,
            ],
        ]);
    }
    
    /**
     * Process payment through the selected gateway
     */
    private function processPaymentGateway(string $gateway, array $params): array
    {
        // Debug logging
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        
        // All gateways use the unified gateway system
        return $this->processPaymentWithGateway($gateway, $params);
    }
    
    /**
     * Process payment using the proper gateway system
     */
    private function processPaymentWithGateway(string $gatewayId, array $params): array
    {
        try {
            $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
            $gateway = $registry->get($gatewayId);
            
            if (!$gateway) {
                return ['success' => false, 'message' => "Payment gateway '{$gatewayId}' not found"];
            }

            if (!$gateway->isEnabled()) {
                return [
                    'success' => false,
                    'message' => __('This payment method is not available.', 'yatra'),
                ];
            }

            if (!$gateway->isProperlyConfigured()) {
                return [
                    'success' => false,
                    'message' => GatewayUserMessages::gatewayNotConfigured($gateway),
                ];
            }
            
            // Prepare payment data - pass all params, gateways extract what they need.
            // Default return_url to the configured booking confirmation URL so redirect gateways
            // (e.g. PayPal Advanced, Mollie, Paystack) do not fall back to wrong paths; gateways
            // may still append their own query args on top of this URL.
            $ref = isset($params['reference']) ? trim((string) $params['reference']) : '';
            $paymentData = array_merge($params, [
                'description' => $params['trip_title'] ?? '',
                'cancel_url' => home_url('/book/?payment=cancelled&ref=' . ($params['reference'] ?? '')),
                'metadata' => [
                    'booking_id' => $params['booking_id'],
                    'reference' => $params['reference'] ?? ''
                ]
            ]);
            if ($ref !== '' && empty($paymentData['return_url'])) {
                $paymentData['return_url'] = $this->getConfirmationUrl($ref);
            }
            
            // Process the payment through the gateway
            $result = $gateway->processPayment($paymentData);
            
            // Debug logging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            
            if ($result['success']) {
                // Save transaction ID for tracking
                if (!empty($result['transaction_id'])) {
                    $this->bookingRepository->updatePaymentSessionId(
                        (int) $params['booking_id'],
                        $result['transaction_id']
                    );
                }
                
                // For gateways that require client-side action (Stripe, Razorpay, etc.)
                // Payment will be recorded after client completes the action
                if (!empty($result['requires_action'])) {
                    return array_merge(['success' => true], $result);
                }
                
                // For gateways that return a redirect URL for external payment (PayPal, eSewa, Khalti)
                // Payment will be recorded on callback/return
                if (!empty($result['redirect_url']) || !empty($result['payment_url'])) {
                    // Check if this is a completed payment with redirect (like Square)
                    // vs pending external payment (like PayPal)
                    $isCompletedPayment = !empty($result['transaction_id']) && 
                        (($result['status'] ?? '') === 'completed' || ($result['status'] ?? '') === 'succeeded');
                    
                    if ($isCompletedPayment) {
                        $this->recordGatewayPayment($params, $result, $gatewayId);
                    }
                    
                    return [
                        'success' => true, 
                        'payment_url' => $result['redirect_url'] ?? $result['payment_url']
                    ];
                }
                
                // For offline gateways or successful direct payments without redirect
                return [
                    'success' => true, 
                    'redirect_url' => $this->getConfirmationUrl($params['reference'] ?? '')
                ];
            }
            
            // Log the payment failure for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                }
            
            return [
                'success' => false, 
                'message' => $result['message'] ?? $result['error'] ?? 'Payment processing failed. Please try again.'
            ];
            
        } catch (\Exception $e) {
            // Log the exception for debugging
            return [
                'success' => false, 
                'message' => 'An unexpected error occurred. Please try again or contact support.'
            ];
        }
    }
    
    /**
     * Record payment from gateway result
     * Matches Stripe's completePayment behavior
     */
    private function recordGatewayPayment(array $params, array $result, string $gatewayId): void
    {
        global $wpdb;
        
        try {
            $bookingId = (int) $params['booking_id'];
            $amount = (float) ($params['amount'] ?? 0);
            $currency = $params['currency'] ?? 'USD';
            $transactionId = $result['transaction_id'] ?? '';
            
            // Get booking
            $booking = $this->bookingRepository->find($bookingId);
            if (!$booking || $booking->payment_status === 'paid') {
                return;
            }
            
            // Record the payment using PaymentRepository
            $paymentRepository = new \Yatra\Repositories\PaymentRepository();
            $payment_id = $paymentRepository->create([
                'booking_id' => $bookingId,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => $gatewayId,
                'transaction_id' => $transactionId,
                'status' => 'completed',
                'created_at' => current_time('mysql'),
            ]);
            
            // Calculate total paid
            $paymentRepository = new \Yatra\Repositories\PaymentRepository();
            
            // Fire payment completed action
            do_action('yatra_payment_completed', [
                'booking_id' => $bookingId,
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => $gatewayId,
            ]);
            
            } catch (\Exception $e) {
            }
    }
    
    /**
     * Process PayPal payment
     */
    private function processPayPalPayment(array $params, array $config, bool $is_test): array
    {
        $client_id = $config['client_id'] ?? '';
        $client_secret = $config['client_secret'] ?? '';
        
        if (empty($client_id) || empty($client_secret)) {
            return ['success' => false, 'message' => 'PayPal credentials not configured'];
        }
        
        $base_url = $is_test ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        
        try {
            // Get access token
            $auth_response = wp_remote_post($base_url . '/v1/oauth2/token', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => 'grant_type=client_credentials',
            ]);
            
            if (is_wp_error($auth_response)) {
                return ['success' => false, 'message' => $auth_response->get_error_message()];
            }
            
            $auth_body = json_decode(wp_remote_retrieve_body($auth_response), true);
            $access_token = $auth_body['access_token'] ?? '';
            
            if (empty($access_token)) {
                return ['success' => false, 'message' => 'Failed to get PayPal access token'];
            }
            
            // Create order
            $order_response = wp_remote_post($base_url . '/v2/checkout/orders', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type' => 'application/json',
                ],
                'body' => wp_json_encode([
                    'intent' => 'CAPTURE',
                    'purchase_units' => [[
                        'reference_id' => $params['reference'],
                        'amount' => [
                            'currency_code' => $params['currency'],
                            'value' => number_format($params['amount'], 2, '.', ''),
                        ],
                        'description' => $params['trip_title'],
                    ]],
                    'application_context' => [
                        'return_url' => add_query_arg('payment', 'success', $this->getConfirmationUrl($params['reference'])),
                        'cancel_url' => home_url('/book/?payment=cancelled&ref=' . $params['reference']),
                    ],
                ]),
            ]);
            
            if (is_wp_error($order_response)) {
                return ['success' => false, 'message' => $order_response->get_error_message()];
            }
            
            $order_body = json_decode(wp_remote_retrieve_body($order_response), true);
            
            // Find approval link
            foreach ($order_body['links'] ?? [] as $link) {
                if ($link['rel'] === 'approve') {
                    // Save order ID for capture later
                    $this->bookingRepository->updatePaymentSessionId(
                        (int) $params['booking_id'],
                        $order_body['id'] ?? ''
                    );

                    return ['success' => true, 'payment_url' => $link['href']];
                }
            }
            
            return ['success' => false, 'message' => 'Failed to create PayPal order'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Process Razorpay payment
     */
    private function processRazorpayPayment(array $params, array $config, bool $is_test): array
    {
        $key_id = $config['api_key'] ?? '';
        $key_secret = $config['api_secret'] ?? '';
        
        if (empty($key_id) || empty($key_secret)) {
            return ['success' => false, 'message' => 'Razorpay credentials not configured'];
        }
        
        try {
            // Create Razorpay order
            $response = wp_remote_post('https://api.razorpay.com/v1/orders', [
                'headers' => [
                    'Authorization' => 'Basic ' . base64_encode($key_id . ':' . $key_secret),
                    'Content-Type' => 'application/json',
                ],
                'body' => wp_json_encode([
                    'amount' => (int) ($params['amount'] * 100), // Amount in paise
                    'currency' => $params['currency'],
                    'receipt' => $params['reference'],
                    'notes' => [
                        'booking_id' => $params['booking_id'],
                        'trip' => $params['trip_title'],
                    ],
                ]),
            ]);
            
            if (is_wp_error($response)) {
                return ['success' => false, 'message' => $response->get_error_message()];
            }
            
            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!empty($body['id'])) {
                // Save order ID
                $this->bookingRepository->updatePaymentSessionId(
                    (int) $params['booking_id'],
                    $body['id']
                );

                // Razorpay requires client-side integration, return data for JS
                // Store order details and redirect to a payment page
                $payment_url = add_query_arg([
                    'razorpay_order' => $body['id'],
                    'booking_ref' => $params['reference'],
                    'key' => $key_id,
                    'amount' => (int) ($params['amount'] * 100),
                    'currency' => $params['currency'],
                    'name' => get_bloginfo('name'),
                    'description' => $params['trip_title'],
                    'email' => $params['customer_email'],
                ], home_url('/yatra-payment/razorpay/'));
                
                return ['success' => true, 'payment_url' => $payment_url];
            }
            
            return ['success' => false, 'message' => $body['error']['description'] ?? 'Failed to create Razorpay order'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Process eSewa payment
     */
    private function processEsewaPayment(array $params, array $config, bool $is_test): array
    {
        $merchant_id = $config['merchant_id'] ?? '';
        
        if (empty($merchant_id)) {
            return ['success' => false, 'message' => 'eSewa merchant ID not configured'];
        }
        
        $base_url = $is_test ? 'https://uat.esewa.com.np/epay/main' : 'https://esewa.com.np/epay/main';
        
        // eSewa uses form redirect, build URL with parameters
        $payment_url = add_query_arg([
            'amt' => $params['amount'],
            'psc' => 0,
            'pdc' => 0,
            'txAmt' => 0,
            'tAmt' => $params['amount'],
            'pid' => $params['reference'],
            'scd' => $merchant_id,
            'su' => add_query_arg(
                ['payment' => 'success', 'gateway' => 'esewa'],
                $this->getConfirmationUrl($params['reference'])
            ),
            'fu' => home_url('/book/?payment=failed&ref=' . $params['reference']),
        ], $base_url);
        
        return ['success' => true, 'payment_url' => $payment_url];
    }
    
    /**
     * Process Khalti payment
     */
    private function processKhaltiPayment(array $params, array $config, bool $is_test): array
    {
        $secret_key = $config['api_secret'] ?? '';
        
        if (empty($secret_key)) {
            return ['success' => false, 'message' => 'Khalti secret key not configured'];
        }
        
        $base_url = $is_test ? 'https://a.khalti.com/api/v2/epayment/initiate/' : 'https://khalti.com/api/v2/epayment/initiate/';
        
        try {
            $response = wp_remote_post($base_url, [
                'headers' => [
                    'Authorization' => 'Key ' . $secret_key,
                    'Content-Type' => 'application/json',
                ],
                'body' => wp_json_encode([
                    'return_url' => add_query_arg(
                        ['payment' => 'success', 'gateway' => 'khalti'],
                        $this->getConfirmationUrl($params['reference'])
                    ),
                    'website_url' => home_url(),
                    'amount' => (int) ($params['amount'] * 100), // Amount in paisa
                    'purchase_order_id' => $params['reference'],
                    'purchase_order_name' => $params['trip_title'],
                    'customer_info' => [
                        'name' => $params['customer_name'],
                        'email' => $params['customer_email'],
                    ],
                ]),
            ]);
            
            if (is_wp_error($response)) {
                return ['success' => false, 'message' => $response->get_error_message()];
            }
            
            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!empty($body['payment_url'])) {
                // Save pidx for verification
                $this->bookingRepository->updatePaymentSessionId(
                    (int) $params['booking_id'],
                    $body['pidx'] ?? ''
                );

                return ['success' => true, 'payment_url' => $body['payment_url']];
            }
            
            return ['success' => false, 'message' => $body['detail'] ?? 'Failed to initiate Khalti payment'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Process Authorize.net payment
     */
    private function processAuthorizeNetPayment(array $params, array $config, bool $is_test): array
    {
        // Authorize.net typically requires hosted payment page or client-side integration
        // Return URL for hosted payment page setup
        return [
            'success' => true, 
            'payment_url' => add_query_arg([
                'booking_ref' => $params['reference'],
                'amount' => $params['amount'],
                'gateway' => 'authorize_net',
            ], home_url('/yatra-payment/authorize-net/'))
        ];
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): string
    {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field($_SERVER[$key]);
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }

    /**
     * Send booking confirmation email
     */
    private function sendBookingConfirmationEmail(int $booking_id, string $reference, object $trip, array $data): void
    {
        $contact = $data['contact'] ?? [];
        $travelers = $data['travelers'] ?? [];
        $travel_date = $data['travel_date'] ?? '';
        $total_amount = $data['total_amount'] ?? 0;
        $amount_due = $data['amount_due'] ?? 0;
        $payment_method = $data['payment_method'] ?? 'full';
        $payment_gateway = $data['payment_gateway'] ?? 'pay_later';
        $booking_status = $data['booking_status'] ?? 'pending';
        $cancellation_policy = $data['cancellation_policy'] ?? 'full_refund';
        $cancellation_days = $data['cancellation_days'] ?? 7;
        $expiry_datetime = $data['expiry_datetime'] ?? null;
        
        $customer_email = $contact['email'] ?? '';
        $customer_name = trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? ''));
        
        if (empty($customer_email)) {
            return;
        }
        
        // Format prices using global currency settings
        $formatted_total = yatra_format_price($total_amount);
        $formatted_due = yatra_format_price($amount_due);

        $intro_paragraph = $booking_status === 'confirmed'
            ? __('Thank you for your booking! Your reservation has been confirmed.', 'yatra')
            : __('Thank you for your booking! Your reservation has been received and is pending confirmation.', 'yatra');
        if ($booking_status === 'pending' && $expiry_datetime) {
            $intro_paragraph .= ' ' . sprintf(
                __('Please complete your payment before %s to avoid automatic cancellation.', 'yatra'),
                date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($expiry_datetime))
            );
        }

        ob_start();
        ?>
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong><?php esc_html_e('Booking reference', 'yatra'); ?>:</strong> <?php echo esc_html($reference); ?></p>
            <p style="margin:0 0 8px;"><strong><?php esc_html_e('Trip', 'yatra'); ?>:</strong> <?php echo esc_html($trip->title); ?></p>
            <p style="margin:0 0 8px;"><strong><?php esc_html_e('Travel date', 'yatra'); ?>:</strong> <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($travel_date))); ?></p>
            <p style="margin:0 0 8px;"><strong><?php esc_html_e('Duration', 'yatra'); ?>:</strong> <?php echo esc_html(sprintf(__('%d days / %d nights', 'yatra'), (int) $trip->duration_days, (int) $trip->duration_nights)); ?></p>
            <p style="margin:0;"><strong><?php esc_html_e('Travelers', 'yatra'); ?>:</strong> <?php echo esc_html((string) count($travelers)); ?></p>
        </div>
        <h3 style="font-size:16px;"><?php esc_html_e('Payment details', 'yatra'); ?></h3>
        <p><?php echo esc_html(sprintf(__('Total: %s', 'yatra'), $formatted_total)); ?></p>
        <?php if ($payment_method === 'deposit') : ?>
            <p><?php echo esc_html(sprintf(__('Payment type: Deposit — due now %s, remaining %s', 'yatra'), $formatted_due, yatra_format_price($total_amount - $amount_due))); ?></p>
        <?php elseif ($payment_method === 'partial') : ?>
            <p><?php echo esc_html(sprintf(__('Payment type: Partial — due now %s, remaining %s', 'yatra'), $formatted_due, yatra_format_price($total_amount - $amount_due))); ?></p>
        <?php else : ?>
            <p><?php esc_html_e('Payment type: Full payment', 'yatra'); ?></p>
        <?php endif; ?>
        <?php if ($payment_gateway === 'pay_later') : ?>
            <p><?php esc_html_e('Pay later — please contact us to arrange payment.', 'yatra'); ?></p>
        <?php elseif ($payment_gateway === 'bank_transfer') : ?>
            <p><?php esc_html_e('Bank transfer — you will receive bank details separately.', 'yatra'); ?></p>
        <?php endif; ?>
        <h3 style="font-size:16px;"><?php esc_html_e('Travelers', 'yatra'); ?></h3>
        <ul style="padding-left:20px;">
            <?php foreach ($travelers as $i => $traveler) : ?>
                <?php
                $traveler_name = trim(($traveler['first_name'] ?? '') . ' ' . ($traveler['last_name'] ?? ''));
                ?>
                <li><?php echo esc_html(sprintf(__('Traveler %d: %s', 'yatra'), $i + 1, $traveler_name ?: '—')); ?></li>
            <?php endforeach; ?>
        </ul>
        <?php
        $cancellation_policy_labels = [
            'full_refund' => __('Full refund available', 'yatra'),
            'partial_refund' => __('Partial refund available', 'yatra'),
            'no_refund' => __('No refund available', 'yatra'),
            'flexible' => __('Flexible cancellation', 'yatra'),
        ];
        $policy_label = $cancellation_policy_labels[$cancellation_policy] ?? __('Standard policy applies', 'yatra');
        ?>
        <h3 style="font-size:16px;"><?php esc_html_e('Cancellation policy', 'yatra'); ?></h3>
        <p><?php echo esc_html($policy_label); ?> — <?php echo esc_html(sprintf(__('free cancellation up to %d days before departure', 'yatra'), (int) $cancellation_days)); ?></p>
        <?php
        $custom_refund_policy = SettingsService::getString('refund_policy', '');
        if ($custom_refund_policy !== '') {
            echo '<p>' . esc_html($custom_refund_policy) . '</p>';
        }
        ?>
        <h3 style="font-size:16px;"><?php esc_html_e('What’s next?', 'yatra'); ?></h3>
        <ol style="padding-left:20px;">
            <li><?php esc_html_e('You will receive a detailed trip itinerary within 24–48 hours.', 'yatra'); ?></li>
            <li><?php esc_html_e('Our team will contact you to confirm any special requirements.', 'yatra'); ?></li>
            <li><?php esc_html_e('Please ensure passports are valid for at least 6 months.', 'yatra'); ?></li>
        </ol>
        <p><?php esc_html_e('If you have any questions, contact us anytime.', 'yatra'); ?></p>
        <p><a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(home_url('/')); ?></a></p>
        <?php
        $details_html = ob_get_clean();

        $vars = [
            'customer_name' => $customer_name,
            'customer_first_name' => (string) ($contact['first_name'] ?? ''),
            'customer_last_name' => (string) ($contact['last_name'] ?? ''),
            'customer_email' => $customer_email,
            'customer_phone' => (string) ($contact['phone'] ?? ''),
            'booking_reference' => $reference,
            'booking_id' => (string) $booking_id,
            'trip_name' => (string) $trip->title,
            'trip_url' => home_url('/' . SettingsService::getTripBase() . '/' . rawurlencode((string) ($trip->slug ?? '')) . '/'),
            'travel_date' => date_i18n(get_option('date_format'), strtotime($travel_date)),
            'travelers_count' => (string) count($travelers),
            'total_amount_formatted' => $formatted_total,
            'amount_due_formatted' => $formatted_due,
            'currency' => SettingsService::getCurrency(),
            'intro_paragraph' => $intro_paragraph,
            'details_html' => $details_html,
            'details_html_only' => '1',
            'footer_note' => sprintf(__('— %s', 'yatra'), get_bloginfo('name')),
            'transactional_context' => 'booking_created',
        ];

        TransactionalEmailTemplateService::sendIfEnabled(
            TransactionalEmailTemplateService::TYPE_BOOKING_CONFIRMATION,
            $customer_email,
            $vars
        );

        // Admin new-booking email is sent from NotificationService (yatra_booking_created) using
        // Email → Templates → Admin: New booking, to avoid duplicate messages.
    }

    /**
     * Apply coupon code to booking session
     */
    public function apply_coupon(WP_REST_Request $request): WP_REST_Response
    {
        yatra_start_session();
        
        $data = $request->get_json_params();
        $code = isset($data['code']) ? strtoupper(sanitize_text_field($data['code'])) : '';
        
        if (empty($code)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Please enter a coupon code.', 'yatra'),
            ], 400);
        }
        
        // Get current session
        $session = yatra_get_booking_session();
        if (empty($session) || empty($session['trip_id'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No active booking session found.', 'yatra'),
            ], 400);
        }
        
        // Use DiscountService to calculate coupon discount
        $discountService = new \Yatra\Services\DiscountService();
        $total_amount = $this->calculateSessionTotal($session);
        $trip_id = (int) $session['trip_id'];
        $travelers_count = (int) ($session['travelers'] ?? 1);
        $traveler_counts = $session['traveler_counts'] ?? [];
        
        $coupon_result = $discountService->calculateCouponDiscount(
            $code,
            $total_amount,
            $trip_id,
            $travelers_count,
            $traveler_counts
        );
        
        // Check if discount was calculated (validation passed)
        if ($coupon_result['calculated_amount'] <= 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('This coupon is not valid for your booking.', 'yatra'),
            ], 400);
        }
        
        $discount_amount = $coupon_result['calculated_amount'];
        
        error_log('apply_coupon - Coupon result: ' . print_r($coupon_result, true));
        error_log('apply_coupon - Original code: ' . $code);
        
        // Store coupon in session (use the original $code variable, not from result)
        $session['coupon'] = [
            'code' => $code,  // Use the actual code that was validated
            'type' => $coupon_result['type'],
            'amount' => $coupon_result['amount'],
            'discount_amount' => $discount_amount,
            'label' => $coupon_result['label'],
        ];
        $session['timestamp'] = time();
        
        yatra_set_booking_session($session);
        
        error_log('apply_coupon - Session coupon stored: ' . print_r($session['coupon'], true));
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Coupon applied successfully!', 'yatra'),
            'data' => [
                'code' => $code,
                'type' => $coupon_result['type'],
                'discount_amount' => $discount_amount,
                'discount_formatted' => yatra_format_price($discount_amount),
                'new_total' => $total_amount - $discount_amount,
                'new_total_formatted' => yatra_format_price($total_amount - $discount_amount),
            ],
        ]);
    }

    /**
     * Calculate booking summary and return HTML for dynamic updates
     * Called via AJAX when traveler count, date, or coupon changes
     */
    public function calculate_summary(WP_REST_Request $request): WP_REST_Response
    {
        yatra_start_session();
        $session = yatra_get_booking_session();
        $data = $request->get_json_params();
        
        error_log('=== calculate_summary CALLED ===');
        error_log('Request data: ' . print_r($data, true));
        error_log('Session traveler_counts: ' . print_r($session['traveler_counts'] ?? 'NOT SET', true));
        error_log('Session travelers: ' . ($session['travelers'] ?? 'NOT SET'));
        
        // Get trip_id from session (required)
        $trip_id = (int) ($session['trip_id'] ?? 0);
        
        // Get traveler_counts from REQUEST (for dynamic updates) or fallback to session
        $traveler_counts = $data['traveler_counts'] ?? ($session['traveler_counts'] ?? []);
        
        // Get other data from request or session
        $travel_date = sanitize_text_field($data['travel_date'] ?? ($session['travel_date'] ?? ''));
        $departure_time = sanitize_text_field($data['departure_time'] ?? ($session['departure_time'] ?? ''));
        $availability_id = $data['availability_id'] ?? ($session['availability_id'] ?? null);
        $pricing_type_from_request = sanitize_text_field($data['pricing_type'] ?? ($session['pricing_type'] ?? ''));
        $payment_method = strtolower(trim(sanitize_text_field($data['payment_method'] ?? ($session['payment_method'] ?? 'full'))));
        if ($payment_method === '') {
            $payment_method = 'full';
        }
        $selected_service_ids_from_request = $data['additional_services'] ?? ($session['additional_services'] ?? null);
        
        // IMPORTANT: Always read coupon from SESSION (not request) to maintain applied discount
        $coupon_code = isset($session['coupon']['code']) ? sanitize_text_field($session['coupon']['code']) : '';
        
        error_log('calculate_summary - Final traveler_counts: ' . print_r($traveler_counts, true));
        error_log('calculate_summary - Coupon from session: ' . $coupon_code);
        
        if (empty($trip_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No active booking session found.', 'yatra'),
            ], 400);
        }
        
        // Get trip data
        $trip = $this->tripRepository->findPublished($trip_id);
        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }
        
        // Ensure pricing fields are properly set
        $trip->original_price = (float) ($trip->original_price ?? 0);
        $trip->discounted_price = !empty($trip->discounted_price) ? (float) $trip->discounted_price : 0;
        $trip->sale_price = !empty($trip->sale_price) ? (float) $trip->sale_price : 0;

        yatra_start_session();
        $existing_session = yatra_get_booking_session();

        global $wpdb;

        $availability = null;
        if (!empty($availability_id) && is_numeric($availability_id)) {
            // Only use getById if availability_id is numeric
            $availability = $this->availabilityService->getById((int) $availability_id);
        } elseif (!empty($travel_date)) {
            // For string IDs or when no availability_id, use date+time lookup for day tours
            $availability = $this->availabilityService->getByTripAndDateTime($trip_id, $travel_date, $departure_time ?: null);
        }
        
        // Resolve pricing type and price_types via centralized TripPricingService
        $resolved_pricing_type = !empty($pricing_type_from_request)
            ? $pricing_type_from_request
            : \Yatra\Services\TripPricingService::resolvePricingType($trip);
        
        $price_types = [];
        
        // First priority: availability price_types (already includes trip fallback from AvailabilityResolutionService)
        if ($availability && !empty($availability->price_types)) {
            $avail_pts = is_string($availability->price_types)
                ? (json_decode($availability->price_types, true) ?: [])
                : $availability->price_types;
            if (!empty($avail_pts) && is_array($avail_pts)) {
                $price_types = array_map(function ($pt) { return (object) $pt; }, $avail_pts);
            }
        }
        // Second priority: trip's price_types via centralized normalizer
        if (empty($price_types)) {
            $normalized = \Yatra\Services\TripPricingService::resolvePriceTypes($trip);
            if (!empty($normalized)) {
                $price_types = array_map(function ($pt) { return (object) $pt; }, $normalized);
            }
        }
        // Auto-detect traveler_based if price_types are present
        if (!empty($price_types)) {
            $resolved_pricing_type = 'traveler_based';
        }

        // Enrich availability price_types with category labels if missing
        if (!empty($price_types)) {
            $missing_label_category_ids = [];
            foreach ($price_types as $pt) {
                $pt = (object) $pt;
                if (empty($pt->category_label) && !empty($pt->category_id)) {
                    $missing_label_category_ids[] = (int) $pt->category_id;
                }
            }

            $missing_label_category_ids = array_values(array_unique(array_filter($missing_label_category_ids)));
            if (!empty($missing_label_category_ids)) {
                // Use AvailabilityService to get traveler categories
                $cats = $this->availabilityService->getTravelerCategories($missing_label_category_ids);

                $catIndex = [];
                foreach ($cats as $cat) {
                    $catIndex[(int) $cat->id] = $cat;
                }

                foreach ($price_types as &$pt) {
                    $pt = (object) $pt;
                    $catId = !empty($pt->category_id) ? (int) $pt->category_id : null;
                    if ($catId && isset($catIndex[$catId])) {
                        $cat = $catIndex[$catId];
                        if (empty($pt->category_label)) {
                            $pt->category_label = $cat->label;
                        }
                        if (empty($pt->category_slug)) {
                            $pt->category_slug = $cat->slug;
                        }
                        if (!isset($pt->age_min)) {
                            $pt->age_min = $cat->age_min ? (int) $cat->age_min : null;
                        }
                        if (!isset($pt->age_max)) {
                            $pt->age_max = $cat->age_max ? (int) $cat->age_max : null;
                        }
                    }
                }
                unset($pt);
            }
        }

        foreach ($price_types as $pt) {
            $pt->effective_price = $pt->effective_price ?? \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice((array) $pt);
        }

        if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
            $spots_remaining = $availability ? (int) ($availability->spots_remaining ?? null) : null;

            foreach ($price_types as $pt) {
                if (!isset($pt->effective_price)) {
                    continue;
                }
                $price_before = $pt->effective_price;
                $pt->effective_price = apply_filters('yatra_trip_display_price', (float) $pt->effective_price, $trip_id, [
                    'departure_date' => $travel_date ?: null,
                    'spots_remaining' => $spots_remaining,
                    'availability_id' => $availability_id,
                    'price_type_id' => $pt->id ?? ($pt->price_type_id ?? null),
                ]);
                }
        }

        $is_traveler_based = $resolved_pricing_type === 'traveler_based' && !empty($price_types);

        // Base trip price via centralized TripPricingService (single source of truth)
        $base_trip_price = \Yatra\Services\TripPricingService::resolveRegularCurrentPrice($trip);
        
        // Override with availability pricing if available
        if ($availability) {
            $avail_price = !empty($availability->discounted_price) && (float) $availability->discounted_price > 0
                ? (float) $availability->discounted_price
                : (!empty($availability->original_price) && (float) $availability->original_price > 0
                    ? (float) $availability->original_price : 0);
            if ($avail_price > 0) {
                $base_trip_price = $avail_price;
            }
        }

        // Apply dynamic pricing filter (Pro DynamicPricingModule hooks here)
        if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
            $base_trip_price = apply_filters('yatra_booking_trip_price', $base_trip_price, $trip_id, [
                'departure_date' => $travel_date,
                'spots_remaining' => $availability ? (int) ($availability->spots_remaining ?? null) : null,
                'availability_id' => $availability_id,
            ]);
        }
        
        // Calculate subtotals per category
        $category_breakdown = [];
        $subtotal = 0;
        $total_travelers = 0;
        $normalized_traveler_counts = [];
        if (!empty($traveler_counts) && is_array($traveler_counts)) {
            foreach ($traveler_counts as $k => $v) {
                $key = is_numeric($k) ? (int) $k : (string) $k;
                $normalized_traveler_counts[$key] = (int) $v;
            }
        }
        
        if ($is_traveler_based && !empty($normalized_traveler_counts)) {
            foreach ($price_types as $pt) {
                $category_id = $pt->category_id;
                $count = (int) ($normalized_traveler_counts[(int) $category_id] ?? ($normalized_traveler_counts[(string) $category_id] ?? 0));
                if ($count > 0) {
                    $category_subtotal = (float) $pt->effective_price * $count;
                    $category_breakdown[] = [
                        'category_id' => $category_id,
                        'label' => $pt->category_label ?? __('Traveler', 'yatra'),
                        'count' => $count,
                        'price' => (float) $pt->effective_price,
                        'subtotal' => $category_subtotal,
                    ];
                    $subtotal += $category_subtotal;
                    $total_travelers += $count;
                }
            }
        } else {
            // Regular pricing
            $total_travelers = array_sum(array_map('intval', $normalized_traveler_counts));
            // If traveler_counts is empty, fallback to session 'travelers' count
            if ($total_travelers < 1) {
                $total_travelers = !empty($session['travelers']) ? (int) $session['travelers'] : 1;
            }
            $price_per_person = $base_trip_price;
            $subtotal = $price_per_person * $total_travelers;
            
            error_log('calculate_summary - Regular pricing: total_travelers=' . $total_travelers . ', subtotal=' . $subtotal);
        }
        
        // Calculate group discount
        $discountService = new \Yatra\Services\DiscountService();
        $travelerCountsForDiscount = [];
        if ($is_traveler_based) {
            foreach ($normalized_traveler_counts as $k => $v) {
                if (is_numeric($k)) {
                    $travelerCountsForDiscount[(int) $k] = (int) $v;
                }
            }
        }
        if (empty($travelerCountsForDiscount)) {
            $travelerCountsForDiscount['default'] = $total_travelers;
        }

        $priceTypesForDiscount = [];
        if ($is_traveler_based) {
            foreach ($price_types as $pt) {
                $pt = (object) $pt;
                $priceTypesForDiscount[] = [
                    'category_id' => $pt->category_id ?? null,
                    'effective_price' => $pt->effective_price ?? \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice((array) $pt),
                ];
            }
        } else {
            $priceTypesForDiscount[] = [
                'category_id' => 'default',
                'effective_price' => $base_trip_price,
            ];
        }

        $group_discount = $discountService->calculateGroupDiscount($trip_id, $travelerCountsForDiscount, $priceTypesForDiscount);
        $group_discount_amount = $group_discount['amount'] ?? 0;
        $group_discount_label = $group_discount['label'] ?? __('Group Discount', 'yatra');
        $group_discount_code = $group_discount['code'] ?? null;
        
        // Calculate coupon discount using DiscountService
        $coupon_discount_amount = 0;
        $coupon_discount_label = '';
        $coupon_error = '';
        
        if (!empty($coupon_code)) {
            $discountService = new \Yatra\Services\DiscountService();
            $subtotal_after_group = $subtotal - $group_discount_amount;
            
            $coupon_result = $discountService->calculateCouponDiscount(
                $coupon_code,
                $subtotal_after_group,
                $trip_id,
                $total_travelers,
                $is_traveler_based ? $normalized_traveler_counts : []
            );
            
            if ($coupon_result['calculated_amount'] > 0) {
                $coupon_discount_amount = $coupon_result['calculated_amount'];
                $coupon_discount_label = $coupon_result['label'];
            } else {
                $coupon_error = __('This coupon is not valid for your booking.', 'yatra');
            }
        }
        
        // Use CalculationService for on-demand pricing calculation
        $calculationService = new CalculationService();
        
        // Initialize additional services (will be populated later via filter)
        $additional_services = [];
        
        // Create session-like data structure for calculation (trip data fetched from database)
        $session_like_data = [
            'trip_id' => $trip_id,
            'travelers' => $total_travelers,
            'traveler_counts' => $traveler_counts,
            'travel_date' => $travel_date,
            'departure_time' => $departure_time,
            'additional_services' => $additional_services
        ];
        
        // Apply filter for pro plugins to modify summary calculation parameters
        $calculation_params = apply_filters('yatra_summary_calculation_params', [
            'session_data' => $session_like_data,
            'coupon_code' => $coupon_code,
            'payment_method' => $payment_method,
        ]);
        
        $pricing = $calculationService->calculateFromSession(
            $calculation_params['session_data'], 
            $calculation_params['coupon_code'], 
            $calculation_params['payment_method']
        );
        
        $total_amount = $pricing['final_total'];
        $amount_due = $pricing['amount_due'];
        $tax_calculation = $pricing['tax_calculation'];
        $total_tax_amount = $pricing['tax_calculation']['total_tax_amount'];
        $tax_inclusive = $pricing['tax_calculation']['tax_inclusive'];
        $tax_breakdown = $pricing['tax_calculation']['tax_breakdown'];
        
        /**
         * Filter: Get additional services for this trip
         * Allows premium modules to add extra services to the booking summary
         * 
         * @param array $services Empty array by default
         * @param int $trip_id The trip ID
         * @param int $total_travelers Total number of travelers
         * @param array $traveler_counts Traveler counts by category
         * @param string $travel_date The travel date
         * @since 3.0.0
         */
        $additional_services = apply_filters('yatra_booking_additional_services', [], $trip_id, $total_travelers, $traveler_counts, $travel_date);
        
        // Get selected services from request (priority) or session
        // If request has additional_services, use that; otherwise fall back to session
        if ($selected_service_ids_from_request !== null) {
            $selected_service_ids = $selected_service_ids_from_request;
        } else {
            $selected_service_ids = isset($existing_session['additional_services']) && is_array($existing_session['additional_services'])
                ? array_map('intval', $existing_session['additional_services'])
                : [];
        }
        
        // Mark which services are selected and calculate their price based on price_per
        $duration_days = (int) ($trip->duration_days ?? 1);
        $default_services_total = 0.0;
        foreach ($additional_services as &$service) {
            $serviceId = (int) $service['id'];
            $isInRequest = in_array($serviceId, $selected_service_ids, true);
            $isRequired = !empty($service['is_required']);
            $isIncluded = !empty($service['is_included']);
            $service['selected'] = $isInRequest || $isRequired || $isIncluded;
            
            // Calculate the price based on price_per (person, day, booking)
            $basePrice = (float) ($service['price'] ?? 0);
            $pricePer = $service['price_per'] ?? 'person';
            
            switch ($pricePer) {
                case 'person':
                    $service['calculated_price'] = $basePrice * $total_travelers;
                    break;
                case 'day':
                    $service['calculated_price'] = $basePrice * max(1, $duration_days);
                    break;
                case 'booking':
                default:
                    $service['calculated_price'] = $basePrice;
                    break;
            }

            if (!empty($service['selected']) && empty($service['is_included'])) {
                $default_services_total += (float) $service['calculated_price'];
            }
        }
        unset($service);
        
        /**
         * Filter: Calculate additional services total
         * Allows premium modules to add services cost to the booking total
         * 
         * @param float $services_total The services total (0 by default)
         * @param array $additional_services The services with 'selected' flag
         * @param int $trip_id The trip ID
         * @param int $total_travelers Total number of travelers
         * @param int $duration_days Trip duration in days
         * @since 3.0.0
         */
        $services_total = apply_filters('yatra_booking_services_total', (float) $default_services_total, $additional_services, $trip_id, $total_travelers, (int) ($trip->duration_days ?? 1));
        
        // Get itinerary costs (separate from additional services)
        $itinerary_costs = apply_filters('yatra_booking_itinerary_costs', [], $trip_id, $total_travelers, $traveler_counts, $travel_date);
        $itinerary_costs_total = 0.0;
        
        foreach ($itinerary_costs as $cost) {
            $basePrice = (float) ($cost['price'] ?? 0);
            $pricePer = $cost['price_per'] ?? 'person';
            
            switch ($pricePer) {
                case 'person':
                    $calculatedPrice = $basePrice * $total_travelers;
                    break;
                case 'day':
                    $calculatedPrice = $basePrice * $duration_days;
                    break;
                case 'booking':
                default:
                    $calculatedPrice = $basePrice;
                    break;
            }
            
            $itinerary_costs_total += $calculatedPrice;
        }
        
        // Note: CalculationService already includes itinerary costs in final_total
        // No need to add itinerary_costs_total again - it's already included in $total_amount
        
        // Calculate due amount based on payment method
        // Use filters for flexible payment settings (Pro feature)
        $flexible_payments_enabled = apply_filters('yatra_flexible_payments_enabled', false);
        $deposit_percentage = (int) apply_filters('yatra_deposit_percentage', 20);
        $partial_percentage = (int) apply_filters('yatra_partial_payment_percentage', 30);
        
        $amount_due = $total_amount;
        if ($payment_method === 'deposit') {
            $amount_due = $total_amount * ($deposit_percentage / 100);
        } elseif ($payment_method === 'partial') {
            $amount_due = $total_amount * ($partial_percentage / 100);
        }

        Logger::debug('Yatra booking summary: payment method and amount due', [
            'context' => 'booking_summary_rest',
            'trip_id' => $trip_id,
            'flexible_payments_enabled' => $flexible_payments_enabled,
            'payment_method' => $payment_method,
            'total_amount' => round($total_amount, 4),
            'amount_due' => round($amount_due, 4),
            'deposit_percentage' => $deposit_percentage,
            'partial_percentage' => $partial_percentage,
        ]);
        
        // Build pricing HTML for the summary section (using CalculationService data)
        $pricing_html = $this->buildPricingHtml([
            'is_traveler_based' => $is_traveler_based,
            'category_breakdown' => $category_breakdown,
            'price_per_person' => $price_per_person ?? $base_trip_price,
            'total_travelers' => $total_travelers,
            'gross_total' => $pricing['gross_total'] ?? $pricing['base_amount'],
            'subtotal' => $pricing['gross_total'] ?? $pricing['base_amount'],
            'taxable_amount' => $pricing['taxable_amount'] ?? 0,
            'group_discount_amount' => $pricing['group_discount']['amount'] ?? 0,
            'group_discount_label' => $pricing['group_discount']['label'] ?? '',
            'coupon_discount_amount' => $pricing['coupon_discount']['calculated_amount'] ?? 0,
            'coupon_discount_label' => $pricing['coupon_discount']['label'] ?? '',
            'coupon_code' => $pricing['coupon_discount']['code'] ?? '',
            'additional_services' => $additional_services,
            'services_total' => $services_total,
            'itinerary_costs' => $itinerary_costs,
            'itinerary_costs_total' => $itinerary_costs_total,
            'total_amount' => $total_amount,
            'amount_due' => $amount_due,
            'payment_method' => $payment_method,
            'deposit_percentage' => $deposit_percentage,
            'partial_percentage' => $partial_percentage,
            // Tax variables from centralized calculation
            'enable_tax' => $pricing['tax_calculation']['enable_tax'],
            'tax_breakdown' => $pricing['tax_calculation']['tax_breakdown'],
            'total_tax_amount' => $pricing['tax_calculation']['total_tax_amount'],
            'tax_inclusive' => $pricing['tax_calculation']['tax_inclusive'],
            // Currency for consistent formatting
            'currency' => $pricing['currency'] ?? \Yatra\Services\SettingsService::getCurrency(),
        ]);
        
        // Build response
        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'is_traveler_based' => $is_traveler_based,
                'category_breakdown' => $category_breakdown,
                'subtotal' => round($subtotal, 2),
                'subtotal_formatted' => yatra_format_price($subtotal),
                'total_travelers' => $total_travelers,
                'group_discount' => $group_discount ? [
                    'amount' => round($group_discount_amount, 2),
                    'amount_formatted' => yatra_format_price($group_discount_amount),
                    'label' => $group_discount_label,
                    'code' => $group_discount_code,
                    'applied_categories' => $group_discount['applied_categories'] ?? [],
                ] : null,
                'coupon_discount' => $coupon_discount_amount > 0 ? [
                    'amount' => round($coupon_discount_amount, 2),
                    'amount_formatted' => yatra_format_price($coupon_discount_amount),
                    'label' => $coupon_discount_label,
                    'code' => $coupon_code,
                ] : null,
                'coupon_error' => $coupon_error,
                'total_discount' => round($group_discount_amount + $coupon_discount_amount, 2),
                'total_discount_formatted' => yatra_format_price($group_discount_amount + $coupon_discount_amount),
                // Additional services (premium feature)
                'additional_services' => $additional_services,
                'services_total' => round($services_total, 2),
                'services_total_formatted' => yatra_format_price($services_total),
                // Itinerary costs (separate from services)
                'itinerary_costs' => $itinerary_costs,
                'itinerary_costs_total' => round($itinerary_costs_total, 2),
                'itinerary_costs_total_formatted' => yatra_format_price($itinerary_costs_total),
                'total_amount' => round($total_amount, 2),
                'total_amount_formatted' => yatra_format_price($total_amount),
                'amount_due' => round($amount_due, 2),
                'amount_due_formatted' => yatra_format_price($amount_due),
                'deposit_percentage' => $deposit_percentage,
                'partial_percentage' => $partial_percentage,
                // HTML for the pricing section
                'pricing_html' => $pricing_html,
            ],
        ]);
    }

    /**
     * Build HTML for the pricing summary section
     * This is returned via AJAX to update the pricing breakdown dynamically
     * Uses the pricing-summary.php template for rendering with Checkout model
     */
    private function buildPricingHtml(array $data): string
    {
        // Get session data to create Checkout model
        yatra_start_session();
        $session = yatra_get_booking_session();
        
        // Get trip data
        $trip_id = (int) ($session['trip_id'] ?? 0);
        if (empty($trip_id)) {
            return '<p>' . __('Pricing information not available.', 'yatra') . '</p>';
        }
        
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trip = $tripRepository->findPublished($trip_id);
        if (!$trip) {
            return '<p>' . __('Trip not found.', 'yatra') . '</p>';
        }
        
        // Build pricing calculation array from data (centralized pricing)
        $resolvedCurrentPrice = \Yatra\Services\TripPricingService::resolveRegularCurrentPrice($trip);
        $pricingCalculation = [
            'original_price' => $trip->original_price ?? 0,
            'discounted_price' => $resolvedCurrentPrice,
            'unit_price' => $data['price_per_person'] ?? $resolvedCurrentPrice,
            'pricing_type' => $session['pricing_type'] ?? 'regular',
            'base_amount' => $data['gross_total'] ?? 0,
            'subtotal' => $data['subtotal'] ?? $data['gross_total'] ?? 0,
            'taxable_amount' => $data['taxable_amount'] ?? 0,
            'gross_total' => $data['gross_total'] ?? 0,
            'final_total' => $data['total_amount'] ?? 0,
            'amount_due' => $data['amount_due'] ?? 0,
            'travelers_count' => $data['total_travelers'] ?? 1,
            'is_traveler_based' => $data['is_traveler_based'] ?? false,
            'category_breakdown' => $data['category_breakdown'] ?? [],
            'group_discount' => [
                'amount' => $data['group_discount_amount'] ?? 0,
                'label' => $data['group_discount_label'] ?? '',
            ],
            'coupon_discount' => [
                'code' => $data['coupon_code'] ?? '',
                'calculated_amount' => $data['coupon_discount_amount'] ?? 0,
                'label' => $data['coupon_discount_label'] ?? '',
            ],
            'total_discount_amount' => ($data['group_discount_amount'] ?? 0) + ($data['coupon_discount_amount'] ?? 0),
            'additional_services' => $data['additional_services'] ?? [],
            'services_total' => $data['services_total'] ?? 0,
            'itinerary_costs' => $data['itinerary_costs'] ?? [],
            'itinerary_costs_total' => $data['itinerary_costs_total'] ?? 0,
            'tax_calculation' => [
                'enable_tax' => $data['enable_tax'] ?? false,
                'tax_breakdown' => $data['tax_breakdown'] ?? [],
                'total_tax_amount' => $data['total_tax_amount'] ?? 0,
                'tax_inclusive' => $data['tax_inclusive'] ?? false,
            ],
            'currency' => $data['currency'] ?? null,
        ];
        
        // Update session with payment method if provided
        if (!empty($data['payment_method'])) {
            $session['payment_method'] = $data['payment_method'];
        }
        if (!empty($data['deposit_percentage'])) {
            $session['deposit_percentage'] = $data['deposit_percentage'];
        }
        if (!empty($data['partial_payment_percentage'])) {
            $session['partial_payment_percentage'] = $data['partial_payment_percentage'];
        }
        if (!empty($data['partial_percentage'])) {
            $session['partial_payment_percentage'] = $data['partial_percentage'];
        }

        if (!empty($data['payment_method']) || !empty($data['deposit_percentage']) || !empty($data['partial_percentage']) || !empty($data['partial_payment_percentage'])) {
            yatra_set_booking_session($session);
        }
        
        // Create Checkout model instance
        $checkout = new \Yatra\Models\Checkout($trip, $session, $pricingCalculation);
        
        // Load the template (uses $checkout model)
        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/pricing-summary.php';
        
        if (!file_exists($template_path)) {
            return '<p>' . __('Template not found.', 'yatra') . '</p>';
        }
        
        // Use output buffering to capture the template output
        ob_start();
        include $template_path;
        return ob_get_clean();
    }

    /**
     * Remove coupon code from booking session
     */
    public function remove_coupon(WP_REST_Request $request): WP_REST_Response
    {
        yatra_start_session();
        
        $session = yatra_get_booking_session();
        if (empty($session)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('No active booking session found.', 'yatra'),
            ], 400);
        }
        
        // Remove coupon directly from session to avoid array_merge issues
        if (isset($_SESSION['yatra_booking']['coupon'])) {
            unset($_SESSION['yatra_booking']['coupon']);
        }
        $_SESSION['yatra_booking']['timestamp'] = time();
        
        // Also update local session array for calculation
        unset($session['coupon']);
        $session['timestamp'] = time();
        
        // Ensure session data is written immediately
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        
        $total_amount = $this->calculateSessionTotal($session);
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Coupon removed.', 'yatra'),
            'data' => [
                'new_total' => $total_amount,
                'new_total_formatted' => yatra_format_price($total_amount),
            ],
        ]);
    }

    /**
     * Calculate total amount from session
     * Uses CalculationService to get accurate pricing (without coupon)
     */
    private function calculateSessionTotal(array $session): float
    {
        // Use CalculationService to get accurate base pricing
        $calculationService = new \Yatra\Services\CalculationService();
        
        try {
            // Calculate pricing WITHOUT coupon (we're calculating this to apply coupon to it)
            $pricing = $calculationService->calculateFromSession($session, '');
            
            // Return gross_total (base amount before discounts but after any group discounts)
            $total = $pricing['gross_total'] ?? 0;
            
            return (float) $total;
        } catch (\Throwable $e) {
            error_log('calculateSessionTotal - ERROR: ' . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * @deprecated Use DiscountService::calculateCouponDiscount() instead
     * Calculate discount amount
     */
    private function calculateDiscountAmount(\stdClass $discount, float $total, array $session): float
    {
        $discount_amount = 0;
        
        // Check if group discount applies
        if ($discount->is_group_discount && !empty($discount->min_group_size)) {
            $travelers = (int) ($session['travelers'] ?? 1);
            if ($travelers >= (int) $discount->min_group_size && !empty($discount->group_discount_amount)) {
                // Apply group discount
                if ($discount->group_discount_type === 'percentage') {
                    $discount_amount = $total * ((float) $discount->group_discount_amount / 100);
                } else {
                    $discount_amount = (float) $discount->group_discount_amount;
                }
            }
        }
        
        // If no group discount, apply regular discount
        if ($discount_amount === 0) {
            if ($discount->type === 'percentage') {
                $discount_amount = $total * ((float) $discount->amount / 100);
            } else {
                $discount_amount = (float) $discount->amount;
            }
        }
        
        // Apply max discount cap if set
        if (!empty($discount->max_discount_amount) && $discount_amount > (float) $discount->max_discount_amount) {
            $discount_amount = (float) $discount->max_discount_amount;
        }
        
        // Ensure discount doesn't exceed total
        if ($discount_amount > $total) {
            $discount_amount = $total;
        }
        
        return round($discount_amount, 2);
    }

    /**
     * Get coupon usage count by user
     */
    private function getCouponUsageByUser(string $discount_code, int $user_id): int
    {
        // Use AvailabilityService to check discount code usage
        return $this->availabilityService->getDiscountCodeUsage($user_id, strtoupper(sanitize_text_field($discount_code)));
    }
}

