<?php
/**
 * Setup Wizard Service
 * Handles setup wizard initialization and registration
 *
 * @package Yatra\Services
 * @since 3.0.0
 */

namespace Yatra\Services;

use Yatra\Controllers\SetupWizardController;

defined('ABSPATH') || exit;

class SetupWizardService
{
    /**
     * Initialize the setup wizard service
     */
    public static function init(): void
    {
        // Only initialize in admin
        if (!is_admin()) {
            return;
        }

        // Initialize the setup wizard controller on plugins_loaded
        add_action('plugins_loaded', [__CLASS__, 'initController']);

        // Register activation hook handler
        add_action('admin_init', [__CLASS__, 'handleWizardRedirect']);
        
        // Force redirect to setup wizard if not completed
        add_action('admin_init', [__CLASS__, 'forceWizardRedirect']);
    }

    /**
     * Initialize the setup wizard controller
     */
    public static function initController(): void
    {
        new SetupWizardController();
    }

    /**
     * Handle wizard redirect after plugin activation
     */
    public static function handleWizardRedirect(): void
    {
        SetupWizardController::setup_wizard_redirect();
    }

    /**
     * Force redirect to setup wizard if not completed
     * This implements the legacy logic: if yatra_setup_wizard_ran != '1', redirect to setup wizard
     */
    public static function forceWizardRedirect(): void
    {
        // Only apply to users who can manage options
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Check if setup wizard is enabled via filter (legacy compatibility)
        if (!apply_filters('yatra_enable_setup_wizard', true)) {
            return;
        }
        
        // Check if wizard has been completed (yatra_setup_wizard_ran != '1')
        if (get_option('yatra_setup_wizard_ran') !== '1') {
            // Don't redirect if we're already on the setup wizard page
            if (isset($_GET['page']) && $_GET['page'] === 'yatra-setup') {
                return;
            }
            
            // Don't redirect on AJAX requests
            if (wp_doing_ajax()) {
                return;
            }
            
            // Force redirect to setup wizard
            wp_safe_redirect(admin_url('admin.php?page=yatra-setup'));
            exit;
        }
    }

    /**
     * Trigger wizard redirect on plugin activation
     * Called from activation hook
     */
    public static function triggerWizardOnActivation(): void
    {
        set_transient('yatra_setup_wizard_redirect', 1, 30);
    }
}
