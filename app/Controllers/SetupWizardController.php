<?php
/**
 * Setup Wizard Controller
 * Handles the one-time setup wizard for Yatra plugin
 *
 * @package Yatra\Controllers
 * @since 3.0.0
 */

namespace Yatra\Controllers;

use Yatra\Helpers\CurrencyHelper;

defined('ABSPATH') || exit;

class SetupWizardController
{
    /**
     * Option name to track wizard completion (legacy compatibility)
     */
    const WIZARD_COMPLETED_OPTION = 'yatra_setup_wizard_ran';

    /**
     * Option name to track wizard redirect
     */
    const WIZARD_REDIRECT_OPTION = 'yatra_setup_wizard_redirect';

    /**
     * Current step
     *
     * @var string
     */
    private $step = '';

    /**
     * Steps for the setup wizard
     *
     * @var array
     */
    private $steps = array();

    /**
     * Constructor
     */
    public function __construct()
    {
        // Only register admin menu if setup wizard is enabled
        if (apply_filters('yatra_enable_setup_wizard', true) && current_user_can('manage_options')) {
            add_action('admin_menu', array($this, 'admin_menus'));
        }
        
        add_action('admin_init', array($this, 'setup_wizard'));
        
        // Add AJAX handlers for theme actions
        add_action('wp_ajax_yatra_install_theme', array($this, 'ajax_install_theme'));
        add_action('wp_ajax_yatra_activate_theme', array($this, 'ajax_activate_theme'));
    }

    /**
     * Get wizard steps
     * Called after init to ensure translations are loaded
     */
    private function get_steps()
    {
        if (!empty($this->steps)) {
            return $this->steps;
        }

        $this->steps = array(
            'welcome' => array(
                'name' => __('Welcome', 'yatra'),
                'view' => array($this, 'setup_welcome'),
            ),
            'general' => array(
                'name' => __('Business Info', 'yatra'),
                'view' => array($this, 'setup_general'),
                'handler' => array($this, 'setup_general_save'),
            ),
            'currency' => array(
                'name' => __('Currency', 'yatra'),
                'view' => array($this, 'setup_currency'),
                'handler' => array($this, 'setup_currency_save'),
            ),
            'theme' => array(
                'name' => __('Theme', 'yatra'),
                'view' => array($this, 'setup_theme'),
                'handler' => array($this, 'setup_theme_save'),
            ),
            'complete' => array(
                'name' => __('Complete', 'yatra'),
                'view' => array($this, 'setup_complete'),
                'handler' => array($this, 'setup_complete_save'),
            ),
        );

        return $this->steps;
    }

    /**
     * Register admin menus
     */
    public function admin_menus()
    {
        add_submenu_page(
            'yatra',
            __('Yatra Setup Wizard', 'yatra'),
            __('Setup Wizard', 'yatra'),
            'manage_options',
            'yatra-setup',
            array($this, 'setup_wizard')
        );
    }


    /**
     * Show the setup wizard
     */
    public function setup_wizard()
    {
        if (empty($_GET['page']) || 'yatra-setup' !== $_GET['page']) {
            return;
        }

        $steps = $this->get_steps();
        $this->step = isset($_GET['step']) ? sanitize_key($_GET['step']) : current(array_keys($steps));

        // Process form submission BEFORE any output
        if (!empty($_POST['save_step'])) {
            $save_step = sanitize_key($_POST['save_step']);
            if ($save_step === $this->step && isset($steps[$this->step]['handler'])) {
                call_user_func($steps[$this->step]['handler'], $this);
                // Handler should redirect and exit, so code below won't execute
            }
        }

        // Enqueue styles and scripts before outputting HTML
        $this->enqueue_wizard_assets();

        $this->setup_wizard_steps();
        $this->setup_wizard_content();
        exit;
    }

    /**
     * Enqueue wizard assets
     */
    private function enqueue_wizard_assets()
    {
        // Enqueue setup wizard styles
        wp_enqueue_style(
            'yatra-setup-wizard',
            YATRA_PLUGIN_URL . 'assets/admin/css/setup-wizard.css',
            [],
            YATRA_VERSION
        );

        // Enqueue setup wizard scripts
        wp_enqueue_script(
            'yatra-setup-wizard',
            YATRA_PLUGIN_URL . 'assets/admin/js/setup-wizard.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );

        // Localize script
        wp_localize_script('yatra-setup-wizard', 'yatraSetupWizard', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_setup_wizard_nonce'),
            'strings' => [
                'confirm_leave' => __('Are you sure you want to leave the setup wizard?', 'yatra'),
                'saving' => __('Saving...', 'yatra'),
                'saved' => __('Saved!', 'yatra'),
                'error' => __('Error occurred', 'yatra')
            ]
        ]);
    }

    /**
     * Get the URL for the next step
     */
    public function get_next_step_link()
    {
        $steps = $this->get_steps();
        $keys = array_keys($steps);
        $current_key = array_search($this->step, $keys);

        if (false === $current_key) {
            return '';
        }

        $next_key = $current_key + 1;

        if (isset($keys[$next_key])) {
            return add_query_arg(
                array(
                    'page' => 'yatra-setup',
                    'step' => $keys[$next_key]
                ),
                admin_url('tools.php')
            );
        }

        return '';
    }

