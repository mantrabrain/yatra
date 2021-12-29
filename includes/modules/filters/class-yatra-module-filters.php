<?php

class Yatra_Module_Filters
{
    public function __construct()
    {
        $this->includes();
        $this->hooks();
    }

    public function includes()
    {
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/yatra-filter-functions.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/class-yatra-module-filter-top.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/class-yatra-module-filter-sidebar.php';
    }

    public function hooks()
    {

        add_action('yatra_before_main_content_loop', array($this, 'wrapper_start'), 11);
        add_action('yatra_after_main_content_loop', array($this, 'wrapper_end'), 20);
        add_filter('yatra_script_localize_params', array($this, 'localize_params'));

        // Admin Filter

        add_action('yatra_after_tour_update', array($this, 'after_tour_update'));

    }


    public function wrapper_start()
    {
        if (!yatra_is_archive_page()) {
            return;
        }
        echo '<div class="yatra-archive-main-content-area">';

        do_action('yatra_before_main_content_area_inner');

        echo '<div class="yatra-archive-main-content-area-inner">';

    }

    public function wrapper_end()
    {
        if (!yatra_is_archive_page()) {
            return;
        }
        echo '</div><!-- end of .yatra-archive-main-content-area-inner-->';

        echo '</div><!-- end of .yatra-archive-main-content-area -->';
    }

    public function localize_params($params)
    {
        $duration = yatra_get_duration_ranges_for_filter();
        $price = yatra_get_price_ranges_for_filter();

        $params['filter_options'] = array(
            'price_range_min' => isset($price->min_price) ? absint($price->min_price) : 0,
            'price_range_max' => isset($price->max_price) ? absint($price->max_price) : 0,
            'days_range_min' => isset($duration->min_days) ? absint($duration->min_days) : 0,
            'days_range_max' => isset($duration->max_days) ? absint($duration->max_days) : 0,
            'days' => __(' Days', 'yatra')
        );
        return $params;
    }

    public function after_tour_update($tour_id)
    {
        yatra_update_filter_meta_minimum_tour_price($tour_id);
        wp_cache_delete('yatra_filter_duration_ranges');
        wp_cache_delete('yatra_filter_price_ranges');

    }

}

new Yatra_Module_Filters();

