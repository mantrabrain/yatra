<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Services\SettingsService;

/**
 * Booking Page Handler
 *
 * Handles booking page requests
 */
class BookingPageHandler extends BasePageHandler
{
    /**
     * Handle booking page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        // Check if custom booking page is enabled
        if (SettingsService::useCustomBookingPage()) {
            return false;
        }

        $page = $route_data['page'] ?? 'main';
        $base = $route_data['base'];

        // Prevent 404 handling
        $this->prevent404();

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_booking_page' => $page,
        ]);

        // Load the booking page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/booking.php';

        if (!file_exists($template_path)) {
            $this->logError("Booking template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }
}
