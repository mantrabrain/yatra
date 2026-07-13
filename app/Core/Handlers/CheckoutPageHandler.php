<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Repositories\BookingRepository;

/**
 * Checkout Page Handler
 *
 * Handles remaining checkout page requests
 */
class CheckoutPageHandler extends BasePageHandler
{
    /**
     * Handle checkout page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $token = $route_data['token'];

        // Validate checkout token
        $bookingRepo = new BookingRepository();
        $booking = $bookingRepo->findByCheckoutToken($token);

        if (!$booking) {
            wp_die(__('Invalid checkout link.', 'yatra'));
        }

        // Configure $wp_query + virtual WP_Post so FSE block themes don't fall back to 404.html.
        $this->setupPageEnvironment('singular', [
            'title' => __('Checkout', 'yatra'),
            // Keep the virtual post ID at 0 (like the account/login/booking
            // handlers). Using the booking row id made get_queried_object_id()
            // collide with a real wp_posts row of the same id, so SEO plugins /
            // WordPress emitted THAT page's SEO on this page. The booking is read
            // from the `yatra_booking` global, so no queried-object id is needed.
            'object_id' => 0,
            'post_type' => 'page',
            'post_name' => $token,
        ]);

        // Set up global booking object
        $this->setGlobal('yatra_booking', $booking);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_remaining_checkout' => $token,
            'yatra_booking' => $booking,
        ]);

        return $this->selectTemplate('checkout', null, 'checkout');
    }
}
