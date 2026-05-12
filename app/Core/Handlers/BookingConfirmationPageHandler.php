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
        $confirmation_id = (string) ($route_data['confirmation_id'] ?? '');

        $bookingRepo = new BookingRepository();
        $booking = $bookingRepo->findByConfirmationSegment($confirmation_id);

        if (!$booking) {
            return false;
        }

        // Configure $wp_query + virtual WP_Post so FSE block themes don't fall back to 404.html.
        $this->setupPageEnvironment('singular', [
            'title' => __('Booking Confirmation', 'yatra'),
            'object_id' => (int) ($booking->id ?? 0),
            'post_type' => 'page',
            'post_name' => $confirmation_id,
        ]);

        // Load trip attributes for booking confirmation display
        if ($booking && !empty($booking->trip_id)) {
            try {
                $singleTripController = new \Yatra\Controllers\SingleTripController();
                // Use reflection to access private method
                $reflection = new \ReflectionClass($singleTripController);
                $method = $reflection->getMethod('getTripAttributes');
                $method->setAccessible(true);
                $attributes = $method->invoke($singleTripController, (int) $booking->trip_id);
                
                // Create a simple list of attribute names for tag display
                $booking->trip_attributes_list = array_map(function($attr) {
                    return $attr['name'];
                }, $attributes);
            } catch (\Throwable $e) {
                $booking->trip_attributes_list = [];
            }
        }

        // Set up global booking object
        $this->setGlobal('yatra_booking', $booking);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_booking_confirmation' => $confirmation_id,
            'yatra_booking' => $booking,
        ]);

        return $this->selectTemplate('booking-confirmation', null, 'booking-confirmation');
    }
}
