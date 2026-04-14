<?php
/**
 * Setup Wizard — Email identity, notifications, payment safety.
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\SettingsService;

$company_name = (string) SettingsService::get('company_name', '');
$company_email = (string) SettingsService::get('company_email', '');
$email_from_name = (string) SettingsService::get('from_name', '');
$email_from_address = (string) SettingsService::get('from_email', '');
if ($email_from_name === '') {
    $email_from_name = $company_name;
}
if ($email_from_address === '') {
    $email_from_address = $company_email;
}
$payment_test_mode = SettingsService::get('payment_test_mode', true);
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="communications">

    <div class="wizard-header wizard-header--task">
        <p class="wizard-header-kicker"><?php echo esc_html($this->get_wizard_progress_label()); ?></p>
        <h1><?php esc_html_e('Emails & payment safety', 'yatra'); ?></h1>
        <p class="wizard-header-lead"><?php esc_html_e('Fix the two most common launch issues: emails that look wrong, and accidental live charges.', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="wizard-card">
            <h3 class="wizard-card-title"><?php esc_html_e('“From” on outgoing mail', 'yatra'); ?></h3>
            <p class="wizard-card-intro"><?php esc_html_e('Should match a domain you control so fewer messages land in spam.', 'yatra'); ?></p>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="email_from_name"><?php esc_html_e('From name', 'yatra'); ?></label>
                    <input type="text" id="email_from_name" name="email_from_name" value="<?php echo esc_attr($email_from_name); ?>" class="form-control" autocomplete="off">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="email_from_address"><?php esc_html_e('From email', 'yatra'); ?></label>
                    <input type="email" id="email_from_address" name="email_from_address" value="<?php echo esc_attr($email_from_address); ?>" class="form-control" autocomplete="off">
                </div>
            </div>
        </div>

        <div class="wizard-card">
            <h3 class="wizard-card-title"><?php esc_html_e('Which emails send?', 'yatra'); ?></h3>
            <p class="wizard-card-intro"><?php esc_html_e('After setup, open Yatra → Email → Templates to turn individual messages on or off (booking, payment, cancellation, admin copies, and more).', 'yatra'); ?></p>
        </div>

        <div class="wizard-card wizard-card--highlight">
            <h3 class="wizard-card-title"><?php esc_html_e('Payment gateways', 'yatra'); ?></h3>
            <label class="wizard-check-row">
                <input type="checkbox" name="payment_test_mode" value="true" <?php checked($payment_test_mode, true); ?>>
                <span>
                    <strong><?php esc_html_e('Keep gateways in test mode for now', 'yatra'); ?></strong>
                    <span class="wizard-check-desc"><?php esc_html_e('Turn this off in Settings when you are ready to accept real payments.', 'yatra'); ?></span>
                </span>
            </label>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('bookings')); ?>" class="btn btn-secondary wizard-footer-back">
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
