<?php
if (!function_exists('yatra_has_search_shortcode')) {

    function yatra_has_search_shortcode($current_page_id = 0)
    {
        $current_page_id = $current_page_id > 0 ? $current_page_id : get_the_ID();

        global $wpdb;

        $page_id = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_search%" AND post_parent = 0');

        if (is_wp_error($page_id)) {
            return false;
        }

        if (absint($current_page_id) === absint($page_id)) {
            return true;
        }

        return false;


    }
}