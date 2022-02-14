<?php
defined('ABSPATH') || exit;

// Load Helpers

include_once YATRA_ABSPATH . 'includes/yatra-pricing-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-deprecated-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-html-functions.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-country-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-currency-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-font-helper.php';
include_once YATRA_ABSPATH . 'includes/template-tags.php';
include_once YATRA_ABSPATH . 'includes/yatra-destination-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-activity-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-misc-functions.php';
include_once YATRA_ABSPATH . 'includes/yatra-formatting-functions.php';


if (!function_exists('yatra_tour_tabs')) {
    function yatra_tour_tabs()
    {
        $tour_tabs_array = array(
            'options' => array(
                'title' => __('Options', 'yatra'),
                'icon' => '',
            ),
            'itinerary' => array(
                'title' => __('Itinerary', 'yatra'),
                'icon' => '',
            ),
            'cost_info' => array(
                'title' => __('Cost Info', 'yatra'),
                'icon' => '',
            ),
            'facts' => array(
                'title' => __('Facts', 'yatra'),
                'icon' => '',
            ),
            'faq' => array(
                'title' => __('FAQ', 'yatra'),
                'icon' => '',
            ),
        );

        return apply_filters('yatra_tour_tabs', $tour_tabs_array);
    }
}

if (!function_exists('yatra_tour_metabox_tabs')) {

    function yatra_tour_metabox_tabs()
    {
        $metabox_tabs = array(

            'general' => array(
                'title' => esc_html__('General & Dates', 'yatra'),
                'is_active' => true,
                'settings' => yatra_tour_general_configurations()
            ),
            'pricing' => array(
                'title' => esc_html__('Pricing', 'yatra'),
                'settings' => yatra_tour_pricing_configurations()
            ),

            'attributes' => array(
                'title' => esc_html__('Attributes', 'yatra'),
                'settings' => yatra_tour_attributes()
            ),
            'tour_tabs' => array(
                'title' => esc_html__('Tour Tabs', 'yatra'),
                'settings' => yatra_tour_tab_configurations()
            ),
        );

        return apply_filters('yatra_tour_metabox_tabs', $metabox_tabs);
    }
}


if (!function_exists('yatra_set_session')) {

    function yatra_set_session($key = '', $value = '')
    {
        if (!session_id()) {
            session_start();
        }

        $yatra_session_id = "yatra_session";

        if (!empty($key) && !empty($value)) {

            $_SESSION[$yatra_session_id][$key] = $value;

            return true;
        }
        return false;

    }
}

if (!function_exists('yatra_get_session')) {

    function yatra_get_session($key = '')
    {

        $yatra_session_id = "yatra_session";

        if (!empty($key)) {

            if (isset($_SESSION[$yatra_session_id][$key])) {

                return $_SESSION[$yatra_session_id][$key];
            }

        }
        if (isset($_SESSION[$yatra_session_id])) {

            return $_SESSION[$yatra_session_id];
        }

        return array();

    }
}

if (!function_exists('yatra_clear_session')) {

    function yatra_clear_session($key = '')
    {
        if (!session_id()) {
            session_start();
        }


        $yatra_session_id = "yatra_session";

        if (!empty($key)) {

            if (isset($_SESSION[$yatra_session_id][$key])) {

                unset($_SESSION[$yatra_session_id][$key]);

                return true;
            }

        }
        if (isset($_SESSION[$yatra_session_id])) {

            unset($_SESSION[$yatra_session_id]);

            return true;
        }

        return false;

    }
}

