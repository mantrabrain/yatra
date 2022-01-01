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
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/class-yatra-filter-query.php';
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

        $display_mode = yatra_get_archive_display_mode();

        $display_class = 'yatra-archive-main-content-area-inner';

        $display_class .= $display_mode === 'grid' ? ' yatra-row' : '';

        echo '<div class="yatra-archive-main-content-area yatra-col-sm-9 yatra-col-xs-12">';

        do_action('yatra_before_main_content_area_inner');

        echo '<div class="' . esc_attr($display_class) . '">';

    }

    public function wrapper_end()
    {
        if (!yatra_is_archive_page()) {
            return;
        }
        echo '</div><!-- end of .yatra-archive-main-content-area-inner-->';

        the_posts_pagination(array(
            'prev_text' => '<i class="fa fa-angle-double-left"></i>',
            'next_text' => '<i class="fa fa-angle-double-right"></i>'
        ));

        echo '</div><!-- end of .yatra-archive-main-content-area -->';
    }

    public function localize_params($params)
    {
        $duration = yatra_get_duration_ranges_for_filter();

        $price = yatra_get_price_ranges_for_filter();

        $filter_params = yatra_get_filter_params();

        $days_range_min = isset($duration->min_days) ? absint($duration->min_days) : 0;

        $days_range_max = isset($duration->max_days) ? absint($duration->max_days) : 0;

        $price_range_min = isset($price->min_price) ? absint($price->min_price) : 0;

        $price_range_max = isset($price->max_price) ? absint($price->max_price) : 0;

        global $wp;

        $current_url = add_query_arg($wp->query_vars, get_post_type_archive_link('tour'));

        $params['filter_options'] = array(
            'price_range_min' => $price_range_min,
            'price_range_max' => $price_range_max,
            'price_range_min_value' => isset($filter_params->min_price) ? absint($filter_params->min_price) : $price_range_min,
            'price_range_max_value' => isset($filter_params->max_price) ? absint($filter_params->max_price) : $price_range_max,
            'days_range_min' => $days_range_min,
            'days_range_max' => $days_range_max,
            'days_range_min_value' => isset($filter_params->min_days) ? absint($filter_params->min_days) : $days_range_min,
            'days_range_max_value' => isset($filter_params->max_days) ? absint($filter_params->max_days) : $days_range_max,
            'days' => __(' Days', 'yatra'),
            'current_url' => $current_url
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

