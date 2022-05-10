<?php

class Yatra_Admin_Addons
{
    public function __construct()
    {
        add_action('yatra_admin_addon_page_output', array($this, 'addon_page'));
        add_action('admin_enqueue_scripts', array($this, 'scripts'), 11);

    }

    public function addon_page()
    {
        try {

            $addons_json = file_get_contents(YATRA_PLUGIN_DIR . 'assets/admin/addon-lists.json');

            $addons = json_decode($addons_json, true);

        } catch (\Exception $e) {

            $addons = [];
        }

        yatra_load_admin_template('addon.list', array('addons' => $addons));
    }

    public function scripts($hook)
    {
        if ('tour_page_yatra-addons' != $hook) {
            return;
        }


        wp_enqueue_style('yatra-admin-addons', YATRA_PLUGIN_URI . '/assets/admin/css/addons.css', array(), YATRA_VERSION);
    }
}

new Yatra_Admin_Addons();