if (!function_exists('yatra_get_template')) {

    function yatra_get_template($template_name, $args = array(), $template_path = '', $default_path = '')
    {
        $cache_key = sanitize_key(implode('-', array('template', $template_name, $template_path, $default_path)));
        $template = (string)wp_cache_get($cache_key, 'yatra');

        if (!$template) {
            $template = yatra_locate_template($template_name, $template_path, $default_path);
            wp_cache_set($cache_key, $template, 'yatra');
        }
        // Allow 3rd party plugin filter template file from their plugin.
        $filter_template = apply_filters('yatra_get_template', $template, $template_name, $args, $template_path, $default_path);

        if ($filter_template !== $template) {
            if (!file_exists($filter_template)) {
                /* translators: %s template */
                _doing_it_wrong(__FUNCTION__, sprintf(__('%s does not exist.', 'yatra'), '<code>' . $template . '</code>'), '1.0.1');
                return;
            }
            $template = $filter_template;
        }

        $action_args = array(
            'template_name' => $template_name,
            'template_path' => $template_path,
            'located' => $template,
            'args' => $args,
        );

        if (!empty($args) && is_array($args)) {
            if (isset($args['action_args'])) {
                _doing_it_wrong(
                    __FUNCTION__,
                    __('action_args should not be overwritten when calling yatra_get_template.', 'yatra'),
                    '1.0.0'
                );
                unset($args['action_args']);
            }
            extract($args); // @codingStandardsIgnoreLine
        }

        do_action('yatra_before_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);

        include $action_args['located'];

        do_action('yatra_after_template_part', $action_args['template_name'], $action_args['template_path'], $action_args['located'], $action_args['args']);
    }
}

if (!function_exists('yatra_locate_template')) {
    function yatra_locate_template($template_name, $template_path = '', $default_path = '')
    {
        if (!$template_path) {
            $template_path = yatra()->template_path();
        }

        if (!$default_path) {
            $default_path = yatra()->plugin_template_path();
        }

        // Look within passed path within the theme - this is priority.
        $template = locate_template(
            array(
                trailingslashit($template_path) . $template_name,
                $template_name,
            )
        );

        // Get default template/.
        if (!$template) {
            $template = $default_path . $template_name;
        }
        // Return what we found.
        return apply_filters('yatra_locate_template', $template, $template_name, $template_path);
    }
}

if (!function_exists('yatra_single_tour_tabs')) {

    function yatra_single_tour_tabs()
    {
        global $post;


    }
}

if (!function_exists('yatra_get_checkout_page')) {

    function yatra_get_checkout_page($get_permalink = false)
    {

        $page_id = absint(get_option('yatra_checkout_page'));

        if ($page_id < 1) {

            global $wpdb;

            $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_checkout]%" AND post_parent = 0');
        }

        $page_permalink = get_permalink($page_id);

        if ($get_permalink) {

            return $page_permalink;
        }

        return $page_id;


    }
}


if (!function_exists('yatra_get_cart_page')) {

    function yatra_get_cart_page($get_permalink = false)
    {
        $page_id = absint(get_option('yatra_cart_page'));

        if ($page_id < 1) {

            global $wpdb;

            $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_cart]%" AND post_parent = 0');
        }

        $page_permalink = get_permalink($page_id);

        if ($get_permalink) {

            return $page_permalink;
        }

        return $page_id;


    }
}

if (!function_exists('yatra_get_booking_statuses')) {

    function yatra_get_booking_statuses($status_key = '')
    {
        $statuses = apply_filters(
            'yatra_booking_statuses', array(
                'yatra-pending' => __('Pending', 'yatra'),
                'yatra-processing' => __('Processing', 'yatra'),
                'yatra-on-hold' => __('On Hold', 'yatra'),
                'yatra-completed' => __('Completed', 'yatra'),
                'yatra-cancelled' => __('Cancelled', 'yatra'),
                'yatra-failed' => __('Failed', 'yatra')
            )
        );

        if (empty($status_key)) {

            return $statuses;
        }
        if (isset($statuses[$status_key])) {
            return $statuses[$status_key];
        }
        return $statuses;

    }
}

if (!function_exists('yatra_the_posts_navigation')) :
    /**
     * Documentation for function.
     */
    function yatra_the_posts_navigation()
    {
        the_post_navigation(array(
            'prev_text' => '<span class="screen-reader-text">' . esc_html__('Previous Post', 'yatra') . '</span><span class="nav-title">%title</span>',
            'next_text' => '<span class="screen-reader-text">' . esc_html__('Next Post', 'yatra') . '</span><span class="nav-title">%title</span>',
        ));
    }
endif;

if (!function_exists('yatra_get_template_part')) {

    function yatra_get_template_part($slug, $name = '')
    {
        $path = "{$slug}.php";

        if ('' !== $name) {

            $path = "{$slug}-{$name}.php";
        }
        $template = yatra_locate_template($path, false, false);

        require $template;

    }

}
if (!function_exists('yatra_posted_by')) :
    /**
     * Prints HTML with meta information about theme author.
     */
    function yatra_posted_by()
    {
        printf(
        /* translators: 1: SVG icon. 2: post author, only visible to screen readers. 3: author link. */
            '<span class="byline"><span class="screen-reader-text">%1$s</span><span class="author vcard"><a class="url fn n" href="%2$s">%3$s</a></span></span>',
            __('Posted by', 'yatra'),
            esc_url(get_author_posts_url(get_the_author_meta('ID'))),
            esc_html(get_the_author())
        );
    }
