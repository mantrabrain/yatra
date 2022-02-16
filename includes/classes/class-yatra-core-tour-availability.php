<?php

class Yatra_Core_Tour_Availability
{
    public function __construct()
    {

        add_action('yatra_availability_page_output', array($this, 'output'));

        add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 11);

        add_action('yatra_availability_calendar_tour_list', array($this, 'calendar_tour_list'));

        add_action('yatra_availability_calendar_tour_list_footer', array($this, 'calendar_tour_list_pagination'));

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
        echo yatra_calendar_booking_indicators();
        echo '</div>';

        echo '<div class="yatra-availability-calendar-content-body">';

        do_action('yatra_availability_calendar_tour_list');

        echo '<div  id="yatra-availability-calendar-wrap">';

        echo '<div  id="yatra-availability-calendar">';


        echo '</div>';

        echo '</div>';

        echo '</div>';

        echo '<div class="yatra-availability-calendar-content-footer">';

        do_action('yatra_availability_calendar_tour_list_footer');

        echo '</div>';

        echo '</div>';

    }

    public static function update_availability($start_date, $end_date, $yatra_availability, $yatra_pricing, $tour_id)
    {
        $start_date = sanitize_text_field($start_date);

        $end_date = sanitize_text_field($end_date);

        $begin = new DateTime($start_date);

        $end = new DateTime($end_date);

        $user_id = get_current_user_id();

        $activate = isset($yatra_availability['activate']) ? (boolean)$yatra_availability['activate'] : false;

        $pricing_type = isset($yatra_availability['pricing_type']) ? sanitize_text_field($yatra_availability['pricing_type']) : 'single';

        $max_traveller = isset($yatra_availability['max_travellers']) ? yatra_maybeintempty($yatra_availability['max_travellers']) : '';

        $max_traveller = '' === $max_traveller ? "__NULL__" : $max_traveller;

        $availability_for = isset($yatra_availability['availability_for']) ? sanitize_text_field($yatra_availability['availability_for']) : '';

        $yatra_final_pricing = array();

        $status = false;

        foreach ($yatra_pricing as $pricing_index => $pricing) {

            $yatra_final_pricing_single = array(
                'pricing_label' => isset($pricing['pricing_label']) ? sanitize_text_field($pricing['pricing_label']) : '',
                'pricing_description' => isset($pricing['pricing_description']) ? sanitize_text_field($pricing['pricing_description']) : '',
                'pricing_per' => isset($pricing['pricing_per']) ? sanitize_text_field($pricing['pricing_per']) : 'single',
                'group_size' => isset($pricing['group_size']) ? yatra_maybeintempty($pricing['group_size']) : '',
                'regular_price' => isset($pricing['regular_price']) ? yatra_maybeintempty($pricing['regular_price']) : '',
                'sales_price' => isset($pricing['sales_price']) ? yatra_maybeintempty($pricing['sales_price']) : '',
                'minimum_pax' => isset($pricing['minimum_pax']) ? yatra_maybeintempty($pricing['minimum_pax']) : '',
                'maximum_pax' => isset($pricing['maximum_pax']) ? yatra_maybeintempty($pricing['maximum_pax']) : '',

            );
            if ($pricing_type === "single" || $pricing_index === "0") {

                $yatra_final_pricing = $yatra_final_pricing_single;

            } else {

                $yatra_final_pricing[$pricing_index] = $yatra_final_pricing_single;

            }
        }

        $slot_group_data = Yatra_Core_DB::get_data('tour_dates', array(
            'slot_group_id'
        ), array(), array(
            'order_by' => 'slot_group_id',
            'order' => 'DESC',
            'offset' => '0',
            'limit' => '1'
        ));


        $slot_group_id = isset($slot_group_data[0]) ? absint($slot_group_data[0]->slot_group_id) : 1;

        $slot_group_id = $slot_group_id + 1;

        for ($date_i = $begin; $date_i <= $end; $date_i->modify('+1 day')) {

            $start_date_value = $date_i->format("Y-m-d H:i:s");

            $end_date_value = $date_i->format("Y-m-d 23:59:59");

            $where = array(
                'start_date' => $start_date_value,
                'end_date' => $end_date_value,
                'tour_id' => $tour_id
            );

            $update_ignore = array('user_id', 'start_date', 'end_date', 'tour_id', 'created_at', 'created_by');

            $data = array(
                'tour_id' => $tour_id,
                'user_id' => $user_id,
                'slot_group_id' => $slot_group_id,
                'start_date' => $start_date_value,
                'end_date' => $end_date_value,
                'pricing' => json_encode($yatra_final_pricing),
                'pricing_type' => $pricing_type,
                'max_travellers' => $max_traveller,
                'active' => $activate,
                'availability' => $availability_for,
                'note_to_customer' => '',
                'note_to_admin' => '',
                'created_by' => $user_id,
                'updated_by' => $user_id,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            );

            if (Yatra_Core_DB::data_exists('tour_dates', $where)) {

                $action_status = Yatra_Core_DB::update_data('tour_dates', $data, $where, $update_ignore);

            } else {

                $action_status = Yatra_Core_DB::save_data('tour_dates', $data);


            }

            $status = !$status ? $action_status : $status;

        }
        return $status;

    }

    /*
     * $filter_condition  = array('is_expired'=>false, is_full=>false, is_
     */

    public static function get_availability($tour_id, $start_date, $end_date, $filter_condition = array(), $date_index = false)
    {

        $yatra_tour_availability = yatra_tour_meta_availability_date_ranges($tour_id);

        if (!yatra_is_tour_fixed_departure($tour_id)) {
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

            $tourData = $tour_options->getTourData();

            for ($i = $begin; $i <= $end; $i->modify('+1 day')) {

                $single_date = $i->format("Y-m-d");

                $single_response = self::get_single_availability($single_date, $tour_options, $tourData, $tour_id);

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

    /* @var $tour_options Yatra_Tour_Options */
    private static function get_single_availability($start_date, $tour_options, $tourData, $tour_id)
    {

        $todayDataSettings = $tour_options->getTodayData($start_date);

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

        $availability = $todayData->getAvailabilityFor($tour_id, $start_date);

        if ('' === $availability) {

            return array();
        }

        $is_active = $todayData->getAvailabilityFor() === $availability ? (boolean)$todayData->isActive() : true;

        $max_travellers = $todayData->getMaxTravellers();

        $max_travellers = is_null($max_travellers) ? '' : $max_travellers;

        $booked_travellers = $todayData->getBookedTravellers($start_date);

        $availability_label = '';

        switch ($availability) {
            case "booking":
                $availability_label = get_option('yatra_available_for_booking_text', __('Available For Booking', 'yatra'));
                break;
            case "enquiry":
                $availability_label = get_option('yatra_available_for_enquiry_text', __('Available For Enquiry Only', 'yatra'));
                break;
            case "none":
                $availability_label = get_option('yatra_not_available_for_booking_enquiry_text', __('Not Available For Booking & Enquiry', 'yatra'));
                break;
            default:
                break;

        }

        $availability_label = $availability_label == '' ? esc_html(yatra_tour_availability_status($availability)) : esc_html($availability_label);

        $pricing = $todayData->getPricing();

        $is_full = ((absint($max_travellers) <= absint($booked_travellers) && $booked_travellers != '' & $max_travellers != '') || ($max_travellers != '' && $max_travellers == 0));

        if ($is_full) {
            $availability_label = __('Booking Full', 'yatra');
        }
        $remaining_travellers = $max_travellers == '' && absint($max_travellers) == 0 ? '' : $max_travellers - absint($booked_travellers);

        $is_expired = (strtotime($start_date) < strtotime($current_date));

        $available_traveller_text = get_option('yatra_available_travellers_text', __('Available Travellers :', 'yatra'));

        $available_traveller_text = $available_traveller_text == '' ? __('Available Travellers :', 'yatra') : $available_traveller_text;

        $available_seat_string = $remaining_travellers === '' ? '' : "<hr style='border-color:#fff;margin:5px 0;padding:0;'/>" . $available_traveller_text . ' ' . $remaining_travellers;

        $currency_symbol = yatra_get_current_currency_symbol();

        if ('' != $start_date) {

            if ($todayData->getPricingType() !== 'multi') {

                /* @var $single_pricing Yatra_Tour_Pricing */
                $single_pricing = $pricing;

                $regular = $single_pricing->getRegularPrice();

                $discounted = $single_pricing->getSalesPrice();

                $pricing_label = $single_pricing->getLabel();

                $final_pricing = '' === $discounted ? $regular : $discounted;

                $pricing_string = yatra_get_price($currency_symbol, $final_pricing);

                $title = "{$pricing_label}: {$pricing_string}";

                if ($is_full) {
                    $title = __('Booking Full', 'yatra');
                }


                $response = array(
                    "title" => $title,
                    "start" => $start_date,
                    "description" => $availability === 'none' ? $availability_label : "<strong>{$availability_label}</strong><hr style='border-color:#fff;margin:5px 0;padding:0;'/>{$pricing_label}: {$pricing_string}{$available_seat_string}",
                    "is_active" => $is_active,
                    "availability" => $availability,
                    'is_full' => $is_full,
                    'is_expired' => $is_expired,
                    'remaining_travellers' => $remaining_travellers


                );
            } else {

                $title = '';

                $description = "<strong>{$availability_label}</strong><hr style='border-color:#fff;margin:5px 0;padding:0;'/>";

                /* @var $single_pricing Yatra_Tour_Pricing */
                foreach ($pricing as $single_pricing) {


                    $regular = $single_pricing->getRegularPrice();

                    $discounted = $single_pricing->getSalesPrice();

                    $final_pricing = '' === $discounted ? $regular : $discounted;

                    $pricing_label = $single_pricing->getLabel();

                    $pricing_string = yatra_get_price($currency_symbol, $final_pricing);

                    $title .= "{$pricing_label}: {$pricing_string} <br/> ";

                    $description .= "{$pricing_label}&nbsp;:&nbsp; <strong style='float:right;'>{$pricing_string}</strong> <br/> ";

                }
                if ($is_full) {
                    $title = __('Booking Full', 'yatra');
                }
                $response = array(
                    "title" => $title,
                    //"event" => $title,
                    "start" => $start_date,
                    "description" => $availability === 'none' ? $availability_label : ($description . $available_seat_string),
                    "is_active" => $is_active,
                    "availability" => $availability,
                    'is_full' => $is_full,
                    'is_expired' => $is_expired,
                    'remaining_travellers' => $remaining_travellers


                );
            }


        }


        return apply_filters('yatra_availability_calendar_date_response', $response, $tour_id, $start_date);
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

        $currency = yatra_get_current_currency();

        $currency_symbol = yatra_get_currency_symbol($currency);

        $template = '';

        $form_class = $active_status === false ? 'form yatra-deactivate-form' : 'form';

        ob_start();

        echo '<form id="yatra-availability-calendar-popup-form" method="post" class="' . esc_attr($form_class) . '">';


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


        $config = $this->pagination_config();

        $query_config =
            array(
                'posts_per_page' => absint($config['per_page']),
                'post_type' => 'tour',
                'paged' => absint($config['current'])
            );

        $search_text = '';

        if (isset($_GET['availability_search'])) {

            $search_text = isset($_POST['search']) ? sanitize_text_field($_POST['search']) : '';
        }

        if ($search_text !== '') {
            $query_config['s'] = $search_text;
        }

        $the_query = new WP_Query(
            $query_config
        );
        echo '<div class="yatra-availability-tour-list-wrap">';

        $removable_query_args = wp_removable_query_args();

        $current_url = set_url_scheme('http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);

        $current_url = remove_query_arg($removable_query_args, $current_url);

        $url = add_query_arg('availability_search', true, $current_url)
        ?>
        <form method="post" action="<?php echo esc_url($url); ?>" id="yatra-availability-search-form">
            <input type="text" name="search" value="<?php echo esc_attr($search_text) ?>"/>
            <button type="submit" class="button-primary"><?php echo __('Search', 'yatra') ?></button>
            <?php wp_nonce_field('yatra_availability_search_form_nonce'); ?>
        </form>
        <?php
        echo '<ul class="yatra-availability-tour-lists">';
        while ($the_query->have_posts()):

            $the_query->the_post();
            echo '<li>';
            echo '<a data-title="' . esc_attr(get_the_title()) . '" data-id="' . absint(get_the_ID()) . '" target="_blank" href="' . esc_url(get_the_permalink()) . '">#' . absint(get_the_ID()) . ' - ' . esc_html(get_the_title()) . '</a>';
            echo '</li>';

        endwhile;

        echo '</ul>';


        echo '</div>';
    }

    public function pagination_config()
    {
        $post_per_page = 15;

        $total_count_query = new WP_Query(
            array('posts_per_page' => 3,
                'post_type' => 'tour'
            ));

        $current_page_number = isset($_GET['paged']) ? absint($_GET['paged']) : 1;

        $total_number_of_posts = $total_count_query->found_posts;

        $total_page_numbers = ceil($total_number_of_posts / $post_per_page);

        $current_page_number = $current_page_number > $total_page_numbers || $current_page_number < 1 ? 1 : $current_page_number;

        return [
            'current' => $current_page_number,
            'total_pages' => $total_page_numbers,
            'total_posts' => $total_number_of_posts,
            'per_page' => $post_per_page

        ];

    }

    public function calendar_tour_list_pagination()
    {
        $config = $this->pagination_config();

        $this->pagination($config['total_posts'], $config['total_pages'], $config['current']);
    }

    protected function pagination($total_items, $total_pages, $current)
    {


        $output = '<span class="displaying-num">' . sprintf(
            /* translators: %s: Number of items. */
                _n('%s item', '%s items', $total_items, 'yatra'),
                number_format_i18n($total_items)
            ) . '</span>';


        $removable_query_args = wp_removable_query_args();

        $current_url = set_url_scheme('http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);

        $current_url = remove_query_arg($removable_query_args, $current_url);

        $page_links = array();

        $total_pages_after = '</span></span>';

        $disable_first = false;
        $disable_last = false;
        $disable_prev = false;
        $disable_next = false;

        if (1 == $current) {
            $disable_first = true;
            $disable_prev = true;
        }
        if (2 == $current) {
            $disable_first = true;
        }
        if ($total_pages == $current) {
            $disable_last = true;
            $disable_next = true;
        }
        if ($total_pages - 1 == $current) {
            $disable_last = true;
        }

        if ($disable_first) {
            $page_links[] = '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&laquo;</span>';
        } else {
            $page_links[] = sprintf(
                "<a class='first-page button' href='%s'><span class='screen-reader-text'>%s</span><span aria-hidden='true'>%s</span></a>",
                esc_url(remove_query_arg('paged', $current_url)),
                __('First page', 'yatra'),
                '&laquo;'
            );
        }

        if ($disable_prev) {
            $page_links[] = '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&lsaquo;</span>';
        } else {
            $page_links[] = sprintf(
                "<a class='prev-page button' href='%s'><span class='screen-reader-text'>%s</span><span aria-hidden='true'>%s</span></a>",
                esc_url(add_query_arg('paged', max(1, $current - 1), $current_url)),
                __('Previous page', 'yatra'),
                '&lsaquo;'
            );
        }


        $html_current_page = $current;
        $total_pages_before = '<span class="screen-reader-text">' . __('Current Page', 'yatra') . '</span><span id="table-paging" class="paging-input"><span class="tablenav-paging-text">';

        $html_total_pages = sprintf("<span class='total-pages'>%s</span>", number_format_i18n($total_pages));
        $page_links[] = $total_pages_before . sprintf(
            /* translators: 1: Current page, 2: Total pages. */
                _x('%1$s of %2$s', 'paging', 'yatra'),
                $html_current_page,
                $html_total_pages
            ) . $total_pages_after;

        if ($disable_next) {
            $page_links[] = '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&rsaquo;</span>';
        } else {
            $page_links[] = sprintf(
                "<a class='next-page button' href='%s'><span class='screen-reader-text'>%s</span><span aria-hidden='true'>%s</span></a>",
                esc_url(add_query_arg('paged', min($total_pages, $current + 1), $current_url)),
                __('Next page', 'yatra'),
                '&rsaquo;'
            );
        }

        if ($disable_last) {
            $page_links[] = '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&raquo;</span>';
        } else {
            $page_links[] = sprintf(
                "<a class='last-page button' href='%s'><span class='screen-reader-text'>%s</span><span aria-hidden='true'>%s</span></a>",
                esc_url(add_query_arg('paged', $total_pages, $current_url)),
                __('Last page', 'yatra'),
                '&raquo;'
            );
        }

        $pagination_links_class = 'pagination-links';
        if (!empty($infinite_scroll)) {
            $pagination_links_class .= ' hide-if-js';
        }
        $output .= "\n<span class='$pagination_links_class'>" . implode("\n", $page_links) . '</span>';

        if ($total_pages) {
            $page_class = $total_pages < 2 ? ' one-page' : '';
        } else {
            $page_class = ' no-pages';
        }
        $pagination = "<div class='tablenav-pages{$page_class}'>$output</div>";

        echo $pagination;
    }
}

new Yatra_Core_Tour_Availability();