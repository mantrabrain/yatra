<?php
if (!class_exists('Yatra_Custom_Post_Type_Tour')) {

    class Yatra_Custom_Post_Type_Tour
    {
        private static $slug = 'tour';

        public static function register()
        {
            $permalinks = yatra_get_permalink_structure();

            $labels = array(
                'name' => __('Tours', 'yatra'),
                'singular_name' => __('Tour', 'yatra'),
                'add_new' => __('Add New', 'yatra'),
                'add_new_item' => __('Add New Tour', 'yatra'),
                'edit_item' => __('Edit Tour', 'yatra'),
                'new_item' => __('New Tour', 'yatra'),
                'all_items' => __('All Tours', 'yatra'),
                'view_item' => __('View Tour', 'yatra'),
                'view_items' => __('View Tours', 'yatra'),
                'search_items' => __('Search Tour', 'yatra'),
                'not_found' => __('No Tours found', 'yatra'),
                'not_found_in_trash' => __('No Tours found in the Trash', 'yatra'),
                'parent_item_colon' => '',
            );

            $args = array(
                'labels' => $labels,
                'menu_icon' => 'dashicons-palmtree',
                'show_in_menu' => true,
                'menu_position' => 29,
                'public' => true,
                'supports' => array('title', 'editor', 'excerpt', 'thumbnail'),
                'has_archive' => true,
                'rewrite' => array(
                    'slug' => trim($permalinks['yatra_tour_base']),
                    'with_front' => true
                ),
                'capability_type' => 'tour',


            );
            register_post_type(self::$slug, $args);

        }
    }


}
