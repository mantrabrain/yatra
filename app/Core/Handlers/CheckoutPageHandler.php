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

        // Prevent 404 handling
        $this->prevent404();

        // Set up global booking object
        $this->setGlobal('yatra_booking', $booking);

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_remaining_checkout' => $token,
            'yatra_booking' => $booking,
        ]);

        // Load the checkout template
        $template_path = YATRA_PLUGIN_PATH . 'templates/checkout.php';

        if (!file_exists($template_path)) {
            $this->logError("Checkout template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }
}
