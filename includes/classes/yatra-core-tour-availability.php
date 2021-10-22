<?php

class Yatra_Core_Tour_Availability
{
    public function __construct()
    {

        add_action('yatra_availability_page_output', array($this, 'output'));

        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 11);

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
        $id = isset($_GET['tour_id']) ? absint($_GET['tour_id']) : 27;

        echo '<div  id="yatra-availability-calendar-container">';
        echo '<input type="text" value="' . esc_attr($id) . '" id="yatra-availability-calendar-tour-id"/>';
        echo '<div  id="yatra-availability-calendar">';

        echo '</div>';

        echo '</div>';

    }

    public static function get_availability($tour_id, $start_date, $end_date)
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

            $availability_data = yatra()->tour->get_availability_pricing(
                1, $begin->format("Y-m-d"), $end->format("Y-m-d"), array(
                'pricing',
                'sales_price',
                'label'
            ),
                $tour_id
            );

            for ($i = $begin; $i <= $end; $i->modify('+1 day')) {

                $single_date = $i->format("Y-m-d");

                $all_responses[] = self::get_single_availability($single_date, $tour_id, $availability_data);
            }
        }


        return $all_responses;
    }

    private static function get_single_availability($start_date, $tour_id, $availability_data)
    {
        $response = array();

        $availability_data_index = str_replace(' ', '', ($start_date . '00:00:00_' . $start_date . '23:59:59'));

        $availability_data_array = isset($availability_data[$availability_data_index]) ? $availability_data[$availability_data_index] : array();

        $pricing = isset($availability_data_array['pricing']) ? $availability_data_array['pricing'] : array();


        if ('' != $start_date) {

            $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);

            if (!$yatra_multiple_pricing) {

                $regular = isset($pricing['regular_price']) ? $pricing['regular_price'] : get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);

                $discounted = isset($pricing['sales_price']) ? $pricing['sales_price'] : get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);

                $final_pricing = '' === $discounted ? $regular : $discounted;

                $pricing_label = __('Default Pricing', 'yatra');

                $current_currency_symbol = '$';//yatra_get_current_currency_symbol();

                $response = array(
                    "title" => "{$pricing_label}: {$current_currency_symbol}{$final_pricing}",
                    "start" => $start_date,
                    "description" => "{$pricing_label}: {$current_currency_symbol}{$final_pricing}",


                );
            } else {
                $title = '';

                $description = '';

                foreach ($yatra_multiple_pricing as $pricing_index => $single_pricing) {

                    $single_pricing = isset($pricing[$pricing_index]) ? $pricing[$pricing_index] : $single_pricing;

                    $regular = $single_pricing['regular_price'];

                    $discounted = $single_pricing['sales_price'];

                    $final_pricing = '' === $discounted ? $regular : $discounted;

                    $pricing_label = $single_pricing['pricing_label'];

                    $current_currency_symbol = '$';//yatra_get_current_currency_symbol();

                    $title .= "{$pricing_label}: {$current_currency_symbol}{$final_pricing} <br/> ";

                    $description .= "{$pricing_label}&nbsp;:&nbsp; <strong style='float:right;'>{$current_currency_symbol}{$final_pricing}</strong> <br/> ";

                }
                $response = array(
                    "title" => $title,
                    "event" => $title,
                    "start" => $start_date,
                    "description" => $description

                );
            }


        }


        return $response;
    }

    public static function get_day_wise_availability_form($tour_id, $start_date, $end_date, $content_only = false)
    {

        yatra()->tour->maybe_initialize($tour_id);

        $pricings = yatra()->tour->get_pricing();

        $pricing_type = yatra()->tour->get_pricing_type();

        yatra()->tour->maybe_flush();

        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);


        $template = '';

        ob_start();

        echo '<form id="yatra-availability-calendar-popup-form">';

        if (!$content_only) {

            $yatra_tour_meta_availability_date_ranges = yatra_tour_meta_availability_date_ranges($tour_id);

            yatra_load_admin_template('availability.availability-calendar-date', array(
                'selected_dates' => array(
                    'start' => $start_date,
                    'end' => $end_date
                ),
                'availability_dates' => $yatra_tour_meta_availability_date_ranges
            ));


        }

        echo '<div class="yatra-availability-calendar-pricing-content">';

        yatra_load_admin_template('availability.availability-calendar-header', array(
            'start_date' => $start_date,
            'end_date' => $end_date,
            'pricing_type' => $pricing_type,
            'tour_id' => $tour_id
        ));

        foreach ($pricings as $pricing_option_id => $pricing) {

            yatra_load_admin_template('availability.availability-calendar', array(
                'id' => $pricing_option_id,
                'currency_symbol' => $currency_symbol,
                'pricing_option_id' => 'yatra_availability_pricing[' . $pricing_option_id . ']',
                'pricing' => $pricing
            ));


        }

        wp_nonce_field('wp_yatra_day_wise_tour_availability_save_nonce', 'yatra_nonce', true, true);

        echo '<input type="hidden" name="action" value="yatra_day_wise_tour_availability_save"/>';

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
}

new Yatra_Core_Tour_Availability();