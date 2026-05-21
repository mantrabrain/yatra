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
            wp_die(__('Your session has expired. Please go back and try again.', 'yatra'));
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
        if (!\Yatra\Services\SettingsService::isEnabled('customer_registration')) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => __('New customer registration is disabled.', 'yatra'),
            ], 403);
        }

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
        $secure_token = (string) get_query_var('yatra_verify_email');
        if ($secure_token === '' && isset($_GET['yatra_verify_email'])) {
            $raw = wp_unslash($_GET['yatra_verify_email']);
            $secure_token = is_string($raw) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $raw) ?? '' : '';
        }

        if ($secure_token === '') {
            self::showVerificationError(__('Invalid verification link.', 'yatra'));

            return;
        }

        $previewToken = defined('YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN')
            ? (string) YATRA_EMAIL_VERIFICATION_PREVIEW_TOKEN
            : 'preview-verify-token';
        if ($secure_token === $previewToken) {
            self::showEmailVerificationPreviewNotice();

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

        // Idempotent path: the token+expiry are deleted as soon as a successful
        // verification completes (see below), so a second click on the same
        // link previously fell into the "Invalid or expired" branch and made
        // already-verified customers believe their account was broken. Detect
        // the prior-success state explicitly and reuse the success page so the
        // outcome is clear regardless of how many times the link is clicked.
        $already_verified = get_user_meta($user_id, 'yatra_email_verified', true) === '1';
        if ($already_verified) {
            self::showVerificationSuccess(true);
            return;
        }

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

        self::showVerificationSuccess(false);
        return;
    }

    /**
     * Send verification email
     */
    private static function sendVerificationEmail(int $_user_id, string $email, string $first_name, string $secure_token, bool $isResend = false): void
    {
        $verificationUrl = function_exists('yatra_get_email_verification_url')
            ? yatra_get_email_verification_url($secure_token)
            : home_url('/yatra-verify-email/' . rawurlencode($secure_token) . '/');

        $siteName = get_bloginfo('name');
        $introParagraph = $isResend
            ? sprintf(
                /* translators: %s: site name */
                __('You requested a new verification link for your account at %s. Click the button below to verify your email address.', 'yatra'),
                $siteName
            )
            : sprintf(
                /* translators: %s: site name */
                __('Thank you for registering at %s. Please verify your email address to activate your account.', 'yatra'),
                $siteName
            );

        $footerNote = $isResend
            ? __('If you did not request this email, you can ignore it.', 'yatra')
            : __('If you did not create this account, you can ignore this email.', 'yatra');

        $expiryNoticeHtml = esc_html(
            sprintf(
                /* translators: %d: hours until link expiry */
                __('This verification link expires in %d hours for your security.', 'yatra'),
                24
            )
        );

        \Yatra\Services\TransactionalEmailTemplateService::sendIfEnabled(
            \Yatra\Services\TransactionalEmailTemplateService::TYPE_CUSTOMER_EMAIL_VERIFICATION,
            $email,
            [
                'customer_first_name' => $first_name,
                'customer_name' => $first_name,
                'customer_email' => $email,
                'verification_link' => $verificationUrl,
                'intro_paragraph' => $introParagraph,
                'footer_note' => $footerNote,
                'expiry_notice_html' => $expiryNoticeHtml,
            ]
        );
    }

    /**
     * Show verification error page (hard-fail dead-end with a route back home).
     * Every string is translatable — operators run Yatra in many locales and
     * the pre-3.0.5 hardcoded "Verification Failed" heading was untranslatable.
     */
    private static function showVerificationError(string $message): void
    {
        $heading = esc_html__('Verification Failed', 'yatra');
        $cta = esc_html__('Go to Homepage', 'yatra');

        wp_die(
            '<div style="text-align: center; padding: 50px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">
                <h1 style="color: #dc2626; margin-bottom: 20px;">' . $heading . '</h1>
                <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">' . esc_html($message) . '</p>
                <a href="' . esc_url(home_url()) . '" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">' . $cta . '</a>
            </div>',
            __('Verification Failed', 'yatra'),
            ['response' => 400]
        );
    }

    /**
     * Render an unambiguous "email verified" confirmation page.
     *
     * The pre-3.0.5 flow silently 302-redirected to the checkout URL with a
     * `?email_verified=1` flag, relying on `booking-auth.php` to surface a
     * one-liner notice. That notice only renders when the auth form itself
     * renders (no booking session / logged-in user → notice never shown), so
     * customers regularly saw "nothing happened" after clicking the link.
     *
     * Now we render a dedicated success page with explicit confirmation, the
     * verified email-state, and a primary CTA back into the booking flow.
     * Idempotent: a second click on the same link reaches `$already=true`
     * and shows "Your email is already verified" instead of the misleading
     * "Invalid or expired link" error.
     *
     * @param bool $already True when the user has already been verified by an
     *                      earlier click on the same link (idempotent path).
     */
    private static function showVerificationSuccess(bool $already): void
    {
        $checkoutUrl = function_exists('yatra_get_checkout_url')
            ? yatra_get_checkout_url()
            : home_url('/');
        $continueUrl = add_query_arg(['email_verified' => '1'], $checkoutUrl);

        $heading = $already
            ? esc_html__('Email Already Verified', 'yatra')
            : esc_html__('Email Verified', 'yatra');
        $message = $already
            ? esc_html__('Your email address is already verified — no further action is needed. You can continue with your booking.', 'yatra')
            : esc_html__('Your email address has been verified successfully. You can now log in and continue with your booking.', 'yatra');
        $cta = esc_html__('Continue to Checkout', 'yatra');
        $homeCta = esc_html__('Go to Homepage', 'yatra');
        $title = $already
            ? __('Email Already Verified', 'yatra')
            : __('Email Verified', 'yatra');

        // Inline-only styling so the page renders correctly regardless of
        // theme stylesheet load order (wp_die() can fire before themes
        // enqueue their styles).
        $body = '<div style="text-align: center; padding: 50px 20px; max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">'
            . '<div style="display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 50%; background: #d1fae5; margin: 0 auto 24px;">'
            . '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            . '<polyline points="20 6 9 17 4 12"></polyline>'
            . '</svg>'
            . '</div>'
            . '<h1 style="color: #065f46; margin: 0 0 12px; font-size: 26px;">' . $heading . '</h1>'
            . '<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 28px;">' . $message . '</p>'
            . '<a href="' . esc_url($continueUrl) . '" style="display: inline-block; background: #059669; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">' . $cta . '</a>'
            . '<a href="' . esc_url(home_url()) . '" style="display: inline-block; color: #4b5563; padding: 12px 16px; text-decoration: none; font-weight: 500;">' . $homeCta . '</a>'
            . '</div>';

        wp_die($body, $title, ['response' => 200]);
    }

    /**
     * Inform users that the link is only for email template previews.
     */
    private static function showEmailVerificationPreviewNotice(): void
    {
        $body = '<div style="text-align: center; padding: 50px; max-width: 520px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">
                <h1 style="color: #1e40af; margin-bottom: 16px;">' . esc_html__('Sample verification link', 'yatra') . '</h1>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">' . esc_html__(
                    'This URL is used only in email previews and test messages. It does not verify an account. Use the link from your real verification email to activate your account.',
                    'yatra'
                ) . '</p>
                <a href="' . esc_url(home_url()) . '" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">' . esc_html__('Go to homepage', 'yatra') . '</a>
            </div>';

        wp_die(
            $body,
            __('Email verification (preview)', 'yatra'),
            ['response' => 200]
        );
    }
}

