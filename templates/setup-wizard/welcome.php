<?php
/**
 * Setup Wizard - Welcome (only screen with broad onboarding / marketing copy).
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\StatsUsage;

$usage_stored = get_option(StatsUsage::OPT_CONSENT, null);
/** First visit: default checked; after save, reflect stored preference. */
$usage_checked = ($usage_stored === null) ? true : (bool) $usage_stored;
?>

<form method="post" class="wizard-step wizard-step--welcome">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="welcome" />

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

        <div class="yatra-usage-optin" style="margin: 24px 0 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; max-width: 720px;">
            <input type="hidden" name="yatra_allow_usage_tracking" value="0" />
            <label style="display: flex; gap: 12px; align-items: flex-start; cursor: pointer;">
                <input
                    type="checkbox"
                    name="yatra_allow_usage_tracking"
                    value="1"
                    <?php checked($usage_checked); ?>
                    style="margin-top: 4px; width: 18px; height: 18px; flex-shrink: 0;"
                />
                <span>
                    <strong style="display: block; color: #111827; margin-bottom: 6px;"><?php esc_html_e('Help us improve the product by sharing non-sensitive data', 'yatra'); ?></strong>
                    <span style="font-size: 13px; color: #6b7280; line-height: 1.55;">
                        <?php esc_html_e('No personal or booking details—only technical signals. Read the full list (opens in a new tab):', 'yatra'); ?>
                        <a href="https://wpyatra.com/what-we-collect/" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 500; text-decoration: underline;"><?php esc_html_e('What we collect', 'yatra'); ?></a>
                    </span>
                </span>
            </label>
        </div>
    </div>

    <div class="wizard-footer wizard-footer--welcome">
        <a href="<?php echo esc_url(add_query_arg('skip_setup', '1', admin_url('admin.php?page=yatra-setup'))); ?>" class="btn btn-secondary">
            <?php esc_html_e('Skip setup', 'yatra'); ?>
        </a>
        <button type="submit" class="btn btn-primary">
            <?php esc_html_e('Start setup', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
    </div>
</form>
