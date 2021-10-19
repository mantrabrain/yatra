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
            )
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
        echo '<div  id="yatra-availability-calendar">';

        echo '</div>';

        echo '</div>';

    }

    public static function get_availability($tour_id, $start_date, $end_date)
    {
        $fixed_departure = (boolean)get_post_meta($tour_id, 'yatra_tour_meta_tour_fixed_departure', true);

        $yatra_tour_availability = yatra_tour_availability($tour_id);

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

            for ($i = $begin; $i <= $end; $i->modify('+1 day')) {
                $single_date = $i->format("Y-m-d");

                $all_responses[] = self::get_single_availability($single_date, $tour_id);
            }
        }


        return $all_responses;
    }

    private static function get_single_availability($start_date, $tour_id)
    {
        $response = array();

        if ('' != $start_date) {

            $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);

            if (!$yatra_multiple_pricing) {

                $regular = get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);

                $discounted = get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);

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

                foreach ($yatra_multiple_pricing as $single_pricing) {

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

    public static function get_day_wise_availability_form()
    {
        $post_id = 27;
        
        yatra()->tour->maybe_initialize($post_id);

        $pricings = yatra()->tour->get_pricing();

        yatra()->tour->maybe_flush();

        $currency = get_option('yatra_currency');

        $currency_symbol = yatra_get_currency_symbols($currency);

        $template = '';

        foreach ($pricings as $pricing_option_id => $pricing) {

            ob_start();

            yatra_load_admin_template('availability.group-pricing-calendar', array(
                'id' => $pricing_option_id,
                'currency_symbol' => $currency_symbol,
                'pricing_option_id' => 'yatra_multiple_pricing[' . $pricing_option_id . ']',
                'pricing' => $pricing
            ));

            $template .= ob_get_clean();
        }


        $response = array(
            'title' => "This is Sample Title",
            'data' => $template
        );
        echo json_encode($response);
        exit;
    }
}

new Yatra_Core_Tour_Availability();