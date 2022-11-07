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
        yatra_get_template('parts/advanced-search.php', []);

    }

}
