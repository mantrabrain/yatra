<?php
/**
 * Booking Authentication Partial
 * Shows login/registration forms when user is not logged in
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

global $booking;
$trip = $booking->trip ?? null;
?>

<div class="yatra-booking-auth">
    <!-- Tab Navigation -->
    <div class="yatra-auth-tabs">
        <button type="button" class="yatra-auth-tab active" data-tab="login">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            <?php esc_html_e('Login', 'yatra'); ?>
        </button>
        <button type="button" class="yatra-auth-tab" data-tab="register">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            <?php esc_html_e('Register', 'yatra'); ?>
        </button>
    </div>

    <!-- Login Form -->
    <div class="yatra-auth-content" id="yatra-auth-login">
        <div class="yatra-auth-header">
            <h2><?php esc_html_e('Welcome Back', 'yatra'); ?></h2>
            <p><?php esc_html_e('Please login to continue with your booking.', 'yatra'); ?></p>
        </div>

        <?php if (isset($_GET['email_verified']) && $_GET['email_verified'] === '1') : ?>
            <div class="yatra-auth-message success" style="display: block; margin-bottom: 20px;">
                <?php esc_html_e('Your email has been verified successfully! You can now log in.', 'yatra'); ?>
            </div>
        <?php endif; ?>

        <form id="yatra-login-form" class="yatra-auth-form" method="post">
            
            <div class="yatra-form-group">
                <label for="yatra-login-email">
                    <?php esc_html_e('Email or Username', 'yatra'); ?>
                    <span class="required">*</span>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <input type="text" id="yatra-login-email" name="log" required placeholder="<?php esc_attr_e('Enter your email or username', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-form-group">
                <label for="yatra-login-password">
                    <?php esc_html_e('Password', 'yatra'); ?>
                    <span class="required">*</span>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    <input type="password" id="yatra-login-password" name="pwd" required placeholder="<?php esc_attr_e('Enter your password', 'yatra'); ?>">
                    <button type="button" class="yatra-toggle-password" tabindex="-1">
                        <svg class="eye-open" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <svg class="eye-closed" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="yatra-form-options">
                <label class="yatra-checkbox-label">
                    <input type="checkbox" name="rememberme" value="forever">
                    <span><?php esc_html_e('Remember me', 'yatra'); ?></span>
                </label>
                <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" class="yatra-forgot-link">
                    <?php esc_html_e('Forgot password?', 'yatra'); ?>
                </a>
            </div>

            <div class="yatra-auth-message" id="yatra-login-message" style="display:none;"></div>

            <button type="submit" class="yatra-auth-submit">
                <span class="btn-text"><?php esc_html_e('Login & Continue', 'yatra'); ?></span>
                <span class="btn-loading" style="display:none;">
                    <svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <?php esc_html_e('Logging in...', 'yatra'); ?>
                </span>
            </button>
        </form>

        <div class="yatra-auth-footer">
            <p><?php esc_html_e("Don't have an account?", 'yatra'); ?> 
                <button type="button" class="yatra-switch-tab" data-tab="register"><?php esc_html_e('Register now', 'yatra'); ?></button>
            </p>
        </div>
    </div>

    <!-- Registration Form -->
    <div class="yatra-auth-content" id="yatra-auth-register" style="display:none;">
        <div class="yatra-auth-header">
            <h2><?php esc_html_e('Create Account', 'yatra'); ?></h2>
            <p><?php esc_html_e('Register to book your trip and manage your bookings.', 'yatra'); ?></p>
        </div>

        <form id="yatra-register-form" class="yatra-auth-form" method="post">
            
            <div class="yatra-form-row">
                <div class="yatra-form-group">
                    <label for="yatra-reg-first-name">
                        <?php esc_html_e('First Name', 'yatra'); ?>
                        <span class="required">*</span>
                    </label>
                    <input type="text" id="yatra-reg-first-name" name="first_name" required placeholder="<?php esc_attr_e('John', 'yatra'); ?>">
                </div>
                <div class="yatra-form-group">
                    <label for="yatra-reg-last-name">
                        <?php esc_html_e('Last Name', 'yatra'); ?>
                        <span class="required">*</span>
                    </label>
                    <input type="text" id="yatra-reg-last-name" name="last_name" required placeholder="<?php esc_attr_e('Doe', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-form-group">
                <label for="yatra-reg-email">
                    <?php esc_html_e('Email Address', 'yatra'); ?>
                    <span class="required">*</span>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <input type="email" id="yatra-reg-email" name="email" required placeholder="<?php esc_attr_e('your@email.com', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-form-group">
                <label for="yatra-reg-phone">
                    <?php esc_html_e('Phone Number', 'yatra'); ?>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <input type="tel" id="yatra-reg-phone" name="phone" placeholder="<?php esc_attr_e('+1 234 567 8900', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-form-group">
                <label for="yatra-reg-password">
                    <?php esc_html_e('Password', 'yatra'); ?>
                    <span class="required">*</span>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    <input type="password" id="yatra-reg-password" name="password" required minlength="8" placeholder="<?php esc_attr_e('Minimum 8 characters', 'yatra'); ?>">
                    <button type="button" class="yatra-toggle-password" tabindex="-1">
                        <svg class="eye-open" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <svg class="eye-closed" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none;">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                    </button>
                </div>
                <div class="yatra-password-strength" id="yatra-password-strength"></div>
            </div>

            <div class="yatra-form-group">
                <label for="yatra-reg-confirm-password">
                    <?php esc_html_e('Confirm Password', 'yatra'); ?>
                    <span class="required">*</span>
                </label>
                <div class="yatra-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <input type="password" id="yatra-reg-confirm-password" name="confirm_password" required placeholder="<?php esc_attr_e('Re-enter your password', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-form-group">
                <label class="yatra-checkbox-label">
                    <input type="checkbox" name="terms" required>
                    <span>
                        <?php 
                        printf(
                            /* translators: %1$s: terms link, %2$s: privacy link */
                            esc_html__('I agree to the %1$s and %2$s', 'yatra'),
                            '<a href="' . esc_url(get_privacy_policy_url()) . '" target="_blank">' . esc_html__('Terms of Service', 'yatra') . '</a>',
                            '<a href="' . esc_url(get_privacy_policy_url()) . '" target="_blank">' . esc_html__('Privacy Policy', 'yatra') . '</a>'
                        ); 
                        ?>
                    </span>
                </label>
            </div>

            <div class="yatra-auth-message" id="yatra-register-message" style="display:none;"></div>

            <button type="submit" class="yatra-auth-submit">
                <span class="btn-text"><?php esc_html_e('Create Account & Continue', 'yatra'); ?></span>
                <span class="btn-loading" style="display:none;">
                    <svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <?php esc_html_e('Creating account...', 'yatra'); ?>
                </span>
            </button>
        </form>

        <div class="yatra-auth-footer">
            <p><?php esc_html_e('Already have an account?', 'yatra'); ?> 
                <button type="button" class="yatra-switch-tab" data-tab="login"><?php esc_html_e('Login here', 'yatra'); ?></button>
            </p>
        </div>
    </div>
</div>
