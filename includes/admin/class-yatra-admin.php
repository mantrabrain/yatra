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
        add_action('admin_menu', array($this, 'yatra_submenu'));
        add_action('admin_menu', array($this, 'yatra_tour_submenu'));
        add_action('admin_notices', array($this, 'promotional_offer'));
        add_filter('plugin_action_links_' . plugin_basename(YATRA_PLUGIN_DIR . 'yatra.php'), [$this, 'settings_link'], 10, 4);

        add_filter('parent_file', array($this, 'menu_parent_fix'));

        add_filter('yatra_admin_main_submenu', array($this, 'submenu'));


    }

    public function menu_parent_fix($parent_file)
    {
        global $submenu_file, $current_screen;

        $menu_post_types = array('yatra-booking', 'yatra-coupons', 'yatra-customers');

        if (in_array($current_screen->post_type, $menu_post_types)) {

            $submenu_file = 'edit.php?post_type=' . $current_screen->post_type;

            $parent_file = YATRA_ADMIN_MENU_SLUG;
        }
        return $parent_file;
    }


    public function promotional_offer()
    {
return;
        if (!current_user_can('manage_yatra')) {
            return;
        }

        $offer_key = 'yatra_black_friday_cyber_monday_promo';

        $offer_start_date = strtotime('2022-10-28 00:00:01');

        $offer_end_date = strtotime('2022-12-05 23:59:00');

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

        if ((!empty($_GET['page']) && in_array($_GET['page'], array('yatra-setup'))) || is_network_admin() || isset($_GET['activate-multi']) || !current_user_can('manage_yatra')) {
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

    public function submenu($submenu)
    {


        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('All Bookings', 'yatra'),
            'menu_title' => __('Bookings', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'edit.php?post_type=yatra-booking',
            'callback' => '',
            'position' => 10,
        );

        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('All Customers', 'yatra'),
            'menu_title' => __('Customers', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'edit.php?post_type=yatra-customers',
            'callback' => '',
            'position' => 15,
        );


        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('Coupons', 'yatra'),
            'menu_title' => __('Coupons', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'edit.php?post_type=yatra-coupons',
            'callback' => '',
            'position' => 20,
        );

        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('Settings', 'yatra'),
            'menu_title' => __('Settings', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'yatra-settings',
            'callback' => array($this, 'settings'),
            'position' => 25,
            'load_action' => array($this, 'settings_page_init')
        );

        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => esc_html__('Yatra Addons', 'yatra'),
            'menu_title' => '<span style="color:#28d01d">' . esc_html__('Addons', 'yatra') . '</span>',
            'capability' => 'manage_yatra',
            'menu_slug' => 'yatra-addons',
            'callback' => array($this, 'addon_page'),
            'position' => 30,
        );


        if (count(yatra_get_premium_addons()) < 1) {

            $submenu[] = array(
                'parent_slug' => YATRA_ADMIN_MENU_SLUG,
                'page_title' => esc_html__('Upgrade to Pro', 'yatra'),
                'menu_title' => '<span style="color:#e27730">' . esc_html__('Upgrade to Pro', 'yatra') . '</span>',
                'capability' => 'manage_yatra',
                'menu_slug' => esc_url('https://wpyatra.com/pricing/?utm_campaign=freeplugin&utm_medium=admin-menu&utm_source=WordPress&utm_content=Upgrade+to+Pro'),
                'callback' => '',
                'position' => 35,
            );
        }
        return $submenu;
    }

    public function yatra_submenu()
    {

        $default_submenu_args = array(
            'parent_slug' => '',
            'page_title' => '',
            'menu_title' => '',
            'capability' => 'manage_yatra',
            'menu_slug' => '',
            'callback' => '',
            'position' => null,
            'load_action' => '',
        );

        $submenu_configurations = apply_filters('yatra_admin_main_submenu', array());
        $submenu_columns = array_column($submenu_configurations, "position");
        array_multisort($submenu_columns, SORT_ASC, $submenu_configurations);
        foreach ($submenu_configurations as $configuration) {

            $configuration = wp_parse_args($configuration, $default_submenu_args);

            $hookname = add_submenu_page(
                $configuration['parent_slug'],
                $configuration['page_title'],
                $configuration['menu_title'],
                $configuration['capability'],
                $configuration['menu_slug'],
                $configuration['callback'],
                $configuration['position']
            );
            if ($configuration['load_action'] !== '') {

                add_action('load-' . $hookname, $configuration['load_action']);

            }
        }


    }

    public function yatra_tour_submenu()
    {
        $availability_page = add_submenu_page(
            YATRA_TOUR_ADMIN_MENU_SLUG,
            'Availability',
            'Availability',
            'manage_yatra',
            'yatra-availability',
            array($this, 'availability'),
            500
        );
        add_action('load-' . $availability_page, array($this, 'availability_page_init'));
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

    public function addon_page()
    {
        do_action('yatra_admin_addon_page_output');
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
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-review.php';
        include_once YATRA_ABSPATH . 'includes/admin/class-yatra-admin-addons.php';


    }

    public function settings_link($links, $plugin_file, $plugin_data, $context)
    {

        $custom['pro'] = sprintf(
            '<a href="%1$s" aria-label="%2$s" target="_blank" rel="noopener noreferrer" 
				style="color: #00a32a; font-weight: 700;" 
				onmouseover="this.style.color=\'#008a20\';" 
				onmouseout="this.style.color=\'#00a32a\';"
				>%3$s</a>',
            esc_url(
                add_query_arg(
                    [
                        'utm_content' => 'Get+Yatra+Premium',
                        'utm_campaign' => 'freeplugin',
                        'utm_medium' => 'all-plugins',
                        'utm_source' => 'WordPress',
                    ],
                    'https://wpyatra.com/pricing/'
                )
            ),
            esc_attr__('Get Yatra Pro', 'yatra'),
            esc_html__('Get Yatra Pro', 'yatra')
        );

        $custom['settings'] = sprintf(
            '<a href="%s" aria-label="%s">%s</a>',
            esc_url(
                add_query_arg(
                    ['page' => 'yatra-settings'],
                    admin_url('admin.php')
                )
            ),
            esc_attr__('Go to Yatra Settings page', 'yatra'),
            esc_html__('Settings', 'yatra')
        );

        $custom['docs'] = sprintf(
            '<a href="%1$s" aria-label="%2$s" target="_blank" rel="noopener noreferrer">%3$s</a>',
            esc_url(
                add_query_arg(
                    [
                        'utm_content' => 'Documentation',
                        'utm_campaign' => 'freeplugin',
                        'utm_medium' => 'all-plugins',
                        'utm_source' => 'WordPress',
                    ],
                    'https://wpyatra.com/docs/'
                )
            ),
            esc_attr__('Read the documentation', 'yatra'),
            esc_html__('Docs', 'yatra')
        );
        if (count(yatra_get_premium_addons()) > 0) {
            unset($custom['pro']);
        }

        return array_merge($custom, (array)$links);
    }


}
