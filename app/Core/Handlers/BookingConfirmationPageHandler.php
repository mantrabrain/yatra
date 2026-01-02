<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Repositories\BookingRepository;

/**
 * Booking Confirmation Page Handler
 *
 * Handles booking confirmation page requests
 */
class BookingConfirmationPageHandler extends BasePageHandler
{
    /**
     * Handle booking confirmation page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $confirmation_id = $route_data['confirmation_id'];

        // Validate confirmation ID (stored as booking reference)
        $bookingRepo = new BookingRepository();
        // Try rich booking first (with trip data), then fallback
        $booking = $bookingRepo->findByReferenceWithTrip($confirmation_id);
        if (!$booking) {
            $booking = $bookingRepo->findByReference($confirmation_id);
        }

        if (!$booking) {
            return false;
        }

        // Prevent 404 handling
        $this->prevent404();

        // Set up global booking object
        $this->setGlobal('yatra_booking', $booking);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_booking_confirmation' => $confirmation_id,
            'yatra_booking' => $booking,
        ]);

        // Load the booking confirmation template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking-confirmation.php';

        if (!file_exists($template_path)) {
            $this->logError("Booking confirmation template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }
}
