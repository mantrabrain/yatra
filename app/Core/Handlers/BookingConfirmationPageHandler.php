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

                // Render each attribute as "Name: Value" so the
                // Features block on the confirmation page actually
                // tells the customer something useful. The previous
                // version mapped to $attr['name'] only, which produced
                // a meaningless list of category labels like
                // "Group Size Age Restriction Fitness Level …" with
                // no values — looks like a broken render.
                //
                // Attributes with an empty value (operator added the
                // category but never filled it in for this trip) are
                // dropped entirely so we don't show "Group Size:" with
                // a dangling colon.
                $booking->trip_attributes_list = [];
                foreach ($attributes as $attr) {
                    $name  = isset($attr['name']) ? trim((string) $attr['name']) : '';
                    $value = isset($attr['value']) ? trim((string) $attr['value']) : '';
                    if ($value === '') {
                        continue;
                    }
                    $booking->trip_attributes_list[] = $name !== ''
                        ? $name . ': ' . $value
                        : $value;
                }
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
