<?php

class Yatra_Module_Status
{
    public function __construct()
    {
        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 10);
        add_action('admin_menu', array($this, 'status_menu'));
        add_action('admin_init', array($this, 'log_action_init'), 10);
        add_action('yatra_status_system_status', array($this, 'system_status'));
        add_action('yatra_status_logs', array($this, 'logs'));
    }

    public function status_menu()
    {
        add_submenu_page(
            'edit.php?post_type=tour',
            'Status',
            'Status',
            'manage_options',
            'yatra-status',
            array($this, 'status'),
            550
        );
    }

    public function status()
    {
        $current_tab = empty($_GET['tab']) ? '' : sanitize_title(wp_unslash($_GET['tab'])); // WPCS: input var okay, CSRF ok.

        $current_section = empty($_REQUEST['section']) ? '' : sanitize_title(wp_unslash($_REQUEST['section'])); // WPCS: input var okay, CSRF ok.

        $tabs = apply_filters('yatra_status_tabs_array', array(

            'system_status' => __('System Status', 'yatra'),

            'logs' => __('Logs', 'yatra')
        ));

        if ($current_tab === '' || !isset($tabs[$current_tab])) {

            $tab_keys = array_keys($tabs);

            $current_tab = $tab_keys[0];

        }

        include YATRA_ABSPATH . 'includes/modules/status/templates/html-admin-status.php';
    }

    public function log_action_init($id)
    {

        $current_tab = empty($_GET['tab']) ? '' : sanitize_title(wp_unslash($_GET['tab'])); // WPCS: input var okay, CSRF ok.

        $page = empty($_GET['page']) ? '' : sanitize_title(wp_unslash($_GET['page'])); // WPCS: input var okay, CSRF ok.

        if ($current_tab === "logs" && $page === 'yatra-status') {

            include_once "sections/class-yatra-module-section-logs.php";

            Yatra_Module_Section_Logs::log_actions();
        }
    }

    public static function show_messages()
    {

    }


    public function system_status()
    {

        include_once "sections/class-yatra-module-section-system-status.php";
    }

    public function logs()
    {

        include_once "sections/class-yatra-module-section-logs.php";

        Yatra_Module_Section_Logs::log_template();
    }

    public function load_admin_scripts($id)
    {

        if ($id !== 'tour_page_yatra-status') {
            return;
        }

        wp_register_style('yatra-admin-status', YATRA_PLUGIN_URI . '/includes/modules/status/assets/css/yatra-admin-status.css', array(), YATRA_VERSION);

        wp_enqueue_style('yatra-admin-status');
    }
}


if (is_admin()) {
    new Yatra_Module_Status();
}
