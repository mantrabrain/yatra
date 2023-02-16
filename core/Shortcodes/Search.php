<?php

namespace Yatra\Core\Shortcodes;


defined('ABSPATH') || exit;

/**
 * Shortcode search class.
 */
class Search
{

    /**
     * Get the shortcode content.
     *
     * @param array $atts Shortcode attributes.
     * @return string
     */
    public static function get($atts)
    {
        return \Yatra_Shortcodes::shortcode_wrapper(array(__CLASS__, 'output'), $atts);
    }

    /**
     * Output the shortcode.
     *
     * @param array $atts Shortcode attributes.
     */
    public static function output($atts)
    {
        $search_type = isset($atts['type']) ? sanitize_text_field($atts['type']) : 'advanced';

        $duration = yatra_get_duration_ranges_for_filter();

        $min_days = $duration->min_days ?? 0;

        $max_days = $duration->max_days ?? 0;

        $price = yatra_get_price_ranges_for_filter();

        $min_price = $price->min_price ?? 0;

        $max_price = $price->max_price ?? 0;

        yatra_get_template('parts/advanced-search.php',
            [
                'min_price' => $min_price, 'max_price' => $max_price, 'min_days' => $min_days, 'max_days' => $max_days, 'search_type' => $search_type
            ]
        );
        wp_enqueue_script('yatra-search-script');
        wp_enqueue_style('yatra-search-style');


    }

}
