<?php
defined('ABSPATH') || exit;
if (!class_exists('Yatra_Tour_Booking')) {

    class Yatra_Tour_Booking
    {
        private $booking_id;

        public function __construct($booking_id = null)
        {
            $this->booking_id = $booking_id;

        }

        public function book($booking_form_data = array())
        {
            $cart = yatra()->cart->get_items();

            do_action('yatra_before_tour_booking', array('cart' => $cart));

            $tour_ids = array_keys($cart);

            $yatra_tour_id_string = implode(',', $tour_ids);

            $booking_code = '#' . $this->get_booking_code($yatra_tour_id_string);

            $booking_arguments = array(

                'post_title' => $booking_code,
                'post_status' => 'yatra-pending',
                'post_content' => '',
                'post_type' => 'yatra-booking'

            );

            $yatra_tour_customer_info = isset($booking_form_data['yatra_tour_customer_info']) ? $booking_form_data['yatra_tour_customer_info'] : array();

            $booking_failed_tour_ids = array();

            $booking_post_meta_value = array();

            $booking_parameters = array();

            $currency = yatra_get_current_currency();

            if (!empty($yatra_tour_customer_info['email'])) {

                foreach ($tour_ids as $yatra_tour_id) {

                    $selected_date = $cart[$yatra_tour_id]['selected_date'];

                    $number_of_person = $cart[$yatra_tour_id]['number_of_person'];

                    if ($this->is_valid_tour_id($yatra_tour_id, $selected_date, $number_of_person)) {

                        $tour_post = get_post($yatra_tour_id);

                        $tour_options = new Yatra_Tour_Options($yatra_tour_id, $selected_date, $selected_date);

                        $todayDataSettings = $tour_options->getTodayData($selected_date);

                        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

                            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $tour_options->getTourData();

                        } else {

                            $todayData = $tour_options->getTourData();
                        }

                        $booking_post_meta['yatra_tour_id'] = $yatra_tour_id;

                        $booking_post_meta['yatra_tour_name'] = $tour_post->post_title;

                        $booking_post_meta['yatra_selected_date'] = $selected_date;

                        $booking_post_meta['yatra_pricing'] = $todayData->getPricing();

                        $booking_post_meta['yatra_pricing_type'] = $todayData->getPricingType();

                        $booking_post_meta['yatra_tour_meta_tour_duration_nights'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_duration_nights', true);

                        $booking_post_meta['yatra_tour_meta_tour_duration_days'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_duration_days', true);

                        $booking_post_meta['yatra_tour_meta_tour_fixed_departure'] = $tour_options->isFixedDeparture();

                        $booking_post_meta['yatra_tour_meta_tour_country'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_country', true);

                        $booking_post_meta['yatra_currency'] = $currency;

                        $booking_post_meta['number_of_person'] = $number_of_person;

                        $tour_price = yatra_get_tour_price($yatra_tour_id, $number_of_person, $cart[$yatra_tour_id]['selected_date']);

                        $booking_post_meta['total_tour_price'] = $tour_price;

                        $booking_post_meta['total_tour_final_price'] = yatra_get_final_tour_price($yatra_tour_id, $number_of_person, $cart[$yatra_tour_id]['selected_date']);

                        $booking_post_meta = apply_filters('yatra_tour_booking_post_meta', $booking_post_meta, $yatra_tour_id, $cart[$yatra_tour_id]);

                        $booking_post_meta_value[$yatra_tour_id] = $booking_post_meta;

                        array_push($booking_parameters, array(
                            'tour_id' => $yatra_tour_id,
                            'selected_date' => $cart[$yatra_tour_id]['selected_date'],
                            'number_of_person' => $number_of_person
                        ));

                    } else {
                        array_push($booking_failed_tour_ids, $yatra_tour_id);
                    }
                }
            } else {

                $booking_failed_tour_ids = $tour_ids;
            }
            if (count($booking_failed_tour_ids) > 0) {

                do_action('yatra_after_tour_booking_failed', array('tour_ids' => $booking_failed_tour_ids));

                return false;

            } else {

                $booking_id = wp_insert_post($booking_arguments);

                update_post_meta($booking_id, 'yatra_booking_meta', $booking_post_meta_value);

                $coupon = yatra()->cart->get_coupon();

                $yatra_booking_meta_params = array(

                    'total_booking_price' => yatra_get_booking_final_price($booking_parameters),

                    'yatra_currency' => $currency,

                    'booking_date' => yatra_get_date(),

                    'yatra_tour_customer_info' => $yatra_tour_customer_info,

                    'booking_code' => $booking_code,

                    'total_booking_gross_price' => yatra_get_booking_final_price($booking_parameters),

                    'total_booking_net_price' => yatra_get_booking_final_price($booking_parameters, true),

                    'coupon' => $coupon

                );

                $coupon_id = isset($coupon['id']) ? absint($coupon['id']) : 0;

                if ($coupon_id > 0) {

                    $booking_ids = get_post_meta($coupon_id, 'yatra_coupon_usages_bookings', true);

                    $booking_ids = is_array($booking_ids) ? $booking_ids : array();

                    array_push($booking_ids, $booking_id);

                    $booking_ids = array_unique($booking_ids);

                    update_post_meta($coupon_id, 'yatra_coupon_usages_bookings', $booking_ids);
                }

                update_post_meta($booking_id, 'yatra_booking_meta_params', $yatra_booking_meta_params);

                $yatra_booking_meta_params['booking_id'] = $booking_id;

                $customer_id = Yatra_Customers::get_instance()->update($yatra_tour_customer_info, $yatra_booking_meta_params);

                $current_user_id = get_current_user_id();

                if ($current_user_id > 0) {

                    update_post_meta($booking_id, 'yatra_user_id', $current_user_id);

                }
                update_post_meta($booking_id, 'yatra_customer_id', $customer_id);

                foreach ($booking_parameters as $parameter) {

                    $number_of_person = $parameter['number_of_person'];

                    $total_number_of_pax = is_array($number_of_person) ? array_sum($number_of_person) : absint($number_of_person);

                    Yatra_Core_DB::save_data(Yatra_Tables::TOUR_BOOKING_STATS, array(
                        'booking_id' => $booking_id,
                        'tour_id' => $parameter['tour_id'],
                        'customer_id' => $customer_id,
                        'booked_date' => $parameter['selected_date'],
                        'currency' => $currency,
                        'total_number_of_pax' => $total_number_of_pax,
                        'gross_total_price' => yatra_get_final_tour_price($parameter['tour_id'], $number_of_person, $parameter['selected_date']),
                        'net_total_price' => yatra_get_final_tour_price($parameter['tour_id'], $number_of_person, $parameter['selected_date']),
                        'ip_address' => yatra_get_visitor_ip_address(),
                        'created_at' => current_time('mysql')
                    ));
                }

                do_action('yatra_after_tour_booking_completed', array(

                    'tour_ids' => $tour_ids,

                    'booking_id' => $booking_id,


                ));

                return $booking_id;
            }

        }

        private function get_booking_code($yatra_tour_ids)
        {
            $code = sha1(time() . $yatra_tour_ids);

            return substr($code, 0, 10);


        }

        private function is_valid_tour_id($tour_id, $start_date, $number_of_person)
        {
            $booking_validation = new Yatra_Tour_Availability_Validation($tour_id, $start_date, $number_of_person);

            $isAvailabilityValid = $booking_validation->validate();

            if (!$isAvailabilityValid || yatra()->yatra_error->has_errors()) {
                return false;
            }

            $post = get_post($tour_id);

            if (!isset($post->ID)) {
                return false;
            }
            if ($post->ID != $tour_id) {
                return false;
            }
            if ($post->post_type != 'tour') {
                return false;
            }
            if ($post->post_status != 'publish') {
                return false;
            }

            return true;
        }

        public function get($key = null)
        {

            $booking_id = $this->booking_id;

            $booking = get_post($this->booking_id);


        }

        public function get_all_booking_details($booking_id = 0)
        {
            $booking_id = $booking_id > 0 ? $booking_id : $this->booking_id;

            $yatra_booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);

            $yatra_booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            $customer_id = get_post_meta($booking_id, 'yatra_customer_id', true);

            $user_id = get_post_meta($booking_id, 'yatra_user_id', true);

            $booking_details = new stdClass();

            $booking_details->booking_id = $booking_id;

            $booking_details->yatra_booking_meta = $yatra_booking_meta;

            $booking_details->yatra_booking_meta_params = $yatra_booking_meta_params;

            $booking_details->yatra_customer_id = $customer_id;

            $booking_details->yatra_user_id = $user_id;

            return $booking_details;
        }

        public function get_total($net_price = true)
        {
            $booking_details = $this->get_all_booking_details();

            $booking_meta_params = $booking_details->yatra_booking_meta_params ?? array();

            $gross = isset($booking_meta_params['total_booking_gross_price']) ? floatval($booking_meta_params['total_booking_gross_price']) : 0;

            $net = isset($booking_meta_params['total_booking_net_price']) ? floatval($booking_meta_params['total_booking_net_price']) : 0;

            return $net_price ? $net : $gross;

        }

        public function get_id()
        {
            return $this->booking_id;
        }

        public function get_title()
        {
            return get_the_title($this->booking_id);
        }

        public function get_currency_code()
        {
            $booking_details = $this->get_all_booking_details();

            $meta_params = $booking_details->yatra_booking_meta_params ?? array();

            return $meta_params['yatra_currency'] ?? yatra_get_current_currency();
        }

        public function get_coupon()
        {
            $booking_details = $this->get_all_booking_details();

            $meta_params = $booking_details->yatra_booking_meta_params ?? array();

            return $meta_params['coupon'] ?? array();
        }

        public function get_all_booking_by_user_id($user_id = null)
        {
            $user_id = is_null($user_id) ? get_current_user_id() : absint($user_id);

            $updated_bookings = array();

            $all_bookings = get_posts(array(
                'numberposts' => 10,
                'meta_key' => 'yatra_user_id', // need to replace with customer_id_meta_key
                'meta_value' => $user_id, /// need to replace with current user id
                'post_type' => 'yatra-booking',
                'post_status' => 'any'
            ));
            if (is_wp_error($all_bookings)) {

                return $updated_bookings;
            }
            return $all_bookings;
        }
    }

}
