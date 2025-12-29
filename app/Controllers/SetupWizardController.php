<?php
/**
 * Setup Wizard Controller
 * Handles the one-time setup wizard for Yatra plugin
 *
 * @package Yatra\Controllers
 * @since 3.0.0
 */

namespace Yatra\Controllers;

defined('ABSPATH') || exit;

class SetupWizardController
{
    /**
     * Option name to track wizard completion
     */
    const WIZARD_COMPLETED_OPTION = 'yatra_setup_wizard_completed';

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
        add_action('admin_menu', array($this, 'admin_menus'));
        add_action('admin_init', array($this, 'setup_wizard'));
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
                'name' => __('General Settings', 'yatra'),
                'view' => array($this, 'setup_general'),
                'handler' => array($this, 'setup_general_save'),
            ),
            'currency' => array(
                'name' => __('Currency', 'yatra'),
                'view' => array($this, 'setup_currency'),
                'handler' => array($this, 'setup_currency_save'),
            ),
            'pages' => array(
                'name' => __('Pages', 'yatra'),
                'view' => array($this, 'setup_pages'),
                'handler' => array($this, 'setup_pages_save'),
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
            'tools.php',
            __('Yatra Setup Wizard', 'yatra'),
            __('Yatra Setup', 'yatra'),
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
        // Use centralized AdminAssetsService for setup wizard assets
        $adminAssetsService = new \Yatra\Services\AdminAssetsService();
        $adminAssetsService->enqueueSetupWizardAssets();
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
                <h1 class="yatra-setup-logo">
                    <a href="https://wpyatra.com" target="_blank">
                        <img src="<?php echo esc_url(YATRA_PLUGIN_URI . '/assets/images/yatra-logo.png'); ?>" alt="Yatra"/>
                    </a>
                </h1>
                <ol class="yatra-setup-steps">
                    <?php
                    $step_icons = array(
                        'welcome' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
                        'general' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path></svg>',
                        'currency' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
                        'pages' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
                        'theme' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>',
                        'complete' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
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

        $settings = array(
            'yatra_general_enable_tour_archive' => isset($_POST['enable_tour_archive']) ? 'yes' : 'no',
            'yatra_general_tour_listing_page_displays' => isset($_POST['tour_listing_display']) ? sanitize_text_field($_POST['tour_listing_display']) : 'grid',
            'yatra_general_number_of_tour_list_per_page' => isset($_POST['tours_per_page']) ? absint($_POST['tours_per_page']) : 9,
        );

        foreach ($settings as $key => $value) {
            update_option($key, $value);
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

        $settings = array(
            'yatra_currency_code' => isset($_POST['currency']) ? sanitize_text_field($_POST['currency']) : 'USD',
            'yatra_currency_position' => isset($_POST['currency_position']) ? sanitize_text_field($_POST['currency_position']) : 'before',
            'yatra_currency_thousand_separator' => isset($_POST['thousand_separator']) ? sanitize_text_field($_POST['thousand_separator']) : ',',
            'yatra_currency_decimal_separator' => isset($_POST['decimal_separator']) ? sanitize_text_field($_POST['decimal_separator']) : '.',
            'yatra_currency_number_of_decimals' => isset($_POST['number_of_decimals']) ? absint($_POST['number_of_decimals']) : 2,
        );

        foreach ($settings as $key => $value) {
            update_option($key, $value);
        }

        wp_safe_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    /**
     * Pages setup step
     */
    public function setup_pages()
    {
        include YATRA_ABSPATH . 'templates/setup-wizard/pages.php';
    }

    /**
     * Save pages settings
     */
    public function setup_pages_save()
    {
        check_admin_referer('yatra-setup');

        // Create default pages if they don't exist
        $pages = array(
            'cart' => array(
                'title' => __('Cart', 'yatra'),
                'content' => '[yatra_cart]',
            ),
            'checkout' => array(
                'title' => __('Checkout', 'yatra'),
                'content' => '[yatra_checkout]',
            ),
            'my_account' => array(
                'title' => __('My Account', 'yatra'),
                'content' => '[yatra_my_account]',
            ),
            'confirmation' => array(
                'title' => __('Booking Confirmation', 'yatra'),
                'content' => '[yatra_booking_confirmation]',
            ),
        );

        foreach ($pages as $page_key => $page_data) {
            $page_id = $this->create_page($page_data['title'], $page_data['content']);
            if ($page_id) {
                update_option('yatra_' . $page_key . '_page', $page_id);
            }
        }

        wp_safe_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    /**
     * Create a page
     */
    private function create_page($title, $content)
    {
        // Use WP_Query instead of deprecated get_page_by_title
        $query = new \WP_Query(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'title' => $title,
            'posts_per_page' => 1,
            'no_found_rows' => true,
            'ignore_sticky_posts' => true,
        ));

        if ($query->have_posts()) {
            $page = $query->posts[0];
            wp_reset_postdata();
            return $page->ID;
        }

        // Page doesn't exist, create it
        $page_id = wp_insert_post(array(
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'publish',
            'post_type' => 'page',
        ));

        return $page_id;
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
        // Mark wizard as completed
        update_option(self::WIZARD_COMPLETED_OPTION, 'yes');

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
        return get_option(self::WIZARD_COMPLETED_OPTION, 'no') === 'yes';
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
     * Setup wizard redirect on activation
     */
    public static function setup_wizard_redirect()
    {
        // Only redirect if not completed and redirect flag is set
        if (get_transient(self::WIZARD_REDIRECT_OPTION)) {
            delete_transient(self::WIZARD_REDIRECT_OPTION);

            if (!self::is_wizard_completed()) {
                wp_safe_redirect(admin_url('tools.php?page=yatra-setup'));
                exit;
            }
        }
    }
}
