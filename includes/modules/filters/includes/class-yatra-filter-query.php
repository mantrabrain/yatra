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

            $query->set('meta_query', $meta_query);
            //$query->set('posts_per_page', 1);


        }

    }
}

new Yatra_Filter_Query();