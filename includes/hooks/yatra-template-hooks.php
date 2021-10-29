<?php

class Yatra_Template_Hooks
{
    public function __construct()
    {
        add_action('yatra_main_content', array($this, 'single_tour_info'), 15);
        add_action('single_tour_info', array($this, 'tour_info'), 10);
        add_action('yatra_single_tour_booking_form', array($this, 'single_tour_booking_form'), 10, 1);
        add_action('yatra_tour_booking_pricing_content', array(__class__, 'tour_booking_pricing_content'), 10, 2);
        add_action('yatra_single_tour_enquiry_form', array($this, 'single_tour_enquiry_form'), 10, 1);
    }

    public function single_tour_info()
    {
        if (is_single()) {
            do_action('single_tour_info');
        }
    }

    public function tour_info()
    {
        $yatra_tour_options = new Yatra_Tour_Options(get_the_ID(), null, null);

        $tourData = $yatra_tour_options->getTourData();

        $pricing = $tourData->getPricing();

        $min_regular_price = 0;

        $min_sales_price = 0;

        if ($pricing instanceof Yatra_Tour_Pricing) {

            $min_regular_price = $pricing->getRegularPrice();

            $min_sales_price = $pricing->getSalesPrice();
        } else {

            /* @var $single Yatra_Tour_Pricing */
            foreach ($pricing as $single) {

                $regular_price = $single->getRegularPrice();

                $sales_price = $single->getSalesPrice();

                $min_pax = $single->getMinimumPax();

                if (absint($min_pax) > 0) {

                    $min_sales_price += $sales_price;

                    $min_regular_price += $regular_price;


                }
            }
        }

        yatra_get_template('tour/sidebar.php',
            array(
                'data' => $tourData,
                'currency' => '$',
                'min_regular' => $min_regular_price,
                'min_sales' => $min_sales_price
            )
        );
    }

    public function single_tour_booking_form($tourData)
    {

        yatra_get_template('tour/booking-form.php',
            array(
                'pricing_type' => $tourData->getPricingType(),
                'yatra_booking_pricing_info' => $tourData,
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

    public function single_tour_enquiry_form($tourData)
    {
        yatra_get_template('tour/enquiry-form.php');
    }

}

new Yatra_Template_Hooks();