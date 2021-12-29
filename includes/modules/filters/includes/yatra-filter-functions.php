<?php

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

function yatra_get_filters_sections()
{
    return apply_filters(
        'yatra_tour_filters_sections',
        array(
            'Yatra_Module_Filter_Section_Destinations',
            'Yatra_Module_Filter_Section_Activities',
            'Yatra_Module_Filter_Section_Price',
            'Yatra_Module_Filter_Section_Duration',
        )
    );
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