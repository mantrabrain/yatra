<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

use Yatra\Services\SettingsService;

/**
 * Login Shortcode
 *
 * Displays customer login form
 */
class LoginShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_login', [
            'show_register' => 'yes',
            'show_forgot_password' => 'yes',
            'redirect_url' => '',
            'remember_me' => 'yes',
            'title' => 'Customer Login',
            'subtitle' => 'Login to access your bookings and account'
        ]);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Enqueue shortcode-specific assets
     */
    public function enqueueAssets(): void
    {
        // Only enqueue assets if shortcode is present on the page
        global $post;
        if (!$post || !has_shortcode($post->post_content, 'yatra_login') && !is_page_template('login-page.php')) {
            return;
        }

        // Enqueue CSS
        wp_enqueue_style(
            'yatra-login-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/login-shortcode.css',
            [],
            YATRA_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'yatra-login-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/login-shortcode.js',
            ['jquery', 'wp-i18n'],
            YATRA_VERSION,
            true
        );
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations(
                'yatra-login-shortcode',
                'yatra',
                YATRA_PLUGIN_PATH . 'i18n/languages'
            );
        }

        // Localize script for AJAX with security and debugging
        wp_localize_script('yatra-login-shortcode', 'yatra_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_login_nonce'),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'strings' => [
                'login_error' => __('Login failed. Please try again.', 'yatra'),
                'network_error' => __('Network error. Please check your connection.', 'yatra'),
                'validation_error' => __('Please fill in all required fields.', 'yatra')
            ]
        ]);
    }

    /**
     * Render the login shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Sanitize and validate attributes
        $atts = $this->sanitizeAttributes($atts);
        
        // Check if user is already logged in
        if (is_user_logged_in()) {
            return $this->renderLoggedInMessage($atts);
        }
        
        // Set secure redirect URL
        $redirect_url = $this->getSecureRedirectUrl($atts['redirect_url']);
        
        // Make variables available to template
        set_query_var('yatra_login_atts', $atts);
        set_query_var('yatra_redirect_url', $redirect_url);
        
        // Load the login template with error handling
        $template_path = YATRA_PLUGIN_PATH . 'templates/shortcodes/login.php';
        
        if (!file_exists($template_path)) {
            return $this->renderFallbackError();
        }
        
        ob_start();
        try {
            include $template_path;
            $content = ob_get_clean();
        } catch (\Exception $e) {
            ob_end_clean();

            $content = $this->renderFallbackError();
        }
        
        // Clean up query vars
        set_query_var('yatra_login_atts', null);
        set_query_var('yatra_redirect_url', null);
        
        return $content;
    }

    /**
     * Render message for logged in users
     */
    private function renderLoggedInMessage(array $atts): string
    {
        $user = wp_get_current_user();
        $account_url = home_url('/' . SettingsService::getAccountBase());
        
        ob_start();
        ?>
        <div class="yatra-login-logged-in">
            <div class="yatra-logged-in-content">
                <div class="yatra-logged-in-icon">
                    <?php echo yatra_svg_icon('user', 'yatra-logged-in-icon-svg'); ?>
                </div>
                <h3><?php esc_html_e('Already Logged In', 'yatra'); ?></h3>
                <p>
                    <?php 
                    printf(
                        esc_html__('You are logged in as %s.', 'yatra'),
                        '<strong>' . esc_html($user->display_name) . '</strong>'
                    );
                    ?>
                </p>
                <div class="yatra-logged-in-actions">
                    <a href="<?php echo esc_url($account_url); ?>" class="yatra-btn yatra-btn-primary">
                        <?php esc_html_e('My Account', 'yatra'); ?>
                    </a>
                    <a href="<?php echo esc_url(wp_logout_url(get_permalink())); ?>" class="yatra-btn yatra-btn-outline">
                        <?php esc_html_e('Logout', 'yatra'); ?>
                    </a>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Sanitize and validate shortcode attributes
     */
    private function sanitizeAttributes(array $atts): array
    {
        return [
            'show_register' => in_array($atts['show_register'], ['yes', 'no'], true) ? $atts['show_register'] : 'yes',
            'show_forgot_password' => in_array($atts['show_forgot_password'], ['yes', 'no'], true) ? $atts['show_forgot_password'] : 'yes',
            'redirect_url' => sanitize_url($atts['redirect_url'] ?? ''),
            'remember_me' => in_array($atts['remember_me'], ['yes', 'no'], true) ? $atts['remember_me'] : 'yes',
            'title' => sanitize_text_field($atts['title'] ?? 'Customer Login'),
            'subtitle' => sanitize_text_field($atts['subtitle'] ?? 'Login to access your bookings and account')
        ];
    }

    /**
     * Get secure redirect URL
     */
    private function getSecureRedirectUrl(string $redirect_url): string
    {
        if (!empty($redirect_url)) {
            // Validate URL is safe
            if (wp_http_validate_url($redirect_url)) {
                $redirect_host = parse_url($redirect_url, PHP_URL_HOST);
                $site_host = parse_url(home_url(), PHP_URL_HOST);
                
                // Only allow redirects to same host
                if ($redirect_host === $site_host) {
                    return $redirect_url;
                }
            }
        }
        
        // Default: always send users to the account area after login.
        // Avoid wp_get_referer() here to prevent redirect loops back to the login form.
        return home_url('/' . SettingsService::getAccountBase());
    }

    /**
     * Render fallback error message
     */
    private function renderFallbackError(): string
    {
        ob_start();
        ?>
        <div class="yatra-login-error">
            <p><?php esc_html_e('Login form is currently unavailable. Please try again later.', 'yatra'); ?></p>
        </div>
        <?php
        return ob_get_clean();
    }
}
