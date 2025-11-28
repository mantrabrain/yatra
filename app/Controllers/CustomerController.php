<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Yatra\Repositories\CustomerRepository;

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
 * - PUT /customers/me - Update current customer profile
 * 
 * Admin Endpoints:
 * - GET /customers - Get all customers (admin)
 * - GET /customers/{id} - Get single customer (admin)
 * - PUT /customers/{id} - Update customer (admin)
 * - DELETE /customers/{id} - Delete customer (admin)
 */
class CustomerController extends BaseController
{
    private CustomerRepository $customerRepository;

    public function __construct()
    {
        // Ensure customers table exists before initializing repository
        $this->ensureCustomersTableExists();
        $this->customerRepository = new CustomerRepository();
    }
    
    /**
     * Ensure the customers table exists
     */
    private function ensureCustomersTableExists(): void
    {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'yatra_customers';
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
            DB_NAME,
            $table_name
        ));
        
        if (!$table_exists) {
            // Create the table
            \Yatra\Core\Database::createTables();
        }
    }

    /**
     * Register routes
     */
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';
        $base = 'customers';

        // ===========================
        // CUSTOMER (FRONTEND) ROUTES
        // ===========================
        
        // Get current customer profile
        register_rest_route($namespace, '/' . $base . '/me', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_me'],
                'permission_callback' => [$this, 'check_customer_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_me'],
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

        // ===========================
        // ADMIN ROUTES
        // ===========================
        
        // List all customers
        register_rest_route($namespace, '/' . $base, [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'list_customers'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Get single customer
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_customer'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_customer'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_customer'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Get customer bookings (admin)
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)/bookings', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_customer_bookings_admin'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Merge customers
        register_rest_route($namespace, '/' . $base . '/merge', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'merge_customers'],
                'permission_callback' => [$this, 'check_admin_permission'],
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
     * Check if user has admin permission
     */
    public function check_admin_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Get current customer profile
     * First checks yatra_customers table, falls back to WordPress user data
     */
    public function get_me(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            // Try to get customer from yatra_customers table
            $customer = $this->customerRepository->findByUserId($current_user->ID);
            
            if (!$customer) {
                // Try by email
                $customer = $this->customerRepository->findByEmail($current_user->user_email);
            }

            if ($customer) {
                // Return customer data from yatra_customers table
                $profile = [
                    'id' => (int) $customer->id,
                    'user_id' => (int) ($customer->user_id ?? 0),
                    'first_name' => $customer->first_name,
                    'last_name' => $customer->last_name ?? '',
                    'name' => trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')),
                    'email' => $customer->email,
                    'phone' => $customer->phone ?? '',
                    'secondary_phone' => $customer->secondary_phone ?? '',
                    'address' => $customer->address ?? '',
                    'city' => $customer->city ?? '',
                    'state' => $customer->state ?? '',
                    'country' => $customer->country ?? '',
                    'postal_code' => $customer->postal_code ?? '',
                    'nationality' => $customer->nationality ?? '',
                    'date_of_birth' => $customer->date_of_birth ?? null,
                    'gender' => $customer->gender ?? null,
                    'passport_number' => $customer->passport_number ?? null,
                    'passport_expiry' => $customer->passport_expiry ?? null,
                    'emergency_name' => $customer->emergency_name ?? '',
                    'emergency_phone' => $customer->emergency_phone ?? '',
                    'emergency_relationship' => $customer->emergency_relationship ?? '',
                    'dietary_requirements' => $customer->dietary_requirements ?? '',
                    'medical_conditions' => $customer->medical_conditions ?? '',
                    'special_needs' => $customer->special_needs ?? '',
                    'newsletter_optin' => (bool) ($customer->newsletter_optin ?? false),
                    'total_bookings' => (int) ($customer->total_bookings ?? 0),
                    'total_spent' => (float) ($customer->total_spent ?? 0),
                    'total_travelers' => (int) ($customer->total_travelers ?? 0),
                    'loyalty_tier' => $customer->loyalty_tier ?? 'bronze',
                    'loyalty_points' => (int) ($customer->loyalty_points ?? 0),
                    'last_booking_date' => $customer->last_booking_date ?? null,
                    'registered_at' => $customer->created_at ?? $current_user->user_registered,
                    'status' => $customer->status ?? 'active',
                ];
            } else {
                // Fall back to WordPress user data
                $profile = [
                    'id' => 0, // No customer record yet
                    'user_id' => $current_user->ID,
                    'first_name' => $current_user->first_name ?: '',
                    'last_name' => $current_user->last_name ?: '',
                    'name' => $current_user->display_name ?: $current_user->user_login,
                    'email' => $current_user->user_email,
                    'phone' => get_user_meta($current_user->ID, 'phone', true) ?: '',
                    'address' => get_user_meta($current_user->ID, 'address', true) ?: '',
                    'city' => get_user_meta($current_user->ID, 'city', true) ?: '',
                    'country' => get_user_meta($current_user->ID, 'country', true) ?: '',
                    'total_bookings' => 0,
                    'total_spent' => 0,
                    'loyalty_tier' => 'bronze',
                    'registered_at' => $current_user->user_registered,
                    'status' => 'active',
                ];
            }

            return $this->success_response($profile);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update current customer profile
     */
    public function update_me(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $current_user = wp_get_current_user();
            
            if (!$current_user->ID) {
                return $this->error_response('User not logged in', 401);
            }

            $data = $request->get_json_params();

            // Find or create customer
            $customer = $this->customerRepository->findByUserId($current_user->ID);
            if (!$customer) {
                $customer = $this->customerRepository->findByEmail($current_user->user_email);
            }

            if ($customer) {
                // Update existing customer
                $this->customerRepository->update((int) $customer->id, [
                    'first_name' => sanitize_text_field($data['first_name'] ?? $customer->first_name),
                    'last_name' => sanitize_text_field($data['last_name'] ?? $customer->last_name),
                    'phone' => sanitize_text_field($data['phone'] ?? $customer->phone),
                    'secondary_phone' => sanitize_text_field($data['secondary_phone'] ?? $customer->secondary_phone),
                    'address' => sanitize_text_field($data['address'] ?? $customer->address),
                    'city' => sanitize_text_field($data['city'] ?? $customer->city),
                    'state' => sanitize_text_field($data['state'] ?? $customer->state),
                    'country' => sanitize_text_field($data['country'] ?? $customer->country),
                    'postal_code' => sanitize_text_field($data['postal_code'] ?? $customer->postal_code),
                    'nationality' => sanitize_text_field($data['nationality'] ?? $customer->nationality),
                    'date_of_birth' => sanitize_text_field($data['date_of_birth'] ?? $customer->date_of_birth),
                    'gender' => sanitize_text_field($data['gender'] ?? $customer->gender),
                    'passport_number' => sanitize_text_field($data['passport_number'] ?? $customer->passport_number),
                    'passport_expiry' => sanitize_text_field($data['passport_expiry'] ?? $customer->passport_expiry),
                    'emergency_name' => sanitize_text_field($data['emergency_name'] ?? $customer->emergency_name),
                    'emergency_phone' => sanitize_text_field($data['emergency_phone'] ?? $customer->emergency_phone),
                    'emergency_relationship' => sanitize_text_field($data['emergency_relationship'] ?? $customer->emergency_relationship),
                    'dietary_requirements' => sanitize_text_field($data['dietary_requirements'] ?? $customer->dietary_requirements),
                    'medical_conditions' => sanitize_textarea_field($data['medical_conditions'] ?? $customer->medical_conditions),
                    'special_needs' => sanitize_textarea_field($data['special_needs'] ?? $customer->special_needs),
                    'newsletter_optin' => isset($data['newsletter_optin']) ? (bool) $data['newsletter_optin'] : (bool) $customer->newsletter_optin,
                    'user_id' => $current_user->ID, // Link WordPress user
                ]);
            } else {
                // Create new customer
                $this->customerRepository->createFromBooking([
                    'user_id' => $current_user->ID,
                    'first_name' => sanitize_text_field($data['first_name'] ?? $current_user->first_name),
                    'last_name' => sanitize_text_field($data['last_name'] ?? $current_user->last_name),
                    'email' => $current_user->user_email,
                    'phone' => sanitize_text_field($data['phone'] ?? ''),
                    'address' => sanitize_text_field($data['address'] ?? ''),
                    'city' => sanitize_text_field($data['city'] ?? ''),
                    'country' => sanitize_text_field($data['country'] ?? ''),
                    'nationality' => sanitize_text_field($data['nationality'] ?? ''),
                    'newsletter_optin' => (bool) ($data['newsletter_optin'] ?? false),
                    'source' => 'profile_update',
                ]);
            }

            // Also update WordPress user meta for compatibility
            wp_update_user([
                'ID' => $current_user->ID,
                'first_name' => sanitize_text_field($data['first_name'] ?? $current_user->first_name),
                'last_name' => sanitize_text_field($data['last_name'] ?? $current_user->last_name),
            ]);

            if (!empty($data['phone'])) {
                update_user_meta($current_user->ID, 'phone', sanitize_text_field($data['phone']));
            }
            if (!empty($data['address'])) {
                update_user_meta($current_user->ID, 'address', sanitize_text_field($data['address']));
            }
            if (!empty($data['city'])) {
                update_user_meta($current_user->ID, 'city', sanitize_text_field($data['city']));
            }
            if (!empty($data['country'])) {
                update_user_meta($current_user->ID, 'country', sanitize_text_field($data['country']));
            }

            return $this->success_response(['message' => 'Profile updated successfully']);
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

            // Get customer ID
            $customer = $this->customerRepository->findByUserId($current_user->ID);
            if (!$customer) {
                $customer = $this->customerRepository->findByEmail($current_user->user_email);
            }

            $bookings = [];
            
            if ($customer) {
                $bookings = $this->customerRepository->getBookings((int) $customer->id);
            } else {
                // Fall back to user_id based query
                $bookings = $this->get_bookings_by_user_id($current_user->ID);
            }

            // Format bookings
            $formatted = array_map(function($booking) {
                return [
                    'id' => (int) $booking->id,
                    'reference' => $booking->reference,
                    'trip_id' => (int) $booking->trip_id,
                    'trip_title' => $booking->trip_title ?? __('Unknown Trip', 'yatra'),
                    'trip_image' => $booking->trip_image ?? null,
                    'travel_date' => $booking->travel_date,
                    'travelers_count' => (int) $booking->travelers_count,
                    'total_amount' => (float) $booking->total_amount,
                    'amount_paid' => (float) ($booking->amount_paid ?? 0),
                    'amount_due' => (float) ($booking->amount_due ?? $booking->total_amount),
                    'currency' => $booking->currency ?? 'USD',
                    'status' => $booking->status,
                    'payment_status' => $booking->payment_status ?? 'pending',
                    'created_at' => $booking->created_at,
                ];
            }, is_array($bookings) ? $bookings : []);

            return $this->success_response($formatted);
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

            // Get customer ID
            $customer = $this->customerRepository->findByUserId($current_user->ID);
            if (!$customer) {
                $customer = $this->customerRepository->findByEmail($current_user->user_email);
            }

            $payments = [];
            
            if ($customer) {
                $payments = $this->get_payments_by_customer_id((int) $customer->id);
            }

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

            // TODO: Implement document retrieval
            // For now, return empty array
            return $this->success_response([]);
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

            // TODO: Implement support ticket retrieval
            // For now, return empty array
            return $this->success_response([]);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    // ===========================
    // ADMIN METHODS
    // ===========================

    /**
     * List all customers (admin)
     */
    public function list_customers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $args = [
                'page' => (int) ($request->get_param('page') ?? 1),
                'per_page' => (int) ($request->get_param('per_page') ?? 20),
                'search' => sanitize_text_field($request->get_param('search') ?? ''),
                'status' => sanitize_text_field($request->get_param('status') ?? ''),
                'loyalty_tier' => sanitize_text_field($request->get_param('loyalty_tier') ?? ''),
                'country' => sanitize_text_field($request->get_param('country') ?? ''),
                'orderby' => sanitize_text_field($request->get_param('orderby') ?? 'created_at'),
                'order' => sanitize_text_field($request->get_param('order') ?? 'DESC'),
            ];

            $result = $this->customerRepository->paginate($args);

            // Format customers
            $result['data'] = array_map(function($customer) {
                return $this->format_customer($customer);
            }, $result['data']);

            return $this->success_response($result);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get single customer (admin)
     */
    public function get_customer(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $customer = $this->customerRepository->find($id);

            if (!$customer) {
                return $this->error_response('Customer not found', 404);
            }

            return $this->success_response($this->format_customer($customer, true));
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Update customer (admin)
     */
    public function update_customer(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $customer = $this->customerRepository->find($id);

            if (!$customer) {
                return $this->error_response('Customer not found', 404);
            }

            $data = $request->get_json_params();
            
            $updateData = [];
            $allowedFields = [
                'first_name', 'last_name', 'email', 'phone', 'secondary_phone',
                'address', 'city', 'state', 'country', 'postal_code',
                'date_of_birth', 'gender', 'nationality', 'passport_number', 'passport_expiry',
                'emergency_name', 'emergency_phone', 'emergency_relationship',
                'dietary_requirements', 'medical_conditions', 'special_needs',
                'newsletter_optin', 'marketing_optin', 'status', 'notes',
                'loyalty_tier', 'loyalty_points',
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = in_array($field, ['medical_conditions', 'special_needs', 'notes'])
                        ? sanitize_textarea_field($data[$field])
                        : sanitize_text_field($data[$field]);
                }
            }

            if (!empty($updateData)) {
                $this->customerRepository->update($id, $updateData);
            }

            return $this->success_response(['message' => 'Customer updated successfully']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Delete customer (admin)
     */
    public function delete_customer(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $customer = $this->customerRepository->find($id);

            if (!$customer) {
                return $this->error_response('Customer not found', 404);
            }

            // Check if customer has bookings
            $bookings = $this->customerRepository->getBookings($id);
            if (!empty($bookings)) {
                return $this->error_response('Cannot delete customer with existing bookings. Please cancel or reassign bookings first.', 400);
            }

            $this->customerRepository->delete($id);

            return $this->success_response(['message' => 'Customer deleted successfully']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Get customer bookings (admin)
     */
    public function get_customer_bookings_admin(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $id = (int) $request->get_param('id');
            $customer = $this->customerRepository->find($id);

            if (!$customer) {
                return $this->error_response('Customer not found', 404);
            }

            $bookings = $this->customerRepository->getBookings($id);

            return $this->success_response($bookings);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    /**
     * Merge two customers (admin)
     */
    public function merge_customers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        try {
            $data = $request->get_json_params();
            
            $keep_id = (int) ($data['keep_id'] ?? 0);
            $merge_id = (int) ($data['merge_id'] ?? 0);

            if (!$keep_id || !$merge_id) {
                return $this->error_response('Both keep_id and merge_id are required', 400);
            }

            if ($keep_id === $merge_id) {
                return $this->error_response('Cannot merge customer with itself', 400);
            }

            $keep_customer = $this->customerRepository->find($keep_id);
            $merge_customer = $this->customerRepository->find($merge_id);

            if (!$keep_customer || !$merge_customer) {
                return $this->error_response('One or both customers not found', 404);
            }

            $this->customerRepository->mergeCustomers($keep_id, $merge_id);

            return $this->success_response(['message' => 'Customers merged successfully']);
        } catch (\Exception $e) {
            return $this->error_response($e->getMessage(), 500);
        }
    }

    // ===========================
    // HELPER METHODS
    // ===========================

    /**
     * Format customer for API response
     */
    private function format_customer(object $customer, bool $detailed = false): array
    {
        $data = [
            'id' => (int) $customer->id,
            'user_id' => (int) ($customer->user_id ?? 0),
            'first_name' => $customer->first_name ?? '',
            'last_name' => $customer->last_name ?? '',
            'name' => trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')),
            'email' => $customer->email ?? '',
            'phone' => $customer->phone ?? '',
            'country' => $customer->country ?? '',
            'total_bookings' => (int) ($customer->total_bookings ?? 0),
            'total_spent' => (float) ($customer->total_spent ?? 0),
            'loyalty_tier' => $customer->loyalty_tier ?? 'bronze',
            'status' => $customer->status ?? 'active',
            'created_at' => $customer->created_at ?? null,
            'last_booking_date' => $customer->last_booking_date ?? null,
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'secondary_phone' => $customer->secondary_phone ?? '',
                'address' => $customer->address ?? '',
                'city' => $customer->city ?? '',
                'state' => $customer->state ?? '',
                'postal_code' => $customer->postal_code ?? '',
                'date_of_birth' => $customer->date_of_birth ?? null,
                'gender' => $customer->gender ?? null,
                'nationality' => $customer->nationality ?? '',
                'passport_number' => $customer->passport_number ?? null,
                'passport_expiry' => $customer->passport_expiry ?? null,
                'emergency_name' => $customer->emergency_name ?? '',
                'emergency_phone' => $customer->emergency_phone ?? '',
                'emergency_relationship' => $customer->emergency_relationship ?? '',
                'dietary_requirements' => $customer->dietary_requirements ?? '',
                'medical_conditions' => $customer->medical_conditions ?? '',
                'special_needs' => $customer->special_needs ?? '',
                'preferred_language' => $customer->preferred_language ?? 'en',
                'preferred_currency' => $customer->preferred_currency ?? 'USD',
                'newsletter_optin' => (bool) ($customer->newsletter_optin ?? false),
                'marketing_optin' => (bool) ($customer->marketing_optin ?? false),
                'source' => $customer->source ?? '',
                'total_travelers' => (int) ($customer->total_travelers ?? 0),
                'last_travel_date' => $customer->last_travel_date ?? null,
                'loyalty_points' => (int) ($customer->loyalty_points ?? 0),
                'loyalty_tier_expiry' => $customer->loyalty_tier_expiry ?? null,
                'stripe_customer_id' => $customer->stripe_customer_id ?? null,
                'paypal_customer_id' => $customer->paypal_customer_id ?? null,
                'razorpay_customer_id' => $customer->razorpay_customer_id ?? null,
                'notes' => $customer->notes ?? '',
                'updated_at' => $customer->updated_at ?? null,
                'verified_at' => $customer->verified_at ?? null,
            ]);
        }

        return $data;
    }

    /**
     * Get bookings by user ID (fallback when no customer record exists)
     */
    private function get_bookings_by_user_id(int $user_id): array
    {
        global $wpdb;
        
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image as trip_image
             FROM {$bookings_table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.user_id = %d
             ORDER BY b.created_at DESC",
            $user_id
        )) ?: [];
    }

    /**
     * Get payments by customer ID
     */
    private function get_payments_by_customer_id(int $customer_id): array
    {
        global $wpdb;
        
        $payments_table = $wpdb->prefix . 'yatra_booking_payments';
        $bookings_table = $wpdb->prefix . 'yatra_bookings';

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT p.*, b.reference as booking_reference
             FROM {$payments_table} p
             INNER JOIN {$bookings_table} b ON p.booking_id = b.id
             WHERE b.customer_id = %d
             ORDER BY p.created_at DESC",
            $customer_id
        )) ?: [];

        return array_map(function($payment) {
            return [
                'id' => (int) $payment->id,
                'booking_id' => (int) $payment->booking_id,
                'booking_reference' => $payment->booking_reference,
                'transaction_id' => $payment->transaction_id ?? '',
                'gateway' => $payment->gateway,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency ?? 'USD',
                'status' => $payment->status,
                'payment_type' => $payment->payment_type ?? 'initial',
                'created_at' => $payment->created_at,
                'processed_at' => $payment->processed_at ?? null,
            ];
        }, $results);
    }
}
