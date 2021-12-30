<?php

if (!function_exists('yatra_get_terms_by_id')) {
    function yatra_get_terms_by_id($taxonomy, $args = array())
    {
        $terms = get_terms($taxonomy, $args);
        $terms_by_ids = array();

        if (is_array($terms)) {
            foreach ($terms as $term_object) {
                $term_object->children = array();
                $term_object->link = get_term_link($term_object->term_id);
                if (isset($terms_by_ids[$term_object->term_id])) {
                    foreach ((array)$terms_by_ids[$term_object->term_id] as $prop_name => $prop_value) {
                        $term_object->{$prop_name} = $prop_value;
                    }
                }
                if ($term_object->parent) {
                    if (!isset($terms_by_ids[$term_object->parent])) {
                        $terms_by_ids[$term_object->parent] = new \stdClass();
                    }
                    $terms_by_ids[$term_object->parent]->children[] = $term_object->term_id;
                }

                $terms_by_ids[$term_object->term_id] = $term_object;
            }
        }

        return $terms_by_ids;
    }
}
if (!function_exists('yatra_array_get')) {
    function yatra_array_get($array, $index = null, $default = null)
    {
        if (!is_array($array)) {
            return $default;
        }
        if (is_null($index)) {
            return $array;
        }
        $multi_label_indices = explode('.', $index);
        $value = $array;
        foreach ($multi_label_indices as $key) {
            if (!isset($value[$key])) {
                $value = $default;
                break;
            }
            $value = $value[$key];
        }
        return $value;
    }
}
if (!function_exists('yatra_get_sidebar_filter_sections')) {
    function yatra_get_sidebar_filter_sections()
    {
        return apply_filters(
            'yatra_sidebar_filter_sections',
            array(
                'Yatra_Module_Filter_Section_Destinations',
                'Yatra_Module_Filter_Section_Activities',
                'Yatra_Module_Filter_Section_Price',
                'Yatra_Module_Filter_Section_Duration',
            )
        );
    }
}

if (!function_exists('yatra_get_duration_ranges_for_filter')) {

    function yatra_get_duration_ranges_for_filter()
    {
        global $wpdb;

        $range = wp_cache_get('yatra_filter_duration_ranges', 'options');

        if (!$range) {
            $where = $wpdb->prepare('meta_key = %s', 'yatra_tour_meta_tour_duration_days');
            $query = "SELECT MIN(meta_value * 1) as `min_days`, MAX(meta_value * 1) as `max_days` FROM {$wpdb->postmeta} WHERE {$where}";
            $results = $wpdb->get_row($query); // phpcs:ignore
            $range = array(
                'max_days' => 0,
                'min_days' => 0,
            );
            if (!empty($results)) {
                $range = $results;
            }

            wp_cache_add('yatra_filter_duration_ranges', $range, 'options');
        }

        return (object)$range;
    }
}

if (!function_exists('yatra_get_price_ranges_for_filter')) {

    function yatra_get_price_ranges_for_filter()
    {
        global $wpdb;

        $range = wp_cache_get('yatra_filter_price_ranges', 'options');

        if (!$range) {
            $where = $wpdb->prepare('meta_key = %s', 'yatra_filter_meta_minimum_tour_price');
            $query = "SELECT MIN(meta_value * 1) as `min_price`, MAX(meta_value * 1) as `max_price` FROM {$wpdb->postmeta} WHERE {$where}";
            $results = $wpdb->get_row($query); // phpcs:ignore
            $range = array(
                'min_price' => 0,
                'max_price' => 0,
            );
            if (!empty($results)) {
                $range = $results;
            }

            wp_cache_add('yatra_filter_price_ranges', $range, 'options');
        }

        return (object)$range;
    }
}
if (!function_exists('yatra_filter_get_sort_by')) {
    function yatra_filter_get_sort_by()
    {
        return array(
            'default' => __('Default Sorting', 'yatra'),
            'price' => __('Sort by price: low to high', 'yatra'),
            'price-desc' => __('Sort by price: high to low', 'yatra'),
            'days' => __('Sort by days: low to high', 'yatra'),
            'days-desc' => __('Sort by days: high to low', 'yatra'),
            'name' => __('Sort by name: a - z', 'yatra'),
            'name-desc' => __('Sort by name: z - a', 'yatra'),


        );
    }
}

if (!function_exists('yatra_get_filter_params')) {

    function yatra_get_filter_params()
    {
        $orderby = isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : '';

        $display_mode = isset($_GET['display_mode']) ? sanitize_text_field($_GET['display_mode']) : '';

        $display_mode = $display_mode === 'list' || $display_mode === 'grid' ? $display_mode : '';

        $order_by_options = array_keys(yatra_filter_get_sort_by());

        $orderby = in_array($orderby, $order_by_options) ? $orderby : '';

        $min_days = isset($_GET['min_days']) ? absint($_GET['min_days']) : '';

        $max_days = isset($_GET['max_days']) ? absint($_GET['max_days']) : '';

        $min_price = isset($_GET['min_price']) ? absint($_GET['min_price']) : '';

        $max_price = isset($_GET['max_price']) ? absint($_GET['max_price']) : '';

        $filter_activity = isset($_GET['filter_activity']) ? sanitize_text_field($_GET['filter_activity']) : '';

        $filter_destination = isset($_GET['filter_destination']) ? sanitize_text_field($_GET['filter_destination']) : '';

        $activity = $filter_activity !== '' ? explode(',', $filter_activity) : array();

        $destination = $filter_destination !== '' ? explode(',', $filter_destination) : array();

        $response_array = array();

        $duration = yatra_get_duration_ranges_for_filter();

        $price = yatra_get_price_ranges_for_filter();


        if ($min_days !== '') {
            $response_array['min_days'] = absint($duration->min_days) > $min_days ? absint($duration->min_days) : $min_days;
        }
        if ($max_days !== '') {
            $response_array['max_days'] = absint($duration->max_days) < $max_days ? absint($duration->max_days) : $max_days;
        }
        if ($min_price !== '') {
            $response_array['min_price'] = absint($price->min_price) > $min_price ? absint($price->min_price) : $min_price;
        }
        if ($max_price !== '') {
            $response_array['max_price'] = absint($price->max_price) < $max_price ? absint($price->max_price) : $max_price;
        }
        if (count($activity) > 0 && count($activity) < 100) {
            $response_array['filter_activity'] = array_unique($activity);
        }
        if (count($destination) > 0 && count($destination) < 100) {

            $response_array['filter_destination'] = array_unique($destination);
        }
        if ($orderby !== '') {
            $response_array['orderby'] = $orderby;
        }
        if ($display_mode !== '') {
            $response_array['display_mode'] = $display_mode;
        }

        return (object)$response_array;


    }
}