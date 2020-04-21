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
       /* $booking_pricing_info = array(
            array(
                'name' => 'yatra_number_of_person[single_pricing]',
                'pricing_label' => 'Person',
                'regular_price' => '$ 15',
                'sales_price' => '$ 5',
                'pricing_per' => 'group',
                'group_size' => 5
            ), array(
                'name' => 'yatra_number_of_person[single_pricing1]',
                'pricing_label' => 'Person',
                'regular_price' => '$ 15',
                'sales_price' => '$ 5',
                'pricing_per' => 'group',
                'group_size' => 5
            )
        );*/
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