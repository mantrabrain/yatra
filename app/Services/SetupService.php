<?php
/**
 * Setup Service for Yatra Plugin
 *
 * Handles plugin activation and setup tasks
 *
 * @package Yatra\Services
 */

namespace Yatra\Services;

class SetupService
{
    /**
     * Register activation hook
     */
    public static function registerActivationHook(): void
    {
        register_activation_hook(YATRA_PLUGIN_FILE, [self::class, 'activate']);
    }

    /**
     * Plugin activation callback
     */
    public static function activate(): void
    {
        if (class_exists('Yatra\Services\SetupWizardService')) {
            SetupWizardService::triggerWizardOnActivation();
        }
    }
}
