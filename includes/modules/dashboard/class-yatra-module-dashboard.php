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
        $activity_count = wp_count_terms('activity', array(
            'hide_empty' => false,
            'parent' => 0
        ));
        $attribute_count = wp_count_terms('attributes', array(
            'hide_empty' => false,
            'parent' => 0
        ));
        $destination_count = wp_count_terms('destination', array(
            'hide_empty' => false,
            'parent' => 0
        ));

        $tour_count = wp_count_posts('tour')->publish;

        $enquiry_count = Yatra_Core_DB::get_count(Yatra_Tables::TOUR_ENQUIRIES);

        $bookings = (array)wp_count_posts('yatra-booking');

        if (isset($bookings['future'])) {
            unset($bookings['future']);
        };
        if (isset($bookings['draft'])) {
            unset($bookings['draft']);
        };
        if (isset($bookings['pending'])) {
            unset($bookings['pending']);
        };
        if (isset($bookings['private'])) {
            unset($bookings['private']);
        };
        if (isset($bookings['trash'])) {
            unset($bookings['trash']);
        };
        if (isset($bookings['auto-draft'])) {
            unset($bookings['auto-draft']);
        };
        if (isset($bookings['inherit'])) {
            unset($bookings['inherit']);
        };

        $booking_count = array_sum($bookings);

        $customer_count = wp_count_posts('yatra-customers')->publish;

        $coupon_count = wp_count_posts('yatra-coupons')->publish;


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