    /**
     * Setup wizard steps
     */
    public function setup_wizard_steps()
    {
        $output_steps = $this->get_steps();
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta name="viewport" content="width=device-width"/>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <title><?php esc_html_e('Yatra &rsaquo; Setup Wizard', 'yatra'); ?></title>
            <?php wp_print_styles('yatra-setup-wizard'); ?>
            <?php wp_print_scripts('jquery'); ?>
            <?php wp_print_scripts('yatra-setup-wizard'); ?>
        </head>
        <body class="yatra-setup wp-core-ui">
            <div class="yatra-setup-wrapper">
                <ol class="yatra-setup-steps">
                    <?php
                    $step_icons = array(
                        'welcome' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
                        'general' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>',
                        'currency' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
                        'pages' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
                        'theme' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>',
                        'complete' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></path></svg>'
                    );
                    
                    foreach ($output_steps as $step_key => $step) {
                        $is_completed = array_search($this->step, array_keys($this->steps)) > array_search($step_key, array_keys($this->steps));
                        $icon = isset($step_icons[$step_key]) ? $step_icons[$step_key] : '';

                        if ($step_key === $this->step) {
                            ?>
                            <li class="active"><span class="step-icon"><?php echo $icon; ?></span><?php echo esc_html($step['name']); ?></li>
                            <?php
                        } elseif ($is_completed) {
                            ?>
                            <li class="done">
                                <a href="<?php echo esc_url(add_query_arg('step', $step_key, remove_query_arg('activate_error'))); ?>"><span class="step-icon"><?php echo $icon; ?></span><?php echo esc_html($step['name']); ?></a>
                            </li>
                            <?php
                        } else {
                            ?>
                            <li><span class="step-icon"><?php echo $icon; ?></span><?php echo esc_html($step['name']); ?></li>
                            <?php
                        }
                    }
                    ?>
                </ol>
        <?php
    }

    /**
     * Setup wizard content
     */
    public function setup_wizard_content()
    {
        $steps = $this->get_steps();
        
        echo '<div class="yatra-setup-content">';
        if (isset($steps[$this->step]['view'])) {
            call_user_func($steps[$this->step]['view'], $this);
        }
        echo '</div>';
        echo '</div>'; // .yatra-setup-wrapper
        ?>
        </body>
        </html>
        <?php
    }

    /**
     * Welcome step
     */
    public function setup_welcome()
    {
        include YATRA_ABSPATH . 'templates/setup-wizard/welcome.php';
    }

    /**
     * General settings step
     */
    public function setup_general()
    {
        include YATRA_ABSPATH . 'templates/setup-wizard/general.php';
    }