endif;

if (!function_exists('yatra_posted_on')) :
    /**
     * Prints HTML with meta information for the current post-date/time.
     */
    function yatra_posted_on()
    {
        $time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
        if (get_the_time('U') !== get_the_modified_time('U')) {
            //$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
        }

        $time_string = sprintf(
            $time_string,
            esc_attr(get_the_date(DATE_W3C)),
            esc_html(get_the_date()),
            esc_attr(get_the_modified_date(DATE_W3C)),
            esc_html(get_the_modified_date())
        );

        printf(
            '<span class="posted-on"><a href="%1$s" rel="bookmark">%2$s</a></span>',
            esc_url(get_permalink()),
            $time_string
        );
    }
endif;

/**
 * Get permalink settings
 *
 * @return array
 * @since  1.0.0
 */
function yatra_get_permalink_structure()
{

    $permalinks = wp_parse_args(
        (array)get_option('yatra_permalinks', array()),
        array(
            'yatra_tour_base' => 'tour',
            'yatra_destination_base' => 'destination',
            'yatra_activity_base' => 'activity',
            'yatra_attributes_base' => 'attributes',
        )
    );

    // Ensure rewrite slugs are set.
    $permalinks['yatra_tour_base'] = untrailingslashit(empty($permalinks['yatra_tour_base']) ? 'tour' : $permalinks['yatra_tour_base']);
    $permalinks['yatra_destination_base'] = untrailingslashit(empty($permalinks['yatra_destination_base']) ? 'destination' : $permalinks['yatra_destination_base']);
    $permalinks['yatra_activity_base'] = untrailingslashit(empty($permalinks['yatra_activity_base']) ? 'activity' : $permalinks['yatra_activity_base']);
    return $permalinks;
}

if (!function_exists('yatra_get_tour_price')) {

    function yatra_get_tour_price($tour_id, $number_of_people, $selected_date)
    {
        $tour_options = new Yatra_Tour_Options($tour_id, $selected_date, $selected_date, $number_of_people);

        $tourData = $tour_options->getTourData();

        $todayDataSettings = $tour_options->getTodayData($selected_date);

        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $tourData;

        } else {

            $todayData = $tourData;
        }

        $pricing = $todayData->getPricing();

        $tour_total_price = 0;

        if ($pricing instanceof Yatra_Tour_Pricing) {

            $tour_total_price += $pricing->getFinalPrice();

        } else {

            foreach ($pricing as $pricing_item) {

                $tour_total_price += $pricing_item->getFinalPrice();
            }

        }
        return $tour_total_price;
    }

}

if (!function_exists('yatra_get_final_tour_price')) {

    function yatra_get_final_tour_price($tour_id, $number_of_people, $selected_date)
    {

        $final_pricing = yatra_get_tour_price($tour_id, $number_of_people, $selected_date);

        return apply_filters('yatra_tour_booking_final_price', floatval($final_pricing), $tour_id, $number_of_people, $selected_date);
    }
}


if (!function_exists('yatra_get_booking_final_price')) {

    function yatra_get_booking_final_price($booking_parameters = array(), $net_pricing = false)
    {
        $total_booking_price = 0;

        foreach ($booking_parameters as $parameter) {

            $total_booking_price = $total_booking_price + floatval(yatra_get_final_tour_price($parameter['tour_id'], $parameter['number_of_person'], $parameter['selected_date']));

        }
        return apply_filters('yatra_booking_final_price', $total_booking_price, $booking_parameters, $net_pricing);
    }
}


if (!function_exists('yatra_update_booking_status')) {

    function yatra_update_booking_status($booking_id = 0, $status = 'yatra-pending')
    {
        $yatra_booking_statuses = yatra_get_booking_statuses();

        if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

            return false;
        }

        do_action('yatra_before_booking_status_change', array(
            'booking_id' => $booking_id,
            'status' => $status
        ));

        $booking_array = array();
        $booking_array['ID'] = $booking_id;
        $booking_array['post_status'] = $status;

        // Update the post into the database
        wp_update_post($booking_array);

        do_action('yatra_after_booking_status_change', array(
            'booking_id' => $booking_id,
            'status' => $status
        ));

        return true;
    }
}


if (!function_exists('yatra_global_smart_tags')) {

    function yatra_global_smart_tags()
    {
        return apply_filters(
            'yatra_global_smart_tags',
            array(
                'home_url' => get_home_url(),
                'blog_info' => get_bloginfo(),
            )
        );
    }
}

