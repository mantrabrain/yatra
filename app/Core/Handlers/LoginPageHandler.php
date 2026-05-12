<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

/**
 * Login Page Handler
 *
 * Production-optimized handler for login page routing and template loading
 * 
 * @package Yatra
 * @version 1.0.0
 */
class LoginPageHandler extends BasePageHandler
{
    /**
     * Handle the login page request with enhanced security
     */
    public function handle(array $params): bool
    {
        // Security: Validate request method
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendErrorResponse(405, __('Method not allowed', 'yatra'));
            return false;
        }

        // Security: Rate limiting for login page access
        if (!$this->checkRateLimit()) {
            $this->sendErrorResponse(429, __('Too many requests', 'yatra'));
            return false;
        }

        // Security: Check if user is already logged in and redirect securely
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            $redirect_url = apply_filters('yatra_login_redirect_url', home_url('/' . \Yatra\Services\SettingsService::getAccountBase()), $current_user);
            
            // Use safe redirect to prevent open redirects
            wp_safe_redirect($redirect_url, 302);
            exit;
        }

        // Security: Validate nonce if present (for form submissions)
        if (isset($_GET['_wpnonce']) && !wp_verify_nonce($_GET['_wpnonce'], 'yatra_login_page')) {
            $this->sendErrorResponse(403, __('Security check failed', 'yatra'));
            return false;
        }

        // Configure $wp_query + virtual WP_Post (covers FSE block-theme rendering).
        $this->setupPageEnvironment('singular', [
            'title' => __('Login', 'yatra'),
            'post_type' => 'page',
            'post_name' => 'login',
        ]);

        // Security headers
        $this->setSecurityHeaders();

        if (!$this->selectTemplate('login-page', null, 'login')) {
            // Fallback to shortcode if template is missing
            return $this->handleFallback();
        }

        return true;
    }

    /**
     * Get the route pattern for this handler
     */
    public function getPattern(): string
    {
        return '^login/?$';
    }

    /**
     * Get the route name for this handler
     */
    public function getName(): string
    {
        return 'login';
    }

    /**
     * Check rate limiting for login page access
     */
    private function checkRateLimit(): bool
    {
        $ip = $this->getClientIp();
        $transient_key = 'yatra_login_page_limit_' . md5($ip);
        $attempts = get_transient($transient_key) ?: 0;
        
        // Allow 30 requests per 5 minutes
        if ($attempts >= 30) {
            return false;
        }
        
        set_transient($transient_key, $attempts + 1, 5 * MINUTE_IN_SECONDS);
        return true;
    }

    /**
     * Set security headers
     */
    private function setSecurityHeaders(): void
    {
        if (!headers_sent()) {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            header('Content-Security-Policy: "default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:; connect-src \'self\'"');
        }
    }

    /**
     * Handle fallback when template is not available
     */
    private function handleFallback(): bool
    {
        // Fallback to shortcode rendering
        add_filter('template_include', function($template) {
            return get_template_directory() . '/page.php';
        });
        
        // Create a virtual page
        add_filter('the_content', function($content) {
            return do_shortcode('[yatra_login]');
        });
        
        return true;
    }

    /**
     * Send error response
     */
    private function sendErrorResponse(int $code, string $message): void
    {
        if (!headers_sent()) {
            status_header($code);
            header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
        }
        
        wp_die(
            esc_html($message),
            esc_html__('Error', 'yatra'),
            ['response' => $code]
        );
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): string
    {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
