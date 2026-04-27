<?php
/**
 * Setup Wizard - Theme Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

$resa_theme = wp_get_theme('resa');
$is_resa_installed = $resa_theme->exists();
$current_theme = wp_get_theme();
$current_theme_slug = $current_theme->get_stylesheet();
$is_resa_active = ($current_theme_slug === 'resa') || ($current_theme->get('Name') === 'Resa') || (get_template() === 'resa') || (get_stylesheet() === 'resa');
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="theme">
    
    <div class="wizard-header wizard-header--task">
        <p class="wizard-header-kicker"><?php echo esc_html($this->get_wizard_progress_label()); ?></p>
        <h1><?php esc_html_e('Site appearance', 'yatra'); ?></h1>
        <p class="wizard-header-lead"><?php esc_html_e('Optional: Resa is built for travel layouts and pairs well with Yatra trip pages.', 'yatra'); ?></p>
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
                    <?php if ($is_resa_installed && $is_resa_active) : ?>
                        <span style="padding: 4px 12px; background: #10b981; color: #fff; font-size: 11px; font-weight: 700; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;"><?php esc_html_e('Activated', 'yatra'); ?></span>
                    <?php endif; ?>
                </div>

                <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.5;">
                    <?php esc_html_e('The perfect theme for travel and trip booking websites. Designed specifically to work seamlessly with Yatra plugin.', 'yatra'); ?>
                </p>

                <?php if ($is_resa_installed && $is_resa_active) : ?>
                    <!-- Theme is active, show no action buttons -->
                <?php elseif ($is_resa_installed && !$is_resa_active) : ?>
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px;">
                        <div style="display: flex; align-items: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-right: 12px;">
                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                            <span style="font-weight: 600; color: #92400e;"><?php esc_html_e('Installed but not activated', 'yatra'); ?></span>
                        </div>
                        <button type="button" class="btn btn-warning" onclick="activateTheme('resa')" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f59e0b; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s ease;" onmouseover="this.style.background='#d97706'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#f59e0b'; this.style.transform='translateY(0)';">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                            <?php esc_html_e('Activate', 'yatra'); ?>
                        </button>
                    </div>
                <?php else : ?>
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px;">
                        <div style="display: flex; align-items: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="margin-right: 12px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span style="font-weight: 600; color: #1e40af;"><?php esc_html_e('Not installed', 'yatra'); ?></span>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="installAndActivateTheme('resa')" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s ease;" onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)';">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <?php esc_html_e('Install & Activate', 'yatra'); ?>
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('currency')); ?>" class="btn btn-secondary wizard-footer-back">
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

<script>
// Define ajaxurl if not available
if (typeof ajaxurl === 'undefined') {
    ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';
}

function installAndActivateTheme(themeSlug) {
    const button = event.target;
    const originalContent = button.innerHTML;
    const yatraThemeWizardI18n = {
        installing: <?php echo wp_json_encode(__('Installing...', 'yatra')); ?>,
        activating: <?php echo wp_json_encode(__('Activating...', 'yatra')); ?>,
        installationFailedInvalidResponse: <?php echo wp_json_encode(__('Installation failed: Invalid response format', 'yatra')); ?>,
        activationFailedPrefix: <?php echo wp_json_encode(__('Activation failed:', 'yatra')); ?>,
        installationFailedPrefix: <?php echo wp_json_encode(__('Installation failed:', 'yatra')); ?>,
        activationRequestFailed: <?php echo wp_json_encode(__('Activation request failed. Please try again.', 'yatra')); ?>,
        installationRequestFailed: <?php echo wp_json_encode(__('Installation request failed. Please try again.', 'yatra')); ?>,
        unknownActivationError: <?php echo wp_json_encode(__('Unknown activation error', 'yatra')); ?>,
        unknownInstallationError: <?php echo wp_json_encode(__('Unknown installation error', 'yatra')); ?>
    };
    
    // Show loading state with spinner
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M12 2v10l4 2" fill="none" stroke="currentColor" stroke-width="2"></path></svg> ' + yatraThemeWizardI18n.installing;
    button.disabled = true;
    button.style.cursor = 'not-allowed';
    button.style.opacity = '0.7';
    
    // Add CSS animation for spinner
    if (!document.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    
    // Make AJAX request to install theme
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'yatra_install_theme',
            theme_slug: themeSlug,
            nonce: '<?php echo wp_create_nonce('yatra_theme_actions'); ?>'
        },
        success: function(response) {
            console.log('Raw installation response:', response); // Debug log
            
            // Handle case where HTML is mixed with JSON
            let jsonResponse = response;
            if (typeof response === 'string' && response.includes('{')) {
                // Extract JSON from mixed HTML/JSON response
                const jsonStart = response.lastIndexOf('{');
                const jsonEnd = response.lastIndexOf('}') + 1;
                const jsonString = response.substring(jsonStart, jsonEnd);
                
                try {
                    jsonResponse = JSON.parse(jsonString);
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                    resetButtonState(button, originalContent);
                    alert(yatraThemeWizardI18n.installationFailedInvalidResponse);
                    return;
                }
            }
            
            if (jsonResponse && jsonResponse.success) {
                // Theme installed successfully, now activate it
                button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M12 2v10l4 2" fill="none" stroke="currentColor" stroke-width="2"></path></svg> ' + yatraThemeWizardI18n.activating;
                
                jQuery.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'yatra_activate_theme',
                        theme_slug: themeSlug,
                        nonce: '<?php echo wp_create_nonce('yatra_theme_actions'); ?>'
                    },
                    success: function(activateResponse) {
                        console.log('Activation response:', activateResponse); // Debug log
                        if (activateResponse && activateResponse.success) {
                            // Update UI dynamically to show activated state
                            updateThemeCardToActivated();
                        } else {
                            resetButtonState(button, originalContent);
                            const errorMsg = activateResponse && activateResponse.data ? activateResponse.data : yatraThemeWizardI18n.unknownActivationError;
                            alert(yatraThemeWizardI18n.activationFailedPrefix + ' ' + errorMsg);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.log('Activation AJAX error:', {xhr: xhr, status: status, error: error}); // Debug log
                        resetButtonState(button, originalContent);
                        alert(yatraThemeWizardI18n.activationRequestFailed);
                    }
                });
            } else {
                resetButtonState(button, originalContent);
                const errorMsg = jsonResponse && jsonResponse.data ? jsonResponse.data : yatraThemeWizardI18n.unknownInstallationError;
                alert(yatraThemeWizardI18n.installationFailedPrefix + ' ' + errorMsg);
            }
        },
        error: function() {
            button.innerHTML = originalContent;
            button.disabled = false;
            alert(yatraThemeWizardI18n.installationRequestFailed);
        }
    });
}

function activateTheme(themeSlug) {
    const button = event.target;
    const originalContent = button.innerHTML;
    const yatraThemeWizardI18n = {
        activating: <?php echo wp_json_encode(__('Activating...', 'yatra')); ?>,
        activationFailedPrefix: <?php echo wp_json_encode(__('Activation failed:', 'yatra')); ?>,
        activationRequestFailed: <?php echo wp_json_encode(__('Activation request failed. Please try again.', 'yatra')); ?>,
        unknownActivationError: <?php echo wp_json_encode(__('Unknown activation error', 'yatra')); ?>
    };
    
    // Show loading state with spinner
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M12 2v10l4 2" fill="none" stroke="currentColor" stroke-width="2"></path></svg> ' + yatraThemeWizardI18n.activating;
    button.disabled = true;
    button.style.cursor = 'not-allowed';
    button.style.opacity = '0.7';
    
    // Add CSS animation for spinner if not already added
    if (!document.querySelector('#spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    
    // Make AJAX request to activate theme
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'yatra_activate_theme',
            theme_slug: themeSlug,
            nonce: '<?php echo wp_create_nonce('yatra_theme_actions'); ?>'
        },
        success: function(response) {
            console.log('Activation response:', response); // Debug log
            if (response && response.success) {
                // Update UI dynamically to show activated state
                updateThemeCardToActivated();
            } else {
                resetButtonState(button, originalContent);
                const errorMsg = response && response.data ? response.data : yatraThemeWizardI18n.unknownActivationError;
                alert(yatraThemeWizardI18n.activationFailedPrefix + ' ' + errorMsg);
            }
        },
        error: function(xhr, status, error) {
            console.log('Activation AJAX error:', {xhr: xhr, status: status, error: error}); // Debug log
            resetButtonState(button, originalContent);
            alert(yatraThemeWizardI18n.activationRequestFailed);
        }
    });
}

function resetButtonState(button, originalContent) {
    button.innerHTML = originalContent;
    button.disabled = false;
    button.style.cursor = 'pointer';
    button.style.opacity = '1';
}

function updateThemeCardToActivated() {
    // Find the theme card and update it to show activated state
    const themeCard = document.querySelector('.theme-card-full');
    if (!themeCard) return;
    
    // Remove any existing action blocks
    const actionBlocks = themeCard.querySelectorAll('div[style*="background: #fef3c7"], div[style*="background: #eff6ff"]');
    actionBlocks.forEach(block => block.remove());
    
    // Add "Activated" badge if not already present
    const header = themeCard.querySelector('div[style*="align-items: center; gap: 12px"]');
    if (header) {
        // Remove existing "Activated" badge if present
        const existingBadge = header.querySelector('span[style*="background: #10b981"]');
        if (existingBadge) existingBadge.remove();
        
        // Add new "Activated" badge
        const activatedBadge = document.createElement('span');
        activatedBadge.style.cssText = 'padding: 4px 12px; background: #10b981; color: #fff; font-size: 11px; font-weight: 700; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;';
        activatedBadge.textContent = '<?php esc_html_e('Activated', 'yatra'); ?>';
        header.appendChild(activatedBadge);
    }
    
    // Show success message briefly
    const successMsg = document.createElement('div');
    successMsg.style.cssText = 'background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center; color: #065f46; font-weight: 600;';
    successMsg.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <?php esc_html_e('Theme activated successfully!', 'yatra'); ?>
    `;
    
    // Insert success message after the description
    const description = themeCard.querySelector('p[style*="color: #6b7280"]');
    if (description && description.nextElementSibling) {
        description.parentNode.insertBefore(successMsg, description.nextElementSibling);
    }
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.remove();
        }
    }, 3000);
}
</script>