if (!function_exists('yatra_booking_smart_tags')) {

    function yatra_booking_smart_tags($booking_id = 0)
    {
        $smart_tags['booking_code'] = '';

        $smart_tags['booking_status'] = '';

        $smart_tags['tour_lists'] = '';

        if ($booking_id > 0) {

            $booking_post = get_post($booking_id);

            $booking_status = isset($booking_post->post_status) ? $booking_post->post_status : '';

            $all_post_statuses = yatra_get_booking_statuses();

            $booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            $booking_meta = get_post_meta($booking_id, 'yatra_booking_meta', true);

            $smart_tags['booking_code'] = isset($booking_meta_params['booking_code']) ? $booking_meta_params['booking_code'] : '';

            $smart_tags['booking_status'] = isset($all_post_statuses[$booking_status]) ? $all_post_statuses[$booking_status] : '';

            foreach ($booking_meta as $tour_id => $meta) {

                $smart_tags['tour_lists'] .= '<a href="' . get_permalink($tour_id) . '" target="_blank">' . $meta['yatra_tour_name'] . '</a><br/>';

            }

        }

        return apply_filters(
            'yatra_booking_smart_tags',
            $smart_tags
        );
    }
}

if (!function_exists('yatra_customer_smart_tags')) {

    function yatra_customer_smart_tags($booking_id = 0)
    {
        $smart_tags['customer_name'] = '';

        $smart_tags['customer_email'] = '';

        if ($booking_id > 0) {

            $booking_meta_params = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            $customer_info = isset($booking_meta_params ['yatra_tour_customer_info']) ? $booking_meta_params ['yatra_tour_customer_info'] : array();

            $smart_tags['customer_name'] = isset($customer_info['fullname']) ? $customer_info['fullname'] : '';

            $smart_tags['customer_email'] = isset($customer_info['email']) ? $customer_info['email'] : '';
        }

        return apply_filters(
            'yatra_customer_smart_tags',
            $smart_tags
        );
    }
}
if (!function_exists('yatra_get_date')) {

    function yatra_get_date($date_only = false, $datetime = '')
    {
        $date_format = 'Y-m-d';

        $time_format = 'Y-m-d H:i:s';

        if ($date_only) {
            return $datetime == '' ? date($date_format) : date($date_format, strtotime($datetime));
        }
        return $datetime == '' ? date($time_format) : date($time_format, strtotime($datetime));
    }
}

if (!function_exists('yatra_all_smart_tags')) {

    function yatra_all_smart_tags($booking_id = 0)
    {
        $yatra_global_smart_tags = yatra_global_smart_tags();

        $yatra_booking_smart_tags = yatra_booking_smart_tags($booking_id);

        $yatra_customer_smart_tags = yatra_customer_smart_tags($booking_id);

        $all_tags = array_merge($yatra_global_smart_tags, $yatra_booking_smart_tags, $yatra_customer_smart_tags);

        return apply_filters('yatra_all_smart_tags', $all_tags);
    }
}


/**
 * Get data if set, otherwise return a default value or null. Prevents notices when data is not set.
 *
 * @param mixed $var Variable.
 * @param string $default Default value.
 * @return mixed
 * @since
 */
if (!function_exists(('yatra_get_var'))) {
    function yatra_get_var(&$var, $default = null)
    {
        return isset($var) ? $var : $default;
    }
}

if (!function_exists('is_yatra_error')) {

    function is_yatra_error($thing)
    {
        return ($thing instanceof WP_Error);
    }


}

if (!function_exists('yatra_logout_url')) {

    function yatra_logout_url()
    {

        return wp_logout_url(get_permalink());

    }


}

if (!function_exists('yatra_get_my_account_page')) {

    function yatra_get_my_account_page($get_permalink = false)
    {
        $page_id = absint(get_option('yatra_my_account_page'));

        if ($page_id < 1) {

            global $wpdb;

            $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_my_account]%" AND post_parent = 0');
        }

        $page_permalink = get_permalink($page_id);

        if ($get_permalink) {

            return $page_permalink;
        }

        return $page_id;


    }
}

if (!function_exists('yatra_enable_guest_checkout')) {

    function yatra_enable_guest_checkout()
    {
        if ('yes' === get_option('yatra_enable_guest_checkout', 'yes')) {

            return true;
        }
        return false;

    }
}

