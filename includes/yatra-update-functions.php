<?php
if (!function_exists('yatra_update_2100_tour_dates_table_create')) {

    function yatra_update_2100_tour_dates_table_create()
    {
        Yatra_Install::verify_base_tables(true);
    }
}

if (!function_exists('yatra_update_2130_logs_update')) {

    function yatra_update_2130_logs_update()
    {
        Yatra_Install::verify_base_tables(true);

        yatra()->get_log_dir();
    }
}


if (!function_exists('yatra_update_2160_tour_minimum_price')) {
    function yatra_update_2160_tour_minimum_price()
    {
        $tours = get_posts(array('post_type' => 'tour', 'numberposts' => -1));
        if (!is_wp_error($tours)) {
            if (is_array($tours)) {
                foreach ($tours as $tour) {
                    $tour_id = isset($tour->ID) ? absint($tour->ID) : 0;
                    if ($tour_id > 0) {
                        yatra_update_filter_meta_minimum_tour_price($tour_id);
                    }
                }
            }
        }
    }
}

