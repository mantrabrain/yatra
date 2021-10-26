<?php

class Yatra_Core_Tour_Availability
{
    public function __construct()
    {

        add_action('yatra_availability_page_output', array($this, 'output'));

        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 11);

        add_action('yatra_availability_calendar_tour_list', array($this, 'calendar_tour_list'));

    }


    public function load_admin_scripts()
    {
        $screen = get_current_screen();

        $screen_id = isset($screen->id) ? $screen->id : '';


        if ($screen_id != 'tour_page_yatra-availability') {
            return;
        }
        wp_enqueue_style('yatra-availability-style', YATRA_PLUGIN_URI . '/assets/admin/css/availability.css', array(
            'yatra-fullcalendar-css'
        ), YATRA_VERSION);

        wp_enqueue_script('yatra-availability-script', YATRA_PLUGIN_URI . '/assets/admin/js/availability.js',
            array('yatra-fullcalendar-js', 'yatra-popper', 'yatra-tippy')
            , YATRA_VERSION);

        $yatra_availability_params = array(

            'ajax_url' => admin_url('admin-ajax.php'),
            'tour_availability' => array(
                'action' => 'yatra_tour_availability',
                'nonce' => wp_create_nonce('wp_yatra_tour_availability_nonce')
            ),
            'day_wise_tour_availability' => array(
                'action' => 'yatra_day_wise_tour_availability',
                'nonce' => wp_create_nonce('wp_yatra_day_wise_tour_availability_nonce')
            ),
            ''
        );

        wp_localize_script('yatra-availability-script', 'yatra_availability_params', $yatra_availability_params);
    }

    public function output()
    {


        echo '<br/>';

        echo '<br/>';

        $this->calendar();
    }

    private function calendar()
    {
        echo '<div  id="yatra-availability-calendar-container">';
        echo '<div class="yatra-availability-calendar-header">';
        echo '<input type="hidden" value="" id="yatra-availability-calendar-tour-id"/>';
        echo '<ul class="symbol">';
        echo '<li class="yatra-tippy-tooltip booking" data-tippy-content="Available for booking">For Booking</li>';
        echo '<li class="yatra-tippy-tooltip enquery" data-tippy-content="Available for enquiry only">For Enquiry Only</li>';
        echo '<li class="yatra-tippy-tooltip not-available" data-tippy-content="Booking & enquiry not available">Not Available for Booking & Enquiry</li>';
        echo '</ul>';
        echo '</div>';

        echo '<div class="yatra-availability-calendar-content-body">';

        do_action('yatra_availability_calendar_tour_list');

        echo '<div  id="yatra-availability-calendar-wrap">';

        echo '<div  id="yatra-availability-calendar">';


        echo '</div>';

        echo '</div>';

        echo '</div>';

        echo '</div>';

    }

    /*
     * $filter_condition  = array('is_expired'=>false, is_full=>false, is_
     */

    public static function get_availability($tour_id, $start_date, $end_date, $filter_condition = array(), $date_index = false)
    {

        $fixed_departure = (boolean)get_post_meta($tour_id, 'yatra_tour_meta_tour_fixed_departure', true);

        $yatra_tour_availability = yatra_tour_meta_availability_date_ranges($tour_id);

        if (!$fixed_departure || (count($yatra_tour_availability) < 1)) {
            $start_date = new DateTime($start_date);
            $end_date = new DateTime($end_date);
            $end_date->modify('-1 day');
            $yatra_tour_availability = array(
                array(
                    'start' => $start_date->format("Y-m-d"),
                    'end' => $end_date->format("Y-m-d")
                )
            );
        }

        $all_responses = array();


        foreach ($yatra_tour_availability as $availability) {

            $begin = new DateTime($availability['start']);

            $end = new DateTime($availability['end']);

            $tour_options = new Yatra_Tour_Options($tour_id, $begin->format("Y-m-d"), $end->format("Y-m-d"));

            $settings = $tour_options->getAllDynamicDataByDateRange();

            $tourData = $tour_options->getTourData();


            for ($i = $begin; $i <= $end; $i->modify('+1 day')) {

                $single_date = $i->format("Y-m-d");


                $single_response = self::get_single_availability($single_date, $settings, $tourData);

                $condition_index = 0;

                foreach ($filter_condition as $condition_array_index => $condition_value) {
                    if (isset($single_response[$condition_array_index])) {
                        if ($single_response[$condition_array_index] === $condition_value) {
                            $condition_index++;
                        }
                    }


                }

                if ($condition_index === count($filter_condition)) {
                    if ($date_index) {
                        $all_responses[$single_date] = $single_response;
                    } else {
                        $all_responses[] = $single_response;
                    }
                }
            }
        }


        return $all_responses;
    }

    private static function get_single_availability($start_date, $settings, $tourData)
    {
        $date_index = str_replace(' ', '', trim($start_date . '00:00:00_' . $start_date . '23:59:59'));

        $todayDataSettings = null;

        if ($settings instanceof Yatra_Tour_Dates) {

            $todayDataSettings = $settings;

        } else if (is_array($settings) && isset($settings[$date_index])) {

            $todayDataSettings = $settings[$date_index];

        }

        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $tourData;

        } else {

            $todayData = $tourData;
        }

        if (!$todayData instanceof Yatra_Tour_Dates) {

            return array();
        }


        $current_date = date('Y-m-d');

        $response = array();

        $is_active = (boolean)$todayData->isActive();

        $max_travellers = $todayData->getMaxTravellers();

        $booked_travellers = $todayData->getBookedTravellers();

        $availability = $todayData->getAvailabilityFor();

        $availability_label = yatra_tour_availability_status($availability);

        $pricing = $todayData->getPricing();

        $is_full = $max_travellers <= $booked_travellers && $booked_travellers != '' & $max_travellers != '';

        $is_expired = (strtotime($start_date) < strtotime($current_date));

        if ('' != $start_date) {

            if ($todayData->getPricingType() !== 'multi') {

                /* @var $single_pricing Yatra_Tour_Pricing */
                $single_pricing = $pricing;

                $regular = $single_pricing->getRegularPrice();

                $discounted = $single_pricing->getSalesPrice();

                $pricing_label = $single_pricing->getLabel();

                $final_pricing = '' === $discounted ? $regular : $discounted;

                $current_currency_symbol = '$';//yatra_get_current_currency_symbol();

                $title = "{$pricing_label}: {$current_currency_symbol}{$final_pricing}";

                if ($is_full) {
                    $title = __('Booking Full', 'yatra');
                }

                $response = array(
                    "title" => $title,
                    "start" => $start_date,
                    "description" => "<strong>{$availability_label}</strong><hr/>{$pricing_label}: {$current_currency_symbol}{$final_pricing}",
                    "is_active" => $is_active,
                    "availability" => $availability,
                    'is_full' => $is_full,
                    'is_expired' => $is_expired


                );
            } else {

                $title = '';

                $description = "<strong>{$availability_label}</strong><hr/>";

                /* @var $single_pricing Yatra_Tour_Pricing */
                foreach ($pricing as $single_pricing) {


                    $regular = $single_pricing->getRegularPrice();

                    $discounted = $single_pricing->getSalesPrice();

                    $final_pricing = '' === $discounted ? $regular : $discounted;

                    $pricing_label = $single_pricing->getLabel();

                    $current_currency_symbol = '$';//yatra_get_current_currency_symbol();

                    $title .= "{$pricing_label}: {$current_currency_symbol}{$final_pricing} <br/> ";

                    $description .= "{$pricing_label}&nbsp;:&nbsp; <strong style='float:right;'>{$current_currency_symbol}{$final_pricing}</strong> <br/> ";

                }
                if ($is_full) {
                    $title = __('Booking Full', 'yatra');
                }
                $response = array(
                    "title" => $title,
                    //"event" => $title,
                    "start" => $start_date,
                    "description" => $description,
                    "is_active" => $is_active,
                    "availability" => $availability,
                    'is_full' => $is_full,
                    'is_expired' => $is_expired


                );
            }


        }


        return $response;
    }

    public static function get_day_wise_availability_form($tour_id, $start_date, $end_date, $content_only = false)
    {

        $tour_options = new Yatra_Tour_Options($tour_id, $start_date, $end_date);

        $tourData = $tour_options->getAllDynamicDataByDateRange();

        if (!$tourData instanceof Yatra_Tour_Dates) {

            $tourData = $tour_options->getTourData();

        }
        $yatra_availability['max_travellers'] = $tourData->getMaxTravellers();

        $yatra_availability['availability_for'] = $tourData->getAvailabilityFor();

        $pricings = $tourData->getPricing();

        $pricing_type = $tourData->getPricingType();

        $active_status = (boolean)$tourData->isActive();

        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        $template = '';

        $form_class = $active_status === false ? 'form yatra-deactivate-form' : 'form';

        ob_start();

        echo '<form id="yatra-availability-calendar-popup-form" method="post" class="' . esc_attr($form_class) . '">';

        /* echo '<pre>';
         print_r($settings);
         print_r($tourData);
         echo '</pre>';*/

        if (!$content_only) {

            $yatra_tour_meta_availability_date_ranges = yatra_tour_meta_availability_date_ranges($tour_id);

            yatra_load_admin_template('availability.availability-calendar-date', array(
                'selected_dates' => array(
                    'start' => $start_date,
                    'end' => $end_date
                ),
                'availability_dates' => $yatra_tour_meta_availability_date_ranges,
                'active_status' => $active_status
            ));


        }

        echo '<div class="yatra-availability-calendar-pricing-content">';

        yatra_load_admin_template('availability.availability-calendar-header', array(
            'start_date' => $start_date,
            'end_date' => $end_date,
            'pricing_type' => $pricing_type,
            'tour_id' => $tour_id,
            'yatra_availability' => $yatra_availability
        ));

        if ($pricings instanceof Yatra_Tour_Pricing) {
            self::load_pricing($pricings, $currency);

        } else {
            foreach ($pricings as $pricing_option_id => $pricing) {

                if ($pricing instanceof Yatra_Tour_Pricing) {
                    self::load_pricing($pricing, $currency);
                }
            }
        }

        wp_nonce_field('wp_yatra_day_wise_tour_availability_save_nonce', 'yatra_nonce', true, true);

        echo '<input type="hidden" name="action" value="yatra_day_wise_tour_availability_save"/>';
        echo '<input type="submit" style="display: none"/>';

        echo '</div>';

        echo '</form>';

        $template .= ob_get_clean();


        $response = array(
            'title' => $start_date . ' - ' . $end_date,
            'data' => $template,
            'fixed_date_ranges' => yatra_tour_meta_availability_date_ranges($tour_id)
        );
        echo json_encode($response);
        exit;
    }

    private static function load_pricing(Yatra_Tour_Pricing $pricing, $currency_symbol)
    {
        yatra_load_admin_template('availability.availability-calendar', array(
            'id' => $pricing->getID(),
            'currency_symbol' => $currency_symbol,
            'pricing_option_id' => 'yatra_availability_pricing[' . $pricing->getID() . ']',
            'pricing' => $pricing
        ));

    }

    public function calendar_tour_list()
    {
        $the_query = new WP_Query(
            array('posts_per_page' => 30,
                'post_type' => 'tour',
                'paged' => get_query_var('paged') ? get_query_var('paged') : 1)
        );
        echo '<ul class="yatra-availability-tour-lists">';
        while ($the_query->have_posts()):

            $the_query->the_post();
            echo '<li>';
            echo '<a data-id="' . absint(get_the_ID()) . '" target="_blank" href="' . esc_url(get_the_permalink()) . '">#' . absint(get_the_ID()) . ' - ' . esc_html(get_the_title()) . '</a>';
            echo '</li>';

        endwhile;
        echo '</ul>';
    }
}

new Yatra_Core_Tour_Availability();