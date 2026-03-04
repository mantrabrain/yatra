<?php
/**
 * Login Shortcode Template
 * 
 * @package Yatra
 * @var array $atts Shortcode attributes
 * @var string $redirect_url Redirect URL after login
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get and validate variables
$atts = get_query_var('yatra_login_atts', []);
$redirect_url = get_query_var('yatra_redirect_url', home_url('/my-account'));

// Generate unique form ID for this instance
$form_id = 'yatra-login-form-' . uniqid();

// Security nonce
$login_nonce = wp_create_nonce('yatra_login_nonce');
?>

<div class="yatra-login-shortcode" data-form-id="<?php echo esc_attr($form_id); ?>">
    <div class="yatra-login-container">
        <div class="yatra-login-header">
            <h2 class="yatra-login-title"><?php echo esc_html($atts['title']); ?></h2>
            <?php if (!empty($atts['subtitle'])): ?>
                <p class="yatra-login-subtitle"><?php echo esc_html($atts['subtitle']); ?></p>
            <?php endif; ?>
        </div>

        <div class="yatra-login-form-container">
            <form class="yatra-login-form" id="<?php echo esc_attr($form_id); ?>" method="post" action="" data-ajax="true">
                <?php wp_nonce_field('yatra_login_action', 'yatra_login_nonce', true, true); ?>
                <div class="yatra-form-group">
                    <label for="yatra-login-username" class="yatra-form-label">
                        <?php esc_html_e('Email or Username', 'yatra'); ?>
                    </label>
                    <input 
                        type="text" 
                        id="<?php echo esc_attr($form_id); ?>-username" 
                        name="log" 
                        class="yatra-form-input" 
                        placeholder="<?php esc_attr_e('Enter your email or username', 'yatra'); ?>"
                        required
                        autocomplete="username"
                        maxlength="60"
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._-]{3,20}"
                        title="<?php esc_attr_e('Enter a valid email address or username', 'yatra'); ?>"
                    >
                </div>

                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-password" class="yatra-form-label">
                        <?php esc_html_e('Password', 'yatra'); ?>
                    </label>
                    <div class="yatra-password-input-group">
                        <input 
                            type="password" 
                            id="<?php echo esc_attr($form_id); ?>-password" 
                            name="pwd" 
                            class="yatra-form-input" 
                            placeholder="<?php esc_attr_e('Enter your password', 'yatra'); ?>"
                            required
                            autocomplete="current-password"
                            maxlength="72"
                            minlength="8"
                            title="<?php esc_attr_e('Password must be at least 8 characters long', 'yatra'); ?>"
                        >
                        <button type="button" class="yatra-password-toggle" aria-label="<?php esc_attr_e('Toggle password visibility', 'yatra'); ?>" data-target="<?php echo esc_attr($form_id); ?>-password">
                            <?php echo yatra_svg_icon('eye', 'yatra-eye-icon'); ?>
                            <?php echo yatra_svg_icon('eye-off', 'yatra-eye-off-icon'); ?>
                        </button>
                    </div>
                </div>

                <?php if ($atts['remember_me'] === 'yes'): ?>
                    <div class="yatra-form-group yatra-form-checkbox">
                        <div class="yatra-checkbox-wrapper">
                            <label class="yatra-checkbox-label" for="<?php echo esc_attr($form_id); ?>-remember">
                                <input type="checkbox" name="rememberme" id="<?php echo esc_attr($form_id); ?>-remember" value="forever">
                                <span class="yatra-checkbox-custom">
                                    <svg class="yatra-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                                <span class="yatra-checkbox-text"><?php esc_html_e('Remember me', 'yatra'); ?></span>
                            </label>
                        </div>
                    </div>
                <?php endif; ?>

                <div class="yatra-form-actions">
                    <button type="submit" class="yatra-btn yatra-btn-primary yatra-btn-full" id="<?php echo esc_attr($form_id); ?>-submit">
                        <span class="yatra-btn-text"><?php esc_html_e('Login', 'yatra'); ?></span>
                        <span class="yatra-btn-loading" style="display: none;">
                            <?php esc_html_e('Logging in...', 'yatra'); ?>
                        </span>
                    </button>
                </div>

                <input type="hidden" name="redirect_to" value="<?php echo esc_url($redirect_url); ?>">
                <input type="hidden" name="form_id" value="<?php echo esc_attr($form_id); ?>">
            </form>

            <?php if ($atts['show_forgot_password'] === 'yes'): ?>
                <div class="yatra-forgot-password">
                    <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" class="yatra-link">
                        <?php esc_html_e('Forgot your password?', 'yatra'); ?>
                    </a>
                </div>
            <?php endif; ?>

            <?php if ($atts['show_register'] === 'yes' && get_option('users_can_register')): ?>
                <div class="yatra-register-prompt">
                    <p>
                        <?php esc_html_e("Don't have an account?", 'yatra'); ?>
                        <a href="<?php echo esc_url(wp_registration_url()); ?>" class="yatra-link yatra-link-bold">
                            <?php esc_html_e('Sign up', 'yatra'); ?>
                        </a>
                    </p>
                </div>
            <?php endif; ?>
        </div>

        <div class="yatra-login-footer">
            <div class="yatra-login-security">
                <div class="yatra-security-icon">
                    <?php echo yatra_svg_icon('shield', 'yatra-security-icon-svg'); ?>
                </div>
                <p class="yatra-security-text">
                    <?php esc_html_e('Your login information is secure and encrypted.', 'yatra'); ?>
                </p>
            </div>
        </div>
    </div>
</div>
