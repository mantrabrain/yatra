<?php

class Yatra_Template_Hooks
{
    public function __construct()
    {

        add_action('single_tour_info', array($this, 'tour_info'), 10);
        add_action('yatra_single_tour_booking_form', array($this, 'single_tour_booking_form'), 10, 1);
        add_action('yatra_tour_booking_pricing_content', array(__class__, 'tour_booking_pricing_content'), 10, 3);
        add_action('yatra_single_tour_enquiry_form', array($this, 'single_tour_enquiry_form'), 10, 1);
        add_filter('excerpt_more', array($this, 'post_link'), 11);
        add_filter('yatra_page_wrapper_class', array($this, 'wrapper_class'), 11);
        add_filter('yatra_tour_class', array($this, 'tour_class'), 10);
        add_action('yatra_before_main_content_loop', array($this, 'wrapper_start'), 11);
        add_action('yatra_after_main_content_loop', array($this, 'wrapper_end'), 20);

        add_action('yatra_after_main_content_loop', array($this, 'single_tour_info'), 21);


    }

    public function single_tour_info()
    {
        if (is_singular('tour')) {
            do_action('single_tour_info');
        }
    }

    public function tour_info()
    {
        $yatra_tour_options = new Yatra_Tour_Options(get_the_ID(), null, null);

        $tourData = $yatra_tour_options->getTourData();


        $minimum_pricing = yatra_get_minimum_tour_pricing(get_the_ID());


        echo '<div class="yatra-single-tour-sidebar yatra-col-md-4 yatra-col-xs-12">';

        yatra_get_template('tour/sidebar.php',
            array(
                'data' => $tourData,
                'currency' => yatra_get_current_currency_symbol(),
                'min_regular' => $minimum_pricing['regular_price'],
                'min_sales' => $minimum_pricing['sales_price']
            )
        );
        echo '</div>';
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

    public static function tour_booking_pricing_content($date_wise_info, $pricing_type, $tour_id, $selected_date = null)
    {
        if (!$date_wise_info instanceof Yatra_Tour_Dates) {
            return;
        }

        $total_price = 0;

        $person_info = array();

        $pricing = $date_wise_info->getPricing();

        $total_persons = array();

        if ($pricing instanceof Yatra_Tour_Pricing) {

            yatra_get_template('tour/pricing-item.php',
                array(
                    'pricing_type' => $pricing_type,
                    'yatra_booking_pricing' => $pricing,
                )
            );
            $total_price += $pricing->getMinimumPax() > 0 ? $pricing->getFinalPrice() : 0;

            $total_persons[] = array(
                'id' => $pricing->getID(),
                'number_of_person' => $pricing->getMinimumPax(),
                'price' => $pricing->getSalesPrice() === '' ? $pricing->getRegularPrice() : $pricing->getSalesPrice()
            );
        } else {

            foreach ($pricing as $booking_pricing_args) {

                if ($booking_pricing_args instanceof Yatra_Tour_Pricing) {

                    yatra_get_template('tour/pricing-item.php',
                        array(
                            'pricing_type' => $pricing_type,
                            'yatra_booking_pricing' => $booking_pricing_args,
                        )
                    );
                    $total_price += $booking_pricing_args->getMinimumPax() > 0 ? $booking_pricing_args->getFinalPrice() : 0;

                    $total_persons[] = array(
                        'id' => $booking_pricing_args->getID(),
                        'number_of_person' => $booking_pricing_args->getMinimumPax(),
                        'price' => $booking_pricing_args->getSalesPrice() === '' ? $booking_pricing_args->getRegularPrice() : $booking_pricing_args->getSalesPrice()
                    );
                }
            }
        }
        $total_price = apply_filters('yatra_tour_after_pricing_item', $total_price, $tour_id, $total_persons, $date_wise_info);

        echo '<div class="yatra-tour-total-price">';
        echo '<strong>' . __('Total Price', 'yatra') . '</strong>';
        echo '<span data-total-price="' . esc_attr($total_price) . '">' . yatra_get_price(yatra_get_current_currency_symbol(), $total_price) . '</span>';
        echo '</div>';

        yatra_book_now_button($date_wise_info->getAvailabilityFor($tour_id, $selected_date));
    }

    public function single_tour_enquiry_form($tourData)
    {
        yatra_get_template('tour/enquiry-form.php');
    }

    function post_link($output_filter = '')
    {
        if ((is_admin() && !wp_doing_ajax()) || !yatra_is_archive_page()) {
            return $output_filter;
        }
        $output = '...';

        return apply_filters('yatra_post_link', $output, $output_filter);
    }

    public function wrapper_class($class)
    {

        $display_mode = yatra_get_archive_display_mode();

        $class .= ' yatra-tour-archive-display-mode-' . esc_attr($display_mode);

        return $class;
    }

    public function tour_class($class)
    {
        if (yatra_is_archive_page()) {

            $display_mode = yatra_get_archive_display_mode();

            $class[] = $display_mode === 'grid' ? 'yatra-col-md-6 yatra-col-sm-12' : '';

        }
        return $class;
    }

    public function wrapper_start()
    {
        if (!is_singular('tour')) {
            return;
        }

        $display_class = 'yatra-single-main-content-area-inner';

        echo '<div class="yatra-single-main-content-area yatra-col-md-8 yatra-col-xs-12">';

        do_action('yatra_before_main_content_area_inner');

        echo '<div class="' . esc_attr($display_class) . '">';

    }

    public function wrapper_end()
    {
        if (!is_singular('tour')) {
            return;
        }
        echo '</div><!-- end of .yatra-single-main-content-area-inner-->';


        echo '</div><!-- end of .yatra-single-main-content-area -->';
    }


}

new Yatra_Template_Hooks();