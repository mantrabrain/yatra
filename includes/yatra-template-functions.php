<?php
if (!function_exists('yatra_get_account_menu_items')) {

    function yatra_get_account_menu_items()
    {

        $items = array(
            'my-account' => array(
                'label' => __('My Account', 'yatra'),
                'items' => array(
                    'dashboard' => array(
                        'label' => __('Dashboard', 'yatra'),
                        'icon' => 'fa fa-tachometer-alt',
                    ),
                    'edit-profile' => array(
                        'label' => __('Edit Profile', 'yatra'),
                        'icon' => 'fa fa-edit',
                    ),
                    'change-password' => array(
                        'label' => __('Change Password', 'yatra'),
                        'icon' => 'fa fa-unlock-alt',
                    )
                )
            ),
            'booking' => array(
                'label' => __('Tour Bookings', 'yatra'),
                'items' => array(
                    'bookings' => array(
                        'label' => __('My Bookings', 'yatra'),
                        'icon' => 'fa fa-file-alt',

                    ))
            ),
        );

        return apply_filters('yatra_account_menu_items', $items);
    }
}

if (!function_exists('yatra_my_account_menu_item_endpoints')) {

    function yatra_my_account_menu_item_endpoints()
    {

        $menu_items = yatra_get_account_menu_items();

        $menu_item_endpoints = array();

        foreach ($menu_items as $item) {

            $child_items = isset($item['items']) ? array_keys($item['items']) : array();

            if (count($child_items) > 0) {

                $menu_item_endpoints = array_merge($menu_item_endpoints, $child_items);

            }
        }


        return $menu_item_endpoints;
    }

}
if (!function_exists('yatra_account_content')) {

    /**
     * My Account content output.
     */
    function yatra_account_content()
    {


        $menu_item_endpoints = yatra_my_account_menu_item_endpoints();

        $page_key = isset($_GET['page_type']) ? sanitize_text_field($_GET['page_type']) : 'dashboard';

        if (!in_array($page_key, $menu_item_endpoints)) {

            return;
        }

        if (has_action('yatra_account_' . $page_key . '_endpoint')) {

            do_action('yatra_account_' . $page_key . '_endpoint');

        }


    }
}

if (!function_exists('yatra_account_navigation')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_navigation()
    {
        $menu_item_endpoints = yatra_my_account_menu_item_endpoints();

        $page_key = isset($_GET['page_type']) ? sanitize_text_field($_GET['page_type']) : 'dashboard';

        $current_endpoint = 'dashboard';

        if (in_array($page_key, $menu_item_endpoints)) {

            $current_endpoint = $page_key;

        }


        yatra_get_template('myaccount/tmpl-navigation.php', array('current_endpoint' => $current_endpoint));
    }
}

if (!function_exists('yatra_account_dashboard')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_dashboard()
    {
        $current_user_id = get_current_user_id();
        $current_user = get_userdata($current_user_id);

        $first_name = get_user_meta($current_user_id, 'first_name', true);
        $last_name = get_user_meta($current_user_id, 'last_name', true);
        $dob = get_user_meta($current_user_id, 'yatra_user_date_of_birth', true);
        $gender = get_user_meta($current_user_id, 'yatra_user_gender', true);
        $country = get_user_meta($current_user_id, 'yatra_user_country', true);
        if (!empty($country)) {
            $country = yatra_get_countries($country);
        }
        $phone = get_user_meta($current_user_id, 'yatra_user_phone_number', true);
        $contact_address = get_user_meta($current_user_id, 'yatra_user_contact_address', true);
        $profile_info = new stdClass();
        $profile_info->fullname = $first_name . ' ' . $last_name;
        $profile_info->dob = $dob;
        $profile_info->email = $current_user->get('user_email');
        $profile_info->contact_address = $contact_address;
        $profile_info->gender = $gender;
        $profile_info->country = $country;
        $profile_info->phone = $phone;
        $profile_info->gravatar = get_avatar_url($current_user->get('user_email'));

        yatra_get_template('myaccount/tmpl-dashboard.php', array('profile_info' => $profile_info));
    }
}