if (!function_exists('yatra_payment_gateway_fields')) {

    function yatra_payment_gateway_fields()
    {
        $yatra_get_active_payment_gateways = (yatra_get_active_payment_gateways());

        $yatra_get_payment_gateways = yatra_get_payment_gateways();

        if (count($yatra_get_active_payment_gateways) > 0) {

            echo '<h2 class="yatra-payment-gateway-title">' . __('Payment Gateways', 'yatra') . '</h2>';

            echo '<ul class="yatra-payment-gateway">';

            foreach ($yatra_get_payment_gateways as $gateway) {

                $gateway_id = isset($gateway['id']) ? $gateway['id'] : '';

                if (in_array($gateway_id, $yatra_get_active_payment_gateways)) {

                    echo '<li>';

                    echo '<label for="yatra-payment-gateway-' . esc_attr($gateway_id) . '">';

                    echo '<input type="radio" id="yatra-payment-gateway-' . esc_attr($gateway_id) . '" name="yatra-payment-gateway" value="' . esc_attr($gateway_id) . '"/>';

                    echo '&nbsp;<span>' . $gateway['frontend_title'] . '</span>';

                    echo '</label>';

                    echo '<div class="yatra-payment-gateway-field-wrap yatra-payment-gateway-field-' . $gateway_id . ' yatra-hide">';

                    do_action('yatra_payment_gateway_field_' . $gateway_id);

                    echo '</div>';

                    echo '</li>';
                }

            }
            echo '</ul>';
        }
    }
}

if (!function_exists('yatra_tour_has_attributes')) {

    function yatra_tour_has_attributes($post_id = null)
    {
        $post_id = is_null($post_id) ? get_the_ID() : $post_id;

        $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);

        $tour_meta_custom_attributes = !$tour_meta_custom_attributes ? array() : $tour_meta_custom_attributes;

        if (count($tour_meta_custom_attributes) > 0) {

            return true;
        }
        return false;
    }
}


if (!function_exists('yatra_maybeintempty')) {
    function yatra_maybeintempty($var)
    {
        if ($var == '') {
            return '';
        }
        return absint($var);
    }
}

if (!function_exists('yatra_maybe_json_decode')) {
    function yatra_maybe_json_decode($var, $assoc = true)
    {
        if ($var == '') {
            return array();
        }
        if (is_array($var)) {

            return $var;
        }
        return json_decode($var, $assoc);
    }
}


if (!function_exists('yatra_tour_tabs_additional_types')) {
    function yatra_tour_tabs_additional_types()
    {
        return apply_filters('yatra_tour_tabs_additional_types', ["text"]);
    }
}


if (!function_exists('yatra_frontend_tour_tabs_ordering')) {

    function yatra_frontend_tour_tabs_ordering($type = 'array', $post_ID = null)
    {
        $ordering_string = '';

        if (!is_null($post_ID)) {

            $ordering_string = get_post_meta($post_ID, 'yatra_tour_meta_tour_tabs_ordering', true);
        }
        if (!$ordering_string) {

            $ordering_string_array = array_keys(yatra_frontend_tabs_available_options());

            $ordering_string = implode(',', $ordering_string_array);
        }

        if (!$ordering_string) {

            $tour_tab_configs = yatra_tour_tab_default_configurations();

            $config_keys = array_keys($tour_tab_configs);

            $ordering_string = implode(',', $config_keys);
        }
        return $type === 'array' ? explode(',', $ordering_string) : $ordering_string;

    }
}


if (!function_exists('yatra_has_tab_visible')) {

    function yatra_has_tab_visible($tab_key, $post_id = null): bool
    {
        $post_id = is_null($post_id) ? get_the_ID() : $post_id;

        $visibility_key = sanitize_text_field(($tab_key . '_visibility'));

        $visibility = get_post_meta($post_id, $visibility_key, true);

        if ($visibility == '' || is_null($visibility)) {

            $available_tabs = yatra_frontend_tabs_available_options();

            $tab = $available_tabs[$tab_key] ?? array();

            $visibility = isset($tab['visibility']) && (boolean)$tab['visibility'];
        }


        return $visibility;

    }
}

