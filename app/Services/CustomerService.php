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
        
        // Merge and deduplicate by booking ID
        $bookingIds = [];
        $allBookings = [];
        
        foreach ($bookings as $booking) {
            $bookingId = is_array($booking) ? ($booking['id'] ?? $booking['booking_id'] ?? null) : ($booking->id ?? null);
            if ($bookingId && !in_array($bookingId, $bookingIds)) {
                $bookingIds[] = $bookingId;
                $allBookings[] = $booking;
            }
        }
        
        foreach ($bookingsByUserId as $booking) {
            $bookingId = is_array($booking) ? ($booking['id'] ?? $booking['booking_id'] ?? null) : ($booking->id ?? null);
            if ($bookingId && !in_array($bookingId, $bookingIds)) {
                $bookingIds[] = $bookingId;
                $allBookings[] = $booking;
            }
        }
        
        // Limit results
        if ($limit > 0 && count($allBookings) > $limit) {
            $allBookings = array_slice($allBookings, 0, $limit);
        }
        
        return $allBookings;
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
        // Get customer's bookings first
        $bookings = $this->customerRepository->getCustomerBookings($customerId, 1000);
        $bookingIds = array_map(function($booking) {
            return (int) $booking['id'];
        }, $bookings);

        if (empty($bookingIds)) {
            return [];
        }

        // Get payments for these bookings
        global $wpdb;
        $payments_table = $wpdb->prefix . 'yatra_payments';
        $bookings_table = $wpdb->prefix . 'yatra_bookings';
        $trips_table = $wpdb->prefix . 'yatra_trips';
        
        $bookingIdsPlaceholder = implode(',', array_fill(0, count($bookingIds), '%d'));
        
        $query = $wpdb->prepare(
            "SELECT p.*, 
                    b.reference as booking_reference,
                    t.title as trip_title
             FROM {$payments_table} p
             LEFT JOIN {$bookings_table} b ON p.booking_id = b.id
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE p.booking_id IN ($bookingIdsPlaceholder)
             ORDER BY p.created_at DESC
             LIMIT %d",
            array_merge($bookingIds, [$limit])
        );

        $payments = $wpdb->get_results($query) ?: [];

        // Format payments
        return array_map(function($payment) {
            return [
                'id' => (int) $payment->id,
                'reference' => 'PAY-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT),
                'booking_number' => $payment->booking_reference ?? 'N/A',
                'trip_title' => $payment->trip_title ?? '',
                'amount' => (float) $payment->amount,
                'status' => $payment->status ?? 'pending',
                'method' => $payment->gateway ?? 'N/A',
                'date' => $payment->created_at ?? $payment->processed_at ?? '',
                'type' => $payment->type ?? 'balance',
                'transaction_id' => $payment->transaction_id ?? '',
            ];
        }, $payments);
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
        
        $documents = [];
        
        foreach ($bookings as $booking) {
            $bookingId = (int) $booking['id'];
            $tripTitle = $booking['trip_title'] ?? 'N/A';
            
            // Generate invoice document
            if (!empty($booking['total_amount'])) {
                $documents[] = [
                    'id' => 'invoice-' . $bookingId,
                    'name' => sprintf(__('Invoice #%s.pdf', 'yatra'), $booking['reference'] ?? $bookingId),
                    'trip_title' => $tripTitle,
                    'category' => 'invoice',
                    'updated_at' => $booking['created_at'] ?? date('Y-m-d H:i:s'),
                    'url' => rest_url('yatra/v1/bookings/' . $bookingId . '/invoice'),
                ];
            }
            
            // Generate voucher document if booking is confirmed
            if (($booking['status'] ?? '') === 'confirmed') {
                $documents[] = [
                    'id' => 'voucher-' . $bookingId,
                    'name' => sprintf(__('Travel Voucher #%s.pdf', 'yatra'), $booking['reference'] ?? $bookingId),
                    'trip_title' => $tripTitle,
                    'category' => 'voucher',
                    'updated_at' => $booking['created_at'] ?? date('Y-m-d H:i:s'),
                    'url' => rest_url('yatra/v1/bookings/' . $bookingId . '/voucher'),
                ];
            }
        }
        
        // Sort by updated_at descending
        usort($documents, function($a, $b) {
            return strtotime($b['updated_at']) - strtotime($a['updated_at']);
        });
        
        return $documents;
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
        return [
            'id' => (int) $customer->id,
            'user_id' => $customer->user_id ? (int) $customer->user_id : null,
            'name' => trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')),
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
            'created_at' => $customer->created_at,
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

