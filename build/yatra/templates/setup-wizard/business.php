<?php
/**
 * Setup Wizard — Business profile (contact details only).
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\SettingsService;

$company_name = SettingsService::get('company_name', '');
$company_email = SettingsService::get('company_email', '');
$company_phone = SettingsService::get('company_phone', '');
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="business">

    <div class="wizard-header wizard-header--task">
        <p class="wizard-header-kicker"><?php echo esc_html($this->get_wizard_progress_label()); ?></p>
        <h1><?php esc_html_e('Your business', 'yatra'); ?></h1>
        <p class="wizard-header-lead"><?php esc_html_e('These details appear on booking records and customer-facing messages.', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="company_name"><?php esc_html_e('Business / brand name', 'yatra'); ?> <span class="wizard-req">*</span></label>
                <input type="text" id="company_name" name="company_name" value="<?php echo esc_attr($company_name); ?>" class="form-control" required autocomplete="organization" placeholder="<?php esc_attr_e('e.g. Mountain View Tours', 'yatra'); ?>">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="company_email"><?php esc_html_e('Public contact email', 'yatra'); ?> <span class="wizard-req">*</span></label>
                <input type="email" id="company_email" name="company_email" value="<?php echo esc_attr($company_email); ?>" class="form-control" required autocomplete="email" placeholder="<?php esc_attr_e('e.g. hello@yourbusiness.com', 'yatra'); ?>">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="company_phone"><?php esc_html_e('Phone', 'yatra'); ?> <span class="wizard-req">*</span></label>
            <input type="tel" id="company_phone" name="company_phone" value="<?php echo esc_attr($company_phone); ?>" class="form-control" required autocomplete="tel" placeholder="<?php esc_attr_e('e.g. +1 555 123 4567', 'yatra'); ?>">
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('welcome')); ?>" class="btn btn-secondary wizard-footer-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <div class="wizard-footer-actions">
            <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-secondary btn-skip"><?php esc_html_e('Skip', 'yatra'); ?></a>
            <button type="submit" class="btn btn-primary">
                <?php esc_html_e('Continue', 'yatra'); ?>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
        </div>
    </div>
</form>