if (!function_exists('yatra_frontend_tabs_available_options')) {

    function yatra_frontend_tabs_available_options($post_id = null)
    {
        $all_valid_available_tabs = get_option('yatra_frontend_tabs_available_options', false);

        $tour_tab_configs = yatra_tour_tab_default_configurations();

        $all_valid_available_tabs_keys = !$all_valid_available_tabs ? array() : array_keys($all_valid_available_tabs);

        $yatra_tour_tabs_additional_types = yatra_tour_tabs_additional_types();

        foreach ($tour_tab_configs as $config_key => $config) {

            $visibility = true;

            if (isset($config['options'])) {


                $visibility = isset($config['options'][$config_key . '_visibility']) && isset($config['options'][$config_key . '_visibility']['default']) && (boolean)$config['options'][$config_key . '_visibility']['default'];

                unset($config['options']);
            }

            if (!in_array($config_key, $all_valid_available_tabs_keys)) {

                $all_valid_available_tabs[$config_key] = $config;

                $all_valid_available_tabs[$config_key]['type'] = $config_key;

                $all_valid_available_tabs[$config_key]['visibility'] = $visibility;

            }
        };
        foreach ($all_valid_available_tabs as $tab_index => $tab) {

            $type = $tab['type'] ?? $tab_index;

            if (!isset($tour_tab_configs[$type])) {

                if (!in_array($type, $yatra_tour_tabs_additional_types)) {

                    unset($all_valid_available_tabs[$tab_index]);
                }

            }
        }


        return $all_valid_available_tabs;

    }
}
if (!function_exists('yatra_tour_availability')) {

    function yatra_tour_meta_availability_date_ranges($tour_id)
    {

        $availability = get_post_meta($tour_id, 'yatra_tour_meta_availability_date_ranges', true);

        return yatra_maybe_json_decode($availability);
    }
}

if (!function_exists('yatra_is_date_overlap')) {

    function yatra_is_date_overlap($start_one, $end_one, $start_two, $end_two)
    {

        if ($start_one <= $end_two && $end_one >= $start_two) { //If the dates overlap
            return min($end_one, $end_two)->diff(max($start_two, $start_one))->days + 1; //return how many days overlap
        }

        return 0; //Return 0 if there is no overlap
    }
}

if (!function_exists('yatra_is_date_overlapped')) {
    function yatra_is_date_range_overlap($date_ranges, $input_range)
    {
        $start = new DateTime($input_range['start']);

        $end = new DateTime($input_range['end']);

        $overlaped_ranges = array();

        foreach ($date_ranges as $range) {

            $range_start = new DateTime($range['start']);

            $range_end = new DateTime($range['end']);

            $status = yatra_is_date_overlap($start, $end, $range_start, $range_end);

            if ($status) {

                $overlaped_ranges[] = $range;
            }

        }

        return $overlaped_ranges;
    }


}
if (!function_exists('yatra_get_unique_date_ranges')) { // Get ranges with not overlapped each other
    function yatra_get_unique_date_ranges($date_ranges)
    {
        $unique_ranges = array();

        foreach ($date_ranges as $range_index => $range) {

            $new_ranges = $date_ranges;

            unset($new_ranges[$range_index]);

            if (!yatra_is_date_range_overlap($new_ranges, $range)) {
                $unique_ranges[] = $range;
            }

        }
        return $unique_ranges;


    }


}
if (!function_exists('yatra_parse_args')) {

    function yatra_parse_args($args, $defaults = array(), $limited_to_defaults = false)
    {
        $parsed = wp_parse_args($args, $defaults);

        if (!$limited_to_defaults) {
            return $parsed;
        }
        $final_parsed = array();

        foreach ($defaults as $array_key => $array_value) {

            $final_parsed[$array_key] = isset($parsed[$array_key]) ? $parsed[$array_key] : $defaults[$array_key];
        }


        return $final_parsed;
    }
}

if (!function_exists('yatra_get_pricing_type')) {

    function yatra_get_pricing_type($tourID)
    {
        $multiple_pricing = get_post_meta($tourID, 'yatra_multiple_pricing', true);

        if (is_array($multiple_pricing)) {

            if (count($multiple_pricing) > 0) {

                return 'multi';
            }
        }
        return 'single';
    }
}

