<?php
/**
 * Setup Wizard - Theme Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

// Check if Resa theme is installed
$resa_theme = wp_get_theme('resa');
$is_resa_installed = $resa_theme->exists();
$is_resa_active = get_template() === 'resa';
?>

<div class="yatra-setup-step yatra-setup-theme">
    <form method="post">
        <?php wp_nonce_field('yatra-setup'); ?>
        
        <div class="yatra-setup-step-content">
            <h2><?php esc_html_e('Choose Your Theme', 'yatra'); ?></h2>
            <p class="yatra-setup-description">
                <?php esc_html_e('Select a theme optimized for travel booking websites. We recommend Resa - a beautiful, modern theme designed specifically for Yatra.', 'yatra'); ?>
            </p>

            <div class="yatra-theme-options">
                <!-- Resa Theme - Recommended -->
                <div class="yatra-theme-option yatra-theme-recommended">
                    <div class="yatra-theme-badge">
                        <span class="dashicons dashicons-star-filled"></span>
                        <?php esc_html_e('Recommended', 'yatra'); ?>
                    </div>
                    
                    <div class="yatra-theme-preview">
                        <img src="<?php echo esc_url(YATRA_PLUGIN_URI . 'assets/images/resa-theme-preview.jpg'); ?>" 
                             alt="<?php esc_attr_e('Resa Theme', 'yatra'); ?>"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23667eea%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2224%22 fill=%22white%22%3EResa Theme%3C/text%3E%3C/svg%3E'">
                    </div>
                    
                    <div class="yatra-theme-details">
                        <h3><?php esc_html_e('Resa - Travel Booking Theme', 'yatra'); ?></h3>
                        <p class="yatra-theme-description">
                            <?php esc_html_e('A modern, responsive WordPress theme built specifically for travel agencies and trip operators. Features beautiful trip listings, booking forms, and seamless Yatra integration.', 'yatra'); ?>
                        </p>
                        
                        <ul class="yatra-theme-features">
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Fully Responsive Design', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Optimized for Yatra Plugin', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Beautiful Trip Layouts', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Fast Loading & SEO Friendly', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('One-Click Demo Import', 'yatra'); ?></li>
                        </ul>

                        <?php if ($is_resa_active) : ?>
                            <div class="yatra-theme-status yatra-theme-active">
                                <span class="dashicons dashicons-yes-alt"></span>
                                <?php esc_html_e('Currently Active', 'yatra'); ?>
                            </div>
                        <?php elseif ($is_resa_installed) : ?>
                            <div class="yatra-theme-status yatra-theme-installed">
                                <span class="dashicons dashicons-download"></span>
                                <?php esc_html_e('Already Installed', 'yatra'); ?>
                            </div>
                        <?php else : ?>
                            <label class="yatra-theme-install-option">
                                <input type="checkbox" name="install_resa_theme" value="yes" checked>
                                <span><?php esc_html_e('Install Resa Theme (Free)', 'yatra'); ?></span>
                            </label>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Current Theme Option -->
                <div class="yatra-theme-option yatra-theme-current">
                    <div class="yatra-theme-preview">
                        <?php
                        $current_theme = wp_get_theme();
                        $screenshot = $current_theme->get_screenshot();
                        if ($screenshot) :
                        ?>
                            <img src="<?php echo esc_url($screenshot); ?>" alt="<?php echo esc_attr($current_theme->get('Name')); ?>">
                        <?php else : ?>
                            <div class="yatra-theme-no-preview">
                                <span class="dashicons dashicons-admin-appearance"></span>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="yatra-theme-details">
                        <h3><?php echo esc_html($current_theme->get('Name')); ?></h3>
                        <p class="yatra-theme-description">
                            <?php esc_html_e('Continue using your current theme. You can always switch to Resa later from the WordPress Appearance menu.', 'yatra'); ?>
                        </p>
                        
                        <div class="yatra-theme-status yatra-theme-active">
                            <span class="dashicons dashicons-yes-alt"></span>
                            <?php esc_html_e('Currently Active', 'yatra'); ?>
                        </div>
                    </div>
                </div>
            </div>

            <div class="yatra-setup-note">
                <strong><?php esc_html_e('Note:', 'yatra'); ?></strong>
                <?php esc_html_e('Resa theme is optimized for Yatra and provides the best user experience. You can preview and install it from WordPress.org themes directory.', 'yatra'); ?>
            </div>
        </div>

        <div class="yatra-setup-actions">
            <button type="submit" class="button button-primary button-large" name="save_step" value="theme">
                <?php esc_html_e('Continue', 'yatra'); ?>
            </button>
            <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="button button-large">
                <?php esc_html_e('Skip this step', 'yatra'); ?>
            </a>
        </div>
    </form>
</div>
