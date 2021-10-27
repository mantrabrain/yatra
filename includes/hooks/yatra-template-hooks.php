<?php

class Yatra_Template_Hooks
{
    public function __construct()
    {
        add_action('yatra_main_content', array($this, 'single_tour_info'), 15);
        add_action('single_tour_info', array($this, 'tour_info'), 10);
        add_action('yatra_single_tour_booking_form', array($this, 'single_tour_booking_form'), 10);
        add_action('yatra_tour_booking_pricing_content', array(__class__, 'tour_booking_pricing_content'), 10, 2);
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
        yatra_get_template('tour/sidebar.php',
            array(
                //'map' => $yatra_tour_meta_map_content,
                //'title' => $title
            )
        );
    }

    public function single_tour_booking_form()
    {

        $start = date('Y-m-d');

        $end = date('Y-m-d');


        $yatra_tour_options = new Yatra_Tour_Options(get_the_ID(), $start, $end);

        $dynamicData = ($yatra_tour_options->getAllDynamicDataByDateRange());

        if (!$dynamicData instanceof Yatra_Tour_Dates) {

            $dynamicData = $yatra_tour_options->getTourData();
        } else {

            $dynamicData = (boolean)$dynamicData->isActive() ? $dynamicData : $yatra_tour_options->getTourData();
        }


        yatra_get_template('tour/booking-form.php',
            array(
                'pricing_type' => $dynamicData->getPricingType(),
                'yatra_booking_pricing_info' => $dynamicData,
            )
        );


    }

    public static function tour_booking_pricing_content($date_wise_info, $pricing_type)
    {
        if (!$date_wise_info instanceof Yatra_Tour_Dates) {
            return;
        }

        $pricing = $date_wise_info->getPricing();

        if ($pricing instanceof Yatra_Tour_Pricing) {

            yatra_get_template('tour/pricing-item.php',
                array(
                    'pricing_type' => $pricing_type,
                    'yatra_booking_pricing' => $pricing,
                )
            );
        } else {

            foreach ($pricing as $booking_pricing_args) {
                yatra_get_template('tour/pricing-item.php',
                    array(
                        'pricing_type' => $pricing_type,
                        'yatra_booking_pricing' => $booking_pricing_args,
                    )
                );
            }
        }

        yatra_book_now_button($date_wise_info->getAvailabilityFor());
    }

    public function single_tour_enquiry_form()
    {
        yatra_get_template('tour/enquiry-form.php',
            array(
                //'map' => $yatra_tour_meta_map_content,
                //'title' => $title
            )
        );
    }

}

new Yatra_Template_Hooks();