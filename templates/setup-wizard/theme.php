<?php
/**
 * Setup Wizard - Theme Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

$resa_theme = wp_get_theme('resa');
$is_resa_installed = $resa_theme->exists();
$is_resa_active = get_template() === 'resa';
$current_theme = wp_get_theme();
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="theme">
    
    <div class="wizard-header">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 style="margin: 0;"><?php esc_html_e('Recommended Theme', 'yatra'); ?></h1>
        </div>
        <p style="text-align: center;"><?php esc_html_e('Get the best experience with a theme designed for travel bookings', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <!-- Resa Theme Card -->
        <div class="theme-card-full" style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="width: 100%; height: 300px; overflow: hidden;">
                <img src="https://i0.wp.com/themes.svn.wordpress.org/resa/1.0.6/screenshot.png" 
                     alt="<?php esc_attr_e('Resa Theme', 'yatra'); ?>"
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.src='<?php echo esc_url(YATRA_PLUGIN_URI . 'assets/images/resa-theme-preview.jpg'); ?>'">
            </div>
            <div style="padding: 24px; background: #fff;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;"><?php esc_html_e('Resa Theme', 'yatra'); ?></h3>
                    <span style="margin-left: auto; padding: 4px 12px; background: #4f46e5; color: #fff; font-size: 11px; font-weight: 700; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;"><?php esc_html_e('Recommended', 'yatra'); ?></span>
                </div>

                <?php if ($is_resa_active) : ?>
                    <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; text-align: center; padding: 14px; font-weight: 600; color: #065f46;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <?php esc_html_e('Active', 'yatra'); ?>
                    </div>
                <?php else : ?>
                    <label style="display: flex; align-items: center; padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;" onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" name="install_resa_theme" value="yes" checked style="width: 18px; height: 18px; margin-right: 12px; cursor: pointer; accent-color: #4f46e5;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" style="margin-right: 8px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span style="font-size: 14px; font-weight: 600; color: #374151;"><?php esc_html_e('Install & Activate Resa Theme (Free)', 'yatra'); ?></span>
                    </label>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url(add_query_arg('step', 'pages', remove_query_arg('activate_error'))); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Skip', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
                <polyline points="12 5 19 12 12 19" transform="translate(5, 0)"></polyline>
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
