<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Booking Session REST API Controller
 * Manages booking session data via REST API
 */
class BookingSessionController extends BaseController
{
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
        global $wpdb;
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        // Query for published/active trips
        $trip = $wpdb->get_row($wpdb->prepare(
            "SELECT id, title, slug, sale_price, original_price, currency, min_travelers, max_travelers, duration_days, status 
             FROM {$trips_table} 
             WHERE id = %d AND status IN ('publish', 'published', 'active')",
            (int) $data['trip_id']
        ));

        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }

        // Prepare session data
        $session_data = [
            'trip_id' => (int) $trip->id,
            'trip_title' => $trip->title,
            'trip_slug' => $trip->slug,
            'trip_price' => !empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price,
            'currency' => $trip->currency ?: 'USD',
            'min_travelers' => (int) ($trip->min_travelers ?: 1),
            'max_travelers' => (int) ($trip->max_travelers ?: 20),
            'duration_days' => (int) ($trip->duration_days ?: 1),
            'travelers' => isset($data['travelers']) ? max(1, (int) $data['travelers']) : 1,
            'travel_date' => !empty($data['travel_date']) ? sanitize_text_field($data['travel_date']) : '',
            'timestamp' => time(),
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

        global $wpdb;
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        $trip = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$trips_table} WHERE id = %d AND status IN ('publish', 'published', 'active')",
            $trip_id
        ));

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
        $data = $request->get_json_params();

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

        // Validate required fields
        $required_fields = ['contact_email', 'contact_phone', 'travel_date', 'travelers'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => sprintf(__('Field %s is required.', 'yatra'), $field),
                ], 400);
            }
        }

        // Validate email
        if (!is_email($data['contact_email'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Invalid email address.', 'yatra'),
            ], 400);
        }

        // Get trip data
        global $wpdb;
        $trips_table = $wpdb->prefix . 'yatra_trips';
        $trip = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$trips_table} WHERE id = %d AND status IN ('publish', 'published', 'active')",
            $trip_id
        ));

        if (!$trip) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Trip not found.', 'yatra'),
            ], 404);
        }

        // Calculate price
        $price_per_person = !empty($trip->sale_price) ? (float) $trip->sale_price : (float) $trip->original_price;
        $travelers_count = count($data['travelers']);
        $total_amount = $price_per_person * $travelers_count;

        // Handle payment method
        $payment_method = sanitize_text_field($data['payment_method'] ?? 'full');
        $payment_gateway = sanitize_text_field($data['payment_gateway'] ?? 'pay_later');
        
        $settings = get_option('yatra_settings', []);
        $deposit_percentage = (int) ($settings['deposit_percentage'] ?? 20);
        $partial_percentage = (int) ($settings['partial_payment_percentage'] ?? 30);

        $amount_due = $total_amount;
        if ($payment_method === 'deposit') {
            $amount_due = $total_amount * ($deposit_percentage / 100);
        } elseif ($payment_method === 'partial') {
            $amount_due = $total_amount * ($partial_percentage / 100);
        }

        // Generate booking reference
        $booking_reference = 'YTR-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));

        // Insert booking
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        
        $result = $wpdb->insert(
            $bookings_table,
            [
                'reference' => $booking_reference,
                'trip_id' => $trip_id,
                'user_id' => get_current_user_id() ?: null,
                'contact_email' => sanitize_email($data['contact_email']),
                'contact_phone' => sanitize_text_field($data['contact_phone']),
                'contact_country' => sanitize_text_field($data['contact_country'] ?? ''),
                'travel_date' => sanitize_text_field($data['travel_date']),
                'travelers_count' => $travelers_count,
                'travelers_data' => json_encode($data['travelers']),
                'total_amount' => $total_amount,
                'amount_paid' => 0,
                'amount_due' => $amount_due,
                'currency' => $trip->currency ?: 'USD',
                'payment_method' => $payment_method,
                'payment_gateway' => $payment_gateway,
                'status' => 'pending',
                'special_requests' => sanitize_textarea_field($data['special_requests'] ?? ''),
                'ip_address' => $this->getClientIp(),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['%s', '%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%f', '%f', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        if ($result === false) {
            return new WP_REST_Response([
                'success' => false,
                'message' => __('Failed to create booking. Please try again.', 'yatra'),
            ], 500);
        }

        $booking_id = $wpdb->insert_id;

        // Clear booking session
        yatra_clear_booking_session();

        // Check if this is an offline gateway
        $gateway_configs = $settings['gateway_configs'] ?? [];
        $gateway_config = $gateway_configs[$payment_gateway] ?? [];
        $is_offline = in_array($payment_gateway, ['pay_later', 'bank_transfer']);

        // For online gateways, create payment intent and return redirect URL
        if (!$is_offline && $amount_due > 0) {
            // TODO: Integrate with actual payment gateway
            // For now, return a placeholder
            return new WP_REST_Response([
                'success' => true,
                'message' => __('Booking created. Redirecting to payment...', 'yatra'),
                'data' => [
                    'booking_id' => $booking_id,
                    'reference' => $booking_reference,
                    'payment_url' => home_url('/payment/' . $booking_reference . '/'),
                ],
            ]);
        }

        // For offline gateways, mark as confirmed and redirect to confirmation
        $wpdb->update(
            $bookings_table,
            ['status' => 'confirmed'],
            ['id' => $booking_id],
            ['%s'],
            ['%d']
        );

        // Send confirmation email
        $this->sendBookingConfirmationEmail($booking_id, $booking_reference, $trip, $data);

        return new WP_REST_Response([
            'success' => true,
            'message' => __('Booking confirmed successfully!', 'yatra'),
            'data' => [
                'booking_id' => $booking_id,
                'reference' => $booking_reference,
                'redirect_url' => home_url('/booking-confirmation/' . $booking_reference . '/'),
            ],
        ]);
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
        $to = sanitize_email($data['contact_email']);
        $subject = sprintf(__('[%s] Booking Confirmation - %s', 'yatra'), get_bloginfo('name'), $reference);
        
        $body = sprintf(__("Dear Customer,\n\nThank you for your booking!\n\n", 'yatra'));
        $body .= sprintf(__("Booking Reference: %s\n", 'yatra'), $reference);
        $body .= sprintf(__("Trip: %s\n", 'yatra'), $trip->title);
        $body .= sprintf(__("Travel Date: %s\n", 'yatra'), $data['travel_date']);
        $body .= sprintf(__("Travelers: %d\n", 'yatra'), count($data['travelers']));
        $body .= sprintf(__("\nWe will contact you shortly with more details.\n\n", 'yatra'));
        $body .= sprintf(__("Best regards,\n%s\n", 'yatra'), get_bloginfo('name'));

        wp_mail($to, $subject, $body);

        // Also notify admin
        $admin_email = get_option('admin_email');
        $admin_subject = sprintf(__('[%s] New Booking - %s', 'yatra'), get_bloginfo('name'), $reference);
        $admin_body = sprintf(__("New booking received!\n\n", 'yatra'));
        $admin_body .= sprintf(__("Reference: %s\n", 'yatra'), $reference);
        $admin_body .= sprintf(__("Trip: %s\n", 'yatra'), $trip->title);
        $admin_body .= sprintf(__("Customer: %s (%s)\n", 'yatra'), $data['contact_email'], $data['contact_phone']);
        $admin_body .= sprintf(__("Travel Date: %s\n", 'yatra'), $data['travel_date']);
        $admin_body .= sprintf(__("Travelers: %d\n", 'yatra'), count($data['travelers']));
        $admin_body .= sprintf(__("\nView in admin: %s\n", 'yatra'), admin_url('admin.php?page=yatra&subpage=bookings&action=view&id=' . $booking_id));

        wp_mail($admin_email, $admin_subject, $admin_body);
    }
}

