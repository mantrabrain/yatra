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

        public function getTabSettings($post_id)
        {
            return array(
                'general' =>
                    array(
                        'title' => __('General', 'yatra'),
                        'content_title' => __('General Settings', 'yatra'),
                        'settings' =>
                            array(
                                array(
                                    'title' => __('Coupon Code', 'yatra'),
                                    'desc' => __('Coupon Code', 'yatra'),
                                    'desc_tip' => true,
                                    'id' => 'yatra_coupon_code',
                                    'type' => 'text',
                                    'value' => $this->get_value('yatra_coupon_code', $post_id)
                                ),
                                array(
                                    'title' => __('Coupon Type', 'yatra'),
                                    'desc' => __('Coupon Type', 'yatra'),
                                    'desc_tip' => true,
                                    'id' => 'yatra_coupon_type',
                                    'type' => 'select',
                                    'value' => $this->get_value('yatra_coupon_type', $post_id),
                                    'options' => array(
                                        'percentage' => __('Percentage Discount', 'yatra'),
                                        'fixed' => __('Fixed Discount', 'yatra'),

                                    )
                                ),
                                array(
                                    'title' => __('Coupon Value', 'yatra'),
                                    'desc' => __('Coupon Value', 'yatra'),
                                    'desc_tip' => true,
                                    'id' => 'yatra_coupon_value',
                                    'type' => 'number',
                                    'value' => $this->get_value('yatra_coupon_value', $post_id),
                                ),
                                array(
                                    'title' => __('Coupon Expiry Date', 'yatra'),
                                    'desc' => __('Coupon Expiry Date', 'yatra'),
                                    'desc_tip' => true,
                                    'id' => 'yatra_coupon_expiry_date',
                                    'type' => 'datetime',
                                    'value' => $this->get_value('yatra_coupon_expiry_date', $post_id),
                                ),

                            )
                    ),

                'restriction' =>
                    array(
                        'title' => __('Restrictions', 'yatra'),
                        'content_title' => __('Restrictions Settings', 'yatra'),
                        'settings' => array(array(
                            'title' => __('Restriction', 'yatra'),
                            'desc' => __('Tab layout for single tour page', 'yatra'),
                            'desc_tip' => true,
                            'id' => 'yatra_setting_layouts_single_tour_tab_layout',
                            'type' => 'number',
                            'value' => $this->get_value('yatra_setting_layouts_single_tour_tab_layout', $post_id, 2)
                        )

                        )
                    )
            );

        }

        public function get_value($option_id, $post_id, $default = '')
        {
            $post_meta = get_post_meta($post_id, $option_id, true);
            if (!($post_meta)) {
                $post_meta = $default;
            }
            return $post_meta;
        }

        public function coupon_script($hook)
        {

            $screen = get_current_screen();
            $screen_id = isset($screen->id) ? $screen->id : '';
            if ($screen_id != 'yatra-coupons') {
                return;
            }
            global $post;

            $post_id = isset($post->ID) ? $post->ID : '';

            wp_enqueue_script('yatra-coupon');
            wp_enqueue_style('yatra-coupon-css');
            wp_localize_script('yatra-coupon', 'YatraCouponSettings', array(
                'tabs' => $this->getTabSettings($post_id),
                'nonce' => wp_create_nonce('yatra_coupon_post_type_metabox_nonce'),
                'active_tab' => $this->get_value('active_tab', $post_id, 'general')
            ));
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
            $nonce = isset($_POST['yatra_coupon_post_type_metabox_nonce']) ? ($_POST['yatra_coupon_post_type_metabox_nonce']) : '';

            if (isset($_POST['yatra_coupon_post_type_metabox_nonce'])) {

                $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_coupon_post_type_metabox_nonce');

                if ($is_valid_nonce) {

                    $tabs = $this->getTabSettings($post_id);

                    foreach ($tabs as $tab_settings) {

                        $fields = isset($tab_settings['settings']) ? $tab_settings['settings'] : array();

                        foreach ($fields as $field) {

                            $field_id = isset($field['id']) ? $field['id'] : '';

                            if ('' !== $field_id) {
                                $field_value = isset($_POST[$field_id]) ? $_POST[$field_id] : '';

                                $valid_field_value = $this->sanitize($field_value, $field);

                                update_post_meta($post_id, $field_id, $valid_field_value);
                            }
                        }
                    }

                    $active_tab = isset($_POST['yatra_coupon_active_tab']) ? sanitize_text_field($_POST['yatra_coupon_active_tab']) : '';

                    update_post_meta($post_id, 'active_tab', $active_tab);


                }
            }

        }


    }
}