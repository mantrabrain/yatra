<?php
/**
 * Setup Wizard - Welcome (only screen with broad onboarding / marketing copy).
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;
?>

<div class="wizard-step wizard-step--welcome">
    <div class="wizard-header wizard-header--welcome">
        <h1><?php esc_html_e('Launch your trip bookings faster', 'yatra'); ?></h1>
        <p class="wizard-welcome-sub"><?php esc_html_e('A short guided setup—then you can publish trips and take bookings.', 'yatra'); ?></p>
    </div>

    <div class="wizard-content wizard-content--welcome">
        <p class="wizard-welcome-lead"><?php esc_html_e('We will walk you through what matters most for Yatra:', 'yatra'); ?></p>
        <ul class="checklist wizard-welcome-checklist">
            <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><?php esc_html_e('Business details travelers and receipts will reference', 'yatra'); ?></span>
            </li>
            <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><?php esc_html_e('Guest checkout and confirmation emails (pageless booking flow)', 'yatra'); ?></span>
            </li>
            <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><?php esc_html_e('Professional “from” addresses and payment test mode so you do not surprise customers', 'yatra'); ?></span>
            </li>
            <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span><?php esc_html_e('Currency display and an optional theme tuned for travel sites', 'yatra'); ?></span>
            </li>
        </ul>

        <div class="info-note wizard-welcome-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span><?php esc_html_e('You can skip anytime; everything here lives under Yatra Settings later.', 'yatra'); ?></span>
        </div>
    </div>

    <div class="wizard-footer wizard-footer--welcome">
        <a href="<?php echo esc_url(add_query_arg('skip_setup', '1', admin_url('admin.php?page=yatra-setup'))); ?>" class="btn btn-secondary">
            <?php esc_html_e('Skip setup', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-primary">
            <?php esc_html_e('Start setup', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
    </div>
</div>