    /**
     * Save general settings
     */
    public function setup_general_save()
    {
        check_admin_referer('yatra-setup');

        // Save ONLY ESSENTIAL settings for travel booking system
        $settings = [
            'company_name' => isset($_POST['company_name']) ? sanitize_text_field($_POST['company_name']) : '',
            'company_email' => isset($_POST['company_email']) ? sanitize_email($_POST['company_email']) : '',
            'company_phone' => isset($_POST['company_phone']) ? sanitize_text_field($_POST['company_phone']) : '',
            'enable_guest_booking' => isset($_POST['enable_guest_booking']) && $_POST['enable_guest_booking'] === 'true',
            'booking_confirmation' => isset($_POST['booking_confirmation']) && $_POST['booking_confirmation'] === 'true',
        ];

        foreach ($settings as $key => $value) {
            update_option('yatra_' . $key, $value);
        }

        wp_safe_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    /**
     * Currency settings step
     */
    public function setup_currency()
    {
        include YATRA_ABSPATH . 'templates/setup-wizard/currency.php';
    }

    /**
     * Save currency settings
     */
    public function setup_currency_save()
    {
        check_admin_referer('yatra-setup');

        $currency_code = isset($_POST['currency']) ? sanitize_text_field($_POST['currency']) : 'USD';
        
        // Validate currency exists
        if (!CurrencyHelper::exists($currency_code)) {
            $currency_code = 'USD'; // Fallback to USD
        }

        // Get recommended decimal places for the selected currency
        $currency_data = CurrencyHelper::get($currency_code);
        $recommended_decimals = $currency_data ? $currency_data['decimal_digits'] : 2;
        
        // Use user-specified decimals or fall back to currency recommendation
        $user_decimals = isset($_POST['decimal_places']) ? absint($_POST['decimal_places']) : $recommended_decimals;

        $settings = array(
            'yatra_currency' => $currency_code,
            'yatra_currency_position' => isset($_POST['currency_position']) ? sanitize_text_field($_POST['currency_position']) : 'before',
            'yatra_thousand_separator' => isset($_POST['thousand_separator']) ? sanitize_text_field($_POST['thousand_separator']) : ',',
            'yatra_decimal_separator' => isset($_POST['decimal_separator']) ? sanitize_text_field($_POST['decimal_separator']) : '.',
            'yatra_decimal_places' => $user_decimals,
        );

        foreach ($settings as $key => $value) {
            update_option($key, $value);
        }

        wp_safe_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    /**
     * Theme step
     */
    public function setup_theme()
    {
        include YATRA_ABSPATH . 'templates/setup-wizard/theme.php';
    }

    /**
     * Save theme settings
     */
    public function setup_theme_save()
    {
        check_admin_referer('yatra-setup');

        // Handle theme installation if requested
        if (isset($_POST['install_resa_theme']) && $_POST['install_resa_theme'] === 'yes') {
            set_transient('yatra_install_resa_theme', 1, 300);
        }

        wp_safe_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    /**
     * Complete step
     */
    public function setup_complete()
    {
        // Mark wizard as completed with value '1' for legacy compatibility
        update_option(self::WIZARD_COMPLETED_OPTION, '1');

        include YATRA_ABSPATH . 'templates/setup-wizard/complete.php';
    }

    /**
     * Handle complete step actions
     */
    public function setup_complete_save()
    {
        check_admin_referer('yatra-setup');

        // Handle sample data import if requested
        if (isset($_POST['import_sample_data']) && $_POST['import_sample_data'] === 'yes') {
            set_transient('yatra_import_sample_data', 1, 300);
        }

        // Redirect to dashboard
        wp_safe_redirect(admin_url('admin.php?page=yatra'));
        exit;
    }

    /**
     * Check if wizard is completed
     */
    public static function is_wizard_completed()
    {
        return get_option(self::WIZARD_COMPLETED_OPTION, '0') === '1';
    }

    /**
     * Reset wizard
     */
    public static function reset_wizard()
    {
        delete_option(self::WIZARD_COMPLETED_OPTION);
        delete_option(self::WIZARD_REDIRECT_OPTION);
    }

    /**
     * Check if wizard should run (for debugging/testing)
     */
    public static function should_run_wizard()
    {
        return get_option(self::WIZARD_COMPLETED_OPTION, '0') !== '1' && 
               apply_filters('yatra_enable_setup_wizard', true) && 
               current_user_can('manage_options');
    }

    /**
     * Setup wizard redirect on activation
     */
    public static function setup_wizard_redirect()
    {
        // Only redirect if not completed and redirect flag is set
        if (get_transient(self::WIZARD_REDIRECT_OPTION)) {
            delete_transient(self::WIZARD_REDIRECT_OPTION);

            if (!self::is_wizard_completed()) {
                wp_safe_redirect(admin_url('admin.php?page=yatra-setup'));
                exit;
            }
        }
    }

    /**
     * AJAX handler for theme installation
     */
    public function ajax_install_theme()
    {
        check_ajax_referer('yatra_theme_actions', 'nonce');
        
        if (!current_user_can('install_themes')) {
            wp_send_json_error('You do not have permission to install themes.');
        }
        
        $theme_slug = isset($_POST['theme_slug']) ? sanitize_text_field($_POST['theme_slug']) : '';
        
        if (empty($theme_slug)) {
            wp_send_json_error('Theme slug is required.');
        }
        
        // Include WordPress theme installation functions
        if (!class_exists('Theme_Upgrader')) {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        }
        
        if (!class_exists('Theme_Installer_Skin')) {
            require_once ABSPATH . 'wp-admin/includes/theme.php';
        }
        
        // Check if theme is already installed
        if ($resa_theme = wp_get_theme($theme_slug)) {
            if ($resa_theme->exists()) {
                // Theme is already installed, just activate it
                wp_send_json_success('Theme already installed, proceeding to activation.');
            }
        }
        
        // Install the theme with aggressive output buffering
        $original_level = ob_get_level();
        ob_start();
        $upgrader = new \Theme_Upgrader(new \Theme_Installer_Skin());
        $result = $upgrader->install("https://downloads.wordpress.org/theme/resa.zip");
        
        // Clean all output buffers
        while (ob_get_level() > $original_level) {
            ob_end_clean();
        }
        
        // Also clean any remaining output
        if (ob_get_length() > 0) {
            ob_clean();
        }
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        if (!$result) {
            wp_send_json_error('Theme installation failed.');
        }
        
        wp_send_json_success('Theme installed successfully.');
    }
    
    /**
     * AJAX handler for theme activation
     */
    public function ajax_activate_theme()
    {
        check_ajax_referer('yatra_theme_actions', 'nonce');
        
        if (!current_user_can('switch_themes')) {
            wp_send_json_error('You do not have permission to activate themes.');
        }
        
        $theme_slug = isset($_POST['theme_slug']) ? sanitize_text_field($_POST['theme_slug']) : '';
        
        if (empty($theme_slug)) {
            wp_send_json_error('Theme slug is required.');
        }
        
        // Check if theme exists
        $theme = wp_get_theme($theme_slug);
        if (!$theme->exists()) {
            wp_send_json_error('Theme is not installed.');
        }
        
        // Activate the theme
        $result = switch_theme($theme_slug);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success('Theme activated successfully.');
    }
}
