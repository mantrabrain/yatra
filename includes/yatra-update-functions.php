<?php
if (!function_exists('yatra_update_2100_tour_dates_table_create')) {

    function yatra_update_2100_tour_dates_table_create()
    {
        Yatra_Install::verify_base_tables(true);
    }
}

if (!function_exists('yatra_update_2130_logs_update')) {

    function yatra_update_2130_logs_update()
    {
        Yatra_Install::verify_base_tables(true);

        yatra()->get_log_dir();
    }
}


if (!function_exists('yatra_update_2160_tour_minimum_price')) {
    function yatra_update_2160_tour_minimum_price()
    {
        $tours = get_posts(array('post_type' => 'tour', 'numberposts' => -1));
        if (!is_wp_error($tours)) {
            if (is_array($tours)) {
                foreach ($tours as $tour) {
                    $tour_id = isset($tour->ID) ? absint($tour->ID) : 0;
                    if ($tour_id > 0) {
                        yatra_update_filter_meta_minimum_tour_price($tour_id);
                    }
                }
            }
        }
    }
}

if (!function_exists('yatra_update_2190_user_roles')) {
    function yatra_update_2190_user_roles()
    {
        $role = new Yatra_User_Role();

        $role->remove_roles();

        $role->create_roles();

        $all_users = get_users(array(
            'meta_key' => 'yatra_user',
        ));

        $all_users = is_array($all_users) ? $all_users : array();

        foreach ($all_users as $index => $user) {

            $user_id = $user->ID ?? 0;

            if ($user_id > 0) {
                $role->add_customer_role($user_id);
            }

        }

        $booking_that_have_user_id = get_posts(array(
            'numberposts' => -1,
            'meta_key' => 'yatra_user_id',
            'post_type' => 'yatra-booking',
            'post_status' => 'any'
        ));

        if (!is_wp_error($booking_that_have_user_id)) {

            $booking_that_have_user_id = is_array($booking_that_have_user_id) ? $booking_that_have_user_id : array();

            foreach ($booking_that_have_user_id as $booking_index => $booking) {

                $booking_id = $booking->ID ?? 0;

                if ($booking_id > 0) {

                    $yatra_user_id = absint(get_post_meta($booking_id, 'yatra_user_id', true));

                    if ($yatra_user_id > 0) {

                        $role->add_customer_role($yatra_user_id);
                    }

                }

            }
        }

    }
}


if (!function_exists('yatra_update_2110_admin_email_recipient_lists')) {

    function yatra_update_2110_admin_email_recipient_lists()
    {
        update_option('yatra_admin_email_recipient_lists', get_option('admin_email'));
    }
}