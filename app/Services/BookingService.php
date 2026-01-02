<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\TravellerRepository;
use Yatra\Repositories\CustomerRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Repositories\DepartureRepository;
use Yatra\Repositories\BookingDepartureRepository;
use Yatra\Validators\BookingValidator;
use Yatra\Utils\Logger;
use Yatra\Services\CacheService;

/**
 * Booking Service
 * 
 * Contains business logic for bookings.
 * Uses repositories for data access.
 * 
 * Note: Does not extend BaseService as it uses multiple repositories
 * and has specialized booking-related methods.
 * 
 * @package Yatra\Services
 */
class BookingService
{
    private BookingRepository $bookingRepository;
    private PaymentRepository $paymentRepository;
    private TravellerRepository $travellerRepository;
    private CustomerRepository $customerRepository;
    private TripRepository $tripRepository;
    private DepartureService $departureService;

    public function __construct()
    {
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
        $this->travellerRepository = new TravellerRepository();
        $this->customerRepository = new CustomerRepository();
        $this->tripRepository = new TripRepository();
        $this->departureService = new DepartureService(
            new DepartureRepository(),
            new BookingDepartureRepository(),
            $this->bookingRepository,
            $this->tripRepository
        );
    }

    /**
     * Get paginated bookings
     * 
     * @param array $filters Filters (page, per_page, status, search, etc.)
     * @return array
     */
    public function getBookings(array $filters = []): array
    {
        $result = $this->bookingRepository->paginate($filters);

        // Format each booking
        $result['data'] = array_map([$this, 'formatBooking'], $result['data']);

        return $result;
    }

    /**
     * Get single booking with all related data
     * 
     * @param int $id Booking ID
     * @return array|null
     */
    public function getBooking(int $id): ?array
    {
        $booking = $this->bookingRepository->findWithTrip($id);

        if (!$booking) {
            return null;
        }

        return $this->formatBookingWithDetails($booking);
    }

    /**
     * Get booking by reference code
     * 
     * @param string $reference Booking reference
     * @return array|null
     */
    public function getBookingByReference(string $reference): ?array
    {
        $booking = $this->bookingRepository->findByReference($reference);

        if (!$booking) {
            return null;
        }

        return $this->formatBookingWithDetails($booking);
    }

    /**
     * Validate booking business rules
     */
    private function validateBookingBusinessRules(array $data): array
    {
        // Check minimum travelers count
        $travelersCount = (int) ($data['travelers_count'] ?? 0);
        if ($travelersCount <= 0) {
            return [
                'success' => false,
                'message' => __('At least one traveler is required for booking.', 'yatra')
            ];
        }

        // Check trip capacity if specified
        if (!empty($data['trip_id'])) {
            $trip = $this->tripRepository->find((int) $data['trip_id']);
            if ($trip && !empty($trip->max_travelers)) {
                $maxCapacity = (int) $trip->max_travelers;
                if ($travelersCount > $maxCapacity) {
                    return [
                        'success' => false,
                        'message' => sprintf(
                            __('Maximum %d travelers allowed for this trip.', 'yatra'),
                            $maxCapacity
                        )
                    ];
                }
            }
        }

        // Check booking date is in the future
        if (!empty($data['start_date'])) {
            $startDate = strtotime($data['start_date']);
            $today = strtotime('today');
            
            if ($startDate < $today) {
                return [
                    'success' => false,
                    'message' => __('Booking date must be in the future.', 'yatra')
                ];
            }
        }

        // Check total amount is positive
        $totalAmount = (float) ($data['total_amount'] ?? 0);
        if ($totalAmount <= 0) {
            return [
                'success' => false,
                'message' => __('Total amount must be greater than zero.', 'yatra')
            ];
        }

        // Check payment amount doesn't exceed total
        $amountPaid = (float) ($data['amount_paid'] ?? 0);
        if ($amountPaid > $totalAmount) {
            return [
                'success' => false,
                'message' => __('Payment amount cannot exceed total booking amount.', 'yatra')
            ];
        }

        return ['success' => true];
    }

