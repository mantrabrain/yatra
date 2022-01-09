<?php
/**
 * Yatra admin setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra_Admin Class.
 *
 * @class Yatra
 */
final class Yatra_Admin
{

    /**
     * The single instance of the class.
     *
     * @var Yatra_Admin
     * @since 1.0.0
     */
    protected static $_instance = null;


    /**
     * Main Yatra_Admin Instance.
     *
     * Ensures only one instance of Yatra_Admin is loaded or can be loaded.
     *
     * @return Yatra_Admin - Main instance.
     * @since 1.0.0
     * @static
     */
    public static function instance()
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }


    /**
     * Yatra Constructor.
     */
    public function __construct()
    {
        $this->includes();
        $this->init_hooks();
    }

    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    private function init_hooks()
    {


        add_action('init', array($this, 'setup_wizard'));
        add_action('admin_init', array($this, 'admin_redirects'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_notices', array($this, 'promotional_offer'));


    }

    public function promotional_offer()
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $offer_key = 'yatra_promo_notice_key';
        
        $offer_start_date = strtotime('2022-01-09 00:00:01');

        $offer_end_date = strtotime('2022-01-23 23:59:00');

        $hide_notice = get_option($offer_key, 'show');

        if ('hide' == $hide_notice) {
            return;
        }

        if ($offer_start_date < current_time('timestamp') && current_time('timestamp') < $offer_end_date) {

            yatra_load_admin_template('notices.promo');

        }

    }

    public function admin_redirects()
    {

        if (!get_transient('_yatra_activation_redirect')) {
            return;
        }

        delete_transient('_yatra_activation_redirect');

        if ((!empty($_GET['page']) && in_array($_GET['page'], array('yatra-setup'))) || is_network_admin() || isset($_GET['activate-multi']) || !current_user_can('manage_options')) {
            return;
        }

        // If it's the first time
        if (get_option('yatra_setup_wizard_ran') != '1') {
            wp_safe_redirect(admin_url('index.php?page=yatra-setup'));
            exit;

            // Otherwise, the welcome page
        } else {
            wp_safe_redirect(admin_url('edit.php?post_type=tour'));
            exit;
        }
    }

    /**
     * Include required files
     *
     * @return void
     */
    public function setup_wizard()
    {
        // Setup/welcome
        if (!empty($_GET['page'])) {

            if ('yatra-setup' == $_GET['page']) {
                include_once YATRA_ABSPATH . 'includes/admin/setup/class-yatra-setup-wizard.php';
            }
        }
    }

    function admin_menu()
    {
        $settings_page = add_submenu_page(
            'edit.php?post_type=tour',
            'Settings',
            'Settings',
            'manage_options',
            'yatra-settings',
            array($this, 'settings')
        );

        add_action('load-' . $settings_page, array($this, 'settings_page_init'));

        // availablity menu

        $availability_page = add_submenu_page(
            'edit.php?post_type=tour',
            'Availability',
            'Availability',
            'manage_options',
            'yatra-availability',
            array($this, 'availability'),
            2
        );
        add_action('load-' . $settings_page, array($this, 'availability_page_init'));
    }

    public function settings()
    {
        Yatra_Admin_Settings::output();


    }

    public function settings_page_init()
    {
        global $current_tab, $current_section;

        // Include settings pages.
        Yatra_Admin_Settings::get_settings_pages();

        // Get current tab/section.
        $current_tab = empty($_GET['tab']) ? 'general' : sanitize_title(wp_unslash($_GET['tab'])); // WPCS: input var okay, CSRF ok.
        $current_section = empty($_REQUEST['section']) ? '' : sanitize_title(wp_unslash($_REQUEST['section'])); // WPCS: input var okay, CSRF ok.

        // Save settings if data has been posted.
        if ('' !== $current_section && apply_filters("yatra_save_settings_{$current_tab}_{$current_section}", !empty($_POST['save']))) { // WPCS: input var okay, CSRF ok.
            Yatra_Admin_Settings::save();
        } elseif ('' === $current_section && apply_filters("yatra_save_settings_{$current_tab}", !empty($_POST['save']))) { // WPCS: input var okay, CSRF ok.
            Yatra_Admin_Settings::save();
        }

        // Add any posted messages.
        if (!empty($_GET['yatra_error'])) { // WPCS: input var okay, CSRF ok.
            Yatra_Admin_Settings::add_error(wp_kses_post(wp_unslash($_GET['yatra_error']))); // WPCS: input var okay, CSRF ok.
        }

        if (!empty($_GET['yatra_message'])) { // WPCS: input var okay, CSRF ok.
            Yatra_Admin_Settings::add_message(wp_kses_post(wp_unslash($_GET['yatra_message']))); // WPCS: input var okay, CSRF ok.
        }

        do_action('yatra_settings_page_init');


    }

    public function availability()
    {
        do_action('yatra_availability_page_output');


    }

    public function availability_page_init()
    {

        do_action('yatra_availability_page_init');


    }


    /**
     * Include required core files used in admin.
     */
    public function includes()
    {
        include_once YATRA_ABSPATH . 'includes/classes/class-yatra-core-exporter.php';
        include_once YATRA_ABSPATH . 'includes/classes/class-yatra-core-importer.php';
        include_once YATRA_ABSPATH . 'includes/admin/yatra-admin-functions.php';
        include_once YATRA_ABSPATH . 'includes/admin/dashboard/class-mantrabrain-admin-dashboard.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-form-handler.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-tour-enquiries.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-export-import.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-license-manager.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-assets.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-post-types.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-permalinks.php';


    }


}
