<?php

class Yatra_Template_Hooks
{
    public function __construct()
    {
        add_action('yatra_main_content', array($this, 'single_tour_info'), 15);
        add_action('single_tour_info', array($this, 'tour_info'), 10);
        add_action('yatra_single_tour_booking_form', array($this, 'single_tour_booking_form'), 10);
        add_action('yatra_single_tour_enquiry_form', array($this, 'single_tour_enquiry_form'), 10);
    }

    public function single_tour_info()
    {
        if (is_single()) {
            do_action('single_tour_info');
        }
    }

    public function tour_info()
    {
        yatra_get_template('parts/tour-sidebar.php',
            array(
                //'map' => $yatra_tour_meta_map_content,
                //'title' => $title
            )
        );
    }


    public function single_tour_booking_form()
    {

        $booking_pricing_info = yatra_booking_pricing_details();

        foreach ($booking_pricing_info as $pricing_key => $pricing_detail) {

            $price_per = isset($pricing_detail['pricing_per']) ? $pricing_detail['pricing_per'] : 'single';
            $group_size = isset($pricing_detail['group_size']) ? $pricing_detail['group_size'] : 1;
            $person_count = isset($pricing_detail['minimum_pax']) ? absint($pricing_detail['minimum_pax']) : 1;
            $person_count = $person_count == 0 ? 1 : $person_count;
            $person_count = $price_per == 'person' ? $person_count : ceil($person_count / $group_size);
            $regular_price = isset($pricing_detail['regular_price']) ? absint($pricing_detail['regular_price']) : 0;
            $sales_price = isset($pricing_detail['sales_price']) ? absint($pricing_detail['sales_price']) : 0;
            $sales_price = isset($pricing_detail['sales_price']) && '' != $pricing_detail['sales_price'] ? $sales_price : $regular_price;
            $regular_price = ($regular_price * $person_count);
            $booking_pricing_info[$pricing_key]['final_price'] = $sales_price;
            $sales_price = ($sales_price * $person_count);
            $booking_pricing_info[$pricing_key]['regular_price'] = $regular_price;
            $booking_pricing_info[$pricing_key]['sales_price'] = $sales_price;
        }

        /*echo '<pre>';
        print_r($booking_pricing_info);
        echo '</pre>';*/

        yatra_get_template('parts/tour-booking-form.php',
            array(
                'yatra_booking_pricing_info' => $booking_pricing_info,
            )
        );
    }

    public function single_tour_enquiry_form()
    {
        yatra_get_template('parts/tour-enquiry-form.php',
            array(
                //'map' => $yatra_tour_meta_map_content,
                //'title' => $title
            )
        );
    }

}

new Yatra_Template_Hooks();