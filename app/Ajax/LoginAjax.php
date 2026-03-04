<?php

declare(strict_types=1);

namespace Yatra\Ajax;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Login AJAX Handler
 * 
 * Handles AJAX login requests
 */
class LoginAjax
{
    /**
     * Constructor - Initialize AJAX hooks
     */
    public function __construct()
    {
        // Register AJAX action for logged-in users
        add_action('wp_ajax_yatra_ajax_login', [$this, 'handleAjaxLogin']);
        
        // Register AJAX action for non-logged-in users
        add_action('wp_ajax_nopriv_yatra_ajax_login', [$this, 'handleAjaxLogin']);
    }

    /**
     * Handle AJAX login request
     */
    public function handleAjaxLogin(): void
    {
        // Rate limiting check
        $this->checkRateLimit();
        
        // Verify nonce with multiple checks
        $nonce = $_POST['yatra_login_nonce'] ?? $_POST['nonce'] ?? '';
        if (!wp_verify_nonce($nonce, 'yatra_login_action') && !wp_verify_nonce($nonce, 'yatra_login_nonce')) {
            $this->logSecurityEvent('nonce_verification_failed', [
                'nonce' => substr($nonce, 0, 8) . '...',
                'ip' => $this->getClientIp()
            ]);
            
            wp_send_json_error([
                'success' => false,
                'code' => 'security_check_failed',
                'message' => __('Security check failed. Please refresh the page and try again.', 'yatra')
            ]);
        }

        // Validate request method
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            wp_send_json_error([
                'success' => false,
                'code' => 'invalid_method',
                'message' => __('Invalid request method.', 'yatra')
            ]);
        }

        // Get and sanitize form data
        $username = sanitize_user($_POST['log'] ?? $_POST['username'] ?? '');
        $password = $_POST['pwd'] ?? $_POST['password'] ?? '';
        $remember = isset($_POST['rememberme']) && $_POST['rememberme'] === 'forever';
        $redirect_to = $this->validateRedirectUrl($_POST['redirect_to'] ?? '');

        // Enhanced input validation
        $validation_result = $this->validateLoginInput($username, $password);
        if (!$validation_result['valid']) {
            wp_send_json_error([
                'success' => false,
                'code' => $validation_result['code'],
                'message' => $validation_result['message']
            ]);
        }

        // Log login attempt (security)
        $this->logLoginAttempt($username);

        // Attempt authentication with security checks
        $user = $this->authenticateUser($username, $password);

        if (is_wp_error($user)) {
            $this->handleAuthenticationError($user);
            return; // Exit early
        }

        // Additional security checks
        if (!$this->isUserAllowedToLogin($user)) {
            wp_send_json_error([
                'success' => false,
                'code' => 'user_not_allowed',
                'message' => __('Your account is not allowed to login. Please contact support.', 'yatra')
            ]);
        }

        // Successful login - set up secure session
        $this->setupUserSession($user, $remember);

        // Prepare secure success response
        $response_data = $this->prepareSuccessResponse($user, $redirect_to);

