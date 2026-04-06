<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\CustomerRepository;
use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;

/**
 * Customer Service
 * 
 * Contains business logic for customer management.
 * 
 * @package Yatra\Services
 */
class CustomerService
{
    private CustomerRepository $customerRepository;
    private BookingRepository $bookingRepository;
    private PaymentRepository $paymentRepository;

    public function __construct()
    {
        $this->customerRepository = new CustomerRepository();
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
    }

    /**
     * Get customer statistics
     *
     * @return array
     */
    public function getStats(): array
    {
        return $this->customerRepository->getStats();
    }

    /**
     * Get paginated customers
     *
     * @param array $filters Filters
     * @return array
     */
    public function getCustomers(array $filters = []): array
    {
        $result = $this->customerRepository->paginate($filters);

        $result['data'] = array_map([$this, 'formatCustomer'], $result['data']);

        return $result;
    }

    /**
     * Get single customer with details
     * 
     * @param int $id Customer ID
     * @return array|null
     */
    public function getCustomer(int $id): ?array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomerWithDetails($customer);
    }

    /**
     * Get customer by email
     * 
     * @param string $email Customer email
     * @return array|null
     */
    public function getCustomerByEmail(string $email): ?array
    {
        $customer = $this->customerRepository->findByEmail($email);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomer($customer);
    }

    /**
     * Get customer by WordPress user ID
     * 
     * @param int $userId WordPress user ID
     * @return array|null
     */
    public function getCustomerByUserId(int $userId): ?array
    {
        $customer = $this->customerRepository->findByUserId($userId);

        if (!$customer) {
            return null;
        }

        return $this->formatCustomer($customer);
    }

    /**
     * Account page /customers/me: Yatra customer when linked, otherwise WordPress user (display name, email).
     */
    public function getAccountProfileForUser(int $userId): ?array
    {
        if ($userId <= 0) {
            return null;
        }

        $customer = $this->getCustomerByUserId($userId);
        if ($customer !== null) {
            return $customer;
        }

        $user = get_userdata($userId);
        if (!$user instanceof \WP_User) {
            return null;
        }

        return $this->buildProfileArrayFromWpUser($user);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildProfileArrayFromWpUser(\WP_User $user): array
    {
        $first = trim((string) $user->first_name);
        $last = trim((string) $user->last_name);
        $fromParts = trim($first . ' ' . $last);
        $display = trim((string) $user->display_name);
        $name = $fromParts !== '' ? $fromParts : $display;
        if ($name === '') {
            $name = (string) $user->user_login;
        }

        return [
            'id' => 0,
            'user_id' => (int) $user->ID,
            'name' => $name,
            'first_name' => $first,
            'last_name' => $last,
            'email' => (string) $user->user_email,
            'phone' => '',
            'country' => '',
            'city' => '',
            'status' => 'active',
            'total_bookings' => 0,
            'total_spent' => 0.0,
            'loyalty_tier' => '',
            'created_at' => $user->user_registered,
            'last_booking_date' => null,
            'registered_at' => $user->user_registered,
        ];
    }

    /**
     * Create a new customer
     * 
     * @param array $data Customer data
     * @return array {success: bool, customer_id?: int, message: string}
     */
    public function createCustomer(array $data): array
    {
        // Validate required fields
        if (empty($data['email'])) {
            return ['success' => false, 'message' => __('Email is required.', 'yatra')];
        }

        // Validate email format
        if (!is_email($data['email'])) {
            return ['success' => false, 'message' => __('Please provide a valid email address.', 'yatra')];
        }

        // Check if customer already exists
        $existingCustomer = $this->customerRepository->findByEmail($data['email']);
        if ($existingCustomer) {
            return [
                'success' => false,
                'message' => __('A customer with this email already exists.', 'yatra'),
                'existing_id' => (int) $existingCustomer->id,
            ];
        }

        // Create customer
        $customerId = $this->customerRepository->findOrCreate($data);

        if (!$customerId) {
            return ['success' => false, 'message' => __('Failed to create customer.', 'yatra')];
        }

        return [
            'success' => true,
            'customer_id' => $customerId,
            'message' => __('Customer created successfully.', 'yatra'),
        ];
    }

    /**
     * Update a customer
     * 
     * @param int   $id   Customer ID
     * @param array $data Customer data
     * @return array {success: bool, message: string}
     */
    public function updateCustomer(int $id, array $data): array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        // Check email uniqueness if changing
        if (!empty($data['email']) && $data['email'] !== $customer->email) {
            $existingCustomer = $this->customerRepository->findByEmail($data['email']);
            if ($existingCustomer && (int) $existingCustomer->id !== $id) {
                return ['success' => false, 'message' => __('Email is already in use by another customer.', 'yatra')];
            }
        }

        $updated = $this->customerRepository->updateCustomer($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update customer.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Customer updated successfully.', 'yatra'),
        ];
    }

    /**
     * Update customer status
     * 
     * @param int    $id     Customer ID
     * @param string $status New status (active, inactive, blocked)
     * @return array {success: bool, message: string}
     */
    public function updateStatus(int $id, string $status): array
    {
        $validStatuses = ['active', 'inactive', 'blocked'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        $updated = $this->customerRepository->updateCustomer($id, ['status' => $status]);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => sprintf(__('Customer status updated to %s.', 'yatra'), $status),
        ];
    }

    /**
     * Delete a customer
     * 
     * @param int $id Customer ID
     * @return array {success: bool, message: string}
     */
    public function deleteCustomer(int $id): array
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return ['success' => false, 'message' => __('Customer not found.', 'yatra')];
        }

        // Check for existing bookings
        $bookings = $this->customerRepository->getCustomerBookings($id, 1);
        if (!empty($bookings)) {
            return [
                'success' => false,
                'message' => __('Cannot delete customer with existing bookings. Consider deactivating instead.', 'yatra'),
            ];
        }

        $deleted = $this->customerRepository->deleteCustomer($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete customer.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Customer deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Get customer's bookings
     * 
     * @param int $customerId Customer ID
     * @param int $limit      Limit results
     * @return array
     */
    public function getCustomerBookings(int $customerId, int $limit = 10): array
    {
        return $this->customerRepository->getCustomerBookings($customerId, $limit);
    }

    /**
     * Get bookings by WordPress user ID (checks both customer_id and user_id)
     * 
     * @param int $userId WordPress user ID
     * @param int $limit  Limit results
     * @return array
     */
    public function getBookingsByUserId(int $userId, int $limit = 10): array
    {
        // First, try to get customer and bookings by customer_id
        $customer = $this->getCustomerByUserId($userId);
        $bookings = [];
        
        if ($customer) {
            $bookings = $this->getCustomerBookings((int) $customer['id'], $limit);
        }
        
        // Also get bookings directly by user_id (in case bookings were made before customer record was created)
        $bookingsByUserId = $this->bookingRepository->findByUserId($userId, $limit);

        // And include bookings made via the same email address
        $emailBookings = [];
        $user = get_userdata($userId);
        if ($user && !empty($user->user_email)) {
            $emailBookings = $this->bookingRepository->findByContactEmail($user->user_email, $limit);
        }
        
        // Merge and deduplicate by booking ID
        $bookingIds = [];
        $allBookings = [];
        $sources = [$bookings, $bookingsByUserId, $emailBookings];

        foreach ($sources as $collection) {
            foreach ($collection as $booking) {
                $bookingId = is_array($booking) ? ($booking['id'] ?? $booking['booking_id'] ?? null) : ($booking->id ?? null);
                if ($bookingId && !in_array($bookingId, $bookingIds, true)) {
                    $bookingIds[] = $bookingId;
                    $allBookings[] = $booking;
                }
            }
        }
        
        // Limit results
        if ($limit > 0 && count($allBookings) > $limit) {
            $allBookings = array_slice($allBookings, 0, $limit);
        }
        
        return $allBookings;
    }

    public function getBookingDetailsForUser(int $userId, int $bookingId): ?array
    {
        if ($userId <= 0 || $bookingId <= 0) {
            return null;
        }

        $booking = $this->bookingRepository->findWithTrip($bookingId);
        if (!$booking) {
            return null;
        }

        $user = get_userdata($userId);
        $userEmail = ($user && !empty($user->user_email)) ? (string) $user->user_email : '';

        $customer = $this->getCustomerByUserId($userId);
        $customerId = $customer ? (int) ($customer['id'] ?? 0) : 0;

        $bookingUserId = isset($booking->user_id) ? (int) $booking->user_id : 0;
        $bookingCustomerId = isset($booking->customer_id) ? (int) $booking->customer_id : 0;
        $bookingEmail = isset($booking->contact_email) ? (string) $booking->contact_email : '';

        $allowed = false;
        if ($bookingUserId > 0 && $bookingUserId === $userId) {
            $allowed = true;
        }
        if (!$allowed && $customerId > 0 && $bookingCustomerId > 0 && $bookingCustomerId === $customerId) {
            $allowed = true;
        }
        if (!$allowed && $userEmail !== '' && $bookingEmail !== '' && strtolower($userEmail) === strtolower($bookingEmail)) {
            $allowed = true;
        }

        if (!$allowed) {
            return null;
        }

        $emergencyContact = isset($booking->emergency_contact) ? maybe_unserialize($booking->emergency_contact) : null;
        if (is_string($emergencyContact)) {
            $decoded = json_decode($emergencyContact, true);
            if (is_array($decoded)) {
                $emergencyContact = $decoded;
            }
        }

        $details = [
            'id' => (int) ($booking->id ?? 0),
            'reference' => $booking->reference ?? null,
            'trip_id' => (int) ($booking->trip_id ?? 0),
            'trip_title' => $booking->trip_title ?? null,
            'trip_slug' => $booking->trip_slug ?? null,
            'trip_url' => function_exists('yatra_get_trip_permalink') ? yatra_get_trip_permalink((int) ($booking->trip_id ?? 0)) : '',
            'featured_image' => $booking->featured_image ?? null,
            'created_at' => $booking->created_at ?? null,
            'updated_at' => $booking->updated_at ?? null,
            'travel_date' => $booking->travel_date ?? null,
            'travelers_count' => (int) ($booking->travelers_count ?? 0),
            'total_amount' => (float) ($booking->total_amount ?? 0),
            'amount_paid' => (float) ($booking->amount_paid ?? 0),
            'amount_due' => (float) ($booking->amount_due ?? 0),
            'currency' => $booking->currency ?? null,
            'payment_status' => $booking->payment_status ?? null,
            'status' => $booking->status ?? null,
            'payment_gateway' => $booking->payment_gateway ?? null,
            'contact_first_name' => $booking->contact_first_name ?? null,
            'contact_last_name' => $booking->contact_last_name ?? null,
            'contact_email' => $booking->contact_email ?? null,
            'contact_phone' => $booking->contact_phone ?? null,
            'contact_country' => $booking->contact_country ?? null,
            'special_requests' => $booking->special_requests ?? null,
            'emergency_contact' => $emergencyContact,
            'contact_data' => isset($booking->contact_data) ? maybe_unserialize($booking->contact_data) : null,
            'travelers' => isset($booking->travelers) ? maybe_unserialize($booking->travelers) : null,
            'payments' => [],
        ];

        return apply_filters('yatra_customer_booking_details', $details, $booking, $userId);
    }

    /**
     * Get customer's payments
     * 
     * @param int $customerId Customer ID
     * @param int $limit      Limit results
     * @return array
     */
    public function getCustomerPayments(int $customerId, int $limit = 50): array
    {
        $bookings = $this->customerRepository->getCustomerBookings($customerId, 1000);
        $bookingIds = array_map(static function($booking) {
            if (is_object($booking)) {
                return (int) ($booking->id ?? 0);
            }
            if (is_array($booking)) {
                return (int) ($booking['id'] ?? 0);
            }
            return 0;
        }, $bookings);

        // Include bookings linked via user ID or email (older bookings may not have customer_id)
        $customer = $this->customerRepository->find($customerId);
        if ($customer) {
            if (!empty($customer->user_id)) {
                $userBookings = $this->bookingRepository->findByUserId((int) $customer->user_id, 1000);
                $bookingIds = array_merge($bookingIds, array_map(static function($booking) {
                    if (is_object($booking)) {
                        return (int) ($booking->id ?? 0);
                    }
                    if (is_array($booking)) {
                        return (int) ($booking['id'] ?? 0);
                    }
                    return 0;
                }, $userBookings));
            }

            if (!empty($customer->email)) {
                $emailBookings = $this->bookingRepository->findByContactEmail($customer->email, 1000);
                $bookingIds = array_merge($bookingIds, array_map(static function($booking) {
                    if (is_object($booking)) {
                        return (int) ($booking->id ?? 0);
                    }
                    if (is_array($booking)) {
                        return (int) ($booking['id'] ?? 0);
                    }
                    return 0;
                }, $emailBookings));
            }
        }

        $bookingIds = array_values(array_unique(array_filter($bookingIds)));

        return $this->getPaymentsForBookingIds($bookingIds, $limit);
    }

    public function getPaymentsByUserId(int $userId, int $limit = 50): array
    {
        $bookings = $this->bookingRepository->findByUserId($userId, 1000);

        $user = get_userdata($userId);
        if ($user && !empty($user->user_email)) {
            $bookingsByEmail = $this->bookingRepository->findByContactEmail($user->user_email, 1000);
            $bookings = array_merge($bookings, $bookingsByEmail);
        }

        $bookingIds = array_map(static function($booking) {
            if (is_object($booking)) {
                return (int) ($booking->id ?? 0);
            }
            if (is_array($booking)) {
                return (int) ($booking['id'] ?? 0);
            }
            return 0;
        }, $bookings);

        return $this->getPaymentsForBookingIds($bookingIds, $limit);
    }

    private function getPaymentsForBookingIds(array $bookingIds, int $limit = 50): array
    {
        $bookingIds = array_values(array_filter(array_map('intval', $bookingIds))); // ensure ints

        if (empty($bookingIds)) {
            return [];
        }

        $customerRepository = new \Yatra\Repositories\CustomerRepository();
        $payments = $customerRepository->getPaymentsForBookingIds($bookingIds, $limit);

        return array_map(static function($payment) {
            return [
                'id' => (int) $payment->id,
                'booking_id' => (int) $payment->booking_id,
                'booking_reference' => $payment->booking_reference,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'payment_method' => $payment->payment_method,
                'gateway' => $payment->gateway,
                'transaction_id' => $payment->transaction_id,
                'created_at' => $payment->created_at,
                'updated_at' => $payment->updated_at,
                'trip_title' => $payment->trip_title,
                'booking_amount_due' => (float) $payment->booking_amount_due,
                'booking_amount_paid' => (float) $payment->booking_amount_paid,
                'booking_total_amount' => (float) $payment->booking_total_amount,
            ];
        }, $payments);
    }

    public function getDocumentsForBookings(array $bookings, int $customerId = 0): array
    {
        $documents = [];

        // Process each booking individually for vouchers and itineraries
        // but group by trip for downloads
        $tripsWithBookings = [];
        
        foreach ($bookings as $booking) {
            $bookingId = is_object($booking) ? (int) ($booking->id ?? 0) : (int) ($booking['id'] ?? $booking['booking_id'] ?? 0);
            $tripId = is_object($booking) ? (int) ($booking->trip_id ?? 0) : (int) ($booking['trip_id'] ?? 0);
            $tripTitle = is_object($booking) ? (string) ($booking->trip_title ?? '') : (string) ($booking['trip_title'] ?? '');
            $reference = is_object($booking) ? ($booking->reference ?? null) : ($booking['reference'] ?? null);
            $status = is_object($booking) ? (string) ($booking->status ?? '') : (string) ($booking['status'] ?? '');
            $createdAt = is_object($booking) ? (string) ($booking->created_at ?? '') : (string) ($booking['created_at'] ?? '');

            if ($bookingId <= 0) {
                continue;
            }

            // Store trip info for downloads (grouped by trip)
            if ($tripId > 0 && !isset($tripsWithBookings[$tripId])) {
                $tripsWithBookings[$tripId] = [
                    'booking_id' => $bookingId,
                    'trip_title' => $tripTitle,
                    'reference' => $reference,
                    'status' => $status,
                    'created_at' => $createdAt,
                ];
            }

            // Get payments for this booking (invoices per payment)
            $payments = $this->paymentRepository->findByBookingId($bookingId);
            foreach ($payments as $payment) {
                $paymentId = (int) ($payment->id ?? 0);
                if ($paymentId <= 0) {
                    continue;
                }

                $paymentStatus = (string) ($payment->status ?? '');
                if (!in_array($paymentStatus, ['paid', 'completed', 'success'], true)) {
                    continue;
                }

                $docRef = $reference ?: $bookingId;

                // Invoice per payment
                $invoiceUrl = rest_url('yatra/v1/payment/' . $paymentId . '/invoice');
                $invoiceUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $invoiceUrl);

                $documents[] = [
                    'id' => 'invoice-payment-' . $paymentId,
                    'name' => sprintf(__('Invoice #%s.pdf', 'yatra'), $docRef),
                    'trip_title' => $tripTitle,
                    'category' => 'invoice',
                    'updated_at' => $payment->created_at ?? $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $invoiceUrl,
                ];
            }

            // Voucher per booking
            if ($status === 'confirmed') {
                $docRef = $reference ?: $bookingId;

                $voucherUrl = rest_url('yatra/v1/bookings/' . $bookingId . '/voucher');
                $voucherUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $voucherUrl);

                $documents[] = [
                    'id' => 'voucher-' . $bookingId, // Booking-based ID
                    'name' => sprintf(__('Travel Voucher #%s.pdf', 'yatra'), $docRef),
                    'trip_title' => $tripTitle,
                    'category' => 'voucher',
                    'updated_at' => $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $voucherUrl,
                ];

                // Itinerary per booking
                $itineraryUrl = rest_url('yatra/v1/bookings/' . $bookingId . '/itinerary');
                $itineraryUrl = add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $itineraryUrl);

                $documents[] = [
                    'id' => 'itinerary-' . $bookingId, // Booking-based ID
                    'name' => sprintf(__('Travel Itinerary #%s.pdf', 'yatra'), $docRef),
                    'trip_title' => $tripTitle,
                    'category' => 'itinerary',
                    'updated_at' => $createdAt ?: date('Y-m-d H:i:s'),
                    'url' => $itineraryUrl,
                ];
            }
        }

        usort($documents, function ($a, $b) {
            return strtotime($b['updated_at']) - strtotime($a['updated_at']);
        });

        // Apply downloads filter (which groups by trip)
        $documents = apply_filters('yatra_customer_documents', $documents, $bookings, $customerId);

        return is_array($documents) ? $documents : [];
    }

    /**
     * Get customer's documents (invoices, vouchers, itineraries)
     * 
     * @param int $customerId Customer ID
     * @return array
     */
    public function getCustomerDocuments(int $customerId): array
    {
        // Get customer's bookings
        $bookings = $this->customerRepository->getCustomerBookings($customerId, 1000);

        // Also include bookings linked via user_id/email (older bookings may not have customer_id)
        $customer = $this->customerRepository->find($customerId);
        if ($customer) {
            if (!empty($customer->user_id)) {
                $userBookings = $this->bookingRepository->findByUserId((int) $customer->user_id, 1000);
                $bookings = array_merge($bookings, $userBookings);
            }

            if (!empty($customer->email)) {
                $emailBookings = $this->bookingRepository->findByContactEmail((string) $customer->email, 1000);
                $bookings = array_merge($bookings, $emailBookings);
            }
        }

        // Deduplicate by booking id
        $seen = [];
        $unique = [];
        foreach ($bookings as $b) {
            $id = is_object($b) ? ($b->id ?? null) : ($b['id'] ?? $b['booking_id'] ?? null);
            if ($id && !isset($seen[$id])) {
                $seen[$id] = true;
                $unique[] = $b;
            }
        }

        return $this->getDocumentsForBookings($unique, $customerId);
    }

    /**
     * Get customer's support tickets
     * 
     * @param int $customerId Customer ID
     * @return array
     */
    public function getCustomerSupportTickets(int $customerId): array
    {
        // For now, return empty array as support tickets system may not be implemented yet
        // This can be extended when support ticket system is added
        return [];
    }

    /**
     * Merge two customer records
     * 
     * @param int $sourceId Source customer ID (will be deleted)
     * @param int $targetId Target customer ID (will be kept)
     * @return array {success: bool, message: string}
     */
    public function mergeCustomers(int $sourceId, int $targetId): array
    {
        if ($sourceId === $targetId) {
            return ['success' => false, 'message' => __('Cannot merge customer with itself.', 'yatra')];
        }

        $source = $this->customerRepository->find($sourceId);
        $target = $this->customerRepository->find($targetId);

        if (!$source || !$target) {
            return ['success' => false, 'message' => __('One or both customers not found.', 'yatra')];
        }

        // Update all bookings to point to target customer
        $this->bookingRepository->updateCustomerBookings($sourceId, $targetId);

        // Update target customer stats
        $this->customerRepository->updateCustomer($targetId, [
            'total_bookings' => (int) $target->total_bookings + (int) $source->total_bookings,
            'total_spent' => (float) $target->total_spent + (float) $source->total_spent,
        ]);

        // Delete source customer
        $this->customerRepository->deleteCustomer($sourceId);

        return [
            'success' => true,
            'message' => __('Customers merged successfully.', 'yatra'),
        ];
    }

    /**
     * Format customer for API response
     * 
     * @param object $customer Raw customer data
     * @return array
     */
    private function formatCustomer(object $customer): array
    {
        $name = trim((string) ($customer->first_name ?? '') . ' ' . (string) ($customer->last_name ?? ''));
        if ($name === '') {
            $uid = (int) ($customer->user_id ?? 0);
            if ($uid > 0) {
                $u = get_userdata($uid);
                if ($u instanceof \WP_User) {
                    $name = trim((string) $u->display_name);
                    if ($name === '') {
                        $name = trim($u->first_name . ' ' . $u->last_name);
                    }
                    if ($name === '') {
                        $name = (string) $u->user_login;
                    }
                }
            }
        }
        if ($name === '' && !empty($customer->email)) {
            $local = explode('@', (string) $customer->email)[0] ?? '';
            $name = $local !== '' ? $local : $name;
        }

        $created = $customer->created_at ?? '';

        return [
            'id' => (int) $customer->id,
            'user_id' => $customer->user_id ? (int) $customer->user_id : null,
            'name' => $name,
            'first_name' => $customer->first_name ?? '',
            'last_name' => $customer->last_name ?? '',
            'email' => $customer->email,
            'phone' => $customer->phone ?? '',
            'country' => $customer->country ?? '',
            'city' => $customer->city ?? '',
            'status' => $customer->status ?? 'active',
            'total_bookings' => (int) ($customer->total_bookings ?? 0),
            'total_spent' => (float) ($customer->total_spent ?? 0),
            'loyalty_tier' => $customer->loyalty_tier ?? 'bronze',
            'created_at' => $created,
            'registered_at' => $created,
            'last_booking_date' => $customer->last_booking_date ?? null,
        ];
    }

    /**
     * Format customer with all details
     * 
     * @param object $customer Raw customer data
     * @return array
     */
    private function formatCustomerWithDetails(object $customer): array
    {
        $formatted = $this->formatCustomer($customer);

        // Add additional fields
        $formatted['secondary_phone'] = $customer->secondary_phone ?? null;
        $formatted['address'] = $customer->address ?? null;
        $formatted['state'] = $customer->state ?? null;
        $formatted['postal_code'] = $customer->postal_code ?? null;
        $formatted['date_of_birth'] = $customer->date_of_birth ?? null;
        $formatted['gender'] = $customer->gender ?? null;
        $formatted['nationality'] = $customer->nationality ?? null;
        $formatted['passport_number'] = $customer->passport_number ?? null;
        $formatted['passport_expiry'] = $customer->passport_expiry ?? null;

        // Emergency contact
        $formatted['emergency_contact'] = [
            'name' => $customer->emergency_name ?? null,
            'phone' => $customer->emergency_phone ?? null,
            'relationship' => $customer->emergency_relationship ?? null,
        ];

        // Preferences
        $formatted['dietary_requirements'] = $customer->dietary_requirements ?? null;
        $formatted['medical_conditions'] = $customer->medical_conditions ?? null;
        $formatted['special_needs'] = $customer->special_needs ?? null;
        $formatted['preferred_language'] = $customer->preferred_language ?? 'en';
        $formatted['preferred_currency'] = $customer->preferred_currency ?? 'USD';

        // Marketing
        $formatted['newsletter_optin'] = (bool) ($customer->newsletter_optin ?? false);
        $formatted['marketing_optin'] = (bool) ($customer->marketing_optin ?? false);
        $formatted['source'] = $customer->source ?? null;

        // Stats
        $formatted['total_travelers'] = (int) ($customer->total_travelers ?? 0);
        $formatted['last_travel_date'] = $customer->last_travel_date ?? null;
        $formatted['loyalty_points'] = (int) ($customer->loyalty_points ?? 0);

        // Gateway IDs
        $formatted['stripe_customer_id'] = $customer->stripe_customer_id ?? null;
        $formatted['paypal_customer_id'] = $customer->paypal_customer_id ?? null;
        $formatted['razorpay_customer_id'] = $customer->razorpay_customer_id ?? null;

        // Notes
        $formatted['notes'] = $customer->notes ?? null;

        // Recent bookings
        $formatted['recent_bookings'] = $customer->recent_bookings ?? [];

        // Timestamps
        $formatted['updated_at'] = $customer->updated_at ?? null;
        $formatted['last_login_at'] = $customer->last_login_at ?? null;
        $formatted['verified_at'] = $customer->verified_at ?? null;

        return $formatted;
    }
}

