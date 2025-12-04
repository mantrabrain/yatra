<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Customer Repository
 * 
 * Manages customer data in the yatra_customers table.
 * Customers are separate from WordPress users - a customer may or may not have a WP account.
 */
class CustomerRepository extends BaseRepository
{
    /**
     * Base table name without prefix
     */
    private const TABLE_NAME = 'yatra_customers';

    /**
     * Get full table name with prefix
     */
    protected function getTableName(): string
    {
        global $wpdb;
        return $wpdb->prefix . self::TABLE_NAME;
    }

    /**
     * Find or create customer by email
     * 
     * @param array $data Customer data
     * @return int Customer ID
     */
    public function findOrCreate(array $data): int
    {
        $email = sanitize_email($data['email'] ?? '');
        
        if (empty($email)) {
            throw new \Exception('Customer email is required');
        }
        
        // Check if customer exists
        $existing = $this->findByEmail($email);
        
        if ($existing) {
            // Update existing customer with new data
            $this->updateFromBooking((int) $existing->id, $data);
            return (int) $existing->id;
        }
        
        // Create new customer
        return $this->createFromBooking($data);
    }

    /**
     * Find customer by email
     * 
     * @param string $email
     * @return object|null
     */
    public function findByEmail(string $email): ?object
    {
        global $wpdb;
        
        $table = $this->getTableName();
        $email = sanitize_email($email);
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s",
            $email
        ));
        
        return $result ?: null;
    }

    /**
     * Find customer by WordPress user ID
     * 
     * @param int $userId
     * @return object|null
     */
    public function findByUserId(int $userId): ?object
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE user_id = %d",
            $userId
        ));
        
        return $result ?: null;
    }

    /**
     * Find customer by gateway customer ID
     * 
     * @param string $gateway 'stripe', 'paypal', 'razorpay'
     * @param string $gatewayCustomerId
     * @return object|null
     */
    public function findByGatewayCustomerId(string $gateway, string $gatewayCustomerId): ?object
    {
        global $wpdb;
        
        $table = $this->getTableName();
        $column = $gateway . '_customer_id';
        
        // Validate column name to prevent SQL injection
        $allowedColumns = ['stripe_customer_id', 'paypal_customer_id', 'razorpay_customer_id'];
        if (!in_array($column, $allowedColumns, true)) {
            return null;
        }
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table} WHERE {$column} = %s",
            $gatewayCustomerId
        ));
        
        return $result ?: null;
    }

    /**
     * Create customer from booking data
     * 
     * @param array $data
     * @return int Customer ID
     */
    public function createFromBooking(array $data): int
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        $insertData = [
            'user_id' => !empty($data['user_id']) ? (int) $data['user_id'] : null,
            'first_name' => sanitize_text_field($data['first_name'] ?? ''),
            'last_name' => sanitize_text_field($data['last_name'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'address' => sanitize_text_field($data['address'] ?? ''),
            'city' => sanitize_text_field($data['city'] ?? ''),
            'country' => sanitize_text_field($data['country'] ?? ''),
            'nationality' => sanitize_text_field($data['nationality'] ?? ''),
            'newsletter_optin' => !empty($data['newsletter_optin']) ? 1 : 0,
            'source' => sanitize_text_field($data['source'] ?? 'booking'),
            'total_bookings' => 1,
            'total_spent' => (float) ($data['total_spent'] ?? 0),
            'last_booking_date' => current_time('mysql'),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];
        
        // Handle emergency contact if provided
        if (!empty($data['emergency_name'])) {
            $insertData['emergency_name'] = sanitize_text_field($data['emergency_name']);
            $insertData['emergency_phone'] = sanitize_text_field($data['emergency_phone'] ?? '');
            $insertData['emergency_relationship'] = sanitize_text_field($data['emergency_relationship'] ?? '');
        }
        
        $result = $wpdb->insert($table, $insertData);
        
        if ($result === false) {
            throw new \Exception('Failed to create customer: ' . $wpdb->last_error);
        }
        
        return (int) $wpdb->insert_id;
    }

    /**
     * Update customer from booking data
     * 
     * @param int $customerId
     * @param array $data
     * @return bool
     */
    public function updateFromBooking(int $customerId, array $data): bool
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        // Get current customer data
        $current = $this->find($customerId);
        if (!$current) {
            return false;
        }
        
        $updateData = [
            'updated_at' => current_time('mysql'),
            'last_booking_date' => current_time('mysql'),
            'total_bookings' => ((int) $current->total_bookings) + 1,
            'total_spent' => ((float) $current->total_spent) + ((float) ($data['total_spent'] ?? 0)),
        ];
        
        // Update phone if provided and not set
        if (!empty($data['phone']) && empty($current->phone)) {
            $updateData['phone'] = sanitize_text_field($data['phone']);
        }
        
        // Update address if provided and not set
        if (!empty($data['address']) && empty($current->address)) {
            $updateData['address'] = sanitize_text_field($data['address']);
        }
        
        // Update city if provided and not set
        if (!empty($data['city']) && empty($current->city)) {
            $updateData['city'] = sanitize_text_field($data['city']);
        }
        
        // Update country if provided and not set
        if (!empty($data['country']) && empty($current->country)) {
            $updateData['country'] = sanitize_text_field($data['country']);
        }
        
        // Update nationality if provided and not set
        if (!empty($data['nationality']) && empty($current->nationality)) {
            $updateData['nationality'] = sanitize_text_field($data['nationality']);
        }
        
        // Link WordPress user if not linked and provided
        if (!empty($data['user_id']) && empty($current->user_id)) {
            $updateData['user_id'] = (int) $data['user_id'];
        }
        
        // Update emergency contact if provided
        if (!empty($data['emergency_name'])) {
            $updateData['emergency_name'] = sanitize_text_field($data['emergency_name']);
            $updateData['emergency_phone'] = sanitize_text_field($data['emergency_phone'] ?? '');
            $updateData['emergency_relationship'] = sanitize_text_field($data['emergency_relationship'] ?? '');
        }
        
        // Update newsletter preference if opted in
        if (!empty($data['newsletter_optin'])) {
            $updateData['newsletter_optin'] = 1;
        }
        
        $result = $wpdb->update(
            $table,
            $updateData,
            ['id' => $customerId],
            null,
            ['%d']
        );
        
        return $result !== false;
    }

    /**
     * Update customer from admin form
     * 
     * This is used by the CustomerService::updateCustomer method when saving
     * changes from the admin Edit Customer screen.
     *
     * @param int   $customerId Customer ID
     * @param array $data       Data to update
     * @return bool
     */
    public function updateCustomer(int $customerId, array $data): bool
    {
        global $wpdb;

        $table = $this->getTableName();

        $updateData = [
            'updated_at' => current_time('mysql'),
        ];

        // Simple text fields
        if (array_key_exists('first_name', $data)) {
            $updateData['first_name'] = sanitize_text_field($data['first_name']);
        }
        if (array_key_exists('last_name', $data)) {
            $updateData['last_name'] = sanitize_text_field($data['last_name']);
        }
        if (array_key_exists('email', $data)) {
            $updateData['email'] = sanitize_email($data['email']);
        }
        if (array_key_exists('phone', $data)) {
            $updateData['phone'] = sanitize_text_field($data['phone']);
        }
        if (array_key_exists('secondary_phone', $data)) {
            $updateData['secondary_phone'] = sanitize_text_field($data['secondary_phone']);
        }
        if (array_key_exists('country', $data)) {
            $updateData['country'] = sanitize_text_field($data['country']);
        }
        if (array_key_exists('city', $data)) {
            $updateData['city'] = sanitize_text_field($data['city']);
        }
        if (array_key_exists('state', $data)) {
            $updateData['state'] = sanitize_text_field($data['state']);
        }
        if (array_key_exists('address', $data)) {
            $updateData['address'] = sanitize_text_field($data['address']);
        }
        if (array_key_exists('postal_code', $data)) {
            $updateData['postal_code'] = sanitize_text_field($data['postal_code']);
        }
        if (array_key_exists('nationality', $data)) {
            $updateData['nationality'] = sanitize_text_field($data['nationality']);
        }
        if (array_key_exists('date_of_birth', $data)) {
            $updateData['date_of_birth'] = sanitize_text_field($data['date_of_birth']);
        }
        if (array_key_exists('gender', $data)) {
            $updateData['gender'] = sanitize_text_field($data['gender']);
        }

        // Passport
        if (array_key_exists('passport_number', $data)) {
            $updateData['passport_number'] = sanitize_text_field($data['passport_number']);
        }
        if (array_key_exists('passport_expiry', $data)) {
            $updateData['passport_expiry'] = sanitize_text_field($data['passport_expiry']);
        }

        // Emergency contact
        if (array_key_exists('emergency_name', $data)) {
            $updateData['emergency_name'] = sanitize_text_field($data['emergency_name']);
        }
        if (array_key_exists('emergency_phone', $data)) {
            $updateData['emergency_phone'] = sanitize_text_field($data['emergency_phone']);
        }
        if (array_key_exists('emergency_relationship', $data)) {
            $updateData['emergency_relationship'] = sanitize_text_field($data['emergency_relationship']);
        }

        // Special requirements & notes
        if (array_key_exists('dietary_requirements', $data)) {
            $updateData['dietary_requirements'] = sanitize_text_field($data['dietary_requirements']);
        }
        if (array_key_exists('medical_conditions', $data)) {
            $updateData['medical_conditions'] = sanitize_textarea_field($data['medical_conditions']);
        }
        if (array_key_exists('special_needs', $data)) {
            $updateData['special_needs'] = sanitize_textarea_field($data['special_needs']);
        }
        if (array_key_exists('notes', $data)) {
            $updateData['notes'] = sanitize_textarea_field($data['notes']);
        }

        // Status & loyalty
        if (array_key_exists('status', $data)) {
            $updateData['status'] = sanitize_text_field($data['status']);
        }
        if (array_key_exists('loyalty_tier', $data)) {
            $updateData['loyalty_tier'] = sanitize_text_field($data['loyalty_tier']);
        }
        if (array_key_exists('loyalty_points', $data)) {
            $updateData['loyalty_points'] = (int) $data['loyalty_points'];
        }

        // Preferences
        if (array_key_exists('newsletter_optin', $data)) {
            $updateData['newsletter_optin'] = !empty($data['newsletter_optin']) ? 1 : 0;
        }
        if (array_key_exists('marketing_optin', $data)) {
            $updateData['marketing_optin'] = !empty($data['marketing_optin']) ? 1 : 0;
        }

        // Nothing to update
        if (count($updateData) === 1) {
            return true;
        }

        $result = $wpdb->update(
            $table,
            $updateData,
            ['id' => $customerId],
            null,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update gateway customer ID
     * 
     * @param int $customerId
     * @param string $gateway 'stripe', 'paypal', 'razorpay'
     * @param string $gatewayCustomerId
     * @return bool
     */
    public function updateGatewayCustomerId(int $customerId, string $gateway, string $gatewayCustomerId): bool
    {
        global $wpdb;
        
        $table = $this->getTableName();
        $column = $gateway . '_customer_id';
        
        // Validate column name to prevent SQL injection
        $allowedColumns = ['stripe_customer_id', 'paypal_customer_id', 'razorpay_customer_id'];
        if (!in_array($column, $allowedColumns, true)) {
            return false;
        }
        
        $result = $wpdb->update(
            $table,
            [
                $column => sanitize_text_field($gatewayCustomerId),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $customerId]
        );
        
        return $result !== false;
    }

    /**
     * Get gateway customer ID for a customer
     * 
     * @param int $customerId
     * @param string $gateway
     * @return string|null
     */
    public function getGatewayCustomerId(int $customerId, string $gateway): ?string
    {
        $customer = $this->find($customerId);
        if (!$customer) {
            return null;
        }
        
        $column = $gateway . '_customer_id';
        return !empty($customer->$column) ? $customer->$column : null;
    }

    /**
     * Update customer stats (called after booking changes)
     * 
     * @param int $customerId
     * @return bool
     */
    public function recalculateStats(int $customerId): bool
    {
        global $wpdb;
        
        $bookingsTable = $wpdb->prefix . 'yatra_bookings';
        $customersTable = $this->getTableName();
        
        // Get stats from bookings
        $stats = $wpdb->get_row($wpdb->prepare(
            "SELECT 
                COUNT(*) as total_bookings,
                COALESCE(SUM(total_amount), 0) as total_spent,
                COALESCE(SUM(travelers_count), 0) as total_travelers,
                MAX(created_at) as last_booking_date,
                MAX(travel_date) as last_travel_date
             FROM {$bookingsTable}
             WHERE customer_id = %d AND status NOT IN ('cancelled', 'refunded', 'failed')",
            $customerId
        ));
        
        if (!$stats) {
            return false;
        }
        
        // Update customer
        $result = $wpdb->update(
            $customersTable,
            [
                'total_bookings' => (int) $stats->total_bookings,
                'total_spent' => (float) $stats->total_spent,
                'total_travelers' => (int) $stats->total_travelers,
                'last_booking_date' => $stats->last_booking_date,
                'last_travel_date' => $stats->last_travel_date,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $customerId]
        );
        
        // Update loyalty tier based on total spent
        $this->updateLoyaltyTier($customerId, (float) $stats->total_spent);
        
        return $result !== false;
    }

    /**
     * Update loyalty tier based on total spent
     * 
     * @param int $customerId
     * @param float $totalSpent
     * @return void
     */
    private function updateLoyaltyTier(int $customerId, float $totalSpent): void
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        // Define tier thresholds (can be made configurable via settings)
        $tier = 'bronze';
        if ($totalSpent >= 10000) {
            $tier = 'platinum';
        } elseif ($totalSpent >= 5000) {
            $tier = 'gold';
        } elseif ($totalSpent >= 2000) {
            $tier = 'silver';
        }
        
        // Tier expires 1 year from last update
        $expiry = date('Y-m-d', strtotime('+1 year'));
        
        $wpdb->update(
            $table,
            [
                'loyalty_tier' => $tier,
                'loyalty_tier_expiry' => $expiry,
            ],
            ['id' => $customerId]
        );
    }

    /**
     * Search customers
     * 
     * @param string $search
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function search(string $search, int $limit = 20, int $offset = 0): array
    {
        global $wpdb;
        
        $table = $this->getTableName();
        $search = '%' . $wpdb->esc_like($search) . '%';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} 
             WHERE first_name LIKE %s 
                OR last_name LIKE %s 
                OR email LIKE %s 
                OR phone LIKE %s
             ORDER BY created_at DESC
             LIMIT %d OFFSET %d",
            $search,
            $search,
            $search,
            $search,
            $limit,
            $offset
        )) ?: [];
    }

    /**
     * Get customers with pagination
     * 
     * @param array $args
     * @return array ['data' => [], 'total' => int, 'pages' => int]
     */
    public function paginate(array $args = []): array
    {
        global $wpdb;
        
        $table = $this->getTableName();
        
        $page = max(1, (int) ($args['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($args['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;
        
        $where = ['1=1'];
        $params = [];
        
        // Filter by status
        if (!empty($args['status'])) {
            $where[] = 'status = %s';
            $params[] = sanitize_text_field($args['status']);
        }
        
        // Filter by loyalty tier
        if (!empty($args['loyalty_tier'])) {
            $where[] = 'loyalty_tier = %s';
            $params[] = sanitize_text_field($args['loyalty_tier']);
        }
        
        // Filter by country
        if (!empty($args['country'])) {
            $where[] = 'country = %s';
            $params[] = sanitize_text_field($args['country']);
        }
        
        // Search
        if (!empty($args['search'])) {
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            $where[] = '(first_name LIKE %s OR last_name LIKE %s OR email LIKE %s OR phone LIKE %s)';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Count total
        $countQuery = "SELECT COUNT(*) FROM {$table} WHERE {$whereClause}";
        $total = (int) $wpdb->get_var($wpdb->prepare($countQuery, $params));
        
        // Get data
        $orderBy = sanitize_sql_orderby($args['orderby'] ?? 'created_at') ?: 'created_at';
        $order = strtoupper($args['order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        
        $dataQuery = "SELECT * FROM {$table} WHERE {$whereClause} ORDER BY {$orderBy} {$order} LIMIT %d OFFSET %d";
        $params[] = $perPage;
        $params[] = $offset;
        
        $data = $wpdb->get_results($wpdb->prepare($dataQuery, $params)) ?: [];
        
        return [
            'data' => $data,
            'total' => $total,
            'pages' => (int) ceil($total / $perPage),
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Get customer bookings
     * 
     * @param int $customerId
     * @return array
     */
    public function getBookings(int $customerId): array
    {
        return $this->getCustomerBookings($customerId, 1000);
    }

    /**
     * Get customer bookings with limit
     * 
     * @param int $customerId Customer ID
     * @param int $limit Limit results
     * @return array
     */
    public function getCustomerBookings(int $customerId, int $limit = 10): array
    {
        global $wpdb;
        
        $bookingsTable = $wpdb->prefix . 'yatra_bookings';
        $tripsTable = $wpdb->prefix . 'yatra_trips';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image as trip_image
             FROM {$bookingsTable} b
             LEFT JOIN {$tripsTable} t ON b.trip_id = t.id
             WHERE b.customer_id = %d
             ORDER BY b.created_at DESC
             LIMIT %d",
            $customerId,
            $limit
        )) ?: [];
    }

    /**
     * Merge duplicate customers (by email)
     * 
     * @param int $keepId Customer ID to keep
     * @param int $mergeId Customer ID to merge into keepId
     * @return bool
     */
    public function mergeCustomers(int $keepId, int $mergeId): bool
    {
        global $wpdb;
        
        $bookingsTable = $wpdb->prefix . 'yatra_bookings';
        $customersTable = $this->getTableName();
        
        // Update all bookings from mergeId to keepId
        $wpdb->update(
            $bookingsTable,
            ['customer_id' => $keepId],
            ['customer_id' => $mergeId],
            ['%d'],
            ['%d']
        );
        
        // Delete the merged customer
        $wpdb->delete($customersTable, ['id' => $mergeId], ['%d']);
        
        // Recalculate stats
        $this->recalculateStats($keepId);
        
        return true;
    }
}

