<?php

declare(strict_types=1);

namespace Yatra\Controllers;

/**
 * Authentication Controller
 * Handles user registration, login, email verification for Yatra customers
 * 
 * @package Yatra
 */
class AuthController
{
    /**
     * Register REST API routes
     */
    public static function registerRoutes(): void
    {
        register_rest_route('yatra/v1', '/auth/login', [
            'methods' => 'POST',
            'callback' => [self::class, 'login'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('yatra/v1', '/auth/register', [
            'methods' => 'POST',
            'callback' => [self::class, 'register'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('yatra/v1', '/auth/resend-verification', [
            'methods' => 'POST',
            'callback' => [self::class, 'resendVerification'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Register Yatra Customer role
     */
    public static function registerCustomerRole(): void
    {
        if (!get_role('yatra_customer')) {
            add_role(
                'yatra_customer',
                __('Yatra Customer', 'yatra'),
                [
                    'read' => true,
                    'edit_posts' => false,
                    'delete_posts' => false,
                ]
            );
        }
    }

    /**
     * Block unverified users from WordPress login
     * 
     * @param \WP_User|\WP_Error|null $user
     * @param string $username
     * @param string $password
     * @return \WP_User|\WP_Error|null
     */
    public static function blockUnverifiedUserLogin($user, string $username, string $password)
    {
        if (is_wp_error($user)) {
            return $user;
        }

        if (!($user instanceof \WP_User)) {
            return $user;
        }

        $has_verification_token = get_user_meta($user->ID, 'yatra_verification_token', true);
        $email_verified = get_user_meta($user->ID, 'yatra_email_verified', true);
        
        $needs_verification = !empty($has_verification_token);
        
        if (!$needs_verification) {
            $meta_exists = metadata_exists('user', $user->ID, 'yatra_email_verified');
            $needs_verification = $meta_exists && !$email_verified;
        }
        
        if ($needs_verification) {
            $resend_url = add_query_arg([
                'action' => 'yatra_resend_verification',
                'email' => urlencode($user->user_email),
                '_wpnonce' => wp_create_nonce('yatra_resend_verification'),
            ], wp_login_url());
            
            $message = sprintf(
                /* translators: %s: resend verification link */
                __('<strong>Error:</strong> Please verify your email address before logging in. Check your inbox for the verification link. <br><br><a href="%s">Click here to resend verification email</a>', 'yatra'),
                esc_url($resend_url)
            );
            
            return new \WP_Error('email_not_verified', $message);
        }

        return $user;
    }

    /**
     * Handle resend verification from WordPress login page
     */
    public static function handleWpLoginResendVerification(): void
    {
        if (!isset($_GET['action']) || $_GET['action'] !== 'yatra_resend_verification') {
            return;
        }

        // Verify nonce
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce(sanitize_text_field($_GET['_wpnonce']), 'yatra_resend_verification')) {
            wp_die(__('Security check failed. Please try again.', 'yatra'));
        }

        $email = isset($_GET['email']) ? sanitize_email(urldecode($_GET['email'])) : '';
        
        if (empty($email) || !is_email($email)) {
            wp_safe_redirect(add_query_arg('login_error', 'invalid_email', wp_login_url()));
            exit;
        }

        $user = get_user_by('email', $email);
        
        if (!$user) {
            // Redirect with generic success message (don't reveal if email exists)
            wp_safe_redirect(add_query_arg('checkemail', 'resent', wp_login_url()));
            exit;
        }

        // Check if already verified
        $email_verified = get_user_meta($user->ID, 'yatra_email_verified', true);
        if ($email_verified === '1') {
            wp_safe_redirect(add_query_arg('login_error', 'already_verified', wp_login_url()));
            exit;
        }

        // Check rate limiting
        $last_sent = get_user_meta($user->ID, 'yatra_verification_last_sent', true);
        if ($last_sent && (time() - (int) $last_sent) < 120) {
            $remaining = 120 - (time() - (int) $last_sent);
            wp_safe_redirect(add_query_arg([
                'login_error' => 'rate_limited',
                'wait' => $remaining,
            ], wp_login_url()));
            exit;
        }

        // Generate new token and send email
        $verification_token = wp_generate_password(32, false);
        $secure_token = base64_encode($user->ID . '|' . $verification_token . '|' . time());
        $secure_token = str_replace(['+', '/', '='], ['-', '_', ''], $secure_token);
        
        update_user_meta($user->ID, 'yatra_verification_token', $verification_token);
        update_user_meta($user->ID, 'yatra_verification_token_expiry', time() + (24 * 60 * 60));
        update_user_meta($user->ID, 'yatra_verification_last_sent', time());

        // Send email
        $first_name = get_user_meta($user->ID, 'first_name', true) ?: $user->display_name;
        self::sendVerificationEmail($user->ID, $email, $first_name, $secure_token, true);

        wp_safe_redirect(add_query_arg('checkemail', 'resent', wp_login_url()));
        exit;
    }

    /**
     * Add custom messages to WordPress login page
     */
    public static function customLoginMessages(string $message): string
    {
        if (isset($_GET['checkemail']) && $_GET['checkemail'] === 'resent') {
            $message = '<p class="message">' . __('A new verification link has been sent to your email address. Please check your inbox and spam folder.', 'yatra') . '</p>';
        }
        
        if (isset($_GET['email_verified']) && $_GET['email_verified'] === '1') {
            $message = '<p class="message">' . __('Your email has been verified successfully! You can now log in.', 'yatra') . '</p>';
        }
        
        return $message;
    }

    /**
     * Add custom error messages to WordPress login page
     */
    public static function customLoginErrors(\WP_Error $errors): \WP_Error
    {
        if (isset($_GET['login_error'])) {
            switch ($_GET['login_error']) {
                case 'invalid_email':
                    $errors->add('invalid_email', __('<strong>Error:</strong> Invalid email address.', 'yatra'));
                    break;
                case 'already_verified':
                    $errors->add('already_verified', __('<strong>Notice:</strong> Your email is already verified. Please log in.', 'yatra'));
                    break;
                case 'rate_limited':
                    $wait = isset($_GET['wait']) ? (int) $_GET['wait'] : 120;
                    $errors->add('rate_limited', sprintf(
                        /* translators: %d: number of seconds to wait */
                        __('<strong>Error:</strong> Please wait %d seconds before requesting another verification email.', 'yatra'),
                        $wait
                    ));
                    break;
            }
        }
        
        return $errors;
    }

    /**
     * Handle login request
     */
    public static function login(\WP_REST_Request $request): \WP_REST_Response
    {
        $username = sanitize_user($request->get_param('username') ?? '');
        $password = $request->get_param('password') ?? '';
        $remember = !empty($request->get_param('remember'));

        if (empty($username) || empty($password)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please enter your username/email and password.', 'yatra'),
            ], 400);
        }

        // Get user to check verification status
        $user_check = get_user_by('login', $username);
        if (!$user_check) {
            $user_check = get_user_by('email', $username);
        }

        // Check email verification for Yatra users
        if ($user_check) {
            $has_verification_token = get_user_meta($user_check->ID, 'yatra_verification_token', true);
            $email_verified = get_user_meta($user_check->ID, 'yatra_email_verified', true);
            
            if (!empty($has_verification_token)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => __('Please verify your email address before logging in. Check your inbox for the verification link.', 'yatra'),
                    'needs_verification' => true,
                    'email' => $user_check->user_email,
                ], 403);
            }
            
            $meta_exists = metadata_exists('user', $user_check->ID, 'yatra_email_verified');
            if ($meta_exists && !$email_verified) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => __('Please verify your email address before logging in. Check your inbox for the verification link.', 'yatra'),
                    'needs_verification' => true,
                    'email' => $user_check->user_email,
                ], 403);
            }
        }

        // Authenticate
        $user = wp_signon([
            'user_login' => $username,
            'user_password' => $password,
            'remember' => $remember,
        ], is_ssl());

        if (is_wp_error($user)) {
            $error_message = wp_strip_all_tags($user->get_error_message());
            if (strpos($error_message, 'incorrect') !== false || strpos($error_message, 'Invalid') !== false) {
                $error_message = __('Invalid username/email or password. Please try again.', 'yatra');
            }
            return new \WP_REST_Response([
                'success' => false,
                'message' => $error_message,
            ], 401);
        }

        wp_set_current_user($user->ID);

        return new \WP_REST_Response([
            'success' => true,
            'message' => __('Login successful! Redirecting...', 'yatra'),
            'user_id' => $user->ID,
        ]);
    }

    /**
     * Handle registration request
     */
    public static function register(\WP_REST_Request $request): \WP_REST_Response
    {
        $first_name = sanitize_text_field($request->get_param('first_name') ?? '');
        $last_name = sanitize_text_field($request->get_param('last_name') ?? '');
        $email = sanitize_email($request->get_param('email') ?? '');
        $phone = sanitize_text_field($request->get_param('phone') ?? '');
        $password = $request->get_param('password') ?? '';
        $confirm_password = $request->get_param('confirm_password') ?? '';

        // Validation
        if (empty($first_name)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please enter your first name.', 'yatra'),
            ], 400);
        }

        if (empty($last_name)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please enter your last name.', 'yatra'),
            ], 400);
        }

        if (empty($email) || !is_email($email)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please enter a valid email address.', 'yatra'),
            ], 400);
        }

        if (empty($password) || strlen($password) < 8) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Password must be at least 8 characters long.', 'yatra'),
            ], 400);
        }

        if ($password !== $confirm_password) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Passwords do not match.', 'yatra'),
            ], 400);
        }

        if (email_exists($email)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('An account with this email already exists. Please login instead.', 'yatra'),
            ], 409);
        }

        // Generate username
        $username = sanitize_user(current(explode('@', $email)));
        $original_username = $username;
        $counter = 1;
        
        while (username_exists($username)) {
            $username = $original_username . $counter;
            $counter++;
        }

        // Create user
        $user_id = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            $error_message = wp_strip_all_tags($user_id->get_error_message());
            return new \WP_REST_Response([
                'success' => false,
                'message' => $error_message,
            ], 500);
        }

        // Assign Yatra Customer role
        $user = new \WP_User($user_id);
        $user->set_role('yatra_customer');

        // Update user meta
        wp_update_user([
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => $first_name . ' ' . $last_name,
        ]);

        if (!empty($phone)) {
            update_user_meta($user_id, 'billing_phone', $phone);
            update_user_meta($user_id, 'phone', $phone);
        }

        // Email verification
        update_user_meta($user_id, 'yatra_email_verified', '0');
        
        $verification_token = wp_generate_password(32, false);
        $secure_token = base64_encode($user_id . '|' . $verification_token . '|' . time());
        $secure_token = str_replace(['+', '/', '='], ['-', '_', ''], $secure_token);
        
        update_user_meta($user_id, 'yatra_verification_token', $verification_token);
        update_user_meta($user_id, 'yatra_verification_token_expiry', time() + (24 * 60 * 60));

        // Send verification email
        self::sendVerificationEmail($user_id, $email, $first_name, $secure_token);

        // Admin notification
        wp_new_user_notification($user_id, null, 'admin');

        return new \WP_REST_Response([
            'success' => true,
            'message' => __('Registration successful! Please check your email to verify your account before logging in.', 'yatra'),
            'user_id' => $user_id,
            'require_verification' => true,
        ]);
    }

    /**
     * Handle resend verification request
     */
    public static function resendVerification(\WP_REST_Request $request): \WP_REST_Response
    {
        $email = sanitize_email($request->get_param('email') ?? '');

        if (empty($email) || !is_email($email)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please enter a valid email address.', 'yatra'),
            ], 400);
        }

        $user = get_user_by('email', $email);
        
        if (!$user) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => __('If an account with this email exists and is pending verification, a new verification link has been sent.', 'yatra'),
            ]);
        }

        $email_verified = get_user_meta($user->ID, 'yatra_email_verified', true);
        
        if ($email_verified === '1' || $email_verified === 1 || $email_verified === true) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('This email is already verified. You can login now.', 'yatra'),
            ], 400);
        }

        $meta_exists = metadata_exists('user', $user->ID, 'yatra_email_verified');
        $has_verification_token = get_user_meta($user->ID, 'yatra_verification_token', true);
        
        if (!$meta_exists && empty($has_verification_token)) {
            return new \WP_REST_Response([
                'success' => true,
                'message' => __('If an account with this email exists and is pending verification, a new verification link has been sent.', 'yatra'),
            ]);
        }

        // Rate limiting
        $last_sent = get_user_meta($user->ID, 'yatra_verification_last_sent', true);
        if ($last_sent && (time() - (int) $last_sent) < 120) {
            $remaining = 120 - (time() - (int) $last_sent);
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('Please wait before requesting another verification email.', 'yatra'),
                'rate_limited' => true,
                'remaining_seconds' => $remaining,
            ], 429);
        }

        // Generate new token
        $verification_token = wp_generate_password(32, false);
        $secure_token = base64_encode($user->ID . '|' . $verification_token . '|' . time());
        $secure_token = str_replace(['+', '/', '='], ['-', '_', ''], $secure_token);
        
        update_user_meta($user->ID, 'yatra_verification_token', $verification_token);
        update_user_meta($user->ID, 'yatra_verification_token_expiry', time() + (24 * 60 * 60));
        update_user_meta($user->ID, 'yatra_verification_last_sent', time());

        // Send email
        $first_name = get_user_meta($user->ID, 'first_name', true) ?: $user->display_name;
        self::sendVerificationEmail($user->ID, $email, $first_name, $secure_token, true);

        return new \WP_REST_Response([
            'success' => true,
            'message' => __('A new verification link has been sent to your email address. Please check your inbox.', 'yatra'),
        ]);
    }

    /**
     * Handle email verification
     */
    public static function handleEmailVerification(): void
    {
        $secure_token = get_query_var('yatra_verify_email');
        
        if (empty($secure_token)) {
            return;
        }

        // Decode token
        $secure_token = str_replace(['-', '_'], ['+', '/'], $secure_token);
        $decoded = base64_decode($secure_token);
        
        if (!$decoded || strpos($decoded, '|') === false) {
            self::showVerificationError(__('Invalid verification link.', 'yatra'));
            return;
        }
        
        $parts = explode('|', $decoded);
        if (count($parts) < 2) {
            self::showVerificationError(__('Invalid verification link.', 'yatra'));
            return;
        }
        
        $user_id = (int) $parts[0];
        $token = $parts[1];
        
        if ($user_id <= 0 || empty($token)) {
            self::showVerificationError(__('Invalid verification link.', 'yatra'));
            return;
        }
        
        $stored_token = get_user_meta($user_id, 'yatra_verification_token', true);
        $token_expiry = get_user_meta($user_id, 'yatra_verification_token_expiry', true);
        
        if (empty($stored_token) || $stored_token !== $token) {
            self::showVerificationError(__('Invalid or expired verification link.', 'yatra'));
            return;
        }
        
        if ($token_expiry && time() > (int) $token_expiry) {
            self::showVerificationError(__('This verification link has expired. Please register again.', 'yatra'));
            return;
        }
        
        // Mark as verified
        update_user_meta($user_id, 'yatra_email_verified', '1');
        delete_user_meta($user_id, 'yatra_verification_token');
        delete_user_meta($user_id, 'yatra_verification_token_expiry');
        
        $redirect_url = add_query_arg(['email_verified' => '1'], yatra_get_checkout_url());
        wp_safe_redirect($redirect_url);
        exit;
    }

    /**
     * Send verification email
     */
    private static function sendVerificationEmail(int $user_id, string $email, string $first_name, string $secure_token, bool $isResend = false): void
    {
        $verification_url = home_url('/yatra-verify-email/' . $secure_token . '/');
        $site_name = get_bloginfo('name');
        $subject = sprintf(__('[%s] Please verify your email address', 'yatra'), $site_name);
        
        $intro = $isResend 
            ? __("You requested a new verification link for your account at %s.", 'yatra')
            : __("Thank you for registering at %s.", 'yatra');
        
        $message = sprintf(
            __("Hello %s,\n\n" . $intro . "\n\nPlease click the link below to verify your email address:\n\n%s\n\nThis link will expire in 24 hours.\n\nIf you did not " . ($isResend ? "request this" : "create this account") . ", please ignore this email.\n\nBest regards,\n%s", 'yatra'),
            $first_name,
            $site_name,
            $verification_url,
            $site_name
        );

        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        wp_mail($email, $subject, $message, $headers);
    }

    /**
     * Show verification error page
     */
    private static function showVerificationError(string $message): void
    {
        wp_die(
            '<div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">
                <h1 style="color: #dc2626; margin-bottom: 20px;">Verification Failed</h1>
                <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">' . esc_html($message) . '</p>
                <a href="' . esc_url(home_url()) . '" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Homepage</a>
            </div>',
            __('Verification Failed', 'yatra'),
            ['response' => 400]
        );
    }
}

