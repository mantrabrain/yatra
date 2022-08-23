<?php
if (!class_exists('Yatra_Custom_Post_Type_Customers')) {

    class Yatra_Custom_Post_Type_Customers
    {
        private static $slug = 'yatra-customers';

        public static function register()
        {
            $labels = array(
                'name' => __('Customers', 'yatra'),
                'singular_name' => __('Customer', 'yatra'),
                'edit_item' => __('Edit Customers', 'yatra'),
                'all_items' => __('All Customers', 'yatra'),
                'view_item' => __('View Customer', 'yatra'),
                'search_items' => __('Search Customer', 'yatra'),
                'not_found' => __('No Customers found', 'yatra'),
                'not_found_in_trash' => __('No Customers found in the Trash', 'yatra'),
                'parent_item_colon' => '',
                'menu_name' => __('Customers', 'yatra'),
            );
            $args = array(
                'labels' => $labels,
                'public' => true,
                'supports' => array('title'),
                'has_archive' => false,
                'show_in_menu' => false,// YATRA_ADMIN_MENU_SLUG,
                'publicly_queryable' => false,
                'exclude_from_search' => true,
                'capabilities' => array(
                    'create_posts' => 'do_not_allow', // false < WP 4.5, credit @Ewout
                    'delete_posts' => 'do_not_allow', // false < WP 4.5, credit @Ewout
                ),
                'capability_type' => 'yatra-customers',
                'menu_position' => 2


            );
            register_post_type(self::$slug, $args);

        }

        public function __construct()
        {
            add_filter('bulk_actions-' . 'edit-yatra-customers', '__return_empty_array');
            add_filter('views_' . 'edit-yatra-customers', '__return_empty_array');


        }

    }
}