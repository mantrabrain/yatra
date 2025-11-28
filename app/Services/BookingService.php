<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\PaymentRepository;
use Yatra\Repositories\TravellerRepository;
use Yatra\Repositories\CustomerRepository;
use Yatra\Repositories\TripRepository;

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

    public function __construct()
    {
        $this->bookingRepository = new BookingRepository();
        $this->paymentRepository = new PaymentRepository();
        $this->travellerRepository = new TravellerRepository();
        $this->customerRepository = new CustomerRepository();
        $this->tripRepository = new TripRepository();
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
     * Create a new booking
     * 
     * @param array $data Booking data
     * @return array {success: bool, booking_id?: int, reference?: string, message?: string}
     */
    public function createBooking(array $data): array
    {
        // Validate trip exists and is available
        $trip = $this->tripRepository->find((int) $data['trip_id']);
        if (!$trip) {
            return ['success' => false, 'message' => __('Trip not found.', 'yatra')];
        }

        if ($trip->status !== 'published') {
            return ['success' => false, 'message' => __('Trip is not available for booking.', 'yatra')];
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
            return ['success' => false, 'message' => __('Failed to create booking.', 'yatra')];
        }

        // Save travelers
        if (!empty($data['travelers']) && is_array($data['travelers'])) {
            $this->saveTravelers($bookingId, $data['travelers']);
        }

        // Send confirmation email if needed
        $this->sendBookingConfirmationEmail($bookingId);

        return [
            'success' => true,
            'booking_id' => $bookingId,
            'reference' => $data['reference'],
            'message' => __('Booking created successfully.', 'yatra'),
        ];
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

        // Update booking
        $updated = $this->bookingRepository->update($id, $data);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update booking.', 'yatra')];
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

        $updated = $this->bookingRepository->updateStatus($id, $status);

        if (!$updated) {
            return ['success' => false, 'message' => __('Failed to update status.', 'yatra')];
        }

        // Send status change notification
        $this->sendStatusChangeNotification($id, $booking->status, $status);

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
        return [
            'id' => (int) $booking->id,
            'reference' => $booking->reference,
            'trip_id' => (int) $booking->trip_id,
            'trip_title' => $booking->trip_title ?? '',
            'trip_slug' => $booking->trip_slug ?? '',
            'customer_id' => $booking->customer_id ? (int) $booking->customer_id : null,
            'user_id' => $booking->user_id ? (int) $booking->user_id : null,
            'contact' => [
                'first_name' => $booking->contact_first_name,
                'last_name' => $booking->contact_last_name,
                'email' => $booking->contact_email,
                'phone' => $booking->contact_phone,
                'country' => $booking->contact_country,
            ],
            'travel_date' => $booking->travel_date,
            'travelers_count' => (int) $booking->travelers_count,
            'total_amount' => (float) $booking->total_amount,
            'amount_paid' => (float) $booking->amount_paid,
            'amount_due' => (float) $booking->amount_due,
            'currency' => $booking->currency,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_gateway' => $booking->payment_gateway,
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

