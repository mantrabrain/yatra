<?php
defined('ABSPATH') || exit;

// Load Helpers

include_once YATRA_ABSPATH . 'includes/helpers/yatra-country-helper.php';
include_once YATRA_ABSPATH . 'includes/helpers/yatra-currency-helper.php';


if (!function_exists('yatra_tour_tabs')) {
    function yatra_tour_tabs()
    {
        $tour_tabs_array = array(
            'overview' => array(
                'title' => __('Overview', 'yatra'),
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

            'tour-overview' => __('Overview', 'yatra'),
            'tour-itinerary' => __('Itinerary', 'yatra'),
            'tour-cost' => __('Cost Info', 'yatra'),
            'tour-facts' => __('Tour Facts', 'yatra'),
        );

        return apply_filters('yatra_tour_metabox_tabs', $metabox_tabs);
    }
}

if (!function_exists('yatra_get_global_settings')) {

    function yatra_get_global_settings($setting_key = '')
    {

        // Default setting options for yatra plugin, please add all keys here.

        $default = array(

            'yatra_currency' => 'USD'
        );

        if (!empty($setting_key) && !isset($default[$setting_key])) {

            throw new Exception("Undefined default yatra option " . $setting_key);
        }

        $yatra_system_settings_from_db = get_option('yatra_global_options', $default);

        if (isset($yatra_system_settings_from_db[$setting_key])) {

            return $yatra_system_settings_from_db[$setting_key];
        }
        return $yatra_system_settings_from_db;

    }
}

if (!function_exists('yatra_update_global_setting')) {

    function yatra_update_global_setting($option_key = '', $sanitized_option_value = '')
    {
        $global_settings = yatra_get_global_settings();

        if ($global_settings[$option_key] && !empty($option_key)) {

            $global_settings[$option_key] = $sanitized_option_value;

            update_option('yatra_global_options', $global_settings);

            return true;
        }
        return false;

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
        if (!session_id()) {
            session_start();
        }

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

function yatra_locate_template($template_name, $template_path = '', $default_path = '')
{
    if (!$template_path) {
        $template_path = yatra_instance()->template_path();
    }

    if (!$default_path) {
        $default_path = yatra_instance()->plugin_path() . '/templates/';
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


if (!function_exists('yatra_single_tour_tabs')) {

    function yatra_single_tour_tabs()
    {
        global $post;


    }
}

if (!function_exists('yatra_get_checkout_page')) {

    function yatra_get_checkout_page($get_permalink = false)
    {
        global $wpdb;

        $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_checkout]%" AND post_parent = 0');

        $page_permalink = get_permalink($page_id);

        if ($get_permalink) {

            return $page_permalink;
        }

        return $page_id;


    }
}


if (!function_exists('yatra_get_booking_statuses')) {

    function yatra_get_booking_statuses()
    {
        return apply_filters(
            'yatra_booking_statuses', array(
                'yatra-pending' => __('Pending'),
                'yatra-processing' => __('Processing'),
                'yatra-on-hold' => __('On Hold'),
                'yatra-completed' => __('Completed'),
                'yatra-cancelled' => __('Cancelled')
            )
        );

    }
}
