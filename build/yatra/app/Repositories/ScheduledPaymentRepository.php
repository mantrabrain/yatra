<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Repository for scheduled payments data access
 *
 * This repository handles all database operations for the yatra_scheduled_payments table.
 * It provides CRUD operations and query methods for scheduled payment records.
 *
 * @package Yatra\Repositories
 */
class ScheduledPaymentRepository extends BaseRepository
{
    /**
     * Table name without prefix
     *
     * @var string
     */
    protected string $table = 'yatra_scheduled_payments';

    /**
     * Get table name with prefix
     *
     * @return string
     */
    public function getTableName(): string
    {
        return $this->wpdb->prefix . $this->table;
    }

    /**
     * Get scheduled payment by ID
     *
     * @param int  $id             Scheduled payment ID
     * @param bool $includeDeleted Whether to include deleted records
     * @return \stdClass|null
     */
    public function find(int $id, bool $includeDeleted = false): ?\stdClass
    {
        $table = $this->getTableName();

        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d",
            $id
        ));

        return $result ?: null;
    }

    /**
     * Get scheduled payments by booking ID
     *
     * @param int $bookingId Booking ID
     * @return array
     */
    public function getByBookingId(int $bookingId): array
    {
        $table = $this->getTableName();

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE booking_id = %d ORDER BY scheduled_date ASC",
            $bookingId
        ));
    }

    /**
     * Get processing payments (for status sync)
     *
     * @return array
     */
    public function getProcessingPayments(): array
    {
        $table = $this->getTableName();

        return $this->wpdb->get_results(
            "SELECT * FROM {$table} 
             WHERE status = 'processing' 
             AND gateway_invoice_id IS NOT NULL
             ORDER BY scheduled_date ASC"
        );
    }

    /**
     * Get pending payments due for reminders
     *
     * @param int $reminderDays Days before scheduled date to send reminder
     * @return array
     */
    public function getPendingForReminders(int $reminderDays): array
    {
        $table = $this->getTableName();
        
        // Use BookingRepository for bookings table
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $bookingsTable = $bookingRepository->getTableName();

        $reminderDate = date('Y-m-d', strtotime("+{$reminderDays} days"));

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT sp.*, b.contact_email, b.contact_first_name, b.contact_last_name
             FROM {$table} sp
             JOIN {$bookingsTable} b ON sp.booking_id = b.id
             WHERE sp.status = 'pending'
             AND sp.reminder_sent = 0
             AND DATE(sp.scheduled_date) <= %s
             ORDER BY sp.scheduled_date ASC",
            $reminderDate
        ));
    }

    /**
     * Get upcoming payments for dashboard
     *
     * @param int $days Number of days ahead
     * @param int $limit Max records
     * @return array
     */
    public function getUpcoming(int $days = 7, int $limit = 20): array
    {
        $table = $this->getTableName();
        
        // Use BookingRepository for bookings table
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $bookingsTable = $bookingRepository->getTableName();

        $futureDate = date('Y-m-d H:i:s', strtotime("+{$days} days"));

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT sp.*, b.reference, b.contact_email, b.contact_first_name, b.contact_last_name
             FROM {$table} sp
             JOIN {$bookingsTable} b ON sp.booking_id = b.id
             WHERE sp.status = 'pending'
             AND sp.scheduled_date <= %s
             ORDER BY sp.scheduled_date ASC
             LIMIT %d",
            $futureDate,
            $limit
        ));
    }

    /**
     * Create scheduled payment
     *
     * @param array $data Payment data
     * @return int Insert ID
     * @throws \Exception on failure
     */
    public function create(array $data): int
    {
        $table = $this->getTableName();

        $prepared = $this->prepareData($data);

        $result = $this->wpdb->insert($table, $prepared['data'], $prepared['formats']);

        if ($result === false) {
            throw new \Exception('Failed to create scheduled payment: ' . $this->wpdb->last_error);
        }

        return $this->wpdb->insert_id;
    }

    /**
     * Update scheduled payment
     *
     * @param int   $id   Payment ID
     * @param array $data Data to update
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $table = $this->getTableName();

        $data['updated_at'] = current_time('mysql');

        $prepared = $this->prepareData($data);

        $result = $this->wpdb->update(
            $table,
            $prepared['data'],
            ['id' => $id],
            $prepared['formats'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update status
     *
     * @param int    $id     Payment ID
     * @param string $status New status
     * @return bool
     */
    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, [
            'status' => $status,
            'updated_at' => current_time('mysql'),
        ]);
    }

    /**
     * Mark as reminded
     *
     * @param int $id Payment ID
     * @return bool
     */
    public function markReminded(int $id): bool
    {
        return $this->update($id, [
            'reminder_sent' => 1,
            'updated_at' => current_time('mysql'),
        ]);
    }

    /**
     * Cancel all scheduled payments for a booking
     *
     * @param int $bookingId Booking ID
     * @return int Number of affected rows
     */
    public function cancelByBookingId(int $bookingId): int
    {
        $table = $this->getTableName();

        $this->wpdb->update(
            $table,
            [
                'status' => 'cancelled',
                'updated_at' => current_time('mysql'),
            ],
            [
                'booking_id' => $bookingId,
                'status' => 'pending',
            ],
            ['%s', '%s'],
            ['%d', '%s']
        );

        return (int) $this->wpdb->rows_affected;
    }

    /**
     * Check if table exists
     * 
     * @param string $tableName Table name
     * @return bool True if table exists
     */
    public function tableExists(string $tableName): bool
    {
        $tableExists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
            DB_NAME,
            $tableName
        ));
        return !empty($tableExists);
    }

    /**
     * Increment retry count
     *
     * @param int    $id            Payment ID
     * @param string $errorMessage  Error message
     * @param string $nextRetryDate Next retry date
     * @return bool
     */
    public function incrementRetry(int $id, string $errorMessage, ?string $nextRetryDate = null): bool
    {
        $table = $this->getTableName();

        $sql = $this->wpdb->prepare(
            "UPDATE {$table} 
             SET retry_count = retry_count + 1, 
                 last_error = %s,
                 next_retry_date = %s,
                 updated_at = %s
             WHERE id = %d",
            $errorMessage,
            $nextRetryDate,
            current_time('mysql'),
            $id
        );

        return $this->wpdb->query($sql) !== false;
    }

    /**
     * Record successful payment
     *
     * @param int    $id            Payment ID
     * @param string $transactionId Gateway transaction ID
     * @return bool
     */
    public function recordSuccess(int $id, string $transactionId): bool
    {
        return $this->update($id, [
            'status' => 'completed',
            'gateway_transaction_id' => $transactionId,
            'paid_at' => current_time('mysql'),
        ]);
    }

    /**
     * Record failed payment
     *
     * @param int    $id    Payment ID
     * @param string $error Error message
     * @return bool
     */
    public function recordFailure(int $id, string $error): bool
    {
        return $this->update($id, [
            'status' => 'failed',
            'last_error' => $error,
        ]);
    }

    /**
     * Get payment token by ID
     *
     * @param int $tokenId Token ID
     * @return object|null
     */
    public function getPaymentToken(int $tokenId): ?object
    {
        // Using hardcoded table name since there's no dedicated repository for this table
        $table = $this->wpdb->prefix . 'yatra_payment_tokens';

        $result = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d",
            $tokenId
        ));

        return $result ?: null;
    }

    /**
     * Create payment token
     *
     * @param array $data Token data
     * @return int|false Insert ID or false
     */
    public function createPaymentToken(array $data)
    {
        // Using hardcoded table name since there's no dedicated repository for this table
        $table = $this->wpdb->prefix . 'yatra_payment_tokens';

        $result = $this->wpdb->insert($table, [
            'customer_id' => $data['customer_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'gateway' => $data['gateway'],
            'token' => $data['token'],
            'payment_method_id' => $data['payment_method_id'] ?? null,
            'card_last4' => $data['card_last4'] ?? null,
            'card_brand' => $data['card_brand'] ?? null,
            'card_exp_month' => $data['card_exp_month'] ?? null,
            'card_exp_year' => $data['card_exp_year'] ?? null,
            'is_default' => $data['is_default'] ?? 0,
            'created_at' => current_time('mysql'),
        ]);

        return $result ? $this->wpdb->insert_id : false;
    }

    /**
     * Prepare data for insert/update
     *
     * @param array $data Raw data
     * @return array ['data' => [], 'formats' => []]
     */
    private function prepareData(array $data): array
    {
        $prepared = [];
        $formats = [];

        $stringFields = [
            'status', 'gateway', 'gateway_subscription_id', 'gateway_invoice_id',
            'gateway_transaction_id', 'last_error', 'next_retry_date', 'paid_at',
            'created_at', 'updated_at',
        ];

        $intFields = ['booking_id', 'payment_token_id', 'installment_number', 'retry_count', 'reminder_sent'];

        $floatFields = ['amount'];

        foreach ($data as $key => $value) {
            if (in_array($key, $stringFields)) {
                $prepared[$key] = $value === null ? null : sanitize_text_field((string) $value);
                $formats[] = '%s';
            } elseif (in_array($key, $intFields)) {
                $prepared[$key] = $value === null ? null : (int) $value;
                $formats[] = '%d';
            } elseif (in_array($key, $floatFields)) {
                $prepared[$key] = $value === null ? null : (float) $value;
                $formats[] = '%f';
            } elseif ($key === 'scheduled_date') {
                $prepared[$key] = $value;
                $formats[] = '%s';
            }
        }

        return ['data' => $prepared, 'formats' => $formats];
    }
}

