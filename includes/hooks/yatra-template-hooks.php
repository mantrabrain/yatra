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

        yatra()->tour->maybe_initialize();

        $start = date('Y-m-d');

        $end = date('Y-m-d');

        $pricing_index = $start . '00:00:00_' . $end . '23:59:59';

        $pricing = yatra()->tour->get_pricing_by_date($start, $end, null);

        $final_pricing_array = isset($pricing[$pricing_index]) ? $pricing[$pricing_index] : array();

        $final_pricing = isset($final_pricing_array['pricing']) ? $final_pricing_array['pricing'] : array();


        yatra_get_template('parts/tour-booking-form.php',
            array(
                'pricing_type' => yatra()->tour->get_pricing_type(),
                'yatra_booking_pricing_info' => $final_pricing,
            )
        );

        yatra()->tour->maybe_flush();

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