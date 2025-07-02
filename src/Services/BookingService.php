<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Booking service for handling booking operations
 */
class BookingService
{
    /**
     * Process a booking request
     */
    public function processBooking(array $data): array
    {
        try {
            // Validate booking data
            $this->validateBookingData($data);

            // Generate booking number
            $bookingNumber = $this->generateBookingNumber();

            // Calculate total amount
            $totalAmount = $this->calculateTotalAmount($data);

            // Create booking record
            $bookingId = $this->createBookingRecord($data, $bookingNumber, $totalAmount);

            return [
                'success' => true,
                'booking_id' => $bookingId,
                'booking_number' => $bookingNumber,
                'total_amount' => $totalAmount,
                'message' => __('Booking created successfully!', 'yatra')
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate booking data
     */
    private function validateBookingData(array $data): void
    {
        $required_fields = ['trip_id', 'trip_date_id', 'adults', 'children', 'lead_traveler'];
        
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                throw new \Exception(sprintf(__('Field %s is required.', 'yatra'), $field));
            }
        }

        // Validate trip exists
        if (!$this->tripExists($data['trip_id'])) {
            throw new \Exception(__('Selected trip does not exist.', 'yatra'));
        }

        // Validate availability
        if (!$this->checkAvailability($data['trip_date_id'], $data['adults'] + $data['children'])) {
            throw new \Exception(__('Not enough seats available for selected date.', 'yatra'));
        }
    }

    /**
     * Generate unique booking number
     */
    private function generateBookingNumber(): string
    {
        $prefix = 'YT';
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        
        return $prefix . $timestamp . $random;
    }

    /**
     * Calculate total amount
     */
    private function calculateTotalAmount(array $data): float
    {
        // Get trip details
        $trip = $this->getTripDetails($data['trip_id']);
        $tripDate = $this->getTripDateDetails($data['trip_date_id']);

        $adults = (int) $data['adults'];
        $children = (int) $data['children'];
        $infants = (int) ($data['infants'] ?? 0);

        // Calculate base price
        $basePrice = $tripDate['fixed_price'] ?? $trip['base_price'];
        $priceModifier = $tripDate['price_modifier'] ?? 1.0;
        
        $adultTotal = $basePrice * $priceModifier * $adults;
        $childTotal = ($trip['child_price'] ?? $basePrice * 0.7) * $priceModifier * $children;
        $infantTotal = 0; // Infants are usually free

        return $adultTotal + $childTotal + $infantTotal;
    }

    /**
     * Create booking record
     */
    private function createBookingRecord(array $data, string $bookingNumber, float $totalAmount): int
    {
        global $wpdb;

        $bookingData = [
            'booking_number' => $bookingNumber,
            'trip_id' => (int) $data['trip_id'],
            'trip_date_id' => (int) $data['trip_date_id'],
            'customer_id' => get_current_user_id() ?: null,
            'lead_traveler' => json_encode($data['lead_traveler']),
            'travelers' => json_encode($data['travelers'] ?? []),
            'adults' => (int) $data['adults'],
            'children' => (int) $data['children'],
            'infants' => (int) ($data['infants'] ?? 0),
            'total_amount' => $totalAmount,
            'currency' => get_option('yatra_currency', 'USD'),
            'special_requirements' => sanitize_textarea_field($data['special_requirements'] ?? ''),
            'booking_date' => current_time('mysql'),
        ];

        $result = $wpdb->insert(
            $wpdb->prefix . 'yatra_bookings',
            $bookingData,
            [
                '%s', '%d', '%d', '%d', '%s', '%s', '%d', '%d', '%d', '%f', '%s', '%s', '%s'
            ]
        );

        if (!$result) {
            throw new \Exception(__('Failed to create booking record.', 'yatra'));
        }

        $bookingId = $wpdb->insert_id;

        // Update trip date availability
        $this->updateTripDateAvailability($data['trip_date_id'], $data['adults'] + $data['children']);

        // Send confirmation email
        $this->sendBookingConfirmation($bookingId);

        return $bookingId;
    }

    /**
     * Check if trip exists
     */
    private function tripExists(int $tripId): bool
    {
        global $wpdb;
        
        $result = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}yatra_trips WHERE id = %d AND status = 'active'",
            $tripId
        ));

        return !empty($result);
    }

    /**
     * Check availability for trip date
     */
    private function checkAvailability(int $tripDateId, int $requestedSeats): bool
    {
        global $wpdb;
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT available_seats, booked_seats FROM {$wpdb->prefix}yatra_trip_dates WHERE id = %d AND status = 'available'",
            $tripDateId
        ));

        if (!$result) {
            return false;
        }

        $availableSeats = $result->available_seats - $result->booked_seats;
        return $availableSeats >= $requestedSeats;
    }

    /**
     * Get trip details
     */
    private function getTripDetails(int $tripId): array
    {
        global $wpdb;
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}yatra_trips WHERE id = %d",
            $tripId
        ), ARRAY_A);

        if (!$result) {
            throw new \Exception(__('Trip not found.', 'yatra'));
        }

        return $result;
    }

    /**
     * Get trip date details
     */
    private function getTripDateDetails(int $tripDateId): array
    {
        global $wpdb;
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}yatra_trip_dates WHERE id = %d",
            $tripDateId
        ), ARRAY_A);

        if (!$result) {
            throw new \Exception(__('Trip date not found.', 'yatra'));
        }

        return $result;
    }

    /**
     * Update trip date availability
     */
    private function updateTripDateAvailability(int $tripDateId, int $bookedSeats): void
    {
        global $wpdb;
        
        $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->prefix}yatra_trip_dates SET booked_seats = booked_seats + %d WHERE id = %d",
            $bookedSeats,
            $tripDateId
        ));
    }

    /**
     * Send booking confirmation email
     */
    private function sendBookingConfirmation(int $bookingId): void
    {
        // This would integrate with the email service
        // For now, just log the action
        error_log("Booking confirmation email should be sent for booking ID: {$bookingId}");
    }
} 