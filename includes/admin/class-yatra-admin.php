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
     * @since 1.0.0
     * @static
     * @return Yatra_Admin - Main instance.
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

        add_action('admin_menu', array($this, 'admin_menu'));

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


    /**
     * Include required core files used in admin.
     */
    public function includes()
    {

        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-assets.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-post-types.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-permalinks.php';

    }


}
