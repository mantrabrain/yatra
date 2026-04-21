<?php
/**
 * Admin Template — React app mount point.
 *
 * Fullscreen shell CSS runs from AdminServiceProvider::printYatraReactAdminCriticalCss() on admin_print_styles
 * (priority 0) so it is output in the document head before the wp-admin menu markup — avoids FOUC.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check if React app is built
$app_js = YATRA_PLUGIN_PATH . 'assets/admin/dist/js/app.js';
$app_css = YATRA_PLUGIN_PATH . 'assets/admin/dist/css/app.css';
$has_build = file_exists($app_js);
?>
<div id="yatra-app-root">
    <?php if ($has_build) : ?>
    <div class="yatra-admin-boot-splash" role="status" aria-live="polite" aria-busy="true">
        <div class="yatra-admin-boot-spinner" aria-hidden="true"></div>
        <p class="yatra-admin-boot-text"><?php esc_html_e('Loading Yatra…', 'yatra'); ?></p>
    </div>
    <?php else : ?>
    <div class="yatra-build-message">
        <h1><?php esc_html_e('🚀 Yatra Admin UI Setup Required', 'yatra'); ?></h1>
        <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
            <?php esc_html_e('The modern React admin interface needs to be built before it can be used.', 'yatra'); ?>
        </p>
        <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 20px; text-align: left; margin: 20px 0;">
            <h3 style="margin-top: 0;"><?php esc_html_e('To build the Admin UI:', 'yatra'); ?></h3>
            <ol style="line-height: 2;">
                <li><?php esc_html_e('Open your terminal/command prompt', 'yatra'); ?></li>
                <li><?php esc_html_e('Navigate to the plugin directory:', 'yatra'); ?>
                    <code><?php echo esc_html(YATRA_PLUGIN_PATH); ?></code>
                </li>
                <li><?php esc_html_e('Install dependencies:', 'yatra'); ?>
                    <code>npm install</code>
                </li>
                <li><?php esc_html_e('Build the application:', 'yatra'); ?>
                    <code>npm run build</code>
                </li>
                <li><?php esc_html_e('Refresh this page', 'yatra'); ?></li>
            </ol>
        </div>
        <p style="color: #999; font-size: 14px;">
            <?php esc_html_e('For development with hot reload, use', 'yatra'); ?> <code>npm run dev</code> <?php esc_html_e('instead of', 'yatra'); ?> <code>npm run build</code>
        </p>
    </div>
    <?php endif; ?>
</div>

