<?php
/**
 * Setup Wizard - General Settings Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\SettingsService;

// Get actual Yatra settings - ONLY ESSENTIAL ONES
$company_name = SettingsService::get('company_name', '');
$company_email = SettingsService::get('company_email', '');
$company_phone = SettingsService::get('company_phone', '');
$enable_guest_booking = SettingsService::get('enable_guest_booking', true);
$booking_confirmation = SettingsService::get('booking_confirmation', true);
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="general">
    
    <div class="wizard-header">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 style="margin: 0;"><?php esc_html_e('Business Information', 'yatra'); ?></h1>
        </div>
        <p style="text-align: center;"><?php esc_html_e('Essential business details for your travel booking system', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <!-- Company Information - ESSENTIAL -->
        <div class="form-section" style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;"><?php esc_html_e('Company Details', 'yatra'); ?></h3>
            
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="form-group">
                    <label class="form-label" for="company_name"><?php esc_html_e('Company Name', 'yatra'); ?> <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="company_name" name="company_name" value="<?php echo esc_attr($company_name); ?>" class="form-control" placeholder="<?php esc_attr_e('Your travel company name', 'yatra'); ?>" required>
                    <p class="form-help"><?php esc_html_e('Required for bookings and legal documents', 'yatra'); ?></p>
                </div>

                <div class="form-group">
                    <label class="form-label" for="company_email"><?php esc_html_e('Company Email', 'yatra'); ?> <span style="color: #ef4444;">*</span></label>
                    <input type="email" id="company_email" name="company_email" value="<?php echo esc_attr($company_email); ?>" class="form-control" placeholder="<?php esc_attr_e('contact@yourcompany.com', 'yatra'); ?>" required>
                    <p class="form-help"><?php esc_html_e('For booking confirmations and customer support', 'yatra'); ?></p>
                </div>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <div class="form-group">
                    <label class="form-label" for="company_phone"><?php esc_html_e('Company Phone', 'yatra'); ?> <span style="color: #ef4444;">*</span></label>
                    <input type="tel" id="company_phone" name="company_phone" value="<?php echo esc_attr($company_phone); ?>" class="form-control" placeholder="<?php esc_attr_e('+1 234 567 8900', 'yatra'); ?>" required>
                    <p class="form-help"><?php esc_html_e('Customer support and emergency contact', 'yatra'); ?></p>
                </div>
            </div>
        </div>

        <!-- Basic Booking Settings - ESSENTIAL -->
        <div class="form-section">
            <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;"><?php esc_html_e('Booking Preferences', 'yatra'); ?></h3>
            
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" name="enable_guest_booking" value="true" <?php checked($enable_guest_booking, true); ?>>
                        <span><?php esc_html_e('Allow Guest Bookings', 'yatra'); ?></span>
                    </label>
                    <p class="form-help"><?php esc_html_e('Let customers book without creating an account (recommended)', 'yatra'); ?></p>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" name="booking_confirmation" value="true" <?php checked($booking_confirmation, true); ?>>
                        <span><?php esc_html_e('Send Booking Confirmations', 'yatra'); ?></span>
                    </label>
                    <p class="form-help"><?php esc_html_e('Automatically email booking details to customers', 'yatra'); ?></p>
                </div>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url(add_query_arg('step', 'welcome', remove_query_arg('activate_error'))); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Skip', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 4 15 12 5 20"></polygon>
                <line x1="19" y1="12" x2="19" y2="12"></line>
            </svg>
        </a>
        <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Continue', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        </button>
    </div>
</form>
