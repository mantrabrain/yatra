<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\TripsTable;

/**
 * Payment Repository
 * 
 * Handles all database operations for booking payments.
 * 
 * @package Yatra\Repositories
 */
class PaymentRepository extends BaseRepository
{
    /**
     * Table name without prefix
     */
    // private const TABLE_NAME = 'yatra_new_booking_payments';

    /** @var bool|null */
    private ?bool $customerColumnExists = null;

    /**
     * Get full table name with prefix
     */
    protected function getTableName(): string
    {
        return BookingPaymentsTable::getTableName();
    }

    private function hasCustomerColumn(): bool
    {
        if ($this->customerColumnExists !== null) {
            return $this->customerColumnExists;
        }

        $table = esc_sql($this->getTableName());
        $column = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = 'customer_id'",
                $table
            )
        );

        $this->customerColumnExists = ((int) $column) > 0;
        return $this->customerColumnExists;
    }

    /**
     * Get bookings table name
     */
    protected function getBookingsTable(): string
    {
        return BookingsTable::getTableName();
    }

    /**
     * Get trips table name
     */
    protected function getTripsTable(): string
    {
        return TripsTable::getTableName();
    }

    /**
     * Get paginated payments with filters
     * 
     * @param array $filters Filter options
     * @return array {data: array, total: int, page: int, per_page: int, total_pages: int}
     */
    public function paginate(array $filters = []): array
    {
        $table = $this->getTableName();
        $bookings_table = $this->getBookingsTable();
        $trips_table = $this->getTripsTable();

        // Pagination
        $page = max(1, (int) ($filters['page'] ?? 1));
        $per_page = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];

        if (!empty($filters['booking_id'])) {
            $where_clauses[] = 'p.booking_id = %d';
            $where_values[] = (int) $filters['booking_id'];
        }

        if (!empty($filters['status'])) {
            $where_clauses[] = 'p.status = %s';
            $where_values[] = sanitize_text_field($filters['status']);
        }

        if (!empty($filters['gateway'])) {
            $where_clauses[] = 'p.gateway = %s';
            $where_values[] = sanitize_text_field($filters['gateway']);
        }

        if (!empty($filters['search'])) {
            $search_like = '%' . $this->wpdb->esc_like(sanitize_text_field($filters['search'])) . '%';
            $where_clauses[] = '(p.transaction_id LIKE %s OR b.reference LIKE %s OR b.contact_email LIKE %s)';
            $where_values = array_merge($where_values, [$search_like, $search_like, $search_like]);
        }

        if (!empty($filters['date_from'])) {
            $where_clauses[] = 'p.created_at >= %s';
            $where_values[] = sanitize_text_field($filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $where_clauses[] = 'p.created_at <= %s';
            $where_values[] = sanitize_text_field($filters['date_to']);
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get total count
        $count_query = "SELECT COUNT(*) 
                        FROM {$table} p
                        LEFT JOIN {$bookings_table} b ON p.booking_id = b.id
                        WHERE {$where_sql}";
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $this->wpdb->get_var($count_query);

        // Get payments with booking and trip info
        $query = "SELECT p.*, 
                         b.reference as booking_reference,
                         b.contact_email,
                         b.contact_first_name,
                         b.contact_last_name,
                         t.title as trip_title
                  FROM {$table} p
                  LEFT JOIN {$bookings_table} b ON p.booking_id = b.id
                  LEFT JOIN {$trips_table} t ON b.trip_id = t.id
                  WHERE {$where_sql}
                  ORDER BY p.created_at DESC
                  LIMIT %d OFFSET %d";

        $query_values = array_merge($where_values, [$per_page, $offset]);
        $payments = $this->wpdb->get_results($this->wpdb->prepare($query, ...$query_values));

        return [
            'data' => $payments ?: [],
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => (int) ceil($total / $per_page),
        ];
    }

    /**
     * Find payment by ID with booking info
     * 
     * @param int $id Payment ID
     * @return object|null
     */
    public function findWithBooking(int $id): ?object
    {
        $table = $this->getTableName();
        $bookings_table = $this->getBookingsTable();
        $trips_table = $this->getTripsTable();

        $query = $this->wpdb->prepare(
            "SELECT p.*, 
                    b.reference as booking_reference,
                    b.user_id as booking_user_id,
                    b.contact_email,
                    b.contact_first_name,
                    b.contact_last_name,
                    b.total_amount as booking_total_amount,
                    b.amount_paid as booking_amount_paid,
                    b.amount_due as booking_amount_due,
                    b.travel_date as travel_date,
                    t.title as trip_title
             FROM {$table} p
             LEFT JOIN {$bookings_table} b ON p.booking_id = b.id
             LEFT JOIN {$trips_table} t ON b.trip_id = t.id
             WHERE p.id = %d",
            $id
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find payments by booking ID
     * 
     * @param int $bookingId Booking ID
     * @return array
     */
    public function findByBookingId(int $bookingId): array
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE booking_id = %d ORDER BY created_at DESC",
            $bookingId
        );

        return $this->wpdb->get_results($query) ?: [];
    }

    /**
     * Find the latest payment for a booking
     * 
     * @param int $bookingId Booking ID
     * @return object|null
     */
    public function findLatestByBookingId(int $bookingId): ?object
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE booking_id = %d ORDER BY created_at DESC, id DESC LIMIT 1",
            $bookingId
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Find payment by transaction ID
     * 
     * @param string $transactionId Transaction ID
     * @return object|null
     */
    public function findByTransactionId(string $transactionId): ?object
    {
        $table = $this->getTableName();

        $query = $this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE transaction_id = %s",
            sanitize_text_field($transactionId)
        );

        return $this->wpdb->get_row($query) ?: null;
    }

    /**
     * Create a new payment
     * 
     * @param array $data Payment data
     * @return int Payment ID on success
     * @throws \Exception on failure
     */
    public function create(array $data): int
    {
        $table = $this->getTableName();

        $insertData = $this->preparePaymentData($data);
        $insertData['created_at'] = current_time('mysql');

        $result = $this->wpdb->insert($table, $insertData);

        if ($result === false) {
            throw new \Exception('Failed to create payment: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update a payment
     * 
     * @param int   $id   Payment ID
     * @param array $data Payment data to update
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $table = $this->getTableName();

        $updateData = $this->preparePaymentData($data);

        $result = $this->wpdb->update(
            $table,
            $updateData,
            ['id' => $id],
            null,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update payment status
     * 
     * @param int    $id     Payment ID
     * @param string $status New status
     * @return bool
     */
    public function updateStatus(int $id, string $status): bool
    {
        $table = $this->getTableName();

        $data = ['status' => sanitize_text_field($status)];

        if ($status === 'completed') {
            $data['processed_at'] = current_time('mysql');
        }

        $result = $this->wpdb->update($table, $data, ['id' => $id]);

        return $result !== false;
    }

    /**
     * Delete a payment
     * 
     * @param int $id Payment ID
     * @return bool
     */
    public function delete(int $id): bool
    {
        $table = $this->getTableName();

        $result = $this->wpdb->delete($table, ['id' => $id], ['%d']);

        return $result !== false;
    }

    /**
     * Get total paid amount for a booking
     * 
     * @param int $bookingId Booking ID
     * @return float
     */
    public function getTotalPaidForBooking(int $bookingId): float
    {
        $table = $this->getTableName();

        $result = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT SUM(amount) FROM {$table} WHERE booking_id = %d AND status = 'completed'",
            $bookingId
        ));

        return (float) ($result ?? 0);
    }

    /**
     * Get payment statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        $table = $this->getTableName();

        // Total by status
        $statusStats = $this->wpdb->get_results(
            "SELECT status, COUNT(*) as count, SUM(amount) as total_amount 
             FROM {$table} GROUP BY status",
            OBJECT_K
        );

        // By gateway
        $gatewayStats = $this->wpdb->get_results(
            "SELECT gateway, COUNT(*) as count, SUM(amount) as total_amount 
             FROM {$table} WHERE status = 'completed' GROUP BY gateway",
            OBJECT_K
        );

        // This month
        $thisMonth = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT COUNT(*) as count, SUM(amount) as total_amount 
             FROM {$table} WHERE status = 'completed' AND created_at >= %s",
            date('Y-m-01 00:00:00')
        ));

        return [
            'by_status' => $statusStats,
            'by_gateway' => $gatewayStats,
            'this_month' => [
                'count' => (int) ($thisMonth->count ?? 0),
                'total_amount' => (float) ($thisMonth->total_amount ?? 0),
            ],
        ];
    }

    /**
     * Flat counts for admin list toolbar (matches payment status filter keys).
     *
     * @return array{all:int,completed:int,pending:int,partial:int,failed:int,refunded:int,cancelled:int}
     */
    public function getAdminStatusCounts(): array
    {
        $table = $this->getTableName();
        $rows = $this->wpdb->get_results(
            "SELECT status, COUNT(*) AS c FROM {$table} GROUP BY status",
            ARRAY_A
        ) ?: [];

        $out = [
            'all' => 0,
            'completed' => 0,
            'pending' => 0,
            'partial' => 0,
            'failed' => 0,
            'refunded' => 0,
            'cancelled' => 0,
        ];

        foreach ($rows as $row) {
            $status = isset($row['status']) ? (string) $row['status'] : '';
            $c = isset($row['c']) ? (int) $row['c'] : 0;
            $out['all'] += $c;
            if ($status !== '' && array_key_exists($status, $out)) {
                $out[$status] = $c;
            }
        }

        return $out;
    }

    /**
     * Prepare payment data for insert/update
     * 
     * @param array $data Raw data
     * @return array Sanitized data
     */
    private function preparePaymentData(array $data): array
    {
        $prepared = [];

        if (array_key_exists('booking_id', $data)) {
            $prepared['booking_id'] = (int) $data['booking_id'];
        }

        if (array_key_exists('customer_id', $data) && $this->hasCustomerColumn()) {
            $prepared['customer_id'] = $data['customer_id'] !== null ? (int) $data['customer_id'] : null;
        }

        if (array_key_exists('transaction_id', $data)) {
            $prepared['transaction_id'] = sanitize_text_field((string) $data['transaction_id']);
        }

        if (array_key_exists('gateway', $data)) {
            $prepared['gateway'] = sanitize_text_field((string) $data['gateway']);
        }

        if (array_key_exists('amount', $data)) {
            $prepared['amount'] = (float) $data['amount'];
        }

        if (array_key_exists('currency', $data)) {
            $prepared['currency'] = sanitize_text_field((string) $data['currency']);
        }

        if (array_key_exists('status', $data)) {
            $prepared['status'] = sanitize_text_field((string) $data['status']);
        }

        if (array_key_exists('payment_type', $data)) {
            $prepared['payment_type'] = sanitize_text_field((string) $data['payment_type']);
        }

        if (array_key_exists('gateway_response', $data)) {
            $prepared['gateway_response'] = is_string($data['gateway_response']) 
                ? $data['gateway_response'] 
                : wp_json_encode($data['gateway_response']);
        }

        if (array_key_exists('notes', $data)) {
            $prepared['notes'] = sanitize_textarea_field((string) $data['notes']);
        }

        if (array_key_exists('meta', $data)) {
            $prepared['meta'] = is_string($data['meta'])
                ? $data['meta']
                : wp_json_encode($data['meta']);
        }

        if (array_key_exists('processed_at', $data) && $data['processed_at']) {
            $prepared['processed_at'] = sanitize_text_field($data['processed_at']);
        }

        return $prepared;
    }
}
