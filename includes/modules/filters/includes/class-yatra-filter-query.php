<?php

class Yatra_Filter_Query
{
    public function __construct()
    {
        add_action('pre_get_posts', array($this, 'alter_query'));

    }

    function alter_query($query)
    {

        if (!yatra_is_archive_page()) {
            return;
        }


        if ($query->is_main_query() && is_post_type_archive('tour')) {

            $filter_params = yatra_get_filter_params();

            $meta_query = (array)$query->get('meta_query');

            $tax_query = (array)$query->get('tax_query');

            if (isset($filter_params->min_days) && isset($filter_params->max_days)) {

                $meta_query[] = array(
                    'key' => 'yatra_tour_meta_tour_duration_days',
                    'value' => array($filter_params->min_days, $filter_params->max_days),
                    'type' => 'numeric',
                    'compare' => 'BETWEEN',
                );
            }
            if (isset($filter_params->min_price) && isset($filter_params->max_price)) {

                $meta_query[] = array(
                    'key' => 'yatra_filter_meta_minimum_tour_price',
                    'value' => array($filter_params->min_price, $filter_params->max_price),
                    'type' => 'numeric',
                    'compare' => 'BETWEEN',
                );
            }
            $destination_tax_query = array(
                'relation' => 'OR'
            );

            if (isset($filter_params->filter_destination)) {
                
                foreach ($filter_params->filter_destination as $destination_slug) {

                    $destination_tax_query[] = array(
                        'taxonomy' => 'destination',
                        'field' => 'slug',
                        'terms' => sanitize_text_field($destination_slug)
                    );
                }

            }

            if (count($destination_tax_query) > 1) {
                $tax_query[] = $destination_tax_query;
            }

            $activity_tax_query = array('relation' => 'OR'
            );
            if (isset($filter_params->filter_activity)) {

                foreach ($filter_params->filter_activity as $activity_slug) {

                    $activity_tax_query[] = array(
                        'taxonomy' => 'activity',
                        'field' => 'slug',
                        'terms' => sanitize_text_field($activity_slug)
                    );
                }

            }

            if (count($activity_tax_query) > 1) {
                $tax_query[] = $activity_tax_query;
            }

            $query->set('meta_query', $meta_query);
            $query->set('tax_query', $tax_query);

            $order_by = isset($filter_params->orderby) ? $filter_params->orderby : 'default';

            switch ($order_by) {
                case "name":
                    $query->set('orderby', 'title');
                    $query->set('order', 'ASC');
                    break;
                case "name-desc":
                    $query->set('orderby', 'title');
                    $query->set('order', 'DESC');
                    break;
                case "price":
                    $query->set('meta_key', 'yatra_filter_meta_minimum_tour_price');
                    $query->set('orderby', 'meta_value_num');
                    $query->set('order', 'ASC');
                    break;
                case "price-desc":
                    $query->set('meta_key', 'yatra_filter_meta_minimum_tour_price');
                    $query->set('orderby', 'meta_value_num');
                    $query->set('order', 'DESC');
                    break;
                case "days":
                    $query->set('meta_key', 'yatra_tour_meta_tour_duration_days');
                    $query->set('orderby', 'meta_value_num');
                    $query->set('order', 'ASC');
                    break;
                case "days-desc":
                    $query->set('meta_key', 'yatra_tour_meta_tour_duration_days');
                    $query->set('orderby', 'meta_value_num');
                    $query->set('order', 'DESC');
                    break;
            }


        }

    }
}

new Yatra_Filter_Query();