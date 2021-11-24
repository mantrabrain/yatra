<?php
if (!class_exists('Yatra_Metabox_Coupons_CPT')) {

    class Yatra_Metabox_Coupons_CPT extends Yatra_Metabox_Base
    {

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));

            add_action('admin_enqueue_scripts', array($this, 'coupon_script'), 11);


        }

        public function coupon_script($hook)
        {

            $screen = get_current_screen();
            $screen_id = isset($screen->id) ? $screen->id : '';
            if ($screen_id != 'yatra-coupons') {
                return;
            }
            wp_enqueue_script('yatra-coupon');
        }

        public function metabox_config($key = null, $get_merge_all_field = false)
        {

            $config = array();

            return $config;
        }

        /**
         * Adds metabox for trip pricing.
         *
         * @since 1.0.0
         */
        public function metabox_form()
        {
            // remove_meta_box('submitdiv', 'yatra-booking', 'side');


            $screens = array('yatra-coupons');

            foreach ($screens as $screen) {
                add_meta_box(
                    'coupons_meta_information',
                    __('Coupon Settings', 'yatra'),
                    array($this, 'callback'),
                    $screen,
                    'normal',
                    'high'
                );
            }
        }

        public function callback($args)
        {
            $coupon_id = $args->ID;

            echo '<div id="yatra-coupon-meta-element"></div>';
        }

        /**
         * When the post is saved, saves our custom data.
         *
         * @param int $post_id The ID of the post being saved.
         */
        public function save($post_id)
        {
            $nonce = isset($_POST['yatra_booking_post_type_metabox_nonce']) ? ($_POST['yatra_booking_post_type_metabox_nonce']) : '';

            if (isset($_POST['yatra_booking_post_type_metabox_nonce'])) {

                $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_booking_post_type_metabox_nonce');

                if ($is_valid_nonce) {

                    $post_status = isset($_POST['yatra_booking_status']) ? $_POST['yatra_booking_status'] : '';

                    $booking_statuses = array_keys(yatra_get_booking_statuses());

                    if (in_array($post_status, $booking_statuses)) {

                        if (!wp_is_post_revision($post_id)) {

                            // unhook this function so it doesn't loop infinitely
                            remove_action('save_post', array($this, 'save'));

                            yatra_update_booking_status($post_id, $post_status);
                            // re-hook this function
                            add_action('save_post', array($this, 'save'));
                        }

                    }
                }
            }

        }


    }
}