if (!function_exists('yatra_account_bookings')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_bookings()
    {

        $booking_id = yatra_get_var($_GET['booking_id'], 0);

        $booking_id = absint($booking_id);

        $current_user_id = get_current_user_id();

        $user_id = get_post_meta($booking_id, 'yatra_user_id', true);

        if ($booking_id > 0 && $user_id == $current_user_id) {

            $yatra_booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);


            yatra_get_template('myaccount/tmpl-booking-details.php', array('yatra_booking_meta' => $yatra_booking_meta));

        } else {
            $booking_array = get_posts(apply_filters('yatra_my_account_my_booking_query', array(
                'numberposts' => 10,
                'meta_key' => 'yatra_user_id', // need to replace with customer_id_meta_key
                'meta_value' => get_current_user_id(), /// need to replace with current user id
                'post_type' => 'yatra-booking',
                'post_status' => 'any'
            )));

            $booking_details = array();

            foreach ($booking_array as $booking) {

                $booking_meta_params = get_post_meta($booking->ID, 'yatra_booking_meta_params', true);

                $yatra_booking_meta = get_post_meta($booking->ID, 'yatra_booking_meta', true);
                $booking_detail = new stdClass();
                $booking_detail->booking_id = $booking->ID;
                $booking_detail->booking_status = yatra_get_booking_statuses($booking->post_status);
                $booking_detail->booking_code = $booking_meta_params['booking_code'];
                $booking_detail->booking_date = $booking_meta_params['booking_date'];
                $booking_detail->booking_total = $booking_meta_params['total_booking_price'];
                $booking_detail->booking_currency_symbol = $booking_meta_params['currency_symbol'];
                $booking_detail->number_of_tours = count($yatra_booking_meta);

                array_push($booking_details, $booking_detail);
            }

            yatra_get_template('myaccount/tmpl-booking.php', array('booking_details' => $booking_details));
        }
    }
}

if (!function_exists('yatra_account_edit_profile')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_edit_profile()
    {
        $account_details = array();


        yatra_get_template('myaccount/tmpl-form-edit-account.php', array('account_details' => $account_details));
    }
}

if (!function_exists('yatra_my_account_edit_profile_form_fields')) {

    function yatra_my_account_edit_profile_form_fields()
    {

        $yatra_user = new Yatra_User_Form();

        $yatra_user->edit_profile_form_fields();
    }
}
if (!function_exists('yatra_account_notices')) {

    function yatra_account_notices()
    {
        if (is_yatra_error(yatra()->yatra_error)) {

            $error_messages = yatra()->yatra_error->get_error_messages('yatra_form_validation_errors');

            if (count($error_messages) > 0) {

                echo '<ul class="yatra-account-messages yatra-error">';

                foreach ($error_messages as $message) {

                    echo '<li>' . esc_html($message) . '</li>';
                }

                echo '</ul>';
            }

        }

        if (yatra()->yatra_messages->has_messages('yatra_my_account_messages')) {

            $messages = yatra()->yatra_messages->get_messages('yatra_my_account_messages');

            if (count($messages) > 0) {

                foreach ($messages as $message_type => $message_list) {

                    echo '<ul class="yatra-account-messages yatra-' . esc_attr($message_type) . '">';

                    foreach ($message_list as $message_text) {

                        echo '<li>' . esc_html($message_text) . '</li>';
                    }

                    echo '</ul>';
                }
            }

        }
    }
}


if (!function_exists('yatra_login_notices')) {

    function yatra_login_notices()
    {

        if (is_yatra_error(yatra()->yatra_error)) {

            $error_messages = yatra()->yatra_error->get_error_messages('yatra_login_error_message');

            if (count($error_messages) > 0) {

                echo '<ul class="yatra-account-messages yatra-error">';

                foreach ($error_messages as $message) {

                    echo '<li>' . wp_kses($message, array('span', 'strong', 'a' => array('href', ''))) . '</li>';
                }

                echo '</ul>';
            }

        }
    }
}

