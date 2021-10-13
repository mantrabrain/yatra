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
        wp_register_script('yatra-popperjs', 'https://unpkg.com/@popperjs/core@2', array(), YATRA_VERSION);
        wp_register_script('yatra-tippy', 'https://unpkg.com/tippy.js@6', array(), YATRA_VERSION);
        wp_enqueue_script('yatra-availability-script', YATRA_PLUGIN_URI . '/assets/admin/js/availability.js',
            array('yatra-fullcalendar-js', 'yatra-popperjs', 'yatra-tippy')
            , YATRA_VERSION);

        $yatra_availability_params = array(

            'ajax_url' => admin_url('admin-ajax.php'),
            'tour_availability' => array(
                'action' => 'yatra_tour_availability',
                'nonce' => wp_create_nonce('wp_yatra_tour_availability_nonce')
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

    public static function get_availability($tour_id): array
    {
        $start_date = get_post_meta($tour_id, 'yatra_tour_meta_tour_start_date', true);

        $response = array();

        if ('' != $start_date) {

            $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);

            if (!$yatra_multiple_pricing) {

                $regular = get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);

                $discounted = get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);

                $final_pricing = '' === $discounted ? $regular : $discounted;

                $pricing_label = __('Default Pricing', 'yatra');

                $current_currency_symbol = '$';//yatra_get_current_currency_symbol();

                $response[] = array(
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
                $response[] = array(
                    "title" => $title,
                    "event" => $title,
                    "start" => $start_date,
                    "description" => $description

                );
            }


        }


        return $response;
    }
}

new Yatra_Core_Tour_Availability();