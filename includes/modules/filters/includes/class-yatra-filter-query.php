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
            if (isset($filter_params->destination)) {

                if (count($filter_params->destination) > 0) {

                    foreach ($filter_params->destination as $destination_slug) {

                        $tax_query[] = array(
                            'taxonomy' => 'destination',
                            'field' => 'slug',
                            'terms' => sanitize_text_field($destination_slug)
                        );
                    }
                }
            }

            if (isset($filter_params->activity)) {

                if (count($filter_params->activity) > 0) {

                    foreach ($filter_params->activity as $activity_slug) {

                        $tax_query[] = array(
                            'taxonomy' => 'activity',
                            'field' => 'slug',
                            'terms' => sanitize_text_field($activity_slug)
                        );
                    }
                }
            }

            $query->set('meta_query', $meta_query);
            $query->set('tax_query', $tax_query);


        }

    }
}

new Yatra_Filter_Query();