        // Send success response
        wp_send_json_success($response_data);
    }

    /**
     * Check rate limiting for login attempts
     */
    private function checkRateLimit(): void
    {
        $ip = $this->getClientIp();
        $transient_key = 'yatra_login_limit_' . md5($ip);
        $attempts = get_transient($transient_key) ?: 0;
        
        // Allow 5 attempts per 15 minutes
        if ($attempts >= 5) {
            $this->logSecurityEvent('rate_limit_exceeded', ['ip' => $ip]);
            wp_send_json_error([
                'success' => false,
                'code' => 'rate_limit_exceeded',
                'message' => __('Too many login attempts. Please try again in 15 minutes.', 'yatra')
            ]);
        }
        
        // Increment counter
        set_transient($transient_key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
    }

    /**
     * Validate login input
     */
    private function validateLoginInput(string $username, string $password): array
    {
        if (empty($username)) {
            return [
                'valid' => false,
                'code' => 'empty_username',
                'message' => __('Please enter your username or email.', 'yatra')
            ];
        }

        if (empty($password)) {
            return [
                'valid' => false,
                'code' => 'empty_password',
                'message' => __('Please enter your password.', 'yatra')
            ];
        }

        if (strlen($username) > 60) {
            return [
                'valid' => false,
                'code' => 'invalid_username_length',
                'message' => __('Username is too long.', 'yatra')
            ];
        }

        if (strlen($password) > 72) {
            return [
                'valid' => false,
                'code' => 'invalid_password_length',
                'message' => __('Password is too long.', 'yatra')
            ];
        }

        return ['valid' => true];
    }

    /**
     * Authenticate user with enhanced security
     */
    private function authenticateUser(string $username, string $password)
    {
        // Use WordPress authentication with additional security
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return $user;
        }

        // Check if user is verified (if email verification is required)
        if ($this->isEmailVerificationRequired() && !get_user_meta($user->ID, 'yatra_email_verified', true)) {
            return new WP_Error('email_not_verified', 
                __('Your email address has not been verified. Please check your email.', 'yatra')
            );
        }

        return $user;
    }

    /**
     * Handle authentication errors
     */
    private function handleAuthenticationError(WP_Error $error): void
    {
        $error_code = $error->get_error_code();
        $error_message = $error->get_error_message();
        
        // Log security events
        $this->logSecurityEvent('authentication_failed', [
            'error_code' => $error_code,
            'error_message' => $error_message
        ]);

        // Provide user-friendly error messages
        if (in_array($error_code, ['invalid_username', 'incorrect_password'], true)) {
            $error_message = __('Invalid username or password. Please try again.', 'yatra');
        } elseif ($error_code === 'email_not_verified') {
            $error_message = $error_message; // Use the specific message
        } else {
            $error_message = __('Login failed. Please try again.', 'yatra');
        }
        
        wp_send_json_error([
            'success' => false,
            'code' => $error_code,
            'message' => $error_message
        ]);
    }

    /**
     * Setup secure user session
     */
    private function setupUserSession(\WP_User $user, bool $remember): void
    {
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, $remember);
        
        // Update user metadata
        update_user_meta($user->ID, 'yatra_last_login', current_time('mysql'));
        update_user_meta($user->ID, 'yatra_last_login_ip', $this->getClientIp());
        
        // Clear failed login attempts
        $transient_key = 'yatra_login_limit_' . md5($this->getClientIp());
        delete_transient($transient_key);
    }

    /**
     * Prepare secure success response
     */
    private function prepareSuccessResponse(\WP_User $user, string $redirect_to): array
    {
        // Apply filter for custom redirect logic
        $redirect_url = apply_filters('yatra_login_redirect_url', $redirect_to, $user);
        
        return [
            'success' => true,
            'message' => __('Login successful! Redirecting...', 'yatra'),
            'user_id' => $user->ID,
            'user_login' => $user->user_login,
            'display_name' => $user->display_name,
            'redirect_url' => esc_url($redirect_url),
            'timestamp' => time()
        ];
    }

    /**
     * Validate redirect URL for security
     */
    private function validateRedirectUrl(string $redirect_url): string
    {
        if (empty($redirect_url)) {
            return home_url('/my-account');
        }

        $redirect_url = sanitize_url($redirect_url);
        
        // Validate URL is safe
        if (!wp_http_validate_url($redirect_url)) {
            return home_url('/my-account');
        }

        // Only allow redirects to same host
        $redirect_host = parse_url($redirect_url, PHP_URL_HOST);
        $site_host = parse_url(home_url(), PHP_URL_HOST);
        
        if ($redirect_host !== $site_host) {
            return home_url('/my-account');
        }

        return $redirect_url;
    }

    /**
     * Check if user is allowed to login
     */
    private function isUserAllowedToLogin(\WP_User $user): bool
    {
        // Check if user is active
        if (in_array('inactive', (array) $user->roles, true)) {
            return false;
        }

        // Apply additional checks via filter
        return apply_filters('yatra_user_allowed_to_login', true, $user);
    }

    /**
     * Check if email verification is required
     */
    private function isEmailVerificationRequired(): bool
    {
        return apply_filters('yatra_require_email_verification', false);
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

    /**
     * Log security events
     */
    private function logSecurityEvent(string $event, array $data = []): void
    {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $log_data = array_merge([
            'event' => $event,
            'timestamp' => current_time('mysql'),
            'ip' => $this->getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ], $data);

        error_log('Yatra Login Security: ' . json_encode($log_data));
    }

    /**
     * Log login attempts
     */
    private function logLoginAttempt(string $username): void
    {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        error_log('Yatra Login Attempt: ' . $username . ' from IP: ' . $this->getClientIp());
    }
}