if (!function_exists('yatra_get_tour_base_multiple_pricing')) {

    function yatra_get_tour_base_multiple_pricing($tourID, $override_overridable_fields_from_base = false)
    {
        $multiple_pricing = get_post_meta($tourID, 'yatra_multiple_pricing', true);

        if (is_array($multiple_pricing)) {

            if ($override_overridable_fields_from_base) {

                $base_pricing = yatra_get_tour_base_single_pricing($tourID);

                foreach ($multiple_pricing as $pricing_id => $pricing) {
                    $multiple_pricing[$pricing_id]['group_size'] = $pricing['pricing_per'] === '' ? $base_pricing['group_size'] : $pricing['group_size'];
                    $multiple_pricing[$pricing_id]['pricing_per'] = $pricing['pricing_per'] === '' ? $base_pricing['pricing_per'] : $pricing['pricing_per'];
                    $multiple_pricing[$pricing_id]['minimum_pax'] = $pricing['minimum_pax'] === '' ? $base_pricing['minimum_pax'] : $pricing['minimum_pax'];
                    $multiple_pricing[$pricing_id]['maximum_pax'] = $pricing['maximum_pax'] === '' ? $base_pricing['maximum_pax'] : $pricing['maximum_pax'];

                }

            }
            return $multiple_pricing;
        }
        return array();
    }
}

if (!function_exists('yatra_get_tour_base_single_pricing')) {

    function yatra_get_tour_base_single_pricing($tourID, $pricing_key = null)
    {
        $pricing = array();
        $pricing['regular_price'] = get_post_meta($tourID, 'yatra_tour_meta_regular_price', true);
        $pricing['sales_price'] = get_post_meta($tourID, 'yatra_tour_meta_sales_price', true);
        $pricing['pricing_label'] = sanitize_text_field(get_post_meta($tourID, 'yatra_tour_meta_pricing_label', true));
        $pricing['pricing_label'] = $pricing['pricing_label'] ? $pricing['pricing_label'] : __('Guest', 'yatra');
        $pricing['pricing_description'] = sanitize_text_field(get_post_meta($tourID, 'yatra_tour_meta_pricing_description', true));
        $pricing['pricing_per'] = get_post_meta($tourID, 'yatra_tour_meta_price_per', true);
        $pricing['group_size'] = get_post_meta($tourID, 'yatra_tour_meta_group_size', true);
        $pricing['minimum_pax'] = get_post_meta($tourID, 'yatra_tour_minimum_pax', true);
        $pricing['maximum_pax'] = get_post_meta($tourID, 'yatra_tour_maximum_pax', true);
        if (!is_null($pricing_key)) {

            if (isset($pricing[$pricing_key])) {

                return $pricing[$pricing_key];
            }
        }
        return $pricing;
    }
}

function yatra_get_current_month_start_and_end_date($year = null, $month = null, $week_start_from = 0)
{
    $year = is_null($year) ? date('Y') : $year;

    $month = is_null($month) ? date('m') : $month;

    $first_day = 1;

    $week_start_from = absint($week_start_from);

    $month_start = $year . '-' . $month . '-' . $first_day;

    $first_day_of_week = absint(date('w', strtotime($month_start)));

    $modified_date = new DateTime($month_start);

    while ($first_day_of_week !== $week_start_from) {

        $modified_date->modify('-1 day');

        $first_day_of_week = absint(date('w', strtotime($modified_date->format('Y-m-d'))));

    }
    $start_date_string = $modified_date->format('Y-m-d');

    $modified_date->modify('+41 day');

    $end_date_string = $modified_date->format('Y-m-d');

    return [
        'start' => $start_date_string,
        'end' => $end_date_string
    ];

}


if (!function_exists('yatra_get_visitor_ip_address')) {

    function yatra_get_visitor_ip_address()
    {

        if (getenv('HTTP_CLIENT_IP')) {
            $ip_address = getenv('HTTP_CLIENT_IP');
        } else if (getenv('HTTP_X_FORWARDED_FOR')) {
            $ip_address = getenv('HTTP_X_FORWARDED_FOR');
        } else if (getenv('HTTP_X_FORWARDED')) {
            $ip_address = getenv('HTTP_X_FORWARDED');
        } else if (getenv('HTTP_FORWARDED_FOR')) {
            $ip_address = getenv('HTTP_FORWARDED_FOR');
        } else if (getenv('HTTP_FORWARDED')) {
            $ip_address = getenv('HTTP_FORWARDED');
        } else if (getenv('REMOTE_ADDR')) {
            $ip_address = getenv('REMOTE_ADDR');
        } else {
            $ip_address = 'UNKNOWN';
        }
        if (apply_filters('yatra_track_visitor_ip_address', true)) {

            return $ip_address;
        }
        return 'TRACKING_DISABLED';
    }
}
if (!function_exists('yatra_is_tour_page')) {
    function yatra_is_tour_page()
    {
        if (is_singular('tour')) {
            return true;
        }
        return false;
    }
}

