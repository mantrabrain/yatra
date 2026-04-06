<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * My Account Shortcode
 *
 * Renders the same React account UI as the virtual account route (see AccountPageHandler + account-page.php).
 * Use [yatra_my_account] on any page; legacy attributes are accepted for compatibility but do not change the React UI.
 */
class MyAccountShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_my_account', [
            'show_bookings' => 'yes',
            'show_profile' => 'yes',
            'show_wishlist' => 'yes',
            'bookings_limit' => '10',
        ]);
    }

    /**
     * Render the my account shortcode content (React mount only; same app as /account URL).
     */
    protected function renderContent(array $atts): string
    {
        shortcode_atts($this->default_attributes, $atts, $this->tag);

        if (!is_user_logged_in()) {
            return $this->renderLoginForm();
        }

        $yatra_account_react_embed = true;
        ob_start();
        require YATRA_PLUGIN_PATH . 'templates/partials/account-react-root.php';

        return (string) ob_get_clean();
    }

    /**
     * Render login form for non-logged in users
     */
    private function renderLoginForm(): string
    {
        $login_url = wp_login_url(get_permalink());
        $register_url = wp_registration_url();

        ob_start();
        ?>
        <div class="yatra-my-account-login">
            <div class="yatra-login-prompt">
                <h3><?php esc_html_e('Login to Your Account', 'yatra'); ?></h3>
                <p><?php esc_html_e('Please login to access your account dashboard, view bookings, and manage your wishlist.', 'yatra'); ?></p>

                <div class="yatra-login-actions">
                    <a href="<?php echo esc_url($login_url); ?>" class="yatra-btn yatra-btn-primary">
                        <?php esc_html_e('Login', 'yatra'); ?>
                    </a>
                    <?php if (get_option('users_can_register')): ?>
                        <a href="<?php echo esc_url($register_url); ?>" class="yatra-btn yatra-btn-secondary">
                            <?php esc_html_e('Register', 'yatra'); ?>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php

        return (string) ob_get_clean();
    }
}
