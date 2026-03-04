<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * My Account Shortcode
 *
 * Displays customer account dashboard with bookings, profile, and preferences
 */
class MyAccountShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_my_account', [
            'show_bookings' => 'yes',
            'show_profile' => 'yes',
            'show_wishlist' => 'yes',
            'bookings_limit' => '10'
        ]);
    }

    /**
     * Render the my account shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            return $this->renderLoginForm();
        }
        
        // Get user data
        $user = wp_get_current_user();
        
        // Get user's bookings and wishlist
        $bookings = $this->getUserBookings($user->ID);
        $wishlist = $this->getUserWishlist($user->ID);
        
        // Prepare data for template
        $data = [
            'user' => $user,
            'bookings' => $bookings,
            'wishlist' => $wishlist,
            'atts' => $atts
        ];

        return $this->loadTemplate('shortcodes/my-account.php', $data);
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
        return ob_get_clean();
    }

    /**
     * Get user bookings
     */
    private function getUserBookings(int $user_id): array
    {
        // For now, return empty bookings array
        // In a real implementation, this would query the Yatra booking system
        return [];
    }

    /**
     * Get user wishlist
     */
    private function getUserWishlist(int $user_id): array
    {
        // For now, return empty wishlist array
        // In a real implementation, this would get from user meta
        return [];
    }
}
