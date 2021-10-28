<?php

class Yatra_Customers
{

    private $post_type = 'yatra-customers';


    private static $instance;


    public static function get_instance()
    {

        if (empty(self::$instance)) {

            return new self;
        }
        return self::$instance;

    }

    public function update($yatra_tour_customer_info, $yatra_booking_meta_params)
    {

        $email = isset($yatra_tour_customer_info['email']) ? $yatra_tour_customer_info['email'] : '';

        if (empty($email)) {

            return 0;
        }
        $customer_object = get_page_by_title($email, OBJECT, 'yatra-customers');

        $customer_id = isset($customer_object->ID) ? $customer_object->ID : 0;

        if (empty($customer_object) && $customer_id < 1) {

            $customer_arguments = array(

                'post_title' => $email,
                'post_content' => '',
                'post_type' => 'yatra-customers',
                'post_status' => 'publish',


            );
            $customer_id = wp_insert_post($customer_arguments);

        }

        foreach ($yatra_tour_customer_info as $info_key => $info_value) {

            update_post_meta($customer_id, $info_key, $info_value);
        }

        $booking_meta_params_from_db = get_post_meta($customer_id, 'yatra_customer_booking_meta', true);

        if ((is_array($booking_meta_params_from_db) && count($booking_meta_params_from_db) < 1) || !is_array($booking_meta_params_from_db)) {

            $booking_meta_params_from_db = array($yatra_booking_meta_params);

        } else {

            array_push($booking_meta_params_from_db, $yatra_booking_meta_params);
        }
        update_post_meta($customer_id, 'yatra_customer_booking_meta', $booking_meta_params_from_db);

        $current_user_id = get_current_user_id();

        update_post_meta($customer_id, 'yatra_user_id', $current_user_id);

        return $customer_id;
    }

    private function customer_meta()
    {

        return array(
            'fullname',
            ''
        );
    }

}