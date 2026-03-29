<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\BookingPaymentsTable;
use Yatra\Database\Tables\CustomersTable;
use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

/**
 * BookingMigration - Migrates bookings from old Yatra CPTs to new custom tables.
 *
 * Old system:
 *   CPT 'yatra-booking' in wp_posts
 *     - post_status: yatra-pending, yatra-processing, yatra-on-hold, yatra-completed, yatra-cancelled, yatra-failed
 *     - post_meta 'yatra_booking_meta': array of tour booking data per tour
 *       Each entry: tour_id, tour_name, selected_date, pricing, pricing_type,
 *                   duration_days, duration_nights, country, yatra_currency,
 *                   number_of_person, total_tour_price, total_tour_final_price
 *     - post_meta 'yatra_booking_meta_params': booking parameters
 *       Keys: total_booking_price, yatra_currency, booking_date,
 *             yatra_tour_customer_info (fullname, email, phone, country),
 *             booking_code, total_booking_gross_price, total_booking_net_price,
 *             coupon (code, type, value, discount_amount), tax_rate, tax_amount
 *     - post_meta 'yatra_customer_id': old customer post ID
 *     - post_meta 'yatra_user_id': WordPress user ID
 *
 *   CPT 'yatra-payment' in wp_posts
 *     - post_status: processing, publish (completed), hold, refunded, failed
 *     - post_meta: booking_id, payment_gateway, total_amount, currency_code,
 *                  paid_amount, payable_amount, due_amount, payment_type,
 *                  installment, transaction_id, booking_details
 *
 * New system:
 *   wp_yatra_new_bookings + wp_yatra_new_booking_payments
 */
class BookingMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        // Old bookings are stored as CPT 'yatra-booking' in wp_posts
        $oldBookings = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-booking' 
             AND post_status NOT IN ('trash', 'auto-draft')"
        );
        $total = count($oldBookings);

        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        Logger::info("Found {$total} old bookings to migrate", ['source' => 'migration', 'data_type' => 'bookings']);

        foreach ($oldBookings as $oldBooking) {
            try {
                // Check if already migrated
                $migratedId = $this->getRawPostMeta($oldBooking->ID, '_migrated_to_booking_id');
                if ($migratedId && !$this->isForceMigration()) {
                    $skipped++;
                    $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $meta = $this->getPostMeta($oldBooking->ID);

                // Parse booking meta arrays
                $bookingMeta = maybe_unserialize($meta['yatra_booking_meta'] ?? '');
                $bookingParams = maybe_unserialize($meta['yatra_booking_meta_params'] ?? '');

                if (!is_array($bookingMeta)) {
                    $bookingMeta = [];
                }
                if (!is_array($bookingParams)) {
                    $bookingParams = [];
                }

                // Get the first tour entry from booking meta (most bookings have one tour)
                $firstTour = !empty($bookingMeta) ? reset($bookingMeta) : [];
                $oldTourId = (int) ($firstTour['tour_id'] ?? 0);

                // Map old trip ID to new trip ID
                $newTripId = $oldTourId > 0 ? $this->getMigratedTripId($oldTourId) : null;

                if (!$newTripId) {
                    // Try to find trip by title if tour_id mapping doesn't exist
                    $tourName = $firstTour['tour_name'] ?? '';
                    if (!empty($tourName)) {
                        $newTripId = $this->wpdb->get_var($this->wpdb->prepare(
                            "SELECT id FROM " . \Yatra\Database\Tables\TripsTable::getTableName() . " WHERE title = %s LIMIT 1",
                            $tourName
                        ));
                    }
                }

                if (!$newTripId) {
                    $failed++;
                    Logger::warning("Booking {$oldBooking->ID}: No matching new trip found for old tour ID {$oldTourId}", [
                        'source' => 'migration',
                        'data_type' => 'bookings',
                    ]);
                    $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                // Map old customer to new customer
                $oldCustomerId = (int) ($meta['yatra_customer_id'] ?? 0);
                $newCustomerId = null;
                $wpUserId = $meta['yatra_user_id'] ?? null;

                if ($oldCustomerId > 0) {
                    $newCustomerId = (int) ($this->getRawPostMeta($oldCustomerId, '_migrated_to_customer_id') ?: 0) ?: null;
                }

                // If no migrated customer found, try to look up by email
                $customerInfo = $bookingParams['yatra_tour_customer_info'] ?? [];
                if (is_string($customerInfo)) {
                    $customerInfo = maybe_unserialize($customerInfo);
                }
                if (!is_array($customerInfo)) {
                    $customerInfo = [];
                }

                $contactEmail = $customerInfo['email'] ?? '';
                $contactFullname = $customerInfo['fullname'] ?? $customerInfo['full_name'] ?? '';
                $contactPhone = $customerInfo['phone'] ?? $customerInfo['phone_number'] ?? '';
                $contactCountry = $customerInfo['country'] ?? $firstTour['country'] ?? '';

                if (!$newCustomerId && !empty($contactEmail)) {
                    $newCustomerId = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM " . CustomersTable::getTableName() . " WHERE email = %s",
                        $contactEmail
                    ));
                }

                // Parse contact name
                $nameParts = $this->parseFullName($contactFullname);

                // Map old booking status to new status
                $newStatus = $this->mapBookingStatus($oldBooking->post_status);

                // Extract pricing info
                $totalAmount = (float) ($bookingParams['total_booking_price'] ?? $bookingParams['total_booking_net_price'] ?? 0);
                $grossAmount = (float) ($bookingParams['total_booking_gross_price'] ?? $totalAmount);
                $currency = $bookingParams['yatra_currency'] ?? 'USD';
                $bookingCode = $bookingParams['booking_code'] ?? 'YTR-' . $oldBooking->ID;
                $bookingDate = $bookingParams['booking_date'] ?? $oldBooking->post_date;

                // Calculate total travelers across all tours in this booking
                $totalTravelers = 0;
                foreach ($bookingMeta as $tourEntry) {
                    $totalTravelers += (int) ($tourEntry['number_of_person'] ?? 1);
                }
                if ($totalTravelers < 1) {
                    $totalTravelers = 1;
                }

                // Get travel date from first tour
                $travelDate = $firstTour['selected_date'] ?? null;
                if ($travelDate) {
                    // Normalize date format
                    $parsedDate = strtotime($travelDate);
                    if ($parsedDate) {
                        $travelDate = date('Y-m-d', $parsedDate);
                    } else {
                        $travelDate = date('Y-m-d');
                    }
                } else {
                    $travelDate = date('Y-m-d');
                }

                // Extract coupon/discount info
                $couponData = $bookingParams['coupon'] ?? [];
                if (is_string($couponData)) {
                    $couponData = maybe_unserialize($couponData);
                }
                if (!is_array($couponData)) {
                    $couponData = [];
                }
                $discountCode = $couponData['code'] ?? null;
                $discountAmount = (float) ($couponData['discount_amount'] ?? 0);

                // Extract tax info
                $taxRate = (float) ($bookingParams['tax_rate'] ?? 0);
                $taxAmount = (float) ($bookingParams['tax_amount'] ?? 0);

                // Calculate paid and due amounts from old payments
                $paidAmount = $this->getOldPaidAmount($oldBooking->ID);
                $dueAmount = ($totalAmount - $paidAmount) > 0 ? ($totalAmount - $paidAmount) : 0;

                // Determine payment status
                $paymentStatus = 'pending';
                if ($paidAmount >= $totalAmount && $totalAmount > 0) {
                    $paymentStatus = 'paid';
                } elseif ($paidAmount > 0) {
                    $paymentStatus = 'partial';
                }

                // Get payment gateway from old payments
                $paymentGateway = $this->getOldPaymentGateway($oldBooking->ID);

                $bookingData = [
                    'reference' => $bookingCode,
                    'trip_id' => $newTripId,
                    'customer_id' => $newCustomerId,
                    'user_id' => !empty($wpUserId) ? (int) $wpUserId : null,
                    'contact_first_name' => $nameParts['first_name'],
                    'contact_last_name' => $nameParts['last_name'],
                    'contact_email' => $contactEmail,
                    'contact_phone' => $contactPhone,
                    'contact_country' => $contactCountry,
                    'travel_date' => $travelDate,
                    'travelers_count' => $totalTravelers,
                    'total_amount' => $totalAmount,
                    'amount_paid' => $paidAmount,
                    'amount_due' => $dueAmount,
                    'currency' => $currency,
                    'discount_amount' => $discountAmount,
                    'discount_code' => $discountCode,
                    'subtotal' => $grossAmount,
                    'tax_amount' => $taxAmount,
                    'tax_rate' => $taxRate,
                    'payment_gateway' => $paymentGateway ?: 'pay_later',
                    'payment_status' => $paymentStatus,
                    'status' => $newStatus,
                    'created_at' => $oldBooking->post_date,
                    'updated_at' => $oldBooking->post_modified,
                ];

                // Check if booking with same reference exists
                $existingBookingId = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM " . BookingsTable::getTableName() . " WHERE reference = %s",
                    $bookingCode
                ));

                if ($existingBookingId && !$this->isForceMigration()) {
                    // Update existing booking
                    $updateData = $bookingData;
                    unset($updateData['created_at']);
                    unset($updateData['reference']);

                    $this->wpdb->update(
                        BookingsTable::getTableName(),
                        $updateData,
                        ['id' => $existingBookingId]
                    );
                    $newBookingId = $existingBookingId;
                    $migrated++;
                } else {
                    // For force migration, ensure unique reference
                    if ($this->isForceMigration() && $existingBookingId) {
                        $bookingData['reference'] = $bookingCode . '-' . time();
                    }

                    $inserted = $this->wpdb->insert(
                        BookingsTable::getTableName(),
                        $bookingData
                    );

                    if ($inserted) {
                        $newBookingId = $this->wpdb->insert_id;
                        $migrated++;
                    } else {
                        $failed++;
                        Logger::error("Failed to insert booking ID {$oldBooking->ID}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'data_type' => 'bookings',
                            'booking_id' => $oldBooking->ID,
                        ]);
                        $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                // Mark as migrated
                $this->setRawPostMeta($oldBooking->ID, '_migrated_to_booking_id', (string) $newBookingId);

                // Migrate associated payments
                $this->migrateBookingPayments($oldBooking->ID, $newBookingId, $newCustomerId);

                $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);

                usleep(50000);
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating booking ID {$oldBooking->ID}: {$e->getMessage()}", [
                    'source' => 'migration',
                    'data_type' => 'bookings',
                    'booking_id' => $oldBooking->ID,
                    'error' => $e->getMessage(),
                ]);
                $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * Map old booking post_status to new booking status
     */
    private function mapBookingStatus(string $oldStatus): string
    {
        $statusMap = [
            'yatra-pending'    => 'pending',
            'yatra-processing' => 'processing',
            'yatra-on-hold'    => 'on_hold',
            'yatra-completed'  => 'completed',
            'yatra-cancelled'  => 'cancelled',
            'yatra-failed'     => 'failed',
            'publish'          => 'confirmed',
            'draft'            => 'pending',
        ];

        return $statusMap[$oldStatus] ?? 'pending';
    }

    /**
     * Get total paid amount for an old booking from yatra-payment CPT
     */
    private function getOldPaidAmount(int $oldBookingId): float
    {
        $totalPaid = 0.0;

        $payments = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT p.ID, p.post_status FROM {$this->wpdb->posts} p
             INNER JOIN {$this->wpdb->postmeta} pm ON p.ID = pm.post_id
             WHERE p.post_type = 'yatra-payment'
             AND pm.meta_key = 'booking_id'
             AND pm.meta_value = %s
             AND p.post_status = 'publish'",
            $oldBookingId
        ));

        foreach ($payments as $payment) {
            $paidAmount = (float) ($this->getRawPostMeta($payment->ID, 'paid_amount') ?: 0);
            $totalPaid += $paidAmount;
        }

        return $totalPaid;
    }

    /**
     * Get payment gateway used for an old booking
     */
    private function getOldPaymentGateway(int $oldBookingId): string
    {
        $payment = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT p.ID FROM {$this->wpdb->posts} p
             INNER JOIN {$this->wpdb->postmeta} pm ON p.ID = pm.post_id
             WHERE p.post_type = 'yatra-payment'
             AND pm.meta_key = 'booking_id'
             AND pm.meta_value = %s
             ORDER BY p.post_date DESC
             LIMIT 1",
            $oldBookingId
        ));

        if ($payment) {
            return $this->getRawPostMeta($payment->ID, 'payment_gateway') ?: '';
        }

        return '';
    }

    /**
     * Migrate payment records associated with a booking
     */
    private function migrateBookingPayments(int $oldBookingId, int $newBookingId, ?int $newCustomerId): void
    {
        $oldPayments = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT p.* FROM {$this->wpdb->posts} p
             INNER JOIN {$this->wpdb->postmeta} pm ON p.ID = pm.post_id
             WHERE p.post_type = 'yatra-payment'
             AND pm.meta_key = 'booking_id'
             AND pm.meta_value = %s
             ORDER BY p.post_date ASC",
            $oldBookingId
        ));

        if (empty($oldPayments)) {
            return;
        }

        foreach ($oldPayments as $oldPayment) {
            // Check if already migrated
            $alreadyMigrated = $this->getRawPostMeta($oldPayment->ID, '_migrated_to_payment_id');
            if ($alreadyMigrated && !$this->isForceMigration()) {
                continue;
            }

            $paymentMeta = $this->getPostMeta($oldPayment->ID);
            $gateway = $paymentMeta['payment_gateway'] ?? 'unknown';
            $amount = (float) ($paymentMeta['paid_amount'] ?? 0);
            $currency = $paymentMeta['currency_code'] ?? 'USD';
            $transactionId = $paymentMeta['transaction_id'] ?? null;
            $paymentType = $paymentMeta['payment_type'] ?? 'full';
            $installment = (int) ($paymentMeta['installment'] ?? 0);

            // Map old payment status to new status
            $oldPaymentStatus = $oldPayment->post_status;
            $newPaymentStatus = $this->mapPaymentStatus($oldPaymentStatus);

            // Map payment type
            $newPaymentType = 'initial';
            if ($paymentType === 'partial' || $installment > 1) {
                $newPaymentType = 'partial';
            }

            $paymentData = [
                'booking_id' => $newBookingId,
                'customer_id' => $newCustomerId,
                'transaction_id' => $transactionId,
                'gateway' => $gateway,
                'amount' => $amount,
                'currency' => $currency,
                'status' => $newPaymentStatus,
                'payment_type' => $newPaymentType,
                'notes' => "Migrated from old payment #{$oldPayment->ID}",
                'processed_at' => $newPaymentStatus === 'completed' ? $oldPayment->post_date : null,
                'created_at' => $oldPayment->post_date,
            ];

            $inserted = $this->wpdb->insert(
                BookingPaymentsTable::getTableName(),
                $paymentData
            );

            if ($inserted) {
                $this->setRawPostMeta($oldPayment->ID, '_migrated_to_payment_id', (string) $this->wpdb->insert_id);
            }
        }
    }

    /**
     * Map old payment post_status to new payment status
     */
    private function mapPaymentStatus(string $oldStatus): string
    {
        $statusMap = [
            'processing' => 'pending',
            'publish'    => 'completed',
            'hold'       => 'pending',
            'refunded'   => 'refunded',
            'failed'     => 'failed',
        ];

        return $statusMap[$oldStatus] ?? 'pending';
    }

    /**
     * Parse a full name string into first and last name parts
     */
    private function parseFullName(string $fullname): array
    {
        $fullname = trim($fullname);

        if (empty($fullname)) {
            return ['first_name' => '', 'last_name' => ''];
        }

        $parts = preg_split('/\s+/', $fullname, 2);

        return [
            'first_name' => $parts[0] ?? '',
            'last_name' => $parts[1] ?? '',
        ];
    }
}
