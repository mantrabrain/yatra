<?php
if (!function_exists('yatra_get_account_menu_items')) {

    function yatra_get_account_menu_items()
    {

        $items = array(
            'my-account' => array(
                'label' => __('Account', 'yatra'),
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
                'label' => __('Bookings', 'yatra'),
                'items' => array(
                    'bookings' => array(
                        'label' => __('My Bookings', 'yatra'),
                        'icon' => 'fa fa-file-alt',

                    ),
                    'payment' => array(
                        'label' => __('Payment History', 'yatra'),
                        'icon' => 'fas fa-dollar-sign',

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
        if ($current_endpoint === "bookings" && isset($_GET['booking_id'])) {

            $booking_id = absint($_GET['booking_id']);

            if (yatra_user_can_modify_booking($booking_id)) {
                return;
            }

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

        $booking = new Yatra_Tour_Booking();

        if (yatra_user_can_modify_booking($booking_id)) {

            $yatra_booking_meta = $booking->get_all_booking_details($booking_id);

            $yatra_booking_meta = isset($yatra_booking_meta->yatra_booking_meta) ? $yatra_booking_meta->yatra_booking_meta : array();

            yatra_get_template('myaccount/tmpl-booking-details.php',
                array('yatra_booking_meta' => $yatra_booking_meta)
            );

        } else {

            $all_booking_data = $booking->get_all_booking_by_user_id();

            $booking_details = array();

            foreach ($all_booking_data as $booking) {

                $yatra_booking = new Yatra_Tour_Booking($booking->ID);

                $all_booking_details = $yatra_booking->get_all_booking_details($booking->ID);

                $booking_meta_params = $all_booking_details->yatra_booking_meta_params;

                $yatra_booking_meta = $all_booking_details->yatra_booking_meta;

                $payment = new Yatra_Payment();

                $total_paid_amount = $payment->get_total_paid_amount($booking->ID);

                $net_total_booking_price = $yatra_booking->get_total(true);
                $remaining_payment = absint($net_total_booking_price) > absint($total_paid_amount) ? $net_total_booking_price - $total_paid_amount : 0;
                $payment_status_key = $total_paid_amount === $net_total_booking_price ? 'paid' : 'pending';
                $payment_status = $total_paid_amount === $net_total_booking_price ? __('Paid', 'yatra') : __('Pending', 'yatra');
                $booking_detail = new stdClass();
                $booking_detail->booking_id = $booking->ID;
                $booking_detail->booking_status = yatra_get_booking_statuses($booking->post_status);
                $booking_detail->booking_status_key = @substr($booking->post_status, 6);
                $booking_detail->booking_code = $booking_meta_params['booking_code'];
                $booking_detail->booking_date = $booking_meta_params['booking_date'];
                $booking_detail->booking_total = $net_total_booking_price;
                $currency = $booking_meta_params['currency'] ?? '';
                $currency = $booking_meta_params['yatra_currency'] ?? $currency;
                $booking_detail->booking_currency_symbol = yatra_get_current_currency_symbol($currency);
                $booking_detail->number_of_tours = count($yatra_booking_meta);
                $booking_detail->coupon = $booking_meta_params['coupon'] ?? array();
                $booking_detail->payment_status = $payment_status;
                $booking_detail->payment_status_key = $payment_status_key;
                $booking_detail->remaining_payment = $remaining_payment;
                $booking_detail->make_payment_text = $remaining_payment > 0 ? __('Make payment of ', 'yatra') . yatra_get_price($booking_detail->booking_currency_symbol, $remaining_payment) : '';

                array_push($booking_details, $booking_detail);
            }

            yatra_get_template('myaccount/tmpl-booking.php', array('booking_details' => $booking_details));
        }
    }
}

if (!function_exists('yatra_account_payment_history')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_payment_history()
    {

        $booking = new Yatra_Tour_Booking();

        $all_bookings = $booking->get_all_booking_by_user_id();

        $payment_details = array();

        foreach ($all_bookings as $booking) {

            $booking_id = $booking->ID;

            $payment = new Yatra_Payment();

            $all_info = $payment->get_all_info($booking_id, 'any', false);

            foreach ($all_info as $payment_id => $info) {
                $payment_details[$payment_id] = $info;
            }

        }


        yatra_get_template('myaccount/tmpl-payment-history.php', array('payment_details' => $payment_details));
    }

}

if (!function_exists('yatra_account_bookings_item')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_bookings_item($bookings)
    {
        foreach ($bookings as $id => $booking) {

            yatra_get_template('myaccount/tmpl-booking-item.php', array('booking' => $booking, 'id' => $id));

        }
    }
}

if (!function_exists('yatra_account_booking_payment_history')) {

    /**
     * My Account navigation template.
     */
    function yatra_account_booking_payment_history($bookings)
    {

        $booking_id = yatra_get_var($_GET['booking_id'], 0);

        $booking_id = absint($booking_id);
        
        if (!yatra_user_can_modify_booking($booking_id)) {

            return;
        }

        $payment = new Yatra_Payment();

        $all_info = $payment->get_all_info($booking_id, 'any', false);


        yatra_get_template('myaccount/tmpl-payment-history.php', array('payment_details' => $all_info));


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

        Yatra_User_Form::get_instance()->render();
    }
}
if (!function_exists('yatra_account_notices')) {

    function yatra_account_notices()
    {
        yatra_get_validation_messages('yatra_user_profile_update_message', 'error', 'yatra-user-profile-update');
        yatra_get_validation_messages('yatra_user_profile_update_message', 'success', 'yatra-user-profile-update');
    }
}


if (!function_exists('yatra_login_notices')) {

    function yatra_login_notices()
    {
        yatra_get_validation_messages('yatra_login_error_message', 'error', 'yatra-login-notice');

    }
}

if (!function_exists('yatra_registration_notices')) {

    function yatra_registration_notices()
    {
        yatra_get_validation_messages('yatra_registration_error_message', 'error', 'yatra-registration-notice');

    }
}

if (!function_exists('yatra_checkout_form_error')) {

    function yatra_checkout_form_error()
    {
        yatra_get_validation_messages(array('yatra_booking_errors', 'yatra_form_validation_errors', 'yatra_checkout_error_message'), 'error', 'yatra-on-checkout');
    }
}

if (!function_exists('yatra_get_validation_messages')) {

    function yatra_get_validation_messages($message_id_value, $type = 'messages', $context = '')
    {
        $all_messages = array(
            'error' => array(),
            'warning' => array(),
            'success' => array()
        );

        $message_ids = is_array($message_id_value) ? $message_id_value : array($message_id_value);

        foreach ($message_ids as $message_id) {

            if ($type === 'error') {

                if (is_yatra_error(yatra()->yatra_error)) {

                    $error_messages = yatra()->yatra_error->get_error_messages($message_id);

                    if (is_array($error_messages)) {

                        $all_messages['error'] = array_merge($all_messages['error'], $error_messages);

                    } else if ($error_messages != '') {

                        array_push($all_messages['error'], $error_messages);
                    }


                }
            } else {
                if (yatra()->yatra_messages->has_messages($message_id)) {

                    $messages = yatra()->yatra_messages->get_messages($message_id);

                    if (count($messages) > 0) {
                        if (isset($messages['error'])) {
                            $all_messages['error'] = array_merge($all_messages['error'], $messages['error']);
                        }
                        if (isset($messages['warning'])) {
                            $all_messages['warning'] = array_merge($all_messages['warning'], $messages['warning']);
                        }
                        if (isset($messages['success'])) {
                            $all_messages['success'] = array_merge($all_messages['success'], $messages['success']);
                        }

                    }
                }
            }
        }
        $context = $context == '' ? 'yatra-general-message' : $context;

        if (count($all_messages) > 0) {

            foreach ($all_messages as $message_type => $message_list) {

                if (count($message_list) > 0) {

                    echo '<ul class="yatra-messages yatra-' . esc_attr($message_type) . ' ' . esc_attr($context) . '">';

                    foreach ($message_list as $message_text) {

                        echo '<li>' . wp_kses($message_text, array('span', 'strong', 'a' => array('href' => array()))) . '</li>';

                    }

                    echo '</ul>';
                }
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

        Yatra_Change_Password_Form::get_instance()->render();

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

        do_action('yatra_cart_person_pricing_section', $cart_id, $cart_items, $tour_id);
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
        $args = array(

            'decimals' => get_option('yatra_price_number_decimals', 2),

            'decimal_separator' => get_option('yatra_decimal_separator', '.'),

            'thousand_separator' => get_option('yatra_thousand_separator', ',')

        );

        if (floatval($price) < 1) {
            $price = 0;
        }

        $price = apply_filters('formatted_yatra_price',
            number_format($price, $args['decimals'], $args['decimal_separator'], $args['thousand_separator']), $price, $args['decimals'], $args['decimal_separator'], $args['thousand_separator'], $price);

        $currency_position = get_option('yatra_currency_position');

        if ($currency_position === "left_space") {

            $price_string = ($currency . ' ' . $price);

        } else if ($currency_position === "right_space") {
            $price_string = ($price . ' ' . $currency);

        } else if ($currency_position === "right") {

            $price_string = ($price . $currency);

        } else {
            $price_string = ($currency . $price);

        }


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
function yatra_tour_class($class = '', $tour_id = null)
{
    echo 'class="' . esc_attr(implode(' ', yatra_get_tour_class($class, $tour_id))) . '"';
}

function yatra_get_tour_class($class = '', $tour_id = null)
{

    if (is_null($tour_id)) {

        $tour_id = get_the_ID();
    }
    if ($class) {
        if (!is_array($class)) {
            $class = preg_split('#\s+#', $class);
        }
    } else {
        $class = array();
    }

    $post_classes = array_map('esc_attr', $class);

    if ('tour' !== get_post_type($tour_id)) {
        return $post_classes;
    }

    $classes[] = 'yatra-tour-single-item';

    $classes = apply_filters('yatra_tour_class', $classes, $tour_id);

    return array_map('esc_attr', array_unique(array_filter($classes)));
}

if (!function_exists('yatra_get_page_wrapper_class')) {

    function yatra_get_page_wrapper_class()
    {
        $class = 'yatra-page-wrapper';

        $container_class = get_option('yatra_page_container_class');

        $container_class = $container_class == '' || !$container_class ? 'yatra-container' : $container_class;

        $class = $class . ' ' . $container_class;

        return apply_filters('yatra_page_wrapper_class', $class);

    }
}
if (!function_exists('yatra_get_archive_display_mode')) {

    function yatra_get_archive_display_mode()
    {
        $filter_params = yatra_get_filter_params();

        $display_mode = $filter_params->display_mode ?? 'list';

        $display_mode = $display_mode === 'grid' || $display_mode === 'list' ? $display_mode : 'list';

        return $display_mode;
    }
}
if (!function_exists('yatra_is_featured_tour')) {

    function yatra_is_featured_tour($tour_id = null)
    {
        $tour_id = is_null($tour_id) ? get_the_ID() : $tour_id;

        return (boolean)get_post_meta($tour_id, 'yatra_tour_meta_tour_featured', true);


    }
}
if (!function_exists('yatra_get_price_html')) {
    function yatra_get_price_html($tour_id = null)
    {
        $tour_id = is_null($tour_id) ? get_the_ID() : $tour_id;

        yatra_get_template('parts/price.php',
            array('yatra_tour_id' => $tour_id)
        );

    }
}