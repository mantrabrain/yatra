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
     * Trigger wizard redirect on plugin activation
     * Called from activation hook
     */
    public static function triggerWizardOnActivation(): void
    {
        set_transient('yatra_setup_wizard_redirect', 1, 30);
    }
}
