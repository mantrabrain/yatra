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

        // Email-change confirmation (WordPress core pattern). The emailed link
        // lands here as a normal front-end request, so the WordPress auth cookie
        // identifies the customer — unlike a REST GET, which carries no nonce and
        // would be treated as anonymous. Handled before anything else so the
        // token is consumed and we redirect away cleanly.
        $emailToken = isset($_GET['yatra_email_token'])
            ? sanitize_text_field(wp_unslash((string) $_GET['yatra_email_token']))
            : '';
        if ($emailToken !== '') {
            $this->confirmEmailChange($emailToken, $base); // always redirects + exits
        }

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

        $this->setupPageEnvironment('singular', [
            'title' => __('My Account', 'yatra'),
            'post_type' => 'page',
            'post_name' => $base,
        ]);

        $this->setQueryVars([
            'yatra_account_page' => $page,
        ]);

        $GLOBALS['yatra_loading_react_account_page'] = true;

        return $this->selectTemplate('account-page', null, 'account');
    }

    /**
     * Confirm a pending account email change from the emailed link, then redirect
     * back to the Profile tab with a success/error flag. Mirrors WordPress core's
     * confirmation step (logged-out visitors are bounced through login and returned
     * here to finish). Always redirects and exits.
     */
    private function confirmEmailChange(string $token, string $base): void
    {
        $accountUrl = home_url('/' . trailingslashit($base));

        if (!is_user_logged_in()) {
            $returnUrl = add_query_arg('yatra_email_token', rawurlencode($token), $accountUrl);
            wp_safe_redirect(wp_login_url($returnUrl));
            exit;
        }

        $result = (new \Yatra\Services\CustomerService())
            ->confirmEmailChange(get_current_user_id(), $token);

        wp_safe_redirect(add_query_arg(
            [
                'tab' => 'profile',
                'email_change' => empty($result['success']) ? 'error' : 'success',
            ],
            $accountUrl
        ));
        exit;
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
        switch ($page) {
            case 'wishlist':
                return 'saved-trips';
            case 'settings':
                return 'profile';
            default:
                return $page;
        }
    }
}
