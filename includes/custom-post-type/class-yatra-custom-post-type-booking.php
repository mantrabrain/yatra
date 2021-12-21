<?php
if (!class_exists('Yatra_Custom_Post_Type_Booking')) {

    class Yatra_Custom_Post_Type_Booking
    {
        private $slug = 'yatra-booking';


        public static function register_post_status()
        {

            $order_statuses = apply_filters(
                'yatra_register_booking_post_statuses',
                array(
                    'yatra-pending' => array(
                        'label' => _x('Pending booking', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('Pending booking <span class="count">(%s)</span>', 'Pending bookings <span class="count">(%s)</span>', 'yatra'),
                    ),
                    'yatra-processing' => array(
                        'label' => _x('Processing', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('Processing <span class="count">(%s)</span>', 'Processing <span class="count">(%s)</span>', 'yatra'),
                    ),
                    'yatra-on-hold' => array(
                        'label' => _x('On hold', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('On hold <span class="count">(%s)</span>', 'On hold <span class="count">(%s)</span>', 'yatra'),
                    ),
                    'yatra-completed' => array(
                        'label' => _x('Completed', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('Completed <span class="count">(%s)</span>', 'Completed <span class="count">(%s)</span>', 'yatra'),
                    ),
                    'yatra-cancelled' => array(
                        'label' => _x('Cancelled', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('Cancelled <span class="count">(%s)</span>', 'Cancelled <span class="count">(%s)</span>', 'yatra'),
                    ),
                    'yatra-failed' => array(
                        'label' => _x('Failed', 'Booking status', 'yatra'),
                        'public' => true,
                        'exclude_from_search' => false,
                        'show_in_admin_all_list' => true,
                        'show_in_admin_status_list' => true,
                        /* translators: %s: number of orders */
                        'label_count' => _n_noop('Failed <span class="count">(%s)</span>', 'Failed <span class="count">(%s)</span>', 'yatra'),
                    ),
                )
            );

            foreach ($order_statuses as $order_status => $values) {
                register_post_status($order_status, $values);
            }
        }

        public function remove($actions)
        {
            if (get_post_type() === $this->slug) {
                unset($actions['edit']);
                unset($actions['view']);
                unset($actions['trash']);
                unset($actions['inline hide-if-no-js']);
            }
            return $actions;
        }

        public function register()
        {
            $labels = array(
                'name' => __('Bookings', 'yatra'),
                'singular_name' => __('Booking', 'yatra'),
                'edit_item' => __('Edit Booking', 'yatra'),
                'all_items' => __('All Bookings', 'yatra'),
                'view_item' => __('View Booking', 'yatra'),
                'search_items' => __('Search Booking', 'yatra'),
                'not_found' => __('No Bookings found', 'yatra'),
                'not_found_in_trash' => __('No Bookings found in the Trash', 'yatra'),
                'parent_item_colon' => '',
                'menu_name' => __('Bookings', 'yatra'),

            );
            $args = array(
                'labels' => $labels,
                'public' => true,
                'supports' => array('title'),
                'has_archive' => false,
                'show_in_menu' => 'edit.php?post_type=tour',
                'publicly_queryable' => false,
                'exclude_from_search' => true,
                'show_in_admin_bar' => false,


            );
            register_post_type($this->slug, $args);

        }


        public function init()
        {
            add_action('init', array($this, 'register'));
            add_action('init', array($this, 'register_post_status'));
            add_filter('post_row_actions', array($this, 'remove'));
            // add_action('do_meta_boxes', array($this, 'hide_metabox'));
        }

        public function hide_metabox()
        {


        }
    }
}