    /**
     * Create a new booking with comprehensive validation and business rules
     * 
     * @param array $data Booking data
     * @return array {success: bool, booking_id?: int, reference?: string, message?: string}
     */
    public function createBooking(array $data): array
    {
        $startTime = microtime(true);
        
        try {
            Logger::info("Booking creation started", [
                'data_keys' => array_keys($data),
                'trip_id' => $data['trip_id'] ?? null
            ]);
            
            // Comprehensive validation using BookingValidator
            try {
                BookingValidator::validateCreate($data);
            } catch (\Yatra\Exceptions\ValidationException $e) {
                Logger::warning('Booking validation failed', [
                    'trip_id' => $data['trip_id'] ?? null,
                    'errors' => $e->getErrors(),
                    'error' => $e->getMessage(),
                ]);
                return [
                    'success' => false,
                    'message' => $e->getMessage() ?: __('Booking validation failed.', 'yatra'),
                    'errors'  => $e->getErrors(),
                ];
            } catch (\Exception $e) {
                Logger::warning('Booking validation failed', [
                    'trip_id' => $data['trip_id'] ?? null,
                    'error' => $e->getMessage(),
                ]);
                return [
                    'success' => false,
                    'message' => $e->getMessage() ?: __('Booking validation failed.', 'yatra'),
                ];
            }
            $data = BookingValidator::sanitize($data);
            
            // Business rule validations
            $validationResult = $this->validateBookingBusinessRules($data);
            if (!$validationResult['success']) {
                Logger::warning("Booking business rule validation failed", [
                    'trip_id' => $data['trip_id'],
                    'reason' => $validationResult['message']
                ]);
                return $validationResult;
            }
            
            // Validate trip exists and is available
            $trip = $this->tripRepository->find((int) $data['trip_id']);
            if (!$trip) {
                Logger::error("Trip not found for booking", ['trip_id' => $data['trip_id']]);
                return ['success' => false, 'message' => __('Trip not found.', 'yatra')];
            }

            if ($trip->status !== 'publish') {
                Logger::warning("Trip not available for booking", [
                    'trip_id' => $data['trip_id'],
                    'status' => $trip->status
                ]);
                return ['success' => false, 'message' => __('Trip is not available for booking.', 'yatra')];
            }

            // Calculate start_date and end_date if travel_date is provided
            if (!empty($data['travel_date']) && empty($data['start_date'])) {
                $data['start_date'] = $data['travel_date'];
            }
            
            if (!empty($data['start_date']) && empty($data['end_date'])) {
                $data['end_date'] = $this->calculateEndDate($data['start_date'], (int) $data['trip_id']);
            }

            // Generate unique reference
            $data['reference'] = $this->bookingRepository->generateReference();

            // Find or create customer
            if (!empty($data['contact_email'])) {
                $customerId = $this->customerRepository->findOrCreate([
                    'email' => $data['contact_email'],
                    'first_name' => $data['contact_first_name'] ?? '',
                    'last_name' => $data['contact_last_name'] ?? '',
                    'phone' => $data['contact_phone'] ?? '',
                    'country' => $data['contact_country'] ?? '',
                    'user_id' => $data['user_id'] ?? null,
                ]);
                $data['customer_id'] = $customerId;
            }

            // Calculate amounts
            $data['amount_due'] = (float) ($data['total_amount'] ?? 0) - (float) ($data['amount_paid'] ?? 0);

            // Create booking
            $bookingId = $this->bookingRepository->create($data);

            if (!$bookingId) {
                Logger::error("Failed to create booking in database", ['data' => $data]);
                return ['success' => false, 'message' => __('Failed to create booking.', 'yatra')];
            }

            // Link booking to departure if start_date is provided
            if (!empty($data['start_date']) && !empty($data['end_date'])) {
                try {
                    $trip = $this->tripRepository->find((int) $data['trip_id']);
                    // Get max capacity from trip's max_travelers, or use default
                    $maxCapacity = null;
                    if ($trip && !empty($trip->max_travelers)) {
                        $maxCapacity = (int) $trip->max_travelers;
                    }
                    $travelersCount = (int) ($data['travelers_count'] ?? 0);

                    // Find or create departure
                    $departure = $this->departureService->findOrCreateForBooking(
                        (int) $data['trip_id'],
                        $data['start_date'],
                        $data['end_date'],
                        $travelersCount,
                        $maxCapacity
                    );

                    // Link booking to departure
                    $this->departureService->linkBookingToDeparture($bookingId, $departure->id);

                    // Increment booked count
                    $this->departureService->incrementBookedCount($departure->id, $travelersCount);

                    Logger::info("Booking linked to departure", [
                        'booking_id' => $bookingId,
                        'departure_id' => $departure->id
                    ]);
                } catch (\Exception $e) {
                    // Log error but don't fail the booking
                    Logger::warning("Failed to link booking to departure", [
                        'booking_id' => $bookingId,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Save travelers
            if (!empty($data['travelers']) && is_array($data['travelers'])) {
                $this->saveTravelers($bookingId, $data['travelers']);
            }

            // Send confirmation email if needed
            $this->sendBookingConfirmationEmail($bookingId);
            
            // Clear related caches
            CacheService::invalidateEntity('booking', $bookingId);
            
            $executionTime = microtime(true) - $startTime;
            Logger::info("Booking created successfully", [
                'booking_id' => $bookingId,
                'reference' => $data['reference'],
                'execution_time' => $executionTime
            ]);

            $booking = $this->bookingRepository->find((int) $bookingId);
            if (!is_object($booking)) {
                $booking = (object) [];
            }

            do_action('yatra_booking_created', (int) $bookingId, $booking);

            return [
                'success' => true,
                'booking_id' => $bookingId,
                'reference' => $data['reference'],
                'message' => __('Booking created successfully.', 'yatra'),
            ];
            
        } catch (\Exception $e) {
            $executionTime = microtime(true) - $startTime;
            Logger::error("Booking creation failed", [
                'trip_id' => $data['trip_id'] ?? null,
                'execution_time' => $executionTime,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Update a booking
     * 
     * @param int   $id   Booking ID
     * @param array $data Booking data
     * @return array {success: bool, message: string}
     */
    public function updateBooking(int $id, array $data): array
    {
        $booking = $this->bookingRepository->find($id);

        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        // Check if date is being changed
        $oldStartDate = $booking->start_date ?? $booking->travel_date ?? null;
        $newStartDate = $data['start_date'] ?? $data['travel_date'] ?? null;
        $dateChanged = false;

        if ($newStartDate && $oldStartDate && $newStartDate !== $oldStartDate) {
            $dateChanged = true;
        }

        // Calculate end_date if start_date is provided
        if (!empty($data['start_date']) && empty($data['end_date'])) {
            $data['end_date'] = $this->calculateEndDate($data['start_date'], (int) $booking->trip_id);
        } elseif (!empty($data['travel_date']) && empty($data['start_date']) && empty($data['end_date'])) {
            $data['start_date'] = $data['travel_date'];
            $data['end_date'] = $this->calculateEndDate($data['travel_date'], (int) $booking->trip_id);
        }

        // Update booking
        $updated = $this->bookingRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update booking.', 'yatra')];
        }

        // Handle departure date change if date was changed
        if ($dateChanged && !empty($data['start_date']) && !empty($data['end_date'])) {
            try {
                $this->departureService->handleBookingDateChange(
                    $id,
                    $data['start_date'],
                    $data['end_date']
                );
                error_log("Yatra: Handled date change for booking {$id}");
            } catch (\Exception $e) {
                // Log error but don't fail the update
                error_log('Yatra: Failed to handle booking date change: ' . $e->getMessage());
            }
        }

        // Update travelers if provided
        if (isset($data['travelers']) && is_array($data['travelers'])) {
            // Delete existing travelers
            $this->travellerRepository->deleteByBookingId($id);
            // Save new travelers
            $this->saveTravelers($id, $data['travelers']);
        }

        return [
            'success' => true,
            'message' => __('Booking updated successfully.', 'yatra'),
        ];
    }

    /**
     * Calculate end date from start date and trip duration
     * 
     * @param string $startDate Start date (YYYY-MM-DD)
     * @param int $tripId Trip ID
     * @return string End date (YYYY-MM-DD)
     */
    private function calculateEndDate(string $startDate, int $tripId): string
    {
        return $this->bookingRepository->calculateEndDate($startDate, $tripId);
    }

    /**
     * Update booking status
     * 
     * @param int    $id     Booking ID
     * @param string $status New status
     * @return array {success: bool, message: string}
     */
    public function updateStatus(int $id, string $status): array
    {
        $validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded', 'failed', 'on_hold'];

        if (!in_array($status, $validStatuses, true)) {
            return ['success' => false, 'message' => __('Invalid status.', 'yatra')];
        }

        $booking = $this->bookingRepository->find($id);

        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        $oldStatus = $booking->status;
        $updated = $this->bookingRepository->updateStatus($id, $status);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        // ========================================
        // HANDLE DEPARTURE BOOKED_COUNT UPDATE
        // ========================================
        // If booking is cancelled or refunded, unlink from departure and decrement booked_count
        // If booking status changes from cancelled/refunded to active, link and increment booked_count
        try {
            $departure = $this->departureService->getDepartureForBooking($id);
            $travelersCount = (int) ($booking->travelers_count ?? 0);

            if ($departure) {
                // If booking is being cancelled or refunded
                if (in_array($status, ['cancelled', 'refunded'], true) && 
                    !in_array($oldStatus, ['cancelled', 'refunded'], true)) {
                    // Unlink booking from departure (this will handle cancellation if no bookings remain)
                    $this->departureService->unlinkBookingFromDeparture($id, $departure->id);
                    error_log("Yatra: Unlinked booking {$id} from departure {$departure->id} (cancelled/refunded)");
                }
                // If booking status changes from cancelled/refunded back to active
                elseif (in_array($oldStatus, ['cancelled', 'refunded'], true) && 
                        !in_array($status, ['cancelled', 'refunded'], true)) {
                    // Ensure booking is linked and increment booked count
                    $this->departureService->linkBookingToDeparture($id, $departure->id);
                    $this->departureService->incrementBookedCount($departure->id, $travelersCount);
                    error_log("Yatra: Reactivated booking {$id} on departure {$departure->id}");
                }
            } elseif (!empty($booking->start_date) || !empty($booking->travel_date)) {
                // Booking doesn't have a departure yet, but has a date - create and link
                $startDate = $booking->start_date ?? $booking->travel_date;
                $endDate = $booking->end_date ?? $this->calculateEndDate($startDate, (int) $booking->trip_id);
                
                $trip = $this->tripRepository->find((int) $booking->trip_id);
                $maxCapacity = $trip ? ($trip->max_capacity ?? 9999) : 9999;
                
                $departure = $this->departureService->findOrCreateForBooking(
                    (int) $booking->trip_id,
                    $startDate,
                    $endDate,
                    $travelersCount,
                    $maxCapacity
                );
                
                $this->departureService->linkBookingToDeparture($id, $departure->id);
                $this->departureService->incrementBookedCount($departure->id, $travelersCount);
                error_log("Yatra: Created and linked departure {$departure->id} for reactivated booking {$id}");
            }
        } catch (\Exception $e) {
            // Log error but don't fail the status update
            error_log('Yatra: Failed to update departure for booking status change: ' . $e->getMessage());
        }

        // Send status change notification
        $this->sendStatusChangeNotification($id, $oldStatus, $status);
        
        /**
         * Action: Booking status changed
         * Fires when booking status changes
         * 
         * @param int $id The booking ID
         * @param string $oldStatus Previous status
         * @param string $status New status
         * @since 3.0.0
         */
        do_action('yatra_booking_status_changed', $id, $oldStatus, $status);

        return [
            'success' => true,
            'message' => sprintf(__('Booking status updated to %s.', 'yatra'), $status),
        ];
    }

    /**
     * Delete a booking
     * 
     * @param int $id Booking ID
     * @return array {success: bool, message: string}
     */
    public function deleteBooking(int $id): array
    {
        $booking = $this->bookingRepository->find($id);

        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        // Delete related travelers
        $this->travellerRepository->deleteByBookingId($id);

        // Delete booking
        $deleted = $this->bookingRepository->delete($id);

        if (!$deleted) {
            return ['success' => false, 'message' => __('Failed to delete booking.', 'yatra')];
        }

        if (!is_object($booking)) {
            $booking = (object) [];
        }

        do_action('yatra_booking_deleted', (int) $id, $booking);

        return [
            'success' => true,
            'message' => __('Booking deleted successfully.', 'yatra'),
        ];
    }

    /**
     * Get booking statistics
     * 
     * @return array
     */
    public function getStats(): array
    {
        return $this->bookingRepository->getStats();
    }

    /**
     * Get booking payments
     * 
     * @param int $bookingId Booking ID
     * @return array
     */
    public function getBookingPayments(int $bookingId): array
    {
        return $this->paymentRepository->findByBookingId($bookingId);
    }

    /**
     * Get booking travelers
     * 
     * @param int $bookingId Booking ID
     * @return array
     */
    public function getBookingTravelers(int $bookingId): array
    {
        return $this->travellerRepository->getByBookingId($bookingId);
    }

    /**
     * Format booking for API response
     * 
     * @param object $booking Raw booking data
     * @return array
     */
    private function formatBooking(object $booking): array
    {
        // Build customer name from contact fields
        $customerName = trim(
            ($booking->customer_first_name ?? $booking->contact_first_name ?? '') . ' ' . ($booking->customer_last_name ?? $booking->contact_last_name ?? '')
        ) ?: ($booking->customer_name ?? $booking->customer_email ?? $booking->contact_email ?? null);

        $customerEmail = $booking->customer_email ?? $booking->contact_email ?? null;
        $customerPhone = $booking->contact_phone ?? null;

        return [
            'id' => (int) $booking->id,
            'reference' => $booking->reference,
            // UI expects booking_number and booking_status fields
            'booking_number' => $booking->reference,
            'booking_status' => $booking->status,
            'trip_id' => (int) $booking->trip_id,
            'trip_title' => $booking->trip_title ?? '',
            'trip_slug' => $booking->trip_slug ?? '',
            'customer_id' => $booking->customer_id ? (int) $booking->customer_id : null,
            'user_id' => $booking->user_id ? (int) $booking->user_id : null,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'contact' => [
                'first_name' => $booking->contact_first_name ?? $booking->customer_first_name ?? null,
                'last_name' => $booking->contact_last_name ?? $booking->customer_last_name ?? null,
                'email' => $customerEmail,
                'phone' => $customerPhone,
                'country' => $booking->contact_country,
            ],
            'contact_first_name' => $booking->contact_first_name ?? $booking->customer_first_name ?? null,
            'contact_last_name' => $booking->contact_last_name ?? $booking->customer_last_name ?? null,
            'contact_email' => $customerEmail,
            'contact_phone' => $customerPhone,
            'contact_country' => $booking->contact_country ?? null,
            'travel_date' => $booking->travel_date,
            // travelers_count stored; also fallback to total_travelers/travelers if present
            'travelers_count' => (int) ($booking->travelers_count ?? $booking->total_travelers ?? $booking->travelers ?? 0),
            'travelers' => (int) ($booking->travelers_count ?? $booking->total_travelers ?? $booking->travelers ?? 0),
            'total_amount' => (float) $booking->total_amount,
            'amount_paid' => (float) $booking->amount_paid,
            'amount_due' => (float) $booking->amount_due,
            'discount_amount' => (float) ($booking->discount_amount ?? 0),
            'discount_code' => $booking->discount_code ?? null,
            'currency' => $booking->currency,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            // Some UIs expect payment_method; map from payment_gateway
            'payment_gateway' => $booking->payment_gateway,
            'payment_method' => $booking->payment_gateway,
            // booking_date is used in admin table; map to created_at
            'booking_date' => $booking->created_at,
            'created_at' => $booking->created_at,
            'updated_at' => $booking->updated_at,
        ];
    }

    /**
     * Format booking with all details for single view
     * 
     * @param object $booking Raw booking data
     * @return array
     */
    private function formatBookingWithDetails(object $booking): array
    {
        $formatted = $this->formatBooking($booking);

        // Add customer name for easier access
        $formatted['customer_name'] = trim(
            ($booking->contact_first_name ?? '') . ' ' . ($booking->contact_last_name ?? '')
        ) ?: null;
        $formatted['customer_email'] = $booking->contact_email ?? null;
        $formatted['customer_phone'] = $booking->contact_phone ?? null;
        
        // Also add contact fields at root level for backward compatibility
        $formatted['contact_first_name'] = $booking->contact_first_name ?? null;
        $formatted['contact_last_name'] = $booking->contact_last_name ?? null;
        $formatted['contact_email'] = $booking->contact_email ?? null;
        $formatted['contact_phone'] = $booking->contact_phone ?? null;
        $formatted['contact_country'] = $booking->contact_country ?? null;

        // Add full contact data
        $formatted['contact_data'] = $booking->contact_data ? json_decode($booking->contact_data, true) : null;

        // Add emergency contact
        $formatted['emergency_contact'] = $booking->emergency_contact ? json_decode($booking->emergency_contact, true) : null;

        // Add travelers
        $formatted['travelers'] = $this->getBookingTravelers((int) $booking->id);

        // Add payments
        $formatted['payments'] = $this->getBookingPayments((int) $booking->id);

        // Add additional fields
        $formatted['special_requests'] = $booking->special_requests;
        $formatted['internal_notes'] = $booking->internal_notes;
        $formatted['payment_transaction_id'] = $booking->payment_transaction_id;
        $formatted['cancelled_at'] = $booking->cancelled_at;
        $formatted['cancellation_reason'] = $booking->cancellation_reason;
        $formatted['confirmed_at'] = $booking->confirmed_at;
        $formatted['completed_at'] = $booking->completed_at;

        /**
         * Filter: Add additional services to booking details
         * Allows premium modules to include services data in booking response
         * 
         * @param array $services Empty array by default
         * @param int $booking_id The booking ID
         * @since 3.0.0
         */
        $formatted['additional_services'] = apply_filters('yatra_booking_get_services', [], (int) $booking->id);

        $formatted = apply_filters('yatra_booking_details', $formatted, (int) $booking->id);

        return $formatted;
    }

    /**
     * Save travelers for a booking
     * 
     * @param int   $bookingId Booking ID
     * @param array $travelers Travelers data
     */
    private function saveTravelers(int $bookingId, array $travelers): void
    {
        foreach ($travelers as $index => $travelerData) {
            $isLead = $index === 0;
            $this->travellerRepository->createTraveller($bookingId, $index, $isLead, $travelerData);
        }
    }

    /**
     * Send booking confirmation email
     * 
     * @param int $bookingId Booking ID
     */
    private function sendBookingConfirmationEmail(int $bookingId): void
    {
        $booking = $this->bookingRepository->findWithTrip($bookingId);

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        $settings = SettingsService::getSettings();

        if (empty($settings['email_notifications']['booking_confirmation'])) {
            return;
        }

        $subject = sprintf(
            __('[%s] Booking Confirmation - %s', 'yatra'),
            get_bloginfo('name'),
            $booking->reference
        );

        $message = $this->getBookingConfirmationEmailContent($booking);

        wp_mail($booking->contact_email, $subject, $message, ['Content-Type: text/html; charset=UTF-8']);
    }

    /**
     * Send status change notification
     * 
     * @param int    $bookingId Booking ID
     * @param string $oldStatus Previous status
     * @param string $newStatus New status
     */
    private function sendStatusChangeNotification(int $bookingId, string $oldStatus, string $newStatus): void
    {
        // Only send for certain status changes
        $notifyStatuses = ['confirmed', 'cancelled', 'completed'];

        if (!in_array($newStatus, $notifyStatuses, true)) {
            return;
        }

        $booking = $this->bookingRepository->findWithTrip($bookingId);

        if (!$booking || empty($booking->contact_email)) {
            return;
        }

        $subject = sprintf(
            __('[%s] Booking Status Update - %s', 'yatra'),
            get_bloginfo('name'),
            $booking->reference
        );

        $message = $this->getStatusChangeEmailContent($booking, $newStatus);

        wp_mail($booking->contact_email, $subject, $message, ['Content-Type: text/html; charset=UTF-8']);
    }

    /**
     * Get booking confirmation email content
     * 
     * @param object $booking Booking data
     * @return string HTML email content
     */
    private function getBookingConfirmationEmailContent(object $booking): string
    {
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;"><?php esc_html_e('Booking Confirmation', 'yatra'); ?></h1>
            
            <p><?php printf(esc_html__('Thank you for your booking, %s!', 'yatra'), esc_html($booking->contact_first_name)); ?></p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;"><?php esc_html_e('Booking Details', 'yatra'); ?></h2>
                <p><strong><?php esc_html_e('Reference:', 'yatra'); ?></strong> <?php echo esc_html($booking->reference); ?></p>
                <p><strong><?php esc_html_e('Trip:', 'yatra'); ?></strong> <?php echo esc_html($booking->trip_title); ?></p>
                <p><strong><?php esc_html_e('Travel Date:', 'yatra'); ?></strong> <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($booking->travel_date))); ?></p>
                <p><strong><?php esc_html_e('Travelers:', 'yatra'); ?></strong> <?php echo esc_html($booking->travelers_count); ?></p>
                <p><strong><?php esc_html_e('Total Amount:', 'yatra'); ?></strong> <?php echo esc_html($booking->currency . ' ' . number_format((float) $booking->total_amount, 2)); ?></p>
            </div>
            
            <p><?php esc_html_e('We will be in touch with further details soon.', 'yatra'); ?></p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <?php echo esc_html(get_bloginfo('name')); ?>
            </p>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Get status change email content
     * 
     * @param object $booking   Booking data
     * @param string $newStatus New status
     * @return string HTML email content
     */
    private function getStatusChangeEmailContent(object $booking, string $newStatus): string
    {
        $statusMessages = [
            'confirmed' => __('Your booking has been confirmed!', 'yatra'),
            'cancelled' => __('Your booking has been cancelled.', 'yatra'),
            'completed' => __('Your trip has been completed. Thank you for traveling with us!', 'yatra'),
        ];

        $message = $statusMessages[$newStatus] ?? sprintf(__('Your booking status has been updated to: %s', 'yatra'), $newStatus);

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;"><?php esc_html_e('Booking Update', 'yatra'); ?></h1>
            
            <p><?php echo esc_html($message); ?></p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong><?php esc_html_e('Reference:', 'yatra'); ?></strong> <?php echo esc_html($booking->reference); ?></p>
                <p><strong><?php esc_html_e('Trip:', 'yatra'); ?></strong> <?php echo esc_html($booking->trip_title); ?></p>
                <p><strong><?php esc_html_e('Travel Date:', 'yatra'); ?></strong> <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($booking->travel_date))); ?></p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <?php echo esc_html(get_bloginfo('name')); ?>
            </p>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Get all travelers with pagination
     * 
     * @param array $filters Filters
     * @return array
     */
    public function getTravelers(array $filters = []): array
    {
        return $this->travellerRepository->paginate($filters);
    }

    /**
     * Perform bulk actions on travelers
     *
     * Currently supports only delete.
     *
     * @param int[]  $ids    Traveler IDs
     * @param string $action Action key (e.g. 'delete')
     * @return array {success: bool, message: string}
     */
    public function bulkTravelers(array $ids, string $action): array
    {
        $action = trim($action);

        if ($action !== 'delete') {
            return [
                'success' => false,
                'message' => __('Invalid traveler bulk action.', 'yatra'),
            ];
        }

        return $this->travellerRepository->bulkDelete($ids);
    }

    /**
     * Send booking email
     * 
     * @param int    $bookingId Booking ID
     * @param string $emailType Email type (confirmation, reminder, etc.)
     * @return array {success: bool, message: string}
     */
    public function sendEmail(int $bookingId, string $emailType = 'confirmation'): array
    {
        $booking = $this->bookingRepository->findWithTrip($bookingId);

        if (!$booking) {
            return ['success' => false, 'message' => __('Booking not found.', 'yatra')];
        }

        if (empty($booking->contact_email)) {
            return ['success' => false, 'message' => __('No email address found.', 'yatra')];
        }

        switch ($emailType) {
            case 'confirmation':
                $this->sendBookingConfirmationEmail($bookingId);
                break;

            case 'reminder':
                $this->sendBookingReminderEmail($booking);
                break;

            default:
                return ['success' => false, 'message' => __('Unknown email type.', 'yatra')];
        }

        return [
            'success' => true,
            'message' => __('Email sent successfully.', 'yatra'),
        ];
    }

    /**
     * Send booking reminder email
     * 
     * @param object $booking Booking data
     */
    private function sendBookingReminderEmail(object $booking): void
    {
        $subject = sprintf(
            __('[%s] Reminder: Your Trip is Coming Up - %s', 'yatra'),
            get_bloginfo('name'),
            $booking->reference
        );

        $daysUntilTrip = (int) ((strtotime($booking->travel_date) - time()) / 86400);

        $message = sprintf(
            __("Hi %s,\n\nThis is a friendly reminder that your trip is coming up in %d days!\n\nTrip: %s\nTravel Date: %s\nReference: %s\n\nWe look forward to seeing you!\n\n%s", 'yatra'),
            $booking->contact_first_name,
            $daysUntilTrip,
            $booking->trip_title,
            date_i18n(get_option('date_format'), strtotime($booking->travel_date)),
            $booking->reference,
            get_bloginfo('name')
        );

        wp_mail($booking->contact_email, $subject, $message);

        // Mark reminder as sent
        $this->bookingRepository->update((int) $booking->id, [
            'reminder_sent' => 1,
            'reminder_sent_at' => current_time('mysql'),
        ]);
    }
}

