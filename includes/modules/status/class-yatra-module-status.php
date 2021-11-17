<?php

class Yatra_Module_Status
{
    public function __construct()
    {
        add_action('admin_menu', array($this, 'status_menu'));
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

    public static function show_messages()
    {

    }

    public function system_status()
    {
        echo '<h1>This is System Status Page</h1>';
    }

    public function logs()
    {
        echo '<h1>This is Log Page</h1>';
    }
}


if (is_admin()) {
    new Yatra_Module_Status();
}
