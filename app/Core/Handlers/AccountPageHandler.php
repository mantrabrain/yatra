<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Core\Routing\UrlParser;
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
        $page = (string) ($route_data['page'] ?? 'dashboard');
        $base = (string) ($route_data['base'] ?? SettingsService::getAccountBase());

        if (!$this->isValidAccountPage($page)) {
            return false;
        }

        $tab = $this->accountPageToReactTab($page);
        $path = UrlParser::getCleanRequestPath();
        if ($path !== $base && str_starts_with($path, $base . '/')) {
            wp_safe_redirect(add_query_arg('tab', $tab, home_url('/' . $base . '/')));
            exit;
        }

        $currentTab = isset($_GET['tab']) ? sanitize_key((string) $_GET['tab']) : '';
        if ($currentTab !== '' && $currentTab !== $tab) {
            wp_safe_redirect(add_query_arg('tab', $tab));
            exit;
        }

        $this->prevent404();

        $this->setQueryVars([
            'yatra_account_page' => $page,
        ]);

        $template_path = YATRA_PLUGIN_PATH . 'templates/account-page.php';

        if (!file_exists($template_path)) {
            $this->logError("Account page template not found: {$template_path}");
            return false;
        }

        $GLOBALS['yatra_loading_react_account_page'] = true;

        include $template_path;
        $this->exit();

        return true;
    }

    /**
     * @return list<string>
     */
    private function validAccountPages(): array
    {
        return [
            'dashboard',
            'profile',
            'bookings',
            'payments',
            'documents',
            'saved-trips',
            'wishlist',
            'settings',
        ];
    }

    private function isValidAccountPage(string $page): bool
    {
        return in_array($page, $this->validAccountPages(), true);
    }

    private function accountPageToReactTab(string $page): string
    {
        return match ($page) {
            'wishlist' => 'saved-trips',
            'settings' => 'profile',
            default => $page,
        };
    }
}
