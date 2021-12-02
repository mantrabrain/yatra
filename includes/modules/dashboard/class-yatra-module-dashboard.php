<?php

class Yatra_Module_Dashboard
{
    public function __construct()
    {
        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 10);
        add_action('admin_menu', array($this, 'menu'));
    }

    public function menu()
    {
        add_submenu_page(
            'edit.php?post_type=tour',
            __('Dashboard', 'yatra'),
            __('Dashboard', 'yatra'),
            'manage_options',
            'yatra-dashboard',
            array($this, 'dashboard'),
            0
        );
    }

    public function dashboard()
    {

        include YATRA_ABSPATH . 'includes/modules/dashboard/templates/html-admin-dashboard.php';
    }


    public function load_admin_scripts($id)
    {

        if ($id !== 'tour_page_yatra-dashboard') {
            return;
        }

        wp_register_style('yatra-admin-dashboard', YATRA_PLUGIN_URI . '/includes/modules/dashboard/assets/css/yatra-admin-dashboard.css', array(), YATRA_VERSION);

        wp_enqueue_style('yatra-admin-dashboard');
    }
}


if (is_admin()) {
    new Yatra_Module_Dashboard();
}
