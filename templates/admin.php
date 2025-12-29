<?php
/**
 * Admin Template
 * Wrapper for React admin app
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check if React app is built
$app_js = YATRA_PLUGIN_PATH . 'public/js/app.js';
$app_css = YATRA_PLUGIN_PATH . 'public/css/app.css';
$has_build = file_exists($app_js);
?>
<script>
  // Apply dark mode immediately to prevent flash
  (function() {
    const darkMode = localStorage.getItem('yatra-dark-mode');
    if (darkMode === 'true') {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
<style>
    /* Hide WordPress admin elements for fullscreen UI */
    #wpadminbar,
    #adminmenumain,
    #adminmenuback,
    #wpfooter {
        display: none !important;
    }
    
    #wpcontent {
        margin-left: 0 !important;
        padding: 0 !important;
    }
    
    .wrap {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
    }
    
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        <?php if (!$has_build): ?>
        overflow: auto !important;
        <?php else: ?>
        overflow: hidden !important;
        <?php endif; ?>
    }
    
    #yatra-app-root {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        background: #fff;
    }
    
    .yatra-build-message {
        padding: 40px;
        text-align: center;
        max-width: 800px;
        margin: 50px auto;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .yatra-build-message h1 {
        margin-bottom: 20px;
        color: #333;
    }
    
    .yatra-build-message code {
        display: block;
        background: #f5f5f5;
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
        text-align: left;
        border-left: 4px solid #0073aa;
    }
</style>

<div id="yatra-app-root">
    <?php if (!$has_build): ?>
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

