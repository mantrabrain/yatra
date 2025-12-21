<?php
/**
 * Setup Wizard - Complete Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;
?>

<div class="yatra-setup-step yatra-setup-complete">
    <form method="post">
        <?php wp_nonce_field('yatra-setup'); ?>
        
        <div class="yatra-setup-step-content">
            <div class="yatra-setup-complete-icon">
                <span class="dashicons dashicons-yes-alt"></span>
            </div>
            
            <h2><?php esc_html_e('Setup Complete!', 'yatra'); ?></h2>
            <p class="yatra-setup-description">
                <?php esc_html_e('Congratulations! Your Yatra travel booking site is now ready to go. Complete your setup with sample data and explore premium features.', 'yatra'); ?>
            </p>

            <!-- Sample Data Import -->
            <div class="yatra-setup-sample-data">
                <div class="yatra-setup-card">
                    <div class="yatra-setup-card-header">
                        <span class="dashicons dashicons-download"></span>
                        <h3><?php esc_html_e('Import Sample Data', 'yatra'); ?></h3>
                    </div>
                    <div class="yatra-setup-card-body">
                        <p><?php esc_html_e('Get started quickly with pre-configured trips, destinations, and sample content. Perfect for testing and learning how Yatra works.', 'yatra'); ?></p>
                        <ul class="yatra-sample-data-includes">
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('5 Sample Trips with Images', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Popular Destinations', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Activities & Categories', 'yatra'); ?></li>
                            <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Sample Reviews & Ratings', 'yatra'); ?></li>
                        </ul>
                        <label class="yatra-checkbox-label">
                            <input type="checkbox" name="import_sample_data" value="yes">
                            <span><?php esc_html_e('Yes, import sample data to get started quickly', 'yatra'); ?></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Premium Features -->
            <div class="yatra-setup-premium-features">
                <h3 class="yatra-premium-heading">
                    <span class="dashicons dashicons-star-filled"></span>
                    <?php esc_html_e('Unlock Premium Features', 'yatra'); ?>
                </h3>
                <p class="yatra-premium-description">
                    <?php esc_html_e('Take your travel booking business to the next level with Yatra Pro premium features:', 'yatra'); ?>
                </p>
                
                <div class="yatra-premium-features-grid">
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-chart-line"></span>
                        <h4><?php esc_html_e('Dynamic Pricing', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Adjust prices based on demand, season, and availability', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-tickets-alt"></span>
                        <h4><?php esc_html_e('Discount Coupons', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Create promotional codes and special offers', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-money-alt"></span>
                        <h4><?php esc_html_e('Partial Payments', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Allow customers to pay deposits and installments', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-email"></span>
                        <h4><?php esc_html_e('Email Notifications', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Automated booking confirmations and reminders', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-pdf"></span>
                        <h4><?php esc_html_e('PDF Invoices', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Generate professional invoices and vouchers', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-calendar-alt"></span>
                        <h4><?php esc_html_e('Google Calendar Sync', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Sync bookings with Google Calendar automatically', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-admin-multisite"></span>
                        <h4><?php esc_html_e('Multi-Currency', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Accept payments in multiple currencies', 'yatra'); ?></p>
                    </div>
                    <div class="yatra-premium-feature">
                        <span class="dashicons dashicons-analytics"></span>
                        <h4><?php esc_html_e('Advanced Reports', 'yatra'); ?></h4>
                        <p><?php esc_html_e('Detailed analytics and business insights', 'yatra'); ?></p>
                    </div>
                </div>

                <div class="yatra-premium-cta">
                    <a href="https://wpyatra.com/pricing" target="_blank" class="button button-primary button-large">
                        <span class="dashicons dashicons-star-filled"></span>
                        <?php esc_html_e('Upgrade to Yatra Pro', 'yatra'); ?>
                    </a>
                    <p class="yatra-premium-note">
                        <?php esc_html_e('30-day money-back guarantee • Priority support included', 'yatra'); ?>
                    </p>
                </div>
            </div>

        <div class="yatra-setup-next-steps">
            <div class="yatra-setup-next-step">
                <span class="dashicons dashicons-location-alt"></span>
                <div class="yatra-setup-next-step-content">
                    <h3><?php esc_html_e('Create Your First Trip', 'yatra'); ?></h3>
                    <p><?php esc_html_e('Start by adding your travel packages and tour offerings.', 'yatra'); ?></p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=yatra&subpage=trips')); ?>" class="button">
                        <?php esc_html_e('Add Trip', 'yatra'); ?>
                    </a>
                </div>
            </div>

            <div class="yatra-setup-next-step">
                <span class="dashicons dashicons-admin-settings"></span>
                <div class="yatra-setup-next-step-content">
                    <h3><?php esc_html_e('Configure Settings', 'yatra'); ?></h3>
                    <p><?php esc_html_e('Fine-tune your booking settings, payment gateways, and more.', 'yatra'); ?></p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=yatra&subpage=settings')); ?>" class="button">
                        <?php esc_html_e('Go to Settings', 'yatra'); ?>
                    </a>
                </div>
            </div>

            <div class="yatra-setup-next-step">
                <span class="dashicons dashicons-book"></span>
                <div class="yatra-setup-next-step-content">
                    <h3><?php esc_html_e('Read Documentation', 'yatra'); ?></h3>
                    <p><?php esc_html_e('Learn more about Yatra features and best practices.', 'yatra'); ?></p>
                    <a href="https://wpyatra.com/docs" target="_blank" class="button">
                        <?php esc_html_e('View Docs', 'yatra'); ?>
                    </a>
                </div>
            </div>

            <div class="yatra-setup-next-step">
                <span class="dashicons dashicons-star-filled"></span>
                <div class="yatra-setup-next-step-content">
                    <h3><?php esc_html_e('Upgrade to Pro', 'yatra'); ?></h3>
                    <p><?php esc_html_e('Unlock advanced features like dynamic pricing, coupons, and more.', 'yatra'); ?></p>
                    <a href="https://wpyatra.com/pricing" target="_blank" class="button button-primary">
                        <?php esc_html_e('View Pro Features', 'yatra'); ?>
                    </a>
                </div>
            </div>
        </div>

        <div class="yatra-setup-support">
            <h3><?php esc_html_e('Need Help?', 'yatra'); ?></h3>
            <p>
                <?php
                printf(
                    /* translators: 1: support URL, 2: documentation URL */
                    __('Visit our <a href="%1$s" target="_blank">support forum</a> or check out the <a href="%2$s" target="_blank">documentation</a> for help.', 'yatra'),
                    'https://wpyatra.com/support',
                    'https://wpyatra.com/docs'
                );
                ?>
            </p>
        </div>
    </div>

        </div>

        <div class="yatra-setup-actions">
            <button type="submit" class="button button-primary button-large" name="save_step" value="complete">
                <?php esc_html_e('Complete Setup', 'yatra'); ?>
            </button>
        </div>
    </form>
</div>
