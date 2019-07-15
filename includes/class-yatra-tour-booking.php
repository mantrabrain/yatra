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

        public function book($post_data = array())
        {
            $cart = yatra_instance()->cart->get_cart();

            do_action('before_yatra_tour_booking', array('cart' => $cart));

            $tour_ids = array_keys($cart);

            $yatra_tour_id_string = implode(',', $tour_ids);

            $booking_arguments = array(

                'post_title' => '#' . $this->get_booking_code($yatra_tour_id_string),
                'post_status' => 'yatra-pending',
                'post_content' => '',
                'post_type' => 'yatra-booking'

            );


            $booking_form_data = Yatra_Forms::get_instance()->get_valid_form_data($post_data);

            $yatra_tour_customer_info = isset($booking_form_data['yatra_tour_customer_info']) ? $booking_form_data['yatra_tour_customer_info'] : array();

            $booking_failed_tour_ids = array();

            $booking_post_meta_value = array();

            $total_booking_price = 0;

            $currency = get_option('yatra_currency');

            $currency_symbol = yatra_get_currency_symbols($currency);

            if (!empty($yatra_tour_customer_info['email'])) {

                foreach ($tour_ids as $yatra_tour_id) {

                    if ($this->is_valid_tour_id($yatra_tour_id)) {

                        $tour_post = get_post($yatra_tour_id);

                        $booking_post_meta['yatra_tour_id'] = $yatra_tour_id;

                        $booking_post_meta['yatra_tour_name'] = $tour_post->post_title;

                        $booking_post_meta['yatra_tour_meta_regular_price'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_regular_price', true);

                        $booking_post_meta['yatra_tour_meta_sales_price'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_sales_price', true);

                        $booking_post_meta['yatra_tour_meta_group_size'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_group_size', true);

                        $booking_post_meta['yatra_tour_meta_price_per'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_price_per', true);

                        $booking_post_meta['yatra_tour_meta_tour_duration_nights'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_duration_nights', true);

                        $booking_post_meta['yatra_tour_meta_tour_duration_days'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_duration_days', true);

                        $booking_post_meta['yatra_tour_meta_tour_country'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_country', true);

                        $booking_post_meta['yatra_currency_symbol'] = $currency_symbol;

                        $booking_post_meta['yatra_currency'] = $currency;

                        $number_of_person = $cart[$yatra_tour_id]['number_of_person'];

                        $final_price = yatra_get_final_tour_price($yatra_tour_id, $number_of_person);

                        $total_booking_price += $final_price;

                        $booking_post_meta['yatra_final_price'] = $final_price;

                        $booking_post_meta_value[$yatra_tour_id] = $booking_post_meta;

                    } else {
                        array_push($booking_failed_tour_ids, $yatra_tour_id);
                    }
                }
            } else {

                $booking_failed_tour_ids = $tour_ids;
            }
            if (count($booking_failed_tour_ids) > 0) {

                do_action('after_yatra_tour_booking_failed', array('tour_ids' => $booking_failed_tour_ids));

                return false;

            } else {

                $booking_id = wp_insert_post($booking_arguments);

                update_post_meta($booking_id, 'yatra_booking_meta', $booking_post_meta_value);

                update_post_meta($booking_id, 'yatra_booking_meta_params', array(

                    'total_booking_price' => $total_booking_price,

                    'currency_symbol' => $currency_symbol,

                    'currency' => $currency,

                    'booking_date' => date('Y-m-d H:i:s'),

                    'yatra_tour_customer_info' => $yatra_tour_customer_info

                ));

                do_action('after_yatra_tour_booking_completed', array('tour_ids' => $tour_ids, 'booking_id' => $booking_id));

                return $booking_id;
            }

        }

        private function get_booking_code($yatra_tour_ids)
        {
            $code = sha1(time() . $yatra_tour_ids);

            return substr($code, 0, 10);


        }

        private function is_valid_tour_id($tour_id)
        {
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

        public function update_status($booking_id = 0, $status = 'pending')
        {
            $yatra_booking_statuses = yatra_get_booking_statuses();

            if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

                return false;
            }

            do_action('yatra_before_booking_status_change', array(
                'booking_id' => $booking_id,
                'status' => $status
            ));

            $booking_array = array();
            $booking_array['ID'] = $booking_id;
            $booking_array['post_status'] = $status;

            // Update the post into the database
            wp_update_post($booking_array);

            do_action('yatra_after_booking_status_change', array(
                'booking_id' => $booking_id,
                'status' => $status
            ));

            return true;
        }

    }

}