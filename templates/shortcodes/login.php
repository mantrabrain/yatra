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
$redirect_url = get_query_var('yatra_redirect_url', home_url('/' . \Yatra\Services\SettingsService::getAccountBase()));

// Generate unique form ID for this instance
$form_id = 'yatra-login-form-' . uniqid();

// Security nonce
$login_nonce = wp_create_nonce('yatra_login_nonce');

// Account CREATION is gated by Yatra's own setting — the same one the backend
// enforces (AuthController::register rejects registration when it is off). This
// deliberately does NOT use WordPress core's get_option('users_can_register'):
// Yatra registers customers via wp_create_user() directly, so the core toggle
// (off by default) is irrelevant and was previously hiding the register option
// entirely.
$registration_enabled = \Yatra\Services\SettingsService::isEnabled('customer_registration');

// Nonce reused by the inline register (REST) and forgot-password (AJAX) forms.
$auth_action_nonce = wp_create_nonce('yatra_login_action');
?>

<div class="yatra-login-shortcode" data-form-id="<?php echo esc_attr($form_id); ?>">
    <div class="yatra-login-container">
        <div class="yatra-login-header">
            <?php // Title + subtitle are kept in sync with the active panel by JS
                  // (each .yatra-auth-panel carries data-header-* copy). Rendered
                  // here with the login-state copy so there is no flash on load. ?>
            <h2 class="yatra-login-title"><?php echo esc_html($atts['title']); ?></h2>
            <p class="yatra-login-subtitle"<?php echo empty($atts['subtitle']) ? ' style="display:none;"' : ''; ?>><?php echo esc_html($atts['subtitle'] ?? ''); ?></p>
        </div>

        <div class="yatra-login-form-container">
          <?php if ($atts['show_register'] === 'yes' && $registration_enabled): ?>
          <div class="yatra-login-tabs" role="tablist" aria-label="<?php esc_attr_e('Login or create an account', 'yatra'); ?>">
              <button type="button" class="yatra-login-tab is-active" data-target="login" id="<?php echo esc_attr($form_id); ?>-tab-login" role="tab" aria-selected="true" aria-controls="<?php echo esc_attr($form_id); ?>-panel-login" tabindex="0">
                  <?php esc_html_e('Login', 'yatra'); ?>
              </button>
              <button type="button" class="yatra-login-tab" data-target="register" id="<?php echo esc_attr($form_id); ?>-tab-register" role="tab" aria-selected="false" aria-controls="<?php echo esc_attr($form_id); ?>-panel-register" tabindex="-1">
                  <?php esc_html_e('Sign Up', 'yatra'); ?>
              </button>
          </div>
          <?php endif; ?>

          <div class="yatra-auth-panel yatra-auth-panel-login" data-panel="login"
               data-header-title="<?php echo esc_attr($atts['title']); ?>"
               data-header-subtitle="<?php echo esc_attr($atts['subtitle'] ?? ''); ?>"
               data-footer-text="<?php echo esc_attr__('Your login information is secure and encrypted.', 'yatra'); ?>"<?php if ($atts['show_register'] === 'yes' && $registration_enabled): ?> id="<?php echo esc_attr($form_id); ?>-panel-login" role="tabpanel" aria-labelledby="<?php echo esc_attr($form_id); ?>-tab-login" tabindex="0"<?php endif; ?>>
            <form class="yatra-login-form" id="<?php echo esc_attr($form_id); ?>" method="post" action="" data-ajax="true">
                <?php wp_nonce_field('yatra_login_action', 'yatra_login_nonce', true, true); ?>
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-username" class="yatra-form-label">
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
                        pattern="([a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})|([a-zA-Z0-9._\\-]{3,20})"
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
                        title="<?php esc_attr_e('Enter your password', 'yatra'); ?>"
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
                    <?php // href kept as a no-JS fallback; JS intercepts to open the inline reset panel. ?>
                    <a href="<?php echo esc_url(wp_lostpassword_url()); ?>" class="yatra-link yatra-auth-switch" data-target="forgot">
                        <?php esc_html_e('Forgot your password?', 'yatra'); ?>
                    </a>
                </div>
            <?php endif; ?>

            <?php if ($atts['show_register'] === 'yes' && $registration_enabled): ?>
                <div class="yatra-register-prompt">
                    <p>
                        <?php esc_html_e("Don't have an account?", 'yatra'); ?>
                        <?php // href kept as a no-JS fallback; JS intercepts to switch to the register tab. ?>
                        <a href="<?php echo esc_url(wp_registration_url()); ?>" class="yatra-link yatra-link-bold yatra-auth-switch" data-target="register">
                            <?php esc_html_e('Sign up', 'yatra'); ?>
                        </a>
                    </p>
                </div>
            <?php endif; ?>

          </div><?php // .yatra-auth-panel-login ?>

            <?php if ($atts['show_register'] === 'yes' && $registration_enabled): ?>
          <div class="yatra-auth-panel yatra-auth-panel-register" data-panel="register"
               data-header-title="<?php echo esc_attr__('Create Account', 'yatra'); ?>"
               data-header-subtitle="<?php echo esc_attr__('Create an account to manage your bookings and travel updates.', 'yatra'); ?>"
               data-footer-text="<?php echo esc_attr__('Your details are secure and encrypted.', 'yatra'); ?>"
               id="<?php echo esc_attr($form_id); ?>-panel-register" role="tabpanel" aria-labelledby="<?php echo esc_attr($form_id); ?>-tab-register" tabindex="0" style="display: none;" aria-hidden="true">
            <form class="yatra-register-form" id="<?php echo esc_attr($form_id); ?>-register" method="post" action="" data-ajax="true" novalidate>
                <input type="hidden" name="yatra_login_nonce" value="<?php echo esc_attr($auth_action_nonce); ?>">
                <div class="yatra-form-row" style="display: flex; gap: 12px;">
                    <div class="yatra-form-group" style="flex: 1;">
                        <label for="<?php echo esc_attr($form_id); ?>-reg-first-name" class="yatra-form-label">
                            <?php esc_html_e('First Name', 'yatra'); ?>
                        </label>
                        <input type="text" id="<?php echo esc_attr($form_id); ?>-reg-first-name" name="first_name" class="yatra-form-input" required maxlength="60" autocomplete="given-name" placeholder="<?php esc_attr_e('Enter your first name', 'yatra'); ?>">
                    </div>
                    <div class="yatra-form-group" style="flex: 1;">
                        <label for="<?php echo esc_attr($form_id); ?>-reg-last-name" class="yatra-form-label">
                            <?php esc_html_e('Last Name', 'yatra'); ?>
                        </label>
                        <input type="text" id="<?php echo esc_attr($form_id); ?>-reg-last-name" name="last_name" class="yatra-form-input" required maxlength="60" autocomplete="family-name" placeholder="<?php esc_attr_e('Enter your last name', 'yatra'); ?>">
                    </div>
                </div>
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-reg-email" class="yatra-form-label">
                        <?php esc_html_e('Email', 'yatra'); ?>
                    </label>
                    <input type="email" id="<?php echo esc_attr($form_id); ?>-reg-email" name="email" class="yatra-form-input" required maxlength="100" autocomplete="email" placeholder="<?php esc_attr_e('you@example.com', 'yatra'); ?>">
                </div>
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-reg-phone" class="yatra-form-label">
                        <?php esc_html_e('Phone', 'yatra'); ?> <span style="color:#9ca3af; font-weight:400;">(<?php esc_html_e('optional', 'yatra'); ?>)</span>
                    </label>
                    <input type="tel" id="<?php echo esc_attr($form_id); ?>-reg-phone" name="phone" class="yatra-form-input" maxlength="30" autocomplete="tel" placeholder="<?php esc_attr_e('Enter your phone number', 'yatra'); ?>">
                </div>
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-reg-password" class="yatra-form-label">
                        <?php esc_html_e('Password', 'yatra'); ?>
                    </label>
                    <div class="yatra-password-input-group">
                        <input type="password" id="<?php echo esc_attr($form_id); ?>-reg-password" name="password" class="yatra-form-input" required minlength="8" autocomplete="new-password" placeholder="<?php esc_attr_e('Minimum 8 characters', 'yatra'); ?>">
                        <button type="button" class="yatra-password-toggle" aria-label="<?php esc_attr_e('Toggle password visibility', 'yatra'); ?>" data-target="<?php echo esc_attr($form_id); ?>-reg-password">
                            <?php echo yatra_svg_icon('eye', 'yatra-eye-icon'); ?>
                            <?php echo yatra_svg_icon('eye-off', 'yatra-eye-off-icon'); ?>
                        </button>
                    </div>
                </div>
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-reg-confirm-password" class="yatra-form-label">
                        <?php esc_html_e('Confirm Password', 'yatra'); ?>
                    </label>
                    <div class="yatra-password-input-group">
                        <input type="password" id="<?php echo esc_attr($form_id); ?>-reg-confirm-password" name="confirm_password" class="yatra-form-input" required minlength="8" autocomplete="new-password" placeholder="<?php esc_attr_e('Re-enter password', 'yatra'); ?>">
                        <button type="button" class="yatra-password-toggle" aria-label="<?php esc_attr_e('Toggle password visibility', 'yatra'); ?>" data-target="<?php echo esc_attr($form_id); ?>-reg-confirm-password">
                            <?php echo yatra_svg_icon('eye', 'yatra-eye-icon'); ?>
                            <?php echo yatra_svg_icon('eye-off', 'yatra-eye-off-icon'); ?>
                        </button>
                    </div>
                </div>
                <div class="yatra-form-actions">
                    <button type="submit" class="yatra-btn yatra-btn-primary yatra-btn-full">
                        <span class="yatra-btn-text"><?php esc_html_e('Create Account', 'yatra'); ?></span>
                        <span class="yatra-btn-loading" style="display: none;"><?php esc_html_e('Creating account...', 'yatra'); ?></span>
                    </button>
                </div>
            </form>
            <div class="yatra-register-prompt">
                <p>
                    <?php esc_html_e('Already have an account?', 'yatra'); ?>
                    <a href="#" class="yatra-link yatra-link-bold yatra-auth-switch" data-target="login">
                        <?php esc_html_e('Log in', 'yatra'); ?>
                    </a>
                </p>
            </div>
          </div><?php // .yatra-auth-panel-register ?>
            <?php endif; ?>

            <?php if ($atts['show_forgot_password'] === 'yes'): ?>
          <div class="yatra-auth-panel yatra-auth-panel-forgot" data-panel="forgot"
               data-header-title="<?php echo esc_attr__('Reset Password', 'yatra'); ?>"
               data-header-subtitle="<?php echo esc_attr__("Enter your email and we'll send you a link to reset your password.", 'yatra'); ?>"
               data-footer-text="<?php echo esc_attr__('Your request is secure and encrypted.', 'yatra'); ?>"
               role="region" aria-label="<?php esc_attr_e('Reset password', 'yatra'); ?>" style="display: none;" aria-hidden="true">
            <form class="yatra-forgot-form" id="<?php echo esc_attr($form_id); ?>-forgot" method="post" action="" data-ajax="true" novalidate>
                <input type="hidden" name="yatra_login_nonce" value="<?php echo esc_attr($auth_action_nonce); ?>">
                <div class="yatra-form-group">
                    <label for="<?php echo esc_attr($form_id); ?>-forgot-login" class="yatra-form-label">
                        <?php esc_html_e('Email or Username', 'yatra'); ?>
                    </label>
                    <input type="text" id="<?php echo esc_attr($form_id); ?>-forgot-login" name="user_login" class="yatra-form-input" required maxlength="100" autocomplete="username" placeholder="<?php esc_attr_e('Enter your email or username', 'yatra'); ?>">
                </div>
                <div class="yatra-form-actions">
                    <button type="submit" class="yatra-btn yatra-btn-primary yatra-btn-full">
                        <span class="yatra-btn-text"><?php esc_html_e('Send Reset Link', 'yatra'); ?></span>
                        <span class="yatra-btn-loading" style="display: none;"><?php esc_html_e('Sending...', 'yatra'); ?></span>
                    </button>
                </div>
            </form>
            <div class="yatra-register-prompt">
                <p>
                    <a href="#" class="yatra-link yatra-auth-switch" data-target="login">
                        <?php esc_html_e('Back to login', 'yatra'); ?>
                    </a>
                </p>
            </div>
          </div><?php // .yatra-auth-panel-forgot ?>
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
