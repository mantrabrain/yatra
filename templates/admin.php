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
        <h1>🚀 Yatra Admin UI Setup Required</h1>
        <p style="font-size: 16px; margin-bottom: 30px; color: #666;">
            The modern React admin interface needs to be built before it can be used.
        </p>
        <div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 20px; text-align: left; margin: 20px 0;">
            <h3 style="margin-top: 0;">To build the Admin UI:</h3>
            <ol style="line-height: 2;">
                <li>Open your terminal/command prompt</li>
                <li>Navigate to the plugin directory:
                    <code><?php echo esc_html(YATRA_PLUGIN_PATH); ?></code>
                </li>
                <li>Install dependencies:
                    <code>npm install</code>
                </li>
                <li>Build the application:
                    <code>npm run build</code>
                </li>
                <li>Refresh this page</li>
            </ol>
        </div>
        <p style="color: #999; font-size: 14px;">
            For development with hot reload, use <code>npm run dev</code> instead of <code>npm run build</code>
        </p>
    </div>
    <?php endif; ?>
</div>

