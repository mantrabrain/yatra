<?php
/**
 * Free vs Pro Comparison Page
 *
 * @package Yatra
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}
?>

<div class="wrap yatra-free-vs-pro">
    <div class="yatra-free-vs-pro-header">
        <h1><?php echo esc_html__('Free vs Pro Comparison', 'yatra'); ?></h1>
        <p><?php echo esc_html__('Compare the features available in Yatra Free vs Yatra Pro to make the best choice for your travel business.', 'yatra'); ?></p>
    </div>

    <div class="yatra-comparison-table">
        <div class="yatra-comparison-header">
            <div class="yatra-plan-column">
                <h2><?php echo esc_html__('Features', 'yatra'); ?></h2>
            </div>
            <div class="yatra-plan-column yatra-free-plan">
                <div class="yatra-plan-header">
                    <h3><?php echo esc_html__('Free', 'yatra'); ?></h3>
                    <div class="yatra-plan-price">
                        <span class="yatra-price">$0</span>
                        <span class="yatra-period"><?php echo esc_html__('Forever', 'yatra'); ?></span>
                    </div>
                </div>
            </div>
            <div class="yatra-plan-column yatra-pro-plan">
                <div class="yatra-plan-header">
                    <h3><?php echo esc_html__('Pro', 'yatra'); ?></h3>
                    <div class="yatra-plan-price">
                        <span class="yatra-price">$99</span>
                        <span class="yatra-period"><?php echo esc_html__('/year', 'yatra'); ?></span>
                    </div>
                    <div class="yatra-plan-badge">
                        <span><?php echo esc_html__('Most Popular', 'yatra'); ?></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="yatra-comparison-body">
            <!-- Core Features -->
            <div class="yatra-feature-category">
                <h4><?php echo esc_html__('Core Features', 'yatra'); ?></h4>
                
                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Tour Management', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Create and manage unlimited tour packages with detailed information', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Booking System', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Complete booking management with availability calendar', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Customer Management', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Manage customer accounts and booking history', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Basic Email Notifications', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Automated email notifications for bookings', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('PayPal Integration', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Accept PayPal payments for tour bookings', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>
            </div>

            <!-- Payment Features -->
            <div class="yatra-feature-category">
                <h4><?php echo esc_html__('Payment Gateways', 'yatra'); ?></h4>
                
                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Stripe Payment Gateway', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Accept credit card payments securely', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Authorize.Net Gateway', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Enterprise-level payment processing', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Razorpay Gateway', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Indian payment gateway integration', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('2Checkout Gateway', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Global payment processing solution', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Square Payment Gateway', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Point-of-sale payment integration', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>
            </div>

            <!-- Advanced Features -->
            <div class="yatra-feature-category">
                <h4><?php echo esc_html__('Advanced Features', 'yatra'); ?></h4>
                
                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Partial Payment', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Allow customers to pay in installments', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Availability Conditions', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Set custom rules for tour availability', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Services Management', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Add extra services to tour packages', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                                            <div class="yatra-feature-row">
                                <div class="yatra-feature-name">
                                    <span><?php echo esc_html__('Downloads Management', 'yatra'); ?></span>
                                    <div class="yatra-feature-description"><?php echo esc_html__('Add downloaded items on the tour package', 'yatra'); ?></div>
                                </div>
                                <div class="yatra-feature-free">
                                    <span class="yatra-cross">✗</span>
                                </div>
                                <div class="yatra-feature-pro">
                                    <span class="yatra-check">✓</span>
                                </div>
                            </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Google Calendar Integration', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Sync bookings with Google Calendar', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Review & Rating System', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Collect and display customer reviews', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>
            </div>

            <!-- Support & License -->
            <div class="yatra-feature-category">
                <h4><?php echo esc_html__('Support & License', 'yatra'); ?></h4>
                
                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Community Support', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Get help from the WordPress community', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-check">✓</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>

                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('Priority Support', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Fast-track support from our expert team', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>



                <div class="yatra-feature-row">
                    <div class="yatra-feature-name">
                        <span><?php echo esc_html__('All Future Add-ons', 'yatra'); ?></span>
                        <div class="yatra-feature-description"><?php echo esc_html__('Access to all upcoming premium features', 'yatra'); ?></div>
                    </div>
                    <div class="yatra-feature-free">
                        <span class="yatra-cross">✗</span>
                    </div>
                    <div class="yatra-feature-pro">
                        <span class="yatra-check">✓</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="yatra-comparison-footer">
            <div class="yatra-plan-column">
                <div class="yatra-plan-action">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=yatra-settings')); ?>" class="button button-secondary">
                        <?php echo esc_html__('Continue with Free', 'yatra'); ?>
                    </a>
                </div>
            </div>
            <div class="yatra-plan-column yatra-free-plan">
                <div class="yatra-plan-action">
                    <span class="yatra-current-plan"><?php echo esc_html__('Current Plan', 'yatra'); ?></span>
                </div>
            </div>
            <div class="yatra-plan-column yatra-pro-plan">
                <div class="yatra-plan-action">
                    <a href="https://mantrabrain.com/checkout?edd_action=add_to_cart&download_id=36139&edd_options[price_id]=1" target="_blank" class="button button-primary yatra-upgrade-button">
                        <?php echo esc_html__('Upgrade to Pro', 'yatra'); ?>
                    </a>
                    <p class="yatra-upgrade-note"><?php echo esc_html__('7-day money-back guarantee', 'yatra'); ?></p>
                    <a href="https://wpyatra.com/pricing/" target="_blank" class="yatra-learn-more-link">
                        <?php echo esc_html__('Learn More', 'yatra'); ?>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="yatra-free-vs-pro-footer">
        <div class="yatra-footer-content">
            <h3><?php echo esc_html__('Still have questions?', 'yatra'); ?></h3>
            <p><?php echo esc_html__('Our team is here to help you choose the right plan for your business.', 'yatra'); ?></p>
            <div class="yatra-footer-actions">
                <a href="https://wpyatra.com/docs/?utm_campaign=freeplugin&utm_medium=admin-menu&utm_source=WordPress&utm_content=Free+vs+Pro" target="_blank" class="button button-secondary">
                    <?php echo esc_html__('View Documentation', 'yatra'); ?>
                </a>
                <a href="https://mantrabrain.com/contact/" target="_blank" class="button button-secondary">
                    <?php echo esc_html__('Contact Support', 'yatra'); ?>
                </a>
            </div>
        </div>
    </div>
</div>
