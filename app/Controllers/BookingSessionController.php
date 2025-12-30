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
use Yatra\Repositories\DiscountRepository;
use Yatra\Services\DepartureService;
use Yatra\Services\AvailabilityService;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\BookingDepartureRepository;

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
     * @var DiscountRepository
     */
    private DiscountRepository $discountRepository;

    /**
     * @var DepartureService
     */
    private DepartureService $departureService;

    /**
     * @var AvailabilityService
     */
    private AvailabilityService $availabilityService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->travellerRepository = new TravellerRepository();
        $this->customerRepository = new CustomerRepository();
        $this->tripRepository = new TripRepository();
        $this->bookingRepository = new BookingRepository();
        $this->discountRepository = new DiscountRepository();
        $this->departureService = new DepartureService(
            new DepartureRepository(),
            new \Yatra\Repositories\BookingDepartureRepository(),
            $this->bookingRepository,
            $this->tripRepository
        );
        $this->availabilityService = new AvailabilityService(
            new \Yatra\Repositories\AvailabilityRepository()
        );
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
        
        // Try to find specific availability using AvailabilityService
        if ($travel_date) {
            $availability = $this->availabilityService->getByTripAndDate((int) $data['trip_id'], $travel_date);
            
            if ($availability && $departure_time && $availability->departure_time !== $departure_time) {
                $availability = null; // Time mismatch
            }
            
            if ($availability) {
                $data['availability_id'] = $availability->id;
                $data['seats_available'] = $availability->seats_available;
                $data['seats_total'] = $availability->seats_total;
                $data['pricing'] = $availability->pricing;
                $data['price_per'] = $availability->price_per;
            }
        }
        
        // Priority: Use data sent from frontend (availability card) first
        // 1. Frontend-sent pricing_type and price_types (from availability card)
        // 2. Database availability pricing
        // 3. Trip pricing
        
        $pricing_type = !empty($data['pricing_type']) ? sanitize_text_field($data['pricing_type']) : ($trip->pricing_type ?? 'regular');
        $trip_price = !empty($trip->discounted_price) ? (float) $trip->discounted_price : (float) $trip->original_price;
        
        // Apply dynamic pricing if module is enabled
        if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
            $trip_price = apply_filters('yatra_booking_trip_price', $trip_price, (int) $trip->id, [
                'departure_date' => $travel_date,
                'spots_remaining' => $availability ? (int) ($availability->spots_remaining ?? null) : null,
                'availability_id' => $availability_id,
            ]);
        }
        
        $price_types = [];
        
        // First priority: price_types sent from frontend (from availability card)
        if (!empty($data['price_types']) && is_array($data['price_types'])) {
            $price_types = $data['price_types'];
        }
        // Second priority: availability from database
        elseif ($availability) {
            $pricing_type = $availability->pricing_type ?? $pricing_type;
            
            // Get availability price
            if (!empty($availability->discounted_price)) {
                $trip_price = (float) $availability->discounted_price;
            } elseif (!empty($availability->original_price)) {
                $trip_price = (float) $availability->original_price;
            }
            
            // Get price_types if traveler-based
            if (!empty($availability->price_types)) {
                $price_types = is_string($availability->price_types) 
                    ? (json_decode($availability->price_types, true) ?: []) 
                    : $availability->price_types;
            }
        }
        
        // Third priority: If no price_types yet, use trip's price_types
        if (empty($price_types) && $pricing_type === 'traveler_based' && !empty($trip->price_types)) {
            $price_types = is_array($trip->price_types) ? $trip->price_types : [];
        }
        
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
                        // Ensure effective price is set
                        if (!isset($pt['effective_price'])) {
                            $pt['effective_price'] = $pt['discounted_price'] ?? $pt['sale_price'] ?? $pt['original_price'] ?? 0;
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
        
        // Prepare session data
        $session_data = [
            'trip_id' => (int) $trip->id,
            'trip_title' => $trip->title,
            'trip_slug' => $trip->slug,
            'trip_price' => $trip_price,
            'currency' => $trip->currency ?: 'USD',
            'min_travelers' => (int) ($trip->min_travelers ?: 1),
            'max_travelers' => (int) ($trip->max_travelers ?: 20),
            'duration_days' => (int) ($trip->duration_days ?: 1),
            'travelers' => $travelers_count,
            'travel_date' => $travel_date,
            'departure_time' => $departure_time,
            'timestamp' => time(),
            // Availability-specific data
            'availability_id' => $availability_id,
            'pricing_type' => $pricing_type,
            'price_types' => $price_types,
            'traveler_counts' => $traveler_counts,
            'is_day_trip' => $is_day_trip,
            // Additional services (selected in popup)
            'additional_services' => $additional_services,
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

        // Get redirect URL - session has all data, no need for URL params
        $redirect_url = yatra_get_checkout_url();

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
            'currency' => $trip->currency ?: 'USD',
            'starting_location' => $trip->starting_location,
            'ending_location' => $trip->ending_location,
        ];

        return new WP_REST_Response([
            'success' => true,
            'data' => $trip_data,
        ]);
    }

    /**
     * Create a new booking OR process remaining payment
     * Server-side detection: if remaining session exists, process payment only
     */
    public function create_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $data = $request->get_json_params();

        // ========================================
        // CHECK FOR REMAINING PAYMENT SESSION FIRST
        // ========================================
        if (yatra_has_remaining_session()) {
            return $this->process_remaining_payment($request);
        }

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

        // Calculate price - Priority: 1. Availability date, 2. Trip price
        $total_amount = 0;
        $price_per_person = 0;
        $travelers_count = count($travelers);
        $availability = null;
        
        // Try to get availability using AvailabilityService
        if (!empty($travel_date)) {
            $availability = $this->availabilityService->getByTripAndDate($trip_id, $travel_date);
        }
        
        // Determine pricing type and calculate total
        $pricing_type = 'regular';
        if ($availability) {
            $pricing_type = $availability->pricing_type ?? $trip->pricing_type ?? 'regular';
        } else {
            $pricing_type = $trip->pricing_type ?? 'regular';
        }
        
        if ($pricing_type === 'traveler_based') {
            // Traveler-based pricing: Calculate based on each traveler's category
            $price_types = [];
            
            // Priority 1: Check availability pricing override
            if ($availability && isset($availability->price_types) && !empty($availability->price_types)) {
                $price_types = is_string($availability->price_types) 
                    ? (json_decode($availability->price_types, true) ?: []) 
                    : $availability->price_types;
            }
            
            // Priority 2: If no availability pricing (NULL or empty), use trip default
            if (empty($price_types) && !empty($trip->price_types)) {
                $price_types = is_array($trip->price_types) ? $trip->price_types : [];
            }
            
            // Index price types by category_id
            $priceByCategory = [];
            foreach ($price_types as $pt) {
                $pt = (object) $pt;
                $catId = $pt->category_id ?? null;
                if ($catId) {
                    $priceByCategory[$catId] = $pt->effective_price ?? $pt->discounted_price ?? $pt->sale_price ?? $pt->original_price ?? 0;
                }
            }
            
            // Calculate total for each traveler based on their category
            foreach ($travelers as $traveler) {
                $categoryId = $traveler['category_id'] ?? null;
                if ($categoryId && isset($priceByCategory[$categoryId])) {
                    $total_amount += (float) $priceByCategory[$categoryId];
                } else {
                    // Fallback to first category price or trip price
                    $firstPrice = !empty($priceByCategory) ? reset($priceByCategory) : 0;
                    $total_amount += $firstPrice > 0 ? (float) $firstPrice : ((float) ($trip->discounted_price ?? $trip->original_price));
                }
            }
            
            $price_per_person = $travelers_count > 0 ? $total_amount / $travelers_count : 0;
        } else {
            // Regular pricing with proper fallback: availability → trip default
            // Priority 1: Check availability discounted price override
            if ($availability && isset($availability->discounted_price) && $availability->discounted_price !== null && $availability->discounted_price > 0) {
                $price_per_person = (float) $availability->discounted_price;
            } 
            // Priority 2: Check availability original price override
            elseif ($availability && isset($availability->original_price) && $availability->original_price !== null && $availability->original_price > 0) {
                $price_per_person = (float) $availability->original_price;
            } 
            // Priority 3: Fall back to trip default pricing
            else {
                $price_per_person = !empty($trip->discounted_price) ? (float) $trip->discounted_price : (float) $trip->original_price;
            }
            $total_amount = $price_per_person * $travelers_count;
        }

        // Handle payment method and totals from frontend booking summary
        $payment_method = sanitize_text_field($data['payment_method'] ?? 'full');
        $payment_gateway = sanitize_text_field($data['payment_gateway'] ?? 'pay_later');
        $frontend_total = isset($data['total_amount']) ? (float) $data['total_amount'] : null;
        $frontend_due = isset($data['amount_due']) ? (float) $data['amount_due'] : null;
        $frontend_paid = isset($data['amount_paid']) ? (float) $data['amount_paid'] : null;

        // Use filters for flexible payment settings (Pro feature)
        // These filters allow the Pro FlexiblePayments module to provide the actual values
        $flexible_payments_enabled = apply_filters('yatra_flexible_payments_enabled', false);
        $deposit_percentage = (int) apply_filters('yatra_deposit_percentage', 20);
        $partial_percentage = (int) apply_filters('yatra_partial_payment_percentage', 30);

        if ($frontend_total !== null && $frontend_total > 0) {
            $total_amount = $frontend_total;
        }
        
        // ========================================
        // APPLY GROUP DISCOUNT (Auto-applied based on traveler count)
        // ========================================
        $discount_amount = 0;
        $discount_code = null;
        $applied_discount = null;
        
        // Get traveler counts by category from session or data
        // Priority: 1. Frontend data, 2. Session data, 3. Build from travelers array
        $travelerCountsByCategory = [];
        
        // Try to get from frontend data first
        if (!empty($data['traveler_counts']) && is_array($data['traveler_counts'])) {
            $travelerCountsByCategory = $data['traveler_counts'];
        }
        // Try to get from session
        elseif (!empty($session['traveler_counts']) && is_array($session['traveler_counts'])) {
            $travelerCountsByCategory = $session['traveler_counts'];
        }
        // Build from travelers array if category_id is present
        else {
            foreach ($travelers as $traveler) {
                $categoryId = $traveler['category_id'] ?? null;
                if ($categoryId) {
                    if (!isset($travelerCountsByCategory[$categoryId])) {
                        $travelerCountsByCategory[$categoryId] = 0;
                    }
                    $travelerCountsByCategory[$categoryId]++;
                }
            }
        }
        
        // If no category-based travelers, use total count with a default category
        if (empty($travelerCountsByCategory) && $travelers_count > 0) {
            // Use 'default' as a placeholder category for total-based discounts
            $travelerCountsByCategory['default'] = $travelers_count;
        }
        
        // Build price types array for discount calculation
        // Priority: 1. Already set price_types, 2. Session price_types, 3. Default
        $priceTypesForDiscount = [];
        
        // Use price_types if already set from traveler_based pricing
        if (!empty($price_types)) {
            foreach ($price_types as $pt) {
                $pt = (object) $pt;
                $priceTypesForDiscount[] = [
                    'category_id' => $pt->category_id ?? null,
                    'effective_price' => $pt->effective_price ?? $pt->discounted_price ?? $pt->sale_price ?? $pt->original_price ?? 0,
                ];
            }
        }
        // Try to get from session
        elseif (!empty($session['price_types']) && is_array($session['price_types'])) {
            foreach ($session['price_types'] as $pt) {
                $pt = (object) $pt;
                $priceTypesForDiscount[] = [
                    'category_id' => $pt->category_id ?? null,
                    'effective_price' => $pt->effective_price ?? $pt->discounted_price ?? $pt->sale_price ?? $pt->original_price ?? 0,
                ];
            }
        }
        // For regular pricing, create a default price type entry
        else {
            $priceTypesForDiscount[] = [
                'category_id' => 'default',
                'effective_price' => $price_per_person,
            ];
        }
        
        // Use DiscountService to calculate group discount (handles category-based discounts properly)
        $discountService = new \Yatra\Services\DiscountService();
        $groupDiscountResult = $discountService->calculateGroupDiscount($trip_id, $travelerCountsByCategory, $priceTypesForDiscount);
        
        if ($groupDiscountResult) {
            $discount_amount = (float) ($groupDiscountResult['amount'] ?? 0);
            // Use label as discount_code if no code is set (for display purposes)
            $discount_code = $groupDiscountResult['code'] ?? $groupDiscountResult['label'] ?? null;
            $applied_discount = $groupDiscountResult;
        }
        
        // Ensure discount doesn't exceed total
        if ($discount_amount > $total_amount) {
            $discount_amount = $total_amount;
        }
        $discount_amount = round($discount_amount, 2);
        
        // Apply discount to total
        $subtotal_before_discount = $total_amount;
        $total_amount = $total_amount - $discount_amount;

        if ($frontend_due !== null && $frontend_due >= 0) {
            $amount_due = $frontend_due;
            // Recalculate amount_due if discount was applied
            if ($discount_amount > 0) {
                // Proportionally reduce amount_due based on discount
                $discount_ratio = $total_amount / $subtotal_before_discount;
                $amount_due = $frontend_due * $discount_ratio;
            }
        } else {
            $amount_due = $total_amount;
            if ($payment_method === 'deposit') {
                $amount_due = $total_amount * ($deposit_percentage / 100);
            } elseif ($payment_method === 'partial') {
                $amount_due = $total_amount * ($partial_percentage / 100);
            }
        }

        $amount_paid = $frontend_paid !== null ? $frontend_paid : ($total_amount - $amount_due);
        if ($amount_paid < 0) {
            $amount_paid = 0;
        }

        // Generate booking reference
        $booking_reference = 'YTR-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));

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
            error_log('Yatra: Failed to create customer: ' . $e->getMessage());
        }

        // Create booking using BookingService
        $booking_service = new \Yatra\Services\BookingService();
        
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
            'travelers_data' => '', // Legacy field - travellers now stored in separate table
            'total_amount' => $total_amount,
            'amount_paid' => 0,
            'amount_due' => $amount_due,
            'currency' => \Yatra\Services\SettingsService::getCurrency(),
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
        ];

        try {
            $booking = $booking_service->createBooking($booking_data);
            $booking_id = $booking['id'];
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to create booking. Please try again.', 'yatra'),
                'error' => $e->getMessage(),
            ], 500);
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

        // ========================================
        // HANDLE DEPARTURE CREATION/UPDATE
        // ========================================
        // Automatically create or update departure for the booking date
        if (!empty($travel_date)) {
            try {
                // Calculate start_date and end_date
                $start_date = $travel_date;
                $duration_days = !empty($trip->duration_days) ? (int) $trip->duration_days : 1;
                $end_date = date('Y-m-d', strtotime($start_date . ' + ' . ($duration_days - 1) . ' days'));

                // Update booking with start_date and end_date (only if columns exist)
                // Check if columns exist before trying to update
                $bookingRepository = new \Yatra\Repositories\BookingRepository();
                $bookingColumns = $bookingRepository->getTableColumns();
                
                $bookingUpdateData = [];
                if (in_array('start_date', $bookingColumns, true)) {
                    $bookingUpdateData['start_date'] = $start_date;
                }
                if (in_array('end_date', $bookingColumns, true)) {
                    $bookingUpdateData['end_date'] = $end_date;
                }
                
                if (!empty($bookingUpdateData)) {
                    $this->bookingRepository->update($booking_id, $bookingUpdateData);
                }

                // Get trip's default max capacity if available
                $defaultMaxCapacity = null;
                if (!empty($trip->max_capacity)) {
                    $defaultMaxCapacity = (int) $trip->max_capacity;
                }

                // Find or create departure for this date
                $departure = $this->departureService->findOrCreateForBooking(
                    $trip_id,
                    $start_date,
                    $end_date,
                    $travelers_count,
                    $defaultMaxCapacity
                );

                // Link booking to departure
                $this->departureService->linkBookingToDeparture($booking_id, $departure->id);

                // Increment booked count for this departure
                $this->departureService->incrementBookedCount($departure->id, $travelers_count);

                error_log("Yatra: Created/updated departure ID {$departure->id} for booking {$booking_id} on date {$start_date} (end: {$end_date})");
            } catch (\Exception $e) {
                // Log error but don't fail the booking
                error_log('Yatra: Failed to create/update departure for booking: ' . $e->getMessage());
            }
        }

        // Clear booking session
        yatra_clear_booking_session();

        // Check if this is an offline gateway
        $is_offline = in_array($payment_gateway, ['pay_later', 'bank_transfer']);

        // For online gateways, create payment intent and return redirect URL
        if (!$is_offline && $amount_due > 0) {
            // Build payment params - merge with request data so gateways can access their own tokens
            $globalCurrency = \Yatra\Services\SettingsService::getCurrency();
            $payment_params = array_merge($data, [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'amount' => $amount_due,
                'currency' => $globalCurrency,
                'customer_email' => $contact_data['email'],
                'customer_name' => $contact_data['first_name'] . ' ' . $contact_data['last_name'],
                'trip_title' => $trip->title,
            ]);
            
            // Process payment based on gateway
            $payment_result = $this->processPaymentGateway($payment_gateway, $payment_params);
            
            if ($payment_result['success']) {
                // Handle redirect-based gateways (PayPal, eSewa, Khalti, etc.)
                if (!empty($payment_result['payment_url'])) {
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
                $errorMessage = $payment_result['error'] ?? __('Payment processing failed. Please try again.', 'yatra');
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

        // Link booking to departure
        $this->departureService->linkBookingToDeparture($booking_id, $departure->id);

        // Increment booked count for this departure
        $this->departureService->incrementBookedCount($departure->id, $travelers_count);
        if (!is_object($booking)) {
            $booking = (object) [];
        }
        
        /**
         * Action: Booking created
         * Fires after a new booking is successfully created
         * 
         * @param int $booking_id The booking ID
         * @param object $booking The booking object with trip data
         * @since 3.0.0
         */
        do_action('yatra_booking_created', (int) $booking_id, $booking);
        
        // If booking was auto-confirmed, also fire status changed action
        if ($booking_status === 'confirmed') {
            /**
             * Action: Booking status changed
             * Fires when booking status changes
             * 
             * @param int $booking_id The booking ID
             * @param string $old_status Previous status
             * @param string $new_status New status
             * @since 3.0.0
             */
            do_action('yatra_booking_status_changed', (int) $booking_id, 'pending', 'confirmed');
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
                'currency' => $trip->currency ?: 'USD',
                'amount' => $amount_due,
                'subtotal' => $subtotal_before_discount,
                'discount_amount' => $discount_amount,
                'discount_code' => $discount_code,
                'total_amount' => $total_amount,
            ],
        ]);
    }
    
    /**
     * Get confirmation page URL
     */
    private function getConfirmationUrl(string $reference): string
    {
        // Check if a custom confirmation page is set
        $confirmation_page_id = \Yatra\Services\SettingsService::get('booking_confirmation_page');
        
        $baseUrl = $confirmation_page_id ? get_permalink($confirmation_page_id) : home_url('/booking-confirmation/');

        return trailingslashit($baseUrl) . $reference . '/';
    }

    /**
     * Process remaining payment (no new booking created)
     */
    private function process_remaining_payment(WP_REST_Request $request): WP_REST_Response
    {
        $session = yatra_get_remaining_session();
        
        $booking_id = (int) ($session['booking_id'] ?? 0);
        $booking_reference = $session['booking_reference'] ?? '';
        $remaining_amount = (float) ($session['remaining_amount'] ?? 0);
        $currency = $session['currency'] ?? 'USD';
        $contact_email = $session['contact_email'] ?? '';
        $contact_first_name = $session['contact_first_name'] ?? '';
        $contact_last_name = $session['contact_last_name'] ?? '';
        $trip_id = (int) ($session['trip_id'] ?? 0);
        $trip_title = $session['trip_title'] ?? '';
        $travel_date = $session['travel_date'] ?? '';

        if ($booking_id <= 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid booking for remaining payment.', 'yatra'),
            ], 400);
        }

        if ($remaining_amount <= 0) {
            yatra_clear_remaining_session();
            return new WP_REST_Response([
                'success' => false,
                'message' => __('This booking is already fully paid.', 'yatra'),
            ], 400);
        }

        // Verify booking exists
        $booking = $this->bookingRepository->find($booking_id);
        if (!$booking) {
            yatra_clear_remaining_session();
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Booking not found.', 'yatra'),
            ], 404);
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

        // Use contact info from session or booking
        $customer_email = $contact_email ?: ($booking->contact_email ?? $booking->customer_email ?? '');
        $customer_name = trim($contact_first_name . ' ' . $contact_last_name) ?: 
            trim(($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? ''));

        if (empty($customer_email)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Email address is required.', 'yatra'),
            ], 400);
        }

        // Return booking info for payment processing (Stripe will create intent)
        // Do NOT clear session yet - it will be cleared after successful payment
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Ready to process remaining payment.', 'yatra'),
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
            error_log('[Yatra] processPaymentGateway called with gateway: ' . $gateway);
            error_log('[Yatra] Payment params: ' . print_r($params, true));
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
            
            if (!$gateway->isAvailable()) {
                return ['success' => false, 'message' => "Payment gateway '{$gatewayId}' is not available"];
            }
            
            // Prepare payment data - pass all params, gateways extract what they need
            // Note: Don't set return_url here - let each gateway set its own with gateway-specific query params
            $paymentData = array_merge($params, [
                'description' => $params['trip_title'] ?? '',
                'cancel_url' => home_url('/book/?payment=cancelled&ref=' . ($params['reference'] ?? '')),
                'metadata' => [
                    'booking_id' => $params['booking_id'],
                    'reference' => $params['reference'] ?? ''
                ]
            ]);
            
            // Process the payment through the gateway
            $result = $gateway->processPayment($paymentData);
            
            // Debug logging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[Yatra Payment] Gateway: ' . $gatewayId . ' Result: ' . print_r($result, true));
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
                error_log('Payment processing failed: ' . print_r([
                    'gateway' => $gatewayId,
                    'params' => $params,
                    'error' => $result['message'] ?? 'Unknown error',
                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5)
                ], true));
            }
            
            return [
                'success' => false, 
                'message' => $result['message'] ?? $result['error'] ?? 'Payment processing failed. Please try again.'
            ];
            
        } catch (\Exception $e) {
            // Log the exception for debugging
            error_log('Payment processing exception: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
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
            
            error_log("[Yatra] Payment recorded for booking {$bookingId}: {$amount} {$currency} via {$gatewayId}");
            
        } catch (\Exception $e) {
            error_log("[Yatra] Failed to record payment: " . $e->getMessage());
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
                        'return_url' => $this->getConfirmationUrl($params['reference']) . '?payment=success',
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
            'su' => $this->getConfirmationUrl($params['reference']) . '?payment=success&gateway=esewa',
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
                    'return_url' => $this->getConfirmationUrl($params['reference']) . '?payment=success&gateway=khalti',
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
        
        // Determine email subject and intro based on booking status
        $to = sanitize_email($customer_email);
        
        if ($booking_status === 'confirmed') {
            $subject = sprintf(__('[%s] Booking Confirmed - %s', 'yatra'), get_bloginfo('name'), $reference);
            $body = sprintf(__("Dear %s,\n\n", 'yatra'), $customer_name ?: 'Customer');
            $body .= __("Thank you for your booking! Your reservation has been confirmed.\n\n", 'yatra');
        } else {
            $subject = sprintf(__('[%s] Booking Received - %s', 'yatra'), get_bloginfo('name'), $reference);
            $body = sprintf(__("Dear %s,\n\n", 'yatra'), $customer_name ?: 'Customer');
            $body .= __("Thank you for your booking! Your reservation has been received and is pending confirmation.\n\n", 'yatra');
            
            // Add expiry notice for pending bookings
            if ($expiry_datetime) {
                $body .= sprintf(
                    __("⚠️ Important: Please complete your payment before %s to avoid automatic cancellation.\n\n", 'yatra'),
                    date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($expiry_datetime))
                );
            }
        }
        $body .= "═══════════════════════════════════════\n";
        $body .= sprintf(__("Booking Reference: %s\n", 'yatra'), $reference);
        $body .= "═══════════════════════════════════════\n\n";
        $body .= sprintf(__("Trip: %s\n", 'yatra'), $trip->title);
        $body .= sprintf(__("Travel Date: %s\n", 'yatra'), date_i18n(get_option('date_format'), strtotime($travel_date)));
        $body .= sprintf(__("Duration: %d Days / %d Nights\n", 'yatra'), $trip->duration_days, $trip->duration_nights);
        $body .= sprintf(__("Number of Travelers: %d\n\n", 'yatra'), count($travelers));
        
        $body .= __("PAYMENT DETAILS\n", 'yatra');
        $body .= "───────────────────────────────────────\n";
        $body .= sprintf(__("Total Amount: %s\n", 'yatra'), $formatted_total);
        
        if ($payment_method === 'deposit') {
            $body .= sprintf(__("Payment Type: Deposit\n", 'yatra'));
            $body .= sprintf(__("Amount Due Now: %s\n", 'yatra'), $formatted_due);
            $body .= sprintf(__("Remaining Balance: %s (due before trip)\n", 'yatra'), yatra_format_price($total_amount - $amount_due));
        } elseif ($payment_method === 'partial') {
            $body .= sprintf(__("Payment Type: Partial Payment\n", 'yatra'));
            $body .= sprintf(__("Amount Due Now: %s\n", 'yatra'), $formatted_due);
            $body .= sprintf(__("Remaining Balance: %s\n", 'yatra'), yatra_format_price($total_amount - $amount_due));
        } else {
            $body .= sprintf(__("Payment Type: Full Payment\n", 'yatra'));
        }
        
        if ($payment_gateway === 'pay_later') {
            $body .= "\n" . __("Payment Status: Pay Later - Please contact us to arrange payment.\n", 'yatra');
        } elseif ($payment_gateway === 'bank_transfer') {
            $body .= "\n" . __("Payment Status: Bank Transfer - You will receive bank details in a separate email.\n", 'yatra');
        }
        
        $body .= "\n" . __("TRAVELERS\n", 'yatra');
        $body .= "───────────────────────────────────────\n";
        foreach ($travelers as $i => $traveler) {
            $traveler_name = trim(($traveler['first_name'] ?? '') . ' ' . ($traveler['last_name'] ?? ''));
            $body .= sprintf(__("Traveler %d: %s\n", 'yatra'), $i + 1, $traveler_name ?: 'N/A');
        }
        
        $body .= "\n" . __("CANCELLATION POLICY\n", 'yatra');
        $body .= "───────────────────────────────────────\n";
        
        $cancellation_policy_labels = [
            'full_refund' => __('Full refund available', 'yatra'),
            'partial_refund' => __('Partial refund available', 'yatra'),
            'no_refund' => __('No refund available', 'yatra'),
            'flexible' => __('Flexible cancellation', 'yatra'),
        ];
        $policy_label = $cancellation_policy_labels[$cancellation_policy] ?? __('Standard policy applies', 'yatra');
        
        $body .= sprintf(__("Policy: %s\n", 'yatra'), $policy_label);
        $body .= sprintf(__("Free cancellation up to: %d days before departure\n", 'yatra'), $cancellation_days);
        
        // Add custom refund policy text if set
        $custom_refund_policy = \Yatra\Services\SettingsService::get('refund_policy', '');
        if (!empty($custom_refund_policy)) {
            $body .= sprintf(__("Details: %s\n", 'yatra'), $custom_refund_policy);
        }
        
        $body .= "\n" . __("WHAT'S NEXT?\n", 'yatra');
        $body .= "───────────────────────────────────────\n";
        $body .= __("1. You will receive a detailed trip itinerary within 24-48 hours.\n", 'yatra');
        $body .= __("2. Our team will contact you to confirm any special requirements.\n", 'yatra');
        $body .= __("3. Please ensure all traveler passports are valid for at least 6 months.\n\n", 'yatra');
        
        $body .= __("If you have any questions, please don't hesitate to contact us.\n\n", 'yatra');
        $body .= sprintf(__("Best regards,\n%s Team\n", 'yatra'), get_bloginfo('name'));
        $body .= "\n" . home_url() . "\n";

        // Set HTML content type for better formatting
        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        
        wp_mail($to, $subject, $body, $headers);

        // Admin notification
        $admin_email = get_option('admin_email');
        
        $status_emoji = ($booking_status === 'confirmed') ? '✅' : '⏳';
        $status_label = ($booking_status === 'confirmed') ? __('Confirmed', 'yatra') : __('Pending', 'yatra');
        
        $admin_subject = sprintf(__('[%s] %s New Booking - %s', 'yatra'), get_bloginfo('name'), $status_emoji, $reference);
        
        $admin_body = sprintf(__("A new booking has been received! Status: %s\n\n", 'yatra'), $status_label);
        $admin_body .= "═══════════════════════════════════════\n";
        $admin_body .= sprintf(__("Reference: %s\n", 'yatra'), $reference);
        $admin_body .= sprintf(__("Status: %s\n", 'yatra'), strtoupper($status_label));
        $admin_body .= "═══════════════════════════════════════\n\n";
        $admin_body .= sprintf(__("Trip: %s\n", 'yatra'), $trip->title);
        $admin_body .= sprintf(__("Travel Date: %s\n", 'yatra'), date_i18n(get_option('date_format'), strtotime($travel_date)));
        $admin_body .= sprintf(__("Travelers: %d\n\n", 'yatra'), count($travelers));
        
        $admin_body .= __("CUSTOMER DETAILS\n", 'yatra');
        $admin_body .= "───────────────────────────────────────\n";
        $admin_body .= sprintf(__("Name: %s\n", 'yatra'), $customer_name);
        $admin_body .= sprintf(__("Email: %s\n", 'yatra'), $customer_email);
        $admin_body .= sprintf(__("Phone: %s\n", 'yatra'), $contact['phone'] ?? 'N/A');
        $admin_body .= sprintf(__("Country: %s\n\n", 'yatra'), $contact['country'] ?? 'N/A');
        
        $admin_body .= __("PAYMENT\n", 'yatra');
        $admin_body .= "───────────────────────────────────────\n";
        $admin_body .= sprintf(__("Total: %s\n", 'yatra'), $formatted_total);
        $admin_body .= sprintf(__("Due Now: %s\n", 'yatra'), $formatted_due);
        $admin_body .= sprintf(__("Method: %s\n", 'yatra'), ucfirst($payment_method));
        $admin_body .= sprintf(__("Gateway: %s\n", 'yatra'), ucwords(str_replace('_', ' ', $payment_gateway)));
        $admin_body .= sprintf(__("Payment Status: %s\n\n", 'yatra'), __('Pending', 'yatra'));
        
        if ($booking_status === 'pending' && $payment_gateway !== 'pay_later') {
            $admin_body .= sprintf(__("⚠️ ACTION REQUIRED: This booking is pending. Please verify payment and confirm.\n\n", 'yatra'));
        }
        
        $admin_body .= sprintf(__("View Booking: %s\n", 'yatra'), admin_url('admin.php?page=yatra&subpage=bookings&action=view&id=' . $booking_id));

        wp_mail($admin_email, $admin_subject, $admin_body, $headers);
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
        
        // Find the coupon
        $discount = $this->discountRepository->findByCode($code);
        
        if (!$discount) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid coupon.', 'yatra'),
            ], 404);
        }
        
        // Validate coupon
        $validation = $this->validateCoupon($discount, $session);
        if (!$validation['valid']) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $validation['message'],
            ], 400);
        }
        
        // Calculate discount amount
        $total_amount = $this->calculateSessionTotal($session);
        $discount_amount = $this->calculateDiscountAmount($discount, $total_amount, $session);
        
        // Store coupon in session
        $session['coupon'] = [
            'id' => (int) $discount->id,
            'code' => $discount->code,
            'type' => $discount->type,
            'amount' => (float) $discount->amount,
            'discount_amount' => $discount_amount,
            'description' => $discount->description ?? '',
        ];
        $session['timestamp'] = time();
        
        yatra_set_booking_session($session);
        
        return new WP_REST_Response([
            'success' => true,
            'message' => __('Coupon applied successfully!', 'yatra'),
            'data' => [
                'code' => $discount->code,
                'type' => $discount->type,
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
        $data = $request->get_json_params();
        
        $trip_id = (int) ($data['trip_id'] ?? 0);
        $traveler_counts = $data['traveler_counts'] ?? [];
        $travel_date = sanitize_text_field($data['travel_date'] ?? '');
        $departure_time = sanitize_text_field($data['departure_time'] ?? '');
        $availability_id = !empty($data['availability_id']) ? sanitize_text_field($data['availability_id']) : null;
        $pricing_type_from_request = sanitize_text_field($data['pricing_type'] ?? '');
        $coupon_code = sanitize_text_field($data['coupon_code'] ?? '');
        $payment_method = sanitize_text_field($data['payment_method'] ?? 'full');
        $selected_service_ids_from_request = isset($data['additional_services']) && is_array($data['additional_services']) 
            ? array_map('intval', $data['additional_services']) 
            : null;
        
        if (empty($trip_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip ID is required.', 'yatra'),
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
        if (!empty($availability_id)) {
            $availability = $this->availabilityService->getById($availability_id);
        } elseif (!empty($travel_date)) {
            $availability = $this->availabilityService->getByTripAndDate($trip_id, $travel_date);
            
            if ($availability && !empty($departure_time) && $availability->departure_time !== $departure_time) {
                $availability = null; // Time mismatch
            }
        }
        
        // Get price types for traveler-based pricing
        // Table removed: rely on availability price_types or trip->price_types only
        $price_types_table = null;
        $categories_table = null;
        $price_types = [];
        
        $resolved_pricing_type = !empty($pricing_type_from_request) ? $pricing_type_from_request : ($trip->pricing_type ?? 'regular');

        if ($availability && !empty($availability->pricing_type)) {
            $resolved_pricing_type = $availability->pricing_type;
        }

        if ($availability && !empty($availability->price_types)) {
            $availability_price_types = is_string($availability->price_types)
                ? (json_decode($availability->price_types, true) ?: [])
                : $availability->price_types;

            if (!empty($availability_price_types) && is_array($availability_price_types)) {
                $price_types = array_map(function ($pt) {
                    return (object) $pt;
                }, $availability_price_types);
            }
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
            $pt->effective_price = $pt->effective_price ?? ($pt->discounted_price ?? $pt->sale_price ?? $pt->original_price ?? 0);
        }

        if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
            $spots_remaining = $availability ? (int) ($availability->spots_remaining ?? null) : null;

            error_log('[Yatra Booking Summary] Applying dynamic pricing - Travel Date: ' . ($travel_date ?: 'null') . ', Spots: ' . ($spots_remaining ?? 'null'));

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
                error_log('[Yatra Booking Summary] Price Type ' . ($pt->category_label ?? 'Unknown') . ': ' . $price_before . ' => ' . $pt->effective_price);
            }
        }

        $is_traveler_based = $resolved_pricing_type === 'traveler_based' && !empty($price_types);

        // Base trip price with proper fallback: availability → trip default
        $base_trip_price = !empty($trip->discounted_price) ? (float) $trip->discounted_price : (float) $trip->original_price;
        
        // Override with availability pricing if set (not NULL)
        if ($availability && isset($availability->discounted_price) && $availability->discounted_price !== null && $availability->discounted_price > 0) {
            $base_trip_price = (float) $availability->discounted_price;
        } elseif ($availability && isset($availability->original_price) && $availability->original_price !== null && $availability->original_price > 0) {
            $base_trip_price = (float) $availability->original_price;
        }

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
            if ($total_travelers < 1) $total_travelers = 1;
            $price_per_person = $base_trip_price;
            $subtotal = $price_per_person * $total_travelers;
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
                    'effective_price' => $pt->effective_price ?? $pt->discounted_price ?? $pt->sale_price ?? $pt->original_price ?? 0,
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
        
        // Calculate coupon discount
        $coupon_discount_amount = 0;
        $coupon_discount_label = '';
        $coupon_error = '';
        
        if (!empty($coupon_code)) {
            $discount = $this->discountRepository->findByCode($coupon_code);
            if ($discount) {
                $session = [
                    'trip_id' => $trip_id,
                    'travelers' => $total_travelers,
                    'travel_date' => $travel_date,
                    'departure_time' => $departure_time,
                    'availability_id' => $availability_id,
                    'pricing_type' => $is_traveler_based ? 'traveler_based' : 'regular',
                    'trip_price' => $base_trip_price,
                    'traveler_counts' => $is_traveler_based ? $normalized_traveler_counts : ['default' => $total_travelers],
                    'price_types' => $is_traveler_based ? $price_types : [],
                ];
                $validation = $this->validateCoupon($discount, $session);
                if ($validation['valid']) {
                    $coupon_discount_amount = $this->calculateDiscountAmount($discount, $subtotal - $group_discount_amount, $session);
                    $coupon_discount_label = $discount->type === 'percentage' 
                        ? sprintf(__('Coupon (%s%%)', 'yatra'), $discount->amount)
                        : __('Coupon Discount', 'yatra');
                } else {
                    $coupon_error = $validation['message'];
                }
            } else {
                $coupon_error = __('Invalid coupon code.', 'yatra');
            }
        }
        
        // Calculate total
        $total_discount = $group_discount_amount + $coupon_discount_amount;
        $total_amount = max(0, $subtotal - $total_discount);
        
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
        
        // Add services and itinerary costs total to the booking total
        $total_amount = $total_amount + $services_total + $itinerary_costs_total;
        
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
        
        // Build pricing HTML for the summary section
        $pricing_html = $this->buildPricingHtml([
            'is_traveler_based' => $is_traveler_based,
            'category_breakdown' => $category_breakdown,
            'subtotal' => $subtotal,
            'total_travelers' => $total_travelers,
            'price_per_person' => $base_trip_price,
            'group_discount_amount' => $group_discount_amount,
            'group_discount_label' => $group_discount_label,
            'coupon_discount_amount' => $coupon_discount_amount,
            'coupon_discount_label' => $coupon_discount_label,
            'coupon_code' => $coupon_code,
            'additional_services' => $additional_services,
            'services_total' => $services_total,
            'itinerary_costs' => $itinerary_costs,
            'itinerary_costs_total' => $itinerary_costs_total,
            'total_amount' => $total_amount,
            'amount_due' => $amount_due,
            'payment_method' => $payment_method,
            'deposit_percentage' => $deposit_percentage,
            'partial_percentage' => $partial_percentage,
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
                'total_discount' => round($total_discount, 2),
                'total_discount_formatted' => yatra_format_price($total_discount),
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
     * Uses the pricing-summary.php template for rendering
     */
    private function buildPricingHtml(array $data): string
    {
        // Extract variables for the template
        $is_traveler_based = $data['is_traveler_based'] ?? false;
        $category_breakdown = $data['category_breakdown'] ?? [];
        $subtotal = $data['subtotal'] ?? 0;
        $total_travelers = $data['total_travelers'] ?? 0;
        $price_per_person = $data['price_per_person'] ?? 0;
        $coupon_discount_amount = $data['coupon_discount_amount'] ?? 0;
        $coupon_discount_label = $data['coupon_discount_label'] ?? '';
        $coupon_code = $data['coupon_code'] ?? '';
        $group_discount_amount = $data['group_discount_amount'] ?? 0;
        $group_discount_label = $data['group_discount_label'] ?? '';
        $additional_services = $data['additional_services'] ?? [];
        $services_total = $data['services_total'] ?? 0;
        $total_amount = $data['total_amount'] ?? 0;
        $amount_due = $data['amount_due'] ?? 0;
        $payment_method = $data['payment_method'] ?? 'full';
        $deposit_percentage = $data['deposit_percentage'] ?? 20;
        $partial_percentage = $data['partial_percentage'] ?? 30;
        
        // Load the template
        $template_path = YATRA_PLUGIN_PATH . 'templates/partials/pricing-summary.php';
        
        if (!file_exists($template_path)) {
            return '';
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
        
        // Remove coupon from session
        unset($session['coupon']);
        $session['timestamp'] = time();
        
        yatra_set_booking_session($session);
        
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
     * Validate coupon against current session
     */
    private function validateCoupon(\stdClass $discount, array $session): array
    {
        // Check if coupon is active (draft or not published = invalid)
        if ($discount->status !== 'publish') {
            return ['valid' => false, 'message' => __('Invalid coupon.', 'yatra')];
        }
        
        // Check validity dates
        $now = current_time('Y-m-d');
        
        if (!empty($discount->valid_from) && $now < $discount->valid_from) {
            return ['valid' => false, 'message' => __('Invalid coupon.', 'yatra')];
        }
        
        if (!empty($discount->expiry_date) && $now > $discount->expiry_date) {
            return ['valid' => false, 'message' => __('Invalid coupon.', 'yatra')];
        }
        
        // Check usage limit
        if ($discount->usage_limit > 0 && $discount->usage_count >= $discount->usage_limit) {
            return ['valid' => false, 'message' => __('This coupon has reached its usage limit.', 'yatra')];
        }
        
        // Check usage limit per customer (if logged in)
        if ($discount->usage_limit_per_customer > 0 && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $user_usage = $this->getCouponUsageByUser($discount->code, $user_id);
            if ($user_usage >= $discount->usage_limit_per_customer) {
                return ['valid' => false, 'message' => __('You have already used this coupon the maximum number of times.', 'yatra')];
            }
        }
        
        // Check if applicable to this trip
        if ($discount->applicable_to === 'specific_trips') {
            $trip_ids = is_string($discount->trip_ids) ? maybe_unserialize($discount->trip_ids) : ($discount->trip_ids ?? []);
            if (!empty($trip_ids) && !in_array((int) $session['trip_id'], array_map('intval', $trip_ids), true)) {
                return ['valid' => false, 'message' => __('This coupon is not applicable to this trip.', 'yatra')];
            }
        }
        
        // Check minimum amount
        $total = $this->calculateSessionTotal($session);
        if (!empty($discount->min_amount) && $total < (float) $discount->min_amount) {
            return [
                'valid' => false, 
                'message' => sprintf(
                    __('Minimum order amount of %s required for this coupon.', 'yatra'),
                    yatra_format_price((float) $discount->min_amount)
                ),
            ];
        }
        
        // Check first-time customer
        if ($discount->first_time_customer_only && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $has_previous_booking = $this->bookingRepository->hasUserMadeBooking($user_id);
            if ($has_previous_booking) {
                return ['valid' => false, 'message' => __('This coupon is only for first-time customers.', 'yatra')];
            }
        }
        
        // Check group size requirements
        if ($discount->is_group_discount && !empty($discount->min_group_size)) {
            $travelers = (int) ($session['travelers'] ?? 1);
            if ($travelers < (int) $discount->min_group_size) {
                return [
                    'valid' => false,
                    'message' => sprintf(
                        __('This coupon requires a minimum group size of %d travelers.', 'yatra'),
                        (int) $discount->min_group_size
                    ),
                ];
            }
        }
        
        return ['valid' => true, 'message' => ''];
    }

    /**
     * Calculate total amount from session
     */
    private function calculateSessionTotal(array $session): float
    {
        $pricing_type = $session['pricing_type'] ?? 'regular';
        
        if ($pricing_type === 'traveler_based' && !empty($session['price_types'])) {
            $total = 0;
            $traveler_counts = $session['traveler_counts'] ?? [];
            
            foreach ($session['price_types'] as $index => $pt) {
                $pt = (array) $pt;
                $category_id = $pt['category_id'] ?? $index;
                $price = (float) ($pt['effective_price'] ?? $pt['discounted_price'] ?? $pt['sale_price'] ?? $pt['original_price'] ?? 0);
                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
                $total += $price * $count;
            }
            
            return $total;
        }
        
        // Regular pricing
        $price = (float) ($session['trip_price'] ?? 0);
        $travelers = (int) ($session['travelers'] ?? 1);
        
        return $price * $travelers;
    }

    /**
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

