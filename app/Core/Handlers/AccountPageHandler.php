<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Services\SettingsService;

/**
 * Account Page Handler
 *
 * Handles account page requests
 */
class AccountPageHandler extends BasePageHandler
{
    /**
     * Handle account page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
        $page = $route_data['page'] ?? 'dashboard';
        $base = $route_data['base'] ?? 'account';

        // Validate page
        $valid_pages = ['dashboard', 'profile', 'bookings', 'wishlist', 'settings'];
        if (!in_array($page, $valid_pages, true)) {
            return false;
        }

        // Prevent 404 handling
        $this->prevent404();

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_account_page' => $page,
        ]);

        // Load the account page template
        $template_path = YATRA_PLUGIN_PATH . 'templates/account.php';

        if (!file_exists($template_path)) {
            $this->logError("Account page template not found: {$template_path}");
            return false;
        }

        include $template_path;
        $this->exit();

        return true;
    }
}