if (!function_exists('yatra_checkout_form_error')) {

    function yatra_checkout_form_error()
    {
        if (is_yatra_error(yatra()->yatra_error)) {


            $form_validation_error = yatra()->yatra_error->get_error_messages('yatra_form_validation_errors');

            $checkout_error = yatra()->yatra_error->get_error_messages('yatra_checkout_error');

            $error_messages = array_merge($form_validation_error, $checkout_error);

            if (count($error_messages) > 0) {

                echo '<ul class="yatra-checkout-messages yatra-error">';

                foreach ($error_messages as $message) {

                    echo '<li>' . wp_kses($message, array('span', 'strong', 'a' => array('href', ''))) . '</li>';
                }

                echo '</ul>';
            }

        }
    }
}


if (!function_exists('yatra_account_change_password')) {

    function yatra_account_change_password()
    {

        yatra_get_template('myaccount/tmpl-form-change-password.php', array());

    }
}

if (!function_exists('yatra_my_account_change_password_form_fields')) {

    function yatra_my_account_change_password_form_fields()
    {

        $yatra_user = new Yatra_User_Form();

        $yatra_user->change_password_form_fields();
    }
}

if (!function_exists('yatra_single_tour_additional_information')) {

    function yatra_single_tour_additional_information()
    {
        $additional_info = yatra_tour_additional_info();

        yatra_get_template('tour/additional.php',
            array(
                'additional_info' => $additional_info
            )
        );

    }
}

if (!function_exists('yatra_cart_edit_person_pricing_details')) {

    function yatra_cart_edit_person_pricing_details($cart_id, $cart_items, $tour_id)
    {
        $number_of_person = isset($cart_items['number_of_person']) ? $cart_items['number_of_person'] : 0;

        $selected_date = isset($cart_items['selected_date']) ? $cart_items['selected_date'] : '';

        if ($selected_date == '') {
            return;
        }

        $tour_options = new Yatra_Tour_Options($tour_id, $selected_date, $selected_date, $number_of_person);

        $tourData = $tour_options->getTourData();

        $todayDataSettings = $tour_options->getTodayData($selected_date);

        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $tourData;

        } else {

            $todayData = $tourData;
        }

        $booking_pricing_info = $todayData->getPricing();

        yatra_get_template('tmpl-cart-edit-form.php',
            array(
                'yatra_booking_pricing_info' => $booking_pricing_info,
                'tour_id' => $tour_id,
                'number_of_person' => $number_of_person
            )
        );

    }
}

if (!function_exists('yatra_cart_edit_item')) {

    function yatra_cart_edit_item($pricing_item, $currency, $tour_id, $number_of_person)
    {
        $person = $number_of_person;


        if ($pricing_item instanceof Yatra_Tour_Pricing) {

            $person = is_array($number_of_person) ? 0 : absint($number_of_person);

            yatra_get_template('tmpl-cart-item.php', array('pricing' => $pricing_item, 'currency' => $currency, 'tour_id' => $tour_id, 'pricing_type' => 'single', 'person' => $person));
        } else {
            foreach ($pricing_item as $pricing) {

                $person = is_array($number_of_person) && isset($number_of_person[$pricing->getID()]) ? $number_of_person[$pricing->getID()] : 1;

                yatra_get_template('tmpl-cart-item.php', array('pricing' => $pricing, 'currency' => $currency, 'tour_id' => $tour_id, 'pricing_type' => 'multi', 'person' => $person));
            }
        }


    }

}
if (!function_exists('yatra_get_price')) {

    function yatra_get_price($currency, $price, $echo = false)
    {
        $currency_price_separator = apply_filters('yatra_currency_price_separator', '');

        $price_string = ($currency . $currency_price_separator . $price);

        if (!$echo) {
            return $price_string;
        }
        if ($echo) {
            echo esc_html($price_string);
        }
    }
}

if (!function_exists('yatra_tour_availability_status')) {
    function yatra_tour_availability_status($key = null)
    {

        $status = apply_filters('yatra_tour_availability_status', array(
            'booking' => __('For Booking', 'yatra'),
            'enquiry' => __('For Enquiry Only', 'yatra'),
            'none' => __('Not Available', 'yatra'),
        ));
        if ($key != '') {
            if (isset($status[$key])) {
                return $status[$key];
            }
            return '';
        }
        return $status;
    }
}