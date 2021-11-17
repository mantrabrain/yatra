<?php

class Yatra_Module_Status
{
    public function __construct()
    {
        add_action('admin_menu', array($this, 'status_menu'));
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

        echo '<h1>Hello Status</h1>';
    }
}


if (is_admin()) {
    new Yatra_Module_Status();
}
