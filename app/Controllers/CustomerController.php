<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Customer REST API Controller
 * Handles customer account page endpoints
 * 
 * Endpoints:
 * - GET /customers/me - Get current customer profile
 * - GET /customers/my-bookings - Get current customer's bookings
 * - GET /customers/my-payments - Get current customer's payments
 * - GET /customers/my-documents - Get current customer's documents
 * - GET /customers/my-support-tickets - Get current customer's support tickets
 */
class CustomerController extends BaseController
{
    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'customers';

        // Get current customer profile
        register_rest_route($namespace, '/' . $base . '/me', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_me'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        // Get current customer's bookings
        register_rest_route($namespace, '/' . $base . '/my-bookings', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_my_bookings'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        // Get current customer's payments
        register_rest_route($namespace, '/' . $base . '/my-payments', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_my_payments'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        // Get current customer's documents
        register_rest_route($namespace, '/' . $base . '/my-documents', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_my_documents'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);

        // Get current customer's support tickets
        register_rest_route($namespace, '/' . $base . '/my-support-tickets', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_my_support_tickets'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
        ]);
    }

    /**
     * Check if user is logged in (customer permission)
     */
    public function check_customer_permission(?WP_REST_Request $request = null): bool
    {
        return is_user_logged_in();
    }

    /**
     * Get current customer profile
     */
    public function get_me(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            // Get user meta
            $phone = get_user_meta($current_user->ID, 'phone', true) ?: '';
            $address = get_user_meta($current_user->ID, 'address', true) ?: '';
            $city = get_user_meta($current_user->ID, 'city', true) ?: '';
            $country = get_user_meta($current_user->ID, 'country', true) ?: '';

            // Calculate total bookings and spent from bookings
            $bookings = $this->get_customer_bookings($current_user->ID);
            $total_bookings = count($bookings);
            $total_spent = 0;
            
            foreach ($bookings as $booking) {
                $total_spent += (float) ($booking['total_amount'] ?? 0);
            }

            // Get loyalty tier (if exists)
            $loyalty_tier = get_user_meta($current_user->ID, 'yatra_loyalty_tier', true) ?: null;

            $profile = [
                'id' => $current_user->ID,
                'name' => $current_user->display_name ?: $current_user->user_login,
                'email' => $current_user->user_email,
                'phone' => $phone,
                'address' => $address,
                'city' => $city,
                'country' => $country,
                'registered_at' => $current_user->user_registered ?: date('Y-m-d\TH:i:s\Z'),
                'total_bookings' => $total_bookings,
                'total_spent' => $total_spent,
                'loyalty_tier' => $loyalty_tier,
            ];

            return $this->success_response($profile);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get current customer's bookings
     */
    public function get_my_bookings(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            $bookings = $this->get_customer_bookings($current_user->ID);

            return $this->success_response($bookings);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get current customer's payments
     */
    public function get_my_payments(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            $payments = $this->get_customer_payments($current_user->ID);

            return $this->success_response($payments);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get current customer's documents
     */
    public function get_my_documents(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            $documents = $this->get_customer_documents($current_user->ID);

            return $this->success_response($documents);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get current customer's support tickets
     */
    public function get_my_support_tickets(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            $tickets = $this->get_customer_support_tickets($current_user->ID);

            return $this->success_response($tickets);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get customer bookings from custom post type or return empty array
     */
    private function get_customer_bookings(int $user_id): array
    {
        // Check if yatra-booking post type exists (legacy Yatra plugin)
        if (post_type_exists('yatra-booking')) {
            $args = [
                'post_type' => 'yatra-booking',
                'post_status' => 'any',
                'posts_per_page' => -1,
                'meta_query' => [
                    [
                        'key' => '_yatra_booking_customer_id',
                        'value' => $user_id,
                        'compare' => '=',
                    ],
                ],
                'orderby' => 'date',
                'order' => 'DESC',
            ];

            $query = new \WP_Query($args);
            $bookings = [];

            foreach ($query->posts as $post) {
                $booking_number = get_post_meta($post->ID, '_yatra_booking_number', true) ?: 'YT-' . $post->ID;
                $trip_id = (int) get_post_meta($post->ID, '_yatra_booking_trip_id', true);
                $trip_title = get_the_title($trip_id) ?: __('Unknown Trip', 'yatra');
                $total_amount = (float) get_post_meta($post->ID, '_yatra_booking_total', true);
                $travelers = (int) get_post_meta($post->ID, '_yatra_booking_travelers', true) ?: 1;
                $payment_status = get_post_meta($post->ID, '_yatra_booking_payment_status', true) ?: 'pending';
                $booking_status = get_post_meta($post->ID, '_yatra_booking_status', true) ?: 'pending';
                $travel_date = get_post_meta($post->ID, '_yatra_booking_travel_date', true) ?: $post->post_date;
                $destination = get_post_meta($post->ID, '_yatra_booking_destination', true) ?: '';

                $bookings[] = [
                    'id' => $post->ID,
                    'booking_number' => $booking_number,
                    'trip_title' => $trip_title,
                    'trip_id' => $trip_id,
                    'booking_date' => $post->post_date,
                    'travel_date' => $travel_date,
                    'travelers' => $travelers,
                    'total_amount' => $total_amount,
                    'payment_status' => $payment_status,
                    'booking_status' => $booking_status,
                    'destination' => $destination,
                ];
            }

            return $bookings;
        }

        // Return empty array if no booking system exists yet
        return [];
    }

    /**
     * Get customer payments from custom post type or return empty array
     */
    private function get_customer_payments(int $user_id): array
    {
        // Check if yatra-payment post type exists (legacy Yatra plugin)
        if (post_type_exists('yatra-payment')) {
            $args = [
                'post_type' => 'yatra-payment',
                'post_status' => 'any',
                'posts_per_page' => -1,
                'meta_query' => [
                    [
                        'key' => '_yatra_payment_customer_id',
                        'value' => $user_id,
                        'compare' => '=',
                    ],
                ],
                'orderby' => 'date',
                'order' => 'DESC',
            ];

            $query = new \WP_Query($args);
            $payments = [];

            foreach ($query->posts as $post) {
                $reference = get_post_meta($post->ID, '_yatra_payment_reference', true) ?: 'PAY-' . $post->ID;
                $booking_number = get_post_meta($post->ID, '_yatra_payment_booking_number', true) ?: '';
                $amount = (float) get_post_meta($post->ID, '_yatra_payment_amount', true);
                $status = get_post_meta($post->ID, '_yatra_payment_status', true) ?: 'pending';
                $method = get_post_meta($post->ID, '_yatra_payment_method', true) ?: __('Unknown', 'yatra');
                $type = get_post_meta($post->ID, '_yatra_payment_type', true) ?: 'deposit';

                $payments[] = [
                    'id' => $post->ID,
                    'reference' => $reference,
                    'booking_number' => $booking_number,
                    'amount' => $amount,
                    'status' => $status,
                    'method' => $method,
                    'date' => $post->post_date,
                    'type' => $type,
                ];
            }

            return $payments;
        }

        // Return empty array if no payment system exists yet
        return [];
    }

    /**
     * Get customer documents (itineraries, vouchers, invoices)
     */
    private function get_customer_documents(int $user_id): array
    {
        // For now, return empty array
        // This can be extended to query from a documents table or post type
        // or generate documents on-the-fly from bookings
        return [];
    }

    /**
     * Get customer support tickets
     */
    private function get_customer_support_tickets(int $user_id): array
    {
        // For now, return empty array
        // This can be extended to query from a support tickets table or post type
        return [];
    }
}

