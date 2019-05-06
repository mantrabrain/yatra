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
            $yatra_tour_id = absint($post_data['yatra_tour_id']);

            do_action('before_yatra_tour_booking', array('tour_id' => $yatra_tour_id));

            if ($this->is_valid_tour_id($yatra_tour_id)) {

                $valid_form_data = Yatra_Forms::get_instance()->get_valid_form_data($post_data);

                $tour_post = get_post($yatra_tour_id);

                $valid_form_data['yatra_tour_id'] = $yatra_tour_id;

                $valid_form_data['yatra_tour_name'] = $tour_post->post_title;

                $valid_form_data['yatra_tour_price'] = get_post_meta($yatra_tour_id, 'yatra_tour_meta_tour_price', true);

                $currency = yatra_get_global_settings('yatra_currency');

                $currency_symbol = get_yatra_currency_symbols($currency);

                $valid_form_data['yatra_currency_symbol'] = $currency_symbol;

                $valid_form_data['yatra_currency'] = $currency;


                $booking_arguments = array(

                    'post_title' => '#' . $yatra_tour_id . '-' . $this->get_booking_code($yatra_tour_id),
                    'post_status' => 'yatra-pending',
                    'post_content' => '',
                    'post_type' => 'yatra-booking'

                );

                $booking_id = wp_insert_post($booking_arguments);

                update_post_meta($booking_id, 'yatra_booking_meta', $valid_form_data);

                do_action('after_yatra_tour_booking_completed', array('tour_id' => $yatra_tour_id));

                return $booking_id;
            } else {

                do_action('after_yatra_tour_booking_failed', array('tour_id' => $yatra_tour_id));

                return false;
            }

        }

        private function get_booking_code($tour_id)
        {
            $code = sha1(time() . $tour_id);

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