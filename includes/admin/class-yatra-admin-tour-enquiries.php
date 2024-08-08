<?php

class Yatra_Admin_Tour_Enquiries
{

    public function __construct()
    {
        add_filter('yatra_admin_main_submenu', array($this, 'enquiries_menu'));

        add_filter('set_screen_option_yatra_enquiries_page_size', array($this, 'set_screen_option'), 1, 10);
    }

    public function enquiries_menu($submenu)
    {
        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('Enquiries', 'yatra'),
            'menu_title' => __('Enquiries', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'enquiries',
            'callback' => array($this, 'settings_page'),
            'position' => 20,
            'load_action' => array($this, 'enquiry_page')
        );
        return $submenu;
    }

    public function set_screen_option($screen_option, $option, $value)
    {
        return absint($value);
    }

    function enquiry_page()
    {

        add_screen_option('per_page', array('label' => 'Per Page', 'default' => 10, 'option' => 'yatra_enquiries_page_size'));
    }

    public function settings_page()
    {

        echo '<div class="wrap">';

        echo '<form method="post">';

        include_once 'list-tables/class-yatra-admin-list-table-enquiries.php';

        $enquiriesTable = new Yatra_Admin_List_Table_Enquiries();

        $enquiriesTable->prepare_items();

        echo '<h2>' . esc_html__('All Enquiries', 'yatra') . '</h2>';

        $enquiriesTable->display();

        echo '</form>';

        echo '</div>';
    }

}

new Yatra_Admin_Tour_Enquiries();
