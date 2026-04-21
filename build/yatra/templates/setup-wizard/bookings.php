<?php
/**
 * Setup Wizard — How bookings work (guest checkout, confirmations).
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\SettingsService;

$enable_guest_booking = SettingsService::get('enable_guest_booking', true);
$booking_confirmation = SettingsService::get('booking_confirmation', true);
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="bookings">

    <div class="wizard-header wizard-header--task">
        <p class="wizard-header-kicker"><?php echo esc_html($this->get_wizard_progress_label()); ?></p>
        <h1><?php esc_html_e('Booking experience', 'yatra'); ?></h1>
        <p class="wizard-header-lead"><?php esc_html_e('Yatra uses streamlined, pageless checkout—set the rules that match how you sell trips.', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="wizard-card">
            <h3 class="wizard-card-title"><?php esc_html_e('Who can book?', 'yatra'); ?></h3>
            <label class="wizard-check-row">
                <input type="checkbox" name="enable_guest_booking" value="true" <?php checked($enable_guest_booking, true); ?>>
                <span>
                    <strong><?php esc_html_e('Allow guest bookings', 'yatra'); ?></strong>
                    <span class="wizard-check-desc"><?php esc_html_e('Customers can complete a trip without creating a WordPress account—fewer drop-offs at checkout.', 'yatra'); ?></span>
                </span>
            </label>
        </div>

        <div class="wizard-card">
            <h3 class="wizard-card-title"><?php esc_html_e('After they book', 'yatra'); ?></h3>
            <label class="wizard-check-row">
                <input type="checkbox" name="booking_confirmation" value="true" <?php checked($booking_confirmation, true); ?>>
                <span>
                    <strong><?php esc_html_e('Send booking confirmation emails', 'yatra'); ?></strong>
                    <span class="wizard-check-desc"><?php esc_html_e('Automatically email trip and payment details so travelers have everything in their inbox.', 'yatra'); ?></span>
                </span>
            </label>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('business')); ?>" class="btn btn-secondary wizard-footer-back">
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
