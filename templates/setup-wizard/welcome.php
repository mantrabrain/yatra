<?php
/**
 * Setup Wizard - Welcome Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;
?>

<div class="wizard-step">
    <div class="wizard-header">
        <h1 style="text-align: center;"><?php esc_html_e('Welcome to Yatra', 'yatra'); ?></h1>
        <p style="text-align: center;"><?php esc_html_e('Let\'s set up your travel booking system in just a few minutes', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <div class="info-box">
            <p><?php esc_html_e('This setup wizard will help you configure:', 'yatra'); ?></p>
            <ul class="checklist">
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <?php esc_html_e('General settings and display options', 'yatra'); ?>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <?php esc_html_e('Currency and pricing format', 'yatra'); ?>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <?php esc_html_e('Essential pages for your booking system', 'yatra'); ?>
                </li>
                <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <?php esc_html_e('Recommended theme and sample data', 'yatra'); ?>
                </li>
            </ul>
        </div>

        <div class="info-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <?php esc_html_e('You can skip this wizard and configure everything manually later from Settings.', 'yatra'); ?>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url(admin_url()); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <?php esc_html_e('Skip Setup', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Get Started', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        </a>
    </div>
</div>
