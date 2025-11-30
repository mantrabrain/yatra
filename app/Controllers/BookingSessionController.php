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
     * Constructor
     */
    public function __construct()
    {
        $this->travellerRepository = new TravellerRepository();
        $this->customerRepository = new CustomerRepository();
        $this->tripRepository = new TripRepository();
        $this->bookingRepository = new BookingRepository();
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
            'permission_callback' => '__return_true', // Allow all users (guests too)
        ]);

        // Get booking session
        register_rest_route($this->namespace, '/booking/session', [
            'methods' => 'GET',
            'callback' => [$this, 'get_session'],
            'permission_callback' => '__return_true',
        ]);

        // Clear booking session
        register_rest_route($this->namespace, '/booking/session', [
            'methods' => 'DELETE',
            'callback' => [$this, 'clear_session'],
            'permission_callback' => '__return_true',
        ]);

        // Get trip data for booking
        register_rest_route($this->namespace, '/booking/trip/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_trip_for_booking'],
            'permission_callback' => '__return_true',
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
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Set booking session data
     */
    public function set_session(WP_REST_Request $request): WP_REST_Response
    {
        // Ensure session is started for REST API requests
        yatra_start_session();
        
        $data = $request->get_json_params();

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
        
        // Try to find specific availability
        if ($travel_date) {
            $availability_table = $wpdb->prefix . 'yatra_trip_availability_dates';
            $query = "SELECT * FROM {$availability_table} WHERE trip_id = %d AND departure_date = %s";
            $params = [(int) $data['trip_id'], $travel_date];
            
            if ($departure_time) {
                $query .= " AND departure_time = %s";
                $params[] = $departure_time;
            }
            
            $query .= " LIMIT 1";
            $availability = $wpdb->get_row($wpdb->prepare($query, ...$params));
        }
        
        // Priority: Use data sent from frontend (availability card) first
        // 1. Frontend-sent pricing_type and price_types (from availability card)
        // 2. Database availability pricing
        // 3. Trip pricing
        
        $pricing_type = !empty($data['pricing_type']) ? sanitize_text_field($data['pricing_type']) : ($trip->pricing_type ?? 'regular');
        $trip_price = !empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price;
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
                    $categories_table = $wpdb->prefix . 'yatra_traveler_categories';
                    $placeholders = implode(',', array_fill(0, count($categoryIds), '%d'));
                    $cats = $wpdb->get_results($wpdb->prepare(
                        "SELECT id, label, slug, age_min, age_max FROM {$categories_table} WHERE id IN ({$placeholders})",
                        ...$categoryIds
                    ));
                    
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
                            $pt['effective_price'] = $pt['sale_price'] ?? $pt['discounted_price'] ?? $pt['original_price'] ?? 0;
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
        $travelers_count = isset($data['travelers']) ? max(1, (int) $data['travelers']) : 1;
        if (!empty($traveler_counts)) {
            $travelers_count = array_sum(array_map('intval', $traveler_counts));
            if ($travelers_count < 1) $travelers_count = 1;
        }

        // Determine if day trip - prefer frontend value, fallback to trip duration
        $is_day_trip = isset($data['is_day_trip']) ? (bool) $data['is_day_trip'] : (($trip->duration_days ?? 1) <= 1);
        
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
        ];

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
            'price' => !empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price,
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
     * Create a new booking
     */
    public function create_booking(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        
        $data = $request->get_json_params();

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
        
        // Try to find availability-specific pricing
        if (!empty($travel_date)) {
            global $wpdb;
            $availability_table = $wpdb->prefix . 'yatra_trip_availability_dates';
            $availability = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$availability_table} WHERE trip_id = %d AND departure_date = %s LIMIT 1",
                $trip_id,
                $travel_date
            ));
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
            
            if ($availability && !empty($availability->price_types)) {
                $price_types = is_string($availability->price_types) 
                    ? (json_decode($availability->price_types, true) ?: []) 
                    : $availability->price_types;
            }
            
            // If no availability pricing, use trip price types
            if (empty($price_types) && !empty($trip->price_types)) {
                $price_types = is_array($trip->price_types) ? $trip->price_types : [];
            }
            
            // Index price types by category_id
            $priceByCategory = [];
            foreach ($price_types as $pt) {
                $pt = (object) $pt;
                $catId = $pt->category_id ?? null;
                if ($catId) {
                    $priceByCategory[$catId] = $pt->effective_price ?? $pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0;
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
                    $total_amount += $firstPrice > 0 ? (float) $firstPrice : ((float) ($trip->sale_price ?? $trip->original_price));
                }
            }
            
            $price_per_person = $travelers_count > 0 ? $total_amount / $travelers_count : 0;
        } else {
            // Regular pricing
            if ($availability && !empty($availability->discounted_price)) {
                $price_per_person = (float) $availability->discounted_price;
            } elseif ($availability && !empty($availability->original_price)) {
                $price_per_person = (float) $availability->original_price;
            } else {
                $price_per_person = !empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price;
            }
            $total_amount = $price_per_person * $travelers_count;
        }

        // Handle payment method
        $payment_method = sanitize_text_field($data['payment_method'] ?? 'full');
        $payment_gateway = sanitize_text_field($data['payment_gateway'] ?? 'pay_later');
        
        // Use SettingsService for settings
        $deposit_percentage = (int) \Yatra\Services\SettingsService::get('deposit_percentage', 20);
        $partial_percentage = (int) \Yatra\Services\SettingsService::get('partial_payment_percentage', 30);

        $amount_due = $total_amount;
        if ($payment_method === 'deposit') {
            $amount_due = $total_amount * ($deposit_percentage / 100);
        } elseif ($payment_method === 'partial') {
            $amount_due = $total_amount * ($partial_percentage / 100);
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
        // CREATE OR UPDATE CUSTOMER
        // ========================================
        // Customers are separate from WordPress users - this is for CRM purposes
        $customer_id = null;
        try {
            $customer_id = $this->customerRepository->findOrCreate([
                'user_id' => get_current_user_id() ?: null,
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

        // Insert booking
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        
        $result = $wpdb->insert(
            $bookings_table,
            [
                'reference' => $booking_reference,
                'trip_id' => $trip_id,
                'customer_id' => $customer_id,
                'user_id' => get_current_user_id() ?: null,
                'contact_first_name' => $contact_data['first_name'],
                'contact_last_name' => $contact_data['last_name'],
                'contact_email' => $contact_data['email'],
                'contact_phone' => $contact_data['phone'],
                'contact_country' => $contact_data['country'],
                'contact_data' => wp_json_encode($contact_data),
                'emergency_contact' => wp_json_encode($emergency_data),
                'travel_date' => sanitize_text_field($travel_date),
                'travelers_count' => $travelers_count,
                'travelers_data' => '', // Legacy field - travellers now stored in separate table
                'total_amount' => $total_amount,
                'amount_paid' => 0,
                'amount_due' => $amount_due,
                'currency' => $trip->currency ?: 'USD',
                'payment_method' => $payment_method,
                'payment_gateway' => $payment_gateway,
                'status' => 'pending',
                'special_requests' => sanitize_textarea_field($data['special_requests'] ?? ''),
                'newsletter_optin' => !empty($data['subscribe_newsletter']) ? 1 : 0,
                'ip_address' => $this->getClientIp(),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%f', '%f', '%f', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s']
        );

        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to create booking. Please try again.', 'yatra'),
                'error' => $wpdb->last_error,
            ], 500);
        }

        $booking_id = $wpdb->insert_id;

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

        // Clear booking session
        yatra_clear_booking_session();

        // Check if this is an offline gateway
        $is_offline = in_array($payment_gateway, ['pay_later', 'bank_transfer']);

        // For online gateways, create payment intent and return redirect URL
        if (!$is_offline && $amount_due > 0) {
            // Process payment based on gateway
            $payment_result = $this->processPaymentGateway($payment_gateway, [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'amount' => $amount_due,
                'currency' => $trip->currency ?: 'USD',
                'customer_email' => $contact_data['email'],
                'customer_name' => $contact_data['first_name'] . ' ' . $contact_data['last_name'],
                'trip_title' => $trip->title,
            ]);
            
            if ($payment_result['success'] && !empty($payment_result['payment_url'])) {
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
            
            // If payment processing failed but booking was created, still return success
            // but with a note about payment
            if (!$payment_result['success']) {
                return new WP_REST_Response([
                    'success' => true,
                    'message' => __('Booking created but payment processing is pending. We will contact you.', 'yatra'),
                    'data' => [
                        'booking_id' => $booking_id,
                        'reference' => $booking_reference,
                        'redirect_url' => $this->getConfirmationUrl($booking_reference),
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
        $update_format = ['%s', '%s'];
        
        if ($confirmed_at) {
            $update_data['confirmed_at'] = $confirmed_at;
            $update_format[] = '%s';
        }
        
        $wpdb->update(
            $bookings_table,
            $update_data,
            ['id' => $booking_id],
            $update_format,
            ['%d']
        );

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
        
        if ($confirmation_page_id) {
            return add_query_arg('booking', $reference, get_permalink($confirmation_page_id));
        }
        
        return home_url('/booking-confirmation/' . $reference . '/');
    }
    
    /**
     * Process payment through the selected gateway
     */
    private function processPaymentGateway(string $gateway, array $params): array
    {
        // Get gateway configuration
        $gateway_configs = \Yatra\Services\SettingsService::get('gateway_configs', []);
        $config = $gateway_configs[$gateway] ?? [];
        
        // Check if gateway is in test mode
        $is_test_mode = !empty($config['test_mode']) || !empty($config['sandbox']);
        
        switch ($gateway) {
            case 'stripe':
                return $this->processStripePayment($params, $config, $is_test_mode);
                
            case 'paypal':
                return $this->processPayPalPayment($params, $config, $is_test_mode);
                
            case 'razorpay':
                return $this->processRazorpayPayment($params, $config, $is_test_mode);
                
            case 'esewa':
                return $this->processEsewaPayment($params, $config, $is_test_mode);
                
            case 'khalti':
                return $this->processKhaltiPayment($params, $config, $is_test_mode);
                
            case 'authorize_net':
                return $this->processAuthorizeNetPayment($params, $config, $is_test_mode);
                
            default:
                return ['success' => false, 'message' => 'Unknown payment gateway'];
        }
    }
    
    /**
     * Process Stripe payment
     */
    private function processStripePayment(array $params, array $config, bool $is_test): array
    {
        $api_key = $is_test ? ($config['api_secret'] ?? '') : ($config['api_secret'] ?? '');
        
        if (empty($api_key)) {
            return ['success' => false, 'message' => 'Stripe API key not configured'];
        }
        
        try {
            // Create Stripe checkout session
            $response = wp_remote_post('https://api.stripe.com/v1/checkout/sessions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => [
                    'payment_method_types[]' => 'card',
                    'line_items[0][price_data][currency]' => strtolower($params['currency']),
                    'line_items[0][price_data][product_data][name]' => $params['trip_title'],
                    'line_items[0][price_data][unit_amount]' => (int) ($params['amount'] * 100),
                    'line_items[0][quantity]' => 1,
                    'mode' => 'payment',
                    'success_url' => $this->getConfirmationUrl($params['reference']) . '?payment=success',
                    'cancel_url' => home_url('/book/?payment=cancelled&ref=' . $params['reference']),
                    'customer_email' => $params['customer_email'],
                    'metadata[booking_id]' => $params['booking_id'],
                    'metadata[reference]' => $params['reference'],
                ],
            ]);
            
            if (is_wp_error($response)) {
                return ['success' => false, 'message' => $response->get_error_message()];
            }
            
            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            if (!empty($body['url'])) {
                // Save session ID for webhook verification
                $this->bookingRepository->updatePaymentSessionId(
                    (int) $params['booking_id'],
                    $body['id'] ?? ''
                );

                return ['success' => true, 'payment_url' => $body['url']];
            }
            
            return ['success' => false, 'message' => $body['error']['message'] ?? 'Failed to create Stripe session'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
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
}

