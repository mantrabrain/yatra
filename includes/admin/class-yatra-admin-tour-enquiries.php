<?php

class Yatra_Admin_Tour_Enquiries
{

    public function __construct()
    {
        add_action('admin_menu', array($this, 'enquiries_menu'), 55);
        add_filter('set_screen_option_yatra_enquiries_page_size', array($this, 'set_screen_option'), 1, 10);
    }

    public function enquiries_menu()
    {

        $hook = add_submenu_page(
            'edit.php?post_type=tour',
            __('Enquiries', 'yatra'),
            __('Enquiries', 'yatra'),
            'administrator',
            'enquiries', array($this, 'settings_page'), 6);




        add_action("load-" . $hook, array($this, 'mp_custom_page_screen_options'));

    }

    public function set_screen_option($screen_option, $option, $value)
    {
        return absint($value);
    }

    function mp_custom_page_screen_options()
    {

        add_screen_option('per_page', array('label' => 'Per Page', 'default' => 10, 'option' => 'yatra_enquiries_page_size'));
    }

    public function settings_page()
    {

        echo '<div class="wrap">';

        include_once 'list-tables/class-yatra-admin-list-table-enquiries.php';

        $enquiriesTable = new Yatra_Admin_List_Table_Enquiries();

        $enquiriesTable->prepare_items();

        echo '<h2>All Enquiries</h2>';

        $enquiriesTable->display();

        echo '</div>';
    }

}

new Yatra_Admin_Tour_Enquiries();
