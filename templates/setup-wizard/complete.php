<?php
/**
 * Setup Wizard - Complete Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="complete">
    
    <div class="wizard-header" style="text-align: center;">
        <div class="success-icon" style="margin: 0 auto;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>
        <h1 style="text-align: center;"><?php esc_html_e('Setup Complete!', 'yatra'); ?></h1>
        <p style="text-align: center;"><?php esc_html_e('Your travel booking system is ready to use', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="info-box" style="text-align: center; padding: 24px; margin-bottom: 32px;">
            <p style="font-size: 15px; color: #6b7280; margin: 0;"><?php esc_html_e('Your booking system is configured and ready. Here are the next steps to get started:', 'yatra'); ?></p>
        </div>

        <div class="action-buttons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; max-width: 700px; margin-left: auto; margin-right: auto;">
            <!-- Create First Trip -->
            <a href="<?php echo esc_url(admin_url('post-new.php?post_type=tour')); ?>" class="action-card" style="display: flex; flex-direction: column; align-items: center; padding: 24px; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#4f46e5'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111827;"><?php esc_html_e('Create Your First Trip', 'yatra'); ?></h3>
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;"><?php esc_html_e('Add destinations, pricing, and availability', 'yatra'); ?></p>
            </a>

            <!-- Setup Payment Gateway -->
            <a href="<?php echo esc_url(admin_url('admin.php?page=yatra&subpage=settings&tab=payment')); ?>" class="action-card" style="display: flex; flex-direction: column; align-items: center; padding: 24px; background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; text-decoration: none; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#10b981'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <div style="width: 48px; height: 48px; background: #f0fdf4; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                </div>
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #111827;"><?php esc_html_e('Setup Payment Gateway', 'yatra'); ?></h3>
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;"><?php esc_html_e('Configure payment methods to accept bookings', 'yatra'); ?></p>
            </a>
        </div>

        <!-- Import Sample Data Card -->
        <div style="max-width: 600px; margin: 0 auto 32px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 24px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #92400e;"><?php esc_html_e('Import Sample Data', 'yatra'); ?></h3>
            </div>
            <p style="margin: 0 0 20px; font-size: 14px; color: #78350f; line-height: 1.6;"><?php esc_html_e('Get started quickly with pre-configured demo trips, destinations, and sample bookings to explore all features.', 'yatra'); ?></p>
            <button type="button" onclick="if(confirm('<?php esc_attr_e('This will import sample trips, destinations, and bookings. Continue?', 'yatra'); ?>')) { this.form.submit(); }" name="import_sample_data" value="yes" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #f59e0b; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#d97706'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';" onmouseout="this.style.background='#f59e0b'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <?php esc_html_e('Import Sample Data', 'yatra'); ?>
            </button>
        </div>

        <div class="premium-box">
            <h3><?php esc_html_e('Upgrade to Yatra Pro', 'yatra'); ?></h3>
            <p><?php esc_html_e('Get advanced features to grow your travel business', 'yatra'); ?></p>
            
            <div class="premium-features">
                <div class="premium-feature">
                    <h4><?php esc_html_e('Dynamic Pricing', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Seasonal rates & discounts', 'yatra'); ?></p>
                </div>
                <div class="premium-feature">
                    <h4><?php esc_html_e('Email Notifications', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Automated booking emails', 'yatra'); ?></p>
                </div>
                <div class="premium-feature">
                    <h4><?php esc_html_e('Advanced Reports', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Revenue & analytics', 'yatra'); ?></p>
                </div>
                <div class="premium-feature">
                    <h4><?php esc_html_e('Multi-Currency', 'yatra'); ?></h4>
                    <p><?php esc_html_e('Accept global payments', 'yatra'); ?></p>
                </div>
            </div>

            <div class="premium-cta">
                <a href="https://wpyatra.com/pricing" target="_blank" class="btn">
                    <?php esc_html_e('View Pro Features', 'yatra'); ?>
                </a>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url(add_query_arg('step', 'theme', remove_query_arg('activate_error'))); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <input type="hidden" name="save_step" value="complete">
        <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <?php esc_html_e('Go to Dashboard', 'yatra'); ?>
        </button>
    </div>
</form>