if (!function_exists('yatra_is_archive_page')) {

    function yatra_is_archive_page()
    {
        if (is_tax('destination')) {
            return true;
        }
        if (is_tax('activity')) {
            return true;
        }
        if (is_post_type_archive('tour')) {
            return true;
        }
        return false;
    }
}

if (!function_exists('yatra_is_search_page')) {

    function yatra_is_search_page()
    {
        global $wp_query;

        if (is_post_type_archive('tour') && $wp_query->is_search) {

            return true;
        }
        return false;
    }
}
function yatra_get_logger()
{
    static $logger = null;

    $class = apply_filters('yatra_logging_class', 'Yatra_Logger');

    if (null !== $logger && is_string($class) && is_a($logger, $class)) {
        return $logger;
    }

    $implements = class_implements($class);

    if (is_array($implements) && in_array('Yatra_Interface_Logger', $implements, true)) {
        $logger = is_object($class) ? $class : new $class();
    } else {
        _doing_it_wrong(
            __FUNCTION__,
            sprintf(
            /* translators: 1: class name 2: yatra_logging_class 3: Yatra_Interface_Logger */
                __('The class %1$s provided by %2$s filter must implement %3$s.', 'yatra'),
                '<code>' . esc_html(is_object($class) ? get_class($class) : $class) . '</code>',
                '<code>yatra_logging_class</code>',
                '<code>Yatra_Interface_Logger</code>'
            ),
            '3.0'
        );

        $logger = is_a($logger, 'Yatra_Logger') ? $logger : new Yatra_Logger();
    }

    return $logger;
}

function yatra_enqueue_js($code)
{
    global $yatra_queued_js;

    if (empty($yatra_queued_js)) {
        $yatra_queued_js = '';
    }

    $yatra_queued_js .= "\n" . $code . "\n";
}

function yatra_print_js()
{
    global $yatra_queued_js;

    if (!empty($yatra_queued_js)) {
        // Sanitize.
        $yatra_queued_js = wp_check_invalid_utf8($yatra_queued_js);
        $yatra_queued_js = preg_replace('/&#(x)?0*(?(1)27|39);?/i', "'", $yatra_queued_js);
        $yatra_queued_js = str_replace("\r", '', $yatra_queued_js);

        $js = "<!-- Yatra JavaScript -->\n<script type=\"text/javascript\">\njQuery(function($) { $yatra_queued_js });\n</script>\n";

        echo apply_filters('yatra_queued_js', $js); //

        unset($yatra_queued_js);
    }
}

if (!function_exists('yatra_terms_and_conditions_pass')) {

    function yatra_terms_and_conditions_pass($show_terms_option_id)
    {
        $show_terms_option_id = sanitize_text_field($show_terms_option_id);

        $agree_terms = get_option($show_terms_option_id, 'no');

        if ($agree_terms === 'yes') {

            $agreed_by_user_value = isset($_POST['yatra_agree_to_terms_and_conditions']) ? absint($_POST['yatra_agree_to_terms_and_conditions']) : 0;

            if ($agreed_by_user_value === 1) {

                return true;
            }
            return false;
        }
        return true;
    }
}

if (!function_exists('yatra_privacy_policy_pass')) {

    function yatra_privacy_policy_pass($show_privacy_policy_option_id)
    {
        $show_privacy_policy_option_id = sanitize_text_field($show_privacy_policy_option_id);

        $agree_privacy = get_option($show_privacy_policy_option_id, 'no');

        if ($agree_privacy === 'yes') {

            $agreed_by_user_value = isset($_POST['yatra_agree_to_privacy_policy']) ? absint($_POST['yatra_agree_to_privacy_policy']) : 0;

            if ($agreed_by_user_value === 1) {

                return true;
            }
            return false;
        }
        return true;
    }
}


if (!function_exists('yatra_is_checkout')) {

    function yatra_is_checkout()
    {
        global $wp_query;

        $is_object_set = isset($wp_query->queried_object);
        $is_object_id_set = isset($wp_query->queried_object_id);
        $is_checkout = is_page(get_option('yatra_checkout_page'));

        if (!$is_object_set) {
            unset($wp_query->queried_object);
        } else if (is_singular()) {
            $content = $wp_query->queried_object->post_content;
        }

        if (!$is_object_id_set) {
            unset($wp_query->queried_object_id);
        }

        // If we know this isn't the primary checkout page, check other methods.
        if (!$is_checkout && isset($content) && has_shortcode($content, 'yatra_checkout')) {
            $is_checkout = true;
        }

        return apply_filters('yatra_is_checkout', $is_checkout);
    }
}