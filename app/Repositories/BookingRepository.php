<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Constants\ClassificationTypes;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Utils\Cache;

/**
 * Booking Repository
 *
 * Handles all database operations for bookings.
 * No business logic here - only database CRUD operations.
 *
 * @package Yatra\Repositories
 */
class BookingRepository extends BaseRepository
{
    private ?string $resolvedBookingsTable = null;

    private function getResolvedBookingsTable(): string
    {
        if ($this->resolvedBookingsTable !== null) {
            return $this->resolvedBookingsTable;
        }
        $candidates = [
            $this->wpdb->prefix . 'yatra_new_bookings',
            $this->wpdb->prefix . 'yatra_bookings',
        ];
        foreach ($candidates as $candidate) {
            $pattern = $this->wpdb->esc_like($candidate);
            $exists = $this->wpdb->get_var($this->wpdb->prepare('SHOW TABLES LIKE %s', $pattern));
            if ($exists === $candidate) {
                $this->resolvedBookingsTable = $candidate;
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    }
                return $candidate;
            }
        }
        // Fallback to default
        $this->resolvedBookingsTable = BookingsTable::getTableName();
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        return $this->resolvedBookingsTable;
    }

    /**
     * Get full table name with prefix
     */
    protected function getTableName(): string
    {
        return $this->getResolvedBookingsTable();
    }

    /**
     * Public accessor for resolved bookings table (e.g. joins from other repositories).
     */
    public function getBookingsTableName(): string
    {
        return $this->getResolvedBookingsTable();
    }

    /**
     * Get trips table name
     */
    protected function getTripsTable(): string
    {
        return TripsTable::getTableName();
    }

    /**
     * Get paginated bookings with filters
     *
     * @param array $filters {
     * @type int $page Page number (default: 1)
     * @type int $per_page Items per page (default: 20)
     * @type string $status Booking status filter
     * @type string $payment_status Payment status filter
     * @type int $trip_id Trip ID filter
     * @type string $search Search term
     * @type string $date_from Start date filter
     * @type string $date_to End date filter
     * }
     * @return array {data: array, total: int, page: int, per_page: int, total_pages: int}
     */
    public function paginate(array $filters = []): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();
        $customers_table = \Yatra\Database\Tables\CustomersTable::getTableName();

        // Pagination
        $page = max(1, (int)($filters['page'] ?? 1));
        $per_page = max(1, min(100, (int)($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];

        if (!empty($filters['status'])) {
            $where_clauses[] = 'b.status = %s';
            $where_values[] = sanitize_text_field($filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $where_clauses[] = 'b.payment_status = %s';
            $where_values[] = sanitize_text_field($filters['payment_status']);
        }

        if (!empty($filters['trip_id'])) {
            $where_clauses[] = 'b.trip_id = %d';
            $where_values[] = (int)$filters['trip_id'];
        }

        if (!empty($filters['search'])) {
            $search_like = '%' . $this->wpdb->esc_like(sanitize_text_field($filters['search'])) . '%';
            $where_clauses[] = '(b.reference LIKE %s OR b.contact_email LIKE %s OR b.contact_first_name LIKE %s OR b.contact_last_name LIKE %s OR b.contact_phone LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like, $search_like, $search_like]);
        }

        if (!empty($filters['date_from'])) {
            $where_clauses[] = 'b.travel_date >= %s';
            $where_values[] = sanitize_text_field($filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $where_clauses[] = 'b.travel_date <= %s';
            $where_values[] = sanitize_text_field($filters['date_to']);
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$table} b WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int)$this->wpdb->get_var($count_query);

        // Get bookings with trip info and customer info
        $query = "SELECT 
                    b.*, 
                    t.title as trip_title, 
                    t.slug as trip_slug, 
                    t.featured_image,
                    c.first_name AS customer_first_name,
                    c.last_name AS customer_last_name,
                    c.email AS customer_email
                  FROM {$table} b
                  LEFT JOIN {$trips_table} t ON b.trip_id = t.id
                  LEFT JOIN {$customers_table} c ON c.id = b.customer_id
                  WHERE {$where_sql}
                  ORDER BY b.created_at DESC
                  LIMIT %d OFFSET %d";

        $query_values = array_merge($where_values, [$per_page, $offset]);
        $bookings = $this->wpdb->get_results($this->wpdb->prepare($query, ...$query_values));

        return [
            'data' => $bookings ?: [],
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => (int)ceil($total / $per_page),
        ];
    }

    /**
     * Find booking by ID with trip info
     *
     * @param int $id Booking ID
     * @return object|null
     */
    public function findWithTrip(int $id): ?object
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image
             FROM {$table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.id = %d",
            $id
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find booking by reference code
     *
     * @param string $reference Booking reference
     * @return object|null
     */
    public function findByReference(string $reference): ?object
    {
        $table = $this->getResolvedBookingsTable();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE reference = %s",
            sanitize_text_field($reference)
        );

        $row = $this->wpdb->get_row($query);
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
        return $row ?: null;
    }

    /**
     * Find booking by reference with trip data
     *
     * @param string $reference Booking reference
     * @return object|null
     */
    public function findByReferenceWithTrip(string $reference): ?object
    {
        $table = $this->getResolvedBookingsTable();

        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();

        $tripClassificationTable = TripClassificationsTable::getTableName();
        $classificationTable = ClassificationsTable::getTableName();
        $reviewsTable = ReviewsTable::getTableName();

        $joins = [];
        $selectParts = [
            "b.*, t.title as trip_title, t.slug as trip_slug, t.featured_image, 
             t.duration_days, t.duration_nights, t.difficulty_level,
             t.starting_location, t.ending_location"
        ];

        $joins[] = "LEFT JOIN {$tripClassificationTable} tc ON tc.trip_id = t.id";
        $joins[] = "LEFT JOIN {$classificationTable} cls ON cls.id = tc.classification_id";
        $selectParts[] = "GROUP_CONCAT(DISTINCT cls.name ORDER BY tc.`sort_order` SEPARATOR ',') as trip_classifications";

        $joins[] = "LEFT JOIN {$reviewsTable} rv ON rv.trip_id = t.id AND rv.status = 'approved'";
        $selectParts[] = "AVG(rv.rating) as trip_average_rating";
        $selectParts[] = "COUNT(DISTINCT CASE WHEN rv.status = 'approved' THEN rv.id END) as trip_review_count";

        $selectSql = implode(",\n                    ", $selectParts);
        $joinsSql = implode("\n             ", $joins);

        $query = $this->wpdb->prepare(
            "SELECT {$selectSql}
             FROM {$table} b
             LEFT JOIN {$tripsTable} t ON b.trip_id = t.id
             {$joinsSql}
             WHERE b.reference = %s
             GROUP BY b.id
             LIMIT 1",
            sanitize_text_field($reference)
        );


        $row = $this->wpdb->get_row($query);

        return $row ?: null;
    }

    /**
     * Find bookings by customer ID
     *
     * @param int $customerId Customer ID
     * @param int $limit Limit results
     * @return array
     */
    public function findByCustomerId(int $customerId, int $limit = 10): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT b.*, t.title as trip_title
             FROM {$table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.customer_id = %d
             ORDER BY b.created_at DESC
             LIMIT %d",
            $customerId,
            $limit
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find bookings by user ID (WordPress user)
     *
     * @param int $userId WordPress user ID
     * @param int $limit Limit results
     * @return array
     */
    public function findByUserId(int $userId, int $limit = 10): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT b.*, t.title as trip_title
             FROM {$table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.user_id = %d
             ORDER BY b.created_at DESC
             LIMIT %d",
            $userId,
            $limit
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find bookings by contact email
     *
     * @param string $email Contact email
     * @param int $limit Limit results
     * @return array
     */
    public function findByContactEmail(string $email, int $limit = 10): array
    {
        $table = $this->getTableName();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT b.*, t.title as trip_title
             FROM {$table} b
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE b.contact_email = %s
             ORDER BY b.created_at DESC
             LIMIT %d",
            sanitize_email($email),
            $limit
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Create a new booking
     *
     * @param array $data Booking data
     * @return int Booking ID on success
     * @throws \Exception on failure
     */
    public function create(array $data): int
    {
        $table = $this->getTableName();

        // Sanitize and prepare data
        $insertData = $this->prepareBookingData($data);
        $insertData['created_at'] = current_time('mysql');
        $insertData['updated_at'] = current_time('mysql');

        // Check which columns exist and remove non-existent ones
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);
        $hasEndDate = in_array('end_date', $columns, true);

        if (!$hasStartDate && isset($insertData['start_date'])) {
            unset($insertData['start_date']);
        }
        if (!$hasEndDate && isset($insertData['end_date'])) {
            unset($insertData['end_date']);
        }
        if (!in_array('meta', $columns, true) && isset($insertData['meta'])) {
            unset($insertData['meta']);
        }

        $result = $this->wpdb->insert($table, $insertData);

        if ($result === false) {
            throw new \Exception('Failed to create booking: ' . $this->wpdb->last_error);
        }

        $newId = (int) $this->wpdb->insert_id;
        $this->afterWrite('create', $newId, []);

        return $newId;
    }

    /**
     * Update a booking
     *
     * @param int $id Booking ID
     * @param array $data Booking data to update
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $table = $this->getTableName();

        // Sanitize and prepare data
        $updateData = $this->prepareBookingData($data);
        $updateData['updated_at'] = current_time('mysql');

        // Check which columns exist and remove non-existent ones
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");
        $hasStartDate = in_array('start_date', $columns, true);
        $hasEndDate = in_array('end_date', $columns, true);

        if (!$hasStartDate && isset($updateData['start_date'])) {
            unset($updateData['start_date']);
        }
        if (!$hasEndDate && isset($updateData['end_date'])) {
            unset($updateData['end_date']);
        }
        if (!in_array('meta', $columns, true) && isset($updateData['meta'])) {
            unset($updateData['meta']);
        }

        if (empty($updateData)) {
            return false;
        }

        $result = $this->wpdb->update(
            $table,
            $updateData,
            ['id' => $id],
            null,
            ['%d']
        );

        if ($result !== false) {
            $this->afterWrite('update', $id, []);
        }

        return $result !== false;
    }

    /**
     * Update booking status
     *
     * @param int $id Booking ID
     * @param string $status New status
     * @return bool
     */
    public function updateStatus(int $id, string $status): bool
    {
        $table = $this->getTableName();

        $data = [
            'status' => sanitize_text_field($status),
            'updated_at' => current_time('mysql'),
        ];

        // Set confirmed_at if confirming
        if ($status === 'confirmed') {
            $data['confirmed_at'] = current_time('mysql');
        }

        // Set completed_at if completing
        if ($status === 'completed') {
            $data['completed_at'] = current_time('mysql');
        }

        // Set cancelled info if cancelling
        if ($status === 'cancelled') {
            $data['cancelled_at'] = current_time('mysql');
            $data['cancelled_by'] = get_current_user_id();
        }

        $result = $this->wpdb->update($table, $data, ['id' => $id]);

        if ($result !== false) {
            $this->afterWrite('update', $id, []);
        }

        return $result !== false;
    }

    /**
     * Update payment status
     *
     * @param int $id Booking ID
     * @param string $status New payment status
     * @return bool
     */
    public function updatePaymentStatus(int $id, string $status): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            [
                'payment_status' => sanitize_text_field($status),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id]
        );

        if ($result !== false) {
            $this->afterWrite('update', $id, []);
        }

        return $result !== false;
    }

    /**
     * Update amount paid
     *
     * @param int $id Booking ID
     * @param float $amountPaid New amount paid
     * @return bool
     */
    public function updateAmountPaid(int $id, float $amountPaid): bool
    {
        $table = $this->getTableName();

        // Get booking to calculate amount due
        $booking = $this->find($id);
        if (!$booking) {
            return false;
        }

        $amountDue = max(0, (float)$booking->total_amount - $amountPaid);
        $paymentStatus = $amountDue <= 0 ? 'paid' : ($amountPaid > 0 ? 'partial' : 'pending');

        $result = $this->wpdb->update(
            $table,
            [
                'amount_paid' => $amountPaid,
                'amount_due' => $amountDue,
                'payment_status' => $paymentStatus,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $id]
        );

        if ($result !== false) {
            $this->afterWrite('update', $id, []);
        }

        return $result !== false;
    }

    /**
     * Delete a booking
     *
     * @param int $id Booking ID
     * @return bool
     */
    public function delete(int $id): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->delete($table, ['id' => $id], ['%d']);

        if ($result !== false) {
            $this->afterWrite('delete', $id, []);
        }

        return $result !== false;
    }

    /**
     * Invalidate booking-related caches after repository writes.
     *
     * @param 'create'|'update'|'delete' $operation
     */
    protected function afterWrite(string $operation, int $id, array $context = []): void
    {
        Cache::invalidateAfterBookingWrite($id);
        if ($operation === 'update') {
            do_action('yatra_booking_updated', $id);
        }
    }

    /**
     * Get booking statistics
     *
     * @return array
     */
    public function getStats(): array
    {
        $table = $this->getTableName();

        // Total bookings by status
        $statusStatsRaw = $this->wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$table} GROUP BY status",
            OBJECT_K
        );

        // Normalize by_status with integer counts and default buckets
        $byStatus = [
            'pending' => (object) ['status' => 'pending', 'count' => 0],
            'confirmed' => (object) ['status' => 'confirmed', 'count' => 0],
            'cancelled' => (object) ['status' => 'cancelled', 'count' => 0],
            'completed' => (object) ['status' => 'completed', 'count' => 0],
            'processing' => (object) ['status' => 'processing', 'count' => 0],
            'refunded' => (object) ['status' => 'refunded', 'count' => 0],
            'failed' => (object) ['status' => 'failed', 'count' => 0],
            'on_hold' => (object) ['status' => 'on_hold', 'count' => 0],
            'waitlist' => (object) ['status' => 'waitlist', 'count' => 0],
            'trash' => (object) ['status' => 'trash', 'count' => 0],
        ];

        foreach ((array)$statusStatsRaw as $status => $row) {
            $count = isset($row->count) ? (int)$row->count : 0;
            if (isset($byStatus[$status])) {
                $byStatus[$status]->count = $count;
            } else {
                // keep unexpected statuses too
                $byStatus[$status] = (object) ['status' => $status, 'count' => $count];
            }
        }

        // Total revenue (exclude non-revenue / non-active states)
        $totalRevenue = (float)$this->wpdb->get_var(
            "SELECT SUM(total_amount) FROM {$table} WHERE status NOT IN ('cancelled', 'refunded', 'failed', 'waitlist')"
        );

        // Total collected
        $totalCollected = (float)$this->wpdb->get_var(
            "SELECT SUM(amount_paid) FROM {$table} WHERE status NOT IN ('cancelled', 'refunded', 'failed', 'waitlist')"
        );

        // This month bookings
        $thisMonth = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE created_at >= %s",
            date('Y-m-01 00:00:00')
        ));

        // Upcoming trips
        $upcoming = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE travel_date >= %s AND status IN ('confirmed', 'pending')",
            date('Y-m-d')
        ));

        // Normalize counts for UI expectations
        return [
            'all' => array_sum(array_column((array)$byStatus, 'count')),
            'confirmed' => $byStatus['confirmed']->count ?? 0,
            'pending' => $byStatus['pending']->count ?? 0,
            'waitlist' => $byStatus['waitlist']->count ?? 0,
            'trash' => $byStatus['trash']->count ?? 0,
            'cancelled' => $byStatus['cancelled']->count ?? 0,
            'completed' => $byStatus['completed']->count ?? 0,
        ];
    }

    /**
     * Generate unique booking reference
     *
     * @return string
     */
    public function generateReference(): string
    {
        $table = $this->getTableName();

        do {
            $reference = 'YTR-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
            $exists = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE reference = %s",
                $reference
            ));
        } while ($exists > 0);

        return $reference;
    }

    /**
     * Update customer ID for all bookings (used for merging customers)
     *
     * @param int $fromCustomerId Source customer ID
     * @param int $toCustomerId Target customer ID
     * @return int Number of affected rows
     */
    public function updateCustomerBookings(int $fromCustomerId, int $toCustomerId): int
    {
        $table = $this->getTableName();

        $this->wpdb->update(
            $table,
            ['customer_id' => $toCustomerId],
            ['customer_id' => $fromCustomerId],
            ['%d'],
            ['%d']
        );

        return (int)$this->wpdb->rows_affected;
    }

    /**
     * Get bookings for reminder emails
     *
     * @param string $travelDate Target travel date
     * @return array
     */
    public function getBookingsForReminder(string $travelDate): array
    {
        $table = $this->getTableName();

        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT b.*, t.title as trip_title, t.currency
             FROM {$table} b
             LEFT JOIN {$tripsTable} t ON b.trip_id = t.id
             WHERE b.status = 'confirmed'
             AND b.travel_date = %s
             AND b.reminder_sent = 0",
            $travelDate
        ));
    }

    /**
     * Mark booking reminder as sent
     *
     * @param int $bookingId Booking ID
     * @return bool
     */
    public function markReminderSent(int $bookingId): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            [
                'reminder_sent' => 1,
                'reminder_sent_at' => current_time('mysql'),
            ],
            ['id' => $bookingId],
            ['%d', '%s'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Get expired pending bookings
     *
     * @param string $expiryThreshold Datetime threshold
     * @return array
     */
    public function getExpiredPendingBookings(string $expiryThreshold): array
    {
        $table = $this->getTableName();

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT id, reference, contact_email, contact_first_name, contact_last_name, trip_id
             FROM {$table}
             WHERE status = 'pending'
             AND payment_status = 'pending'
             AND created_at < %s",
            $expiryThreshold
        ));
    }

    /**
     * Expire a booking
     *
     * @param int $bookingId Booking ID
     * @param string $reason Cancellation reason
     * @return bool
     */
    public function expireBooking(int $bookingId, string $reason): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            [
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $bookingId],
            ['%s', '%s', '%s', '%s'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update payment session ID for a booking
     *
     * @param int $bookingId Booking ID
     * @param string $sessionId Payment session ID from gateway
     * @return bool
     */
    public function updatePaymentSessionId(int $bookingId, string $sessionId): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->update(
            $table,
            ['payment_session_id' => sanitize_text_field($sessionId)],
            ['id' => $bookingId],
            ['%s'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Prepare booking data for insert/update
     *
     * @param array $data Raw data
     * @return array Sanitized data
     */
    private function prepareBookingData(array $data): array
    {
        $prepared = [];

        $stringFields = [
            'reference', 'contact_first_name', 'contact_last_name', 'contact_email',
            'contact_phone', 'contact_country', 'status', 'payment_status', 'payment_method',
            'payment_gateway', 'currency', 'discount_code', 'special_requests', 'internal_notes',
            'ip_address', 'payment_session_id', 'payment_transaction_id', 'cancellation_reason',
        ];

        $intFields = ['trip_id', 'customer_id', 'user_id', 'travelers_count', 'cancelled_by', 'availability_id'];

        $floatFields = ['total_amount', 'amount_paid', 'amount_due', 'discount_amount', 'subtotal', 'tax_amount', 'tax_rate', 'itinerary_costs_total'];

        $boolFields = ['newsletter_optin', 'terms_accepted', 'reminder_sent', 'tax_inclusive'];

        $jsonFields = ['contact_data', 'emergency_contact', 'tax_details', 'itinerary_costs', 'meta'];

        $dateFields = ['travel_date', 'start_date', 'end_date', 'payment_date', 'cancelled_at', 'confirmed_at', 'completed_at', 'reminder_sent_at'];

        foreach ($stringFields as $field) {
            if (array_key_exists($field, $data)) {
                $prepared[$field] = sanitize_text_field((string)$data[$field]);
            }
        }

        foreach ($intFields as $field) {
            if (array_key_exists($field, $data)) {
                $prepared[$field] = $data[$field] === null ? null : (int)$data[$field];
            }
        }

        foreach ($floatFields as $field) {
            if (array_key_exists($field, $data)) {
                $prepared[$field] = (float)$data[$field];
            }
        }

        foreach ($boolFields as $field) {
            if (array_key_exists($field, $data)) {
                $prepared[$field] = $data[$field] ? 1 : 0;
            }
        }

        foreach ($jsonFields as $field) {
            if (array_key_exists($field, $data)) {
                $prepared[$field] = is_string($data[$field]) ? $data[$field] : wp_json_encode($data[$field]);
            }
        }

        foreach ($dateFields as $field) {
            if (array_key_exists($field, $data) && $data[$field]) {
                $prepared[$field] = sanitize_text_field($data[$field]);
            }
        }

        // Calculate end_date if start_date is provided but end_date is not
        if (isset($prepared['start_date']) && !isset($prepared['end_date']) && !empty($prepared['trip_id'])) {
            $prepared['end_date'] = $this->calculateEndDate($prepared['start_date'], (int)$prepared['trip_id']);
        }

        // Sync travel_date with start_date if start_date is provided
        if (isset($prepared['start_date']) && !isset($prepared['travel_date'])) {
            $prepared['travel_date'] = $prepared['start_date'];
        }

        // Check if start_date and end_date columns exist before including them
        // If columns don't exist, only use travel_date (backward compatibility)
        $table = $this->getTableName();
        $columns = $this->wpdb->get_col("DESCRIBE {$table}");

        if (!in_array('start_date', $columns, true)) {
            unset($prepared['start_date']);
        }
        if (!in_array('end_date', $columns, true)) {
            unset($prepared['end_date']);
        }
        if (!in_array('meta', $columns, true)) {
            unset($prepared['meta']);
        }

        if (array_key_exists('user_agent', $data)) {
            $prepared['user_agent'] = sanitize_textarea_field((string)$data['user_agent']);
        }

        if (array_key_exists('payment_notes', $data)) {
            $prepared['payment_notes'] = sanitize_textarea_field((string)$data['payment_notes']);
        }

        return $prepared;
    }

    /**
     * Calculate end date from start date and trip duration
     *
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param int $tripId Trip ID
     * @return string End date (YYYY-MM-DD)
     */
    public function calculateEndDate(string $startDate, int $tripId): string
    {
        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $tripsTable = $tripRepository->getTableName();

        $durationDays = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT duration_days FROM {$tripsTable} WHERE id = %d LIMIT 1",
            $tripId
        ));

        $durationDays = $durationDays ? (int)$durationDays : 1;

        // end_date = start_date + (duration_days - 1) days
        // Example: 5-day trip starting Jan 1 = Jan 1 + 4 days = Jan 5
        $endDate = date('Y-m-d', strtotime($startDate . ' + ' . ($durationDays - 1) . ' days'));

        return $endDate;
    }

    /**
     * Get table columns for booking table
     *
     * @return array Array of column names
     */
    public function getTableColumns(): array
    {
        $table = $this->getTableName();
        return $this->wpdb->get_col("DESCRIBE {$table}");
    }

    /**
     * Count discount code usage by customer
     *
     * @param int $customerId Customer ID
     * @param string $discountCode Discount code
     * @return int Number of times discount code has been used
     */
    public function countDiscountCodeUsage(int $customerId, string $discountCode): int
    {
        $table = $this->getTableName();
        return (int)$this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE customer_id = %d AND discount_code = %s AND status NOT IN ('cancelled', 'refunded', 'failed')",
            $customerId,
            $discountCode
        ));
    }

    /**
     * Count booked travelers by availability ID
     *
     * @param int $availabilityId Availability ID
     * @return int Number of booked travelers
     */
    public function countBookedTravelersByAvailabilityId(int $availabilityId): int
    {
        $table = $this->getTableName();
        return (int)$this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COALESCE(SUM(travelers_count), 0) 
             FROM {$table} 
             WHERE availability_id = %d AND status NOT IN ('cancelled', 'refunded', 'failed')",
            $availabilityId
        ));
    }

    /**
     * Get booking counts for multiple availability IDs
     *
     * @param array $availabilityIds Array of availability IDs
     * @return array Array of objects with availability_id and booked_count
     */
    public function getBookingCountsByAvailabilityIds(array $availabilityIds): array
    {
        $table = $this->getTableName();

        if (empty($availabilityIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($availabilityIds), '%d'));

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT availability_id, SUM(travelers_count) AS booked_count
             FROM {$table} 
             WHERE availability_id IN ({$placeholders}) AND status NOT IN ('cancelled', 'refunded', 'failed')
             GROUP BY availability_id",
            ...$availabilityIds
        ));
    }

    /**
     * Update availability ID by trip and date
     *
     * @param int $tripId Trip ID
     * @param string $date Travel date
     * @param int $availabilityId Availability ID
     * @return int|false Number of rows updated or false on failure
     */
    public function updateAvailabilityIdByTripAndDate(int $tripId, string $date, int $availabilityId)
    {
        $table = $this->getTableName();
        return $this->wpdb->query(
            $this->wpdb->prepare(
                "UPDATE {$table}
                 SET availability_id = %d
                 WHERE trip_id = %d
                   AND travel_date = %s
                   AND (availability_id IS NULL OR availability_id = 0)",
                $availabilityId,
                $tripId,
                $date
            )
        );
    }

    /**
     * Find bookings by departure ID
     *
     * @param int $departureId Departure ID
     * @return array Array of booking objects
     */
    public function findByDepartureId(int $departureId): array
    {
        $table = $this->getTableName();

        // Using hardcoded table name since there's no dedicated repository for this table
        $relationTable = $this->wpdb->prefix . 'yatra_booking_departures';

        $bookings = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT b.* FROM {$table} b
             INNER JOIN {$relationTable} bd ON b.id = bd.booking_id
             WHERE bd.departure_id = %d
             ORDER BY b.created_at DESC",
            $departureId
        ));

        return $bookings ?: [];
    }

    /**
     * Check if a user has made any previous bookings
     *
     * @param int $user_id User ID
     * @return bool True if user has made at least one booking
     */
    public function hasUserMadeBooking(int $user_id): bool
    {
        $count = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE customer_id = %d AND status NOT IN ('cancelled', 'refunded', 'failed')",
            $user_id
        ));

        return (int)$count > 0;
    }

    /**
     * Get recent bookings for cache warming
     *
     * @param int $days Number of days to look back
     * @param int $limit Maximum number of bookings to return
     * @return array Array of recent booking IDs
     */
    public function getRecentBookings(int $days = 7, int $limit = 50): array
    {
        return $this->wpdb->get_results("
            SELECT id 
            FROM {$this->table} 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)
            ORDER BY created_at DESC
            LIMIT {$limit}
        ") ?: [];
    }

    /**
     * Get total travelers count for a trip and availability with specific statuses
     *
     * @param int $tripId Trip ID
     * @param int $availabilityId Availability ID
     * @param array $statuses Array of booking statuses to include
     * @return int Total travelers count
     */
    public function getTotalTravelersByTripAndAvailability(int $tripId, int $availabilityId, array $statuses = []): int
    {
        $table = esc_sql($this->table);

        if (empty($statuses)) {
            $statuses = ['pending', 'confirmed', 'processing', 'completed', 'on_hold'];
        }

        $placeholders = implode(',', array_fill(0, count($statuses), '%s'));
        $params = array_merge([$tripId, $availabilityId], $statuses);

        $count = (int)$this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COALESCE(SUM(travelers_count), 0)
             FROM {$table}
             WHERE trip_id = %d
               AND availability_id = %d
               AND status IN ({$placeholders})",
            $params
        ));

        return $count;
    }

    /**
     * @return list<object>
     */
    public function findWaitlistBookingsForAvailability(int $availabilityId, int $limit = 20): array
    {
        if ($availabilityId <= 0) {
            return [];
        }

        $table = esc_sql($this->table);
        $limit = max(1, min(100, $limit));

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $rows = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM `{$table}` WHERE availability_id = %d AND status = 'waitlist' ORDER BY created_at ASC, id ASC LIMIT %d",
                $availabilityId,
                $limit
            )
        );

        return is_array($rows) ? $rows : [];
    }

    public function getTotalWaitlistTravelersForAvailability(int $availabilityId): int
    {
        if ($availabilityId <= 0) {
            return 0;
        }

        $table = esc_sql($this->table);

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COALESCE(SUM(travelers_count), 0) FROM `{$table}` WHERE availability_id = %d AND status = 'waitlist'",
            $availabilityId
        ));
    }
}

