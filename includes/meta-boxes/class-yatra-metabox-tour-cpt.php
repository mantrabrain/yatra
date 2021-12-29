<?php
if (!class_exists('Yatra_Metabox_Tour_CPT')) {

    class Yatra_Metabox_Tour_CPT extends Yatra_Metabox_Base
    {
        private $tabs = array();

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));
            add_action('wp_ajax_yatra_add_attribute_meta', array($this, 'yatra_add_attribute_meta'));
            add_action('yatra_tour_meta_body_content', array($this, 'tour_meta'));
            add_action('yatra_tour_meta_tab_content_general', array($this, 'general_tab_content'));
            add_action('yatra_tour_meta_tab_content_pricing', array($this, 'pricing_tab_content'));
            add_action('yatra_tour_meta_tab_content_attributes', array($this, 'attributes_tab_content'));
            add_action('yatra_tour_meta_tab_content_tour_tabs', array($this, 'tour_tabs_tab_content'));


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
            add_action('edit_form_after_editor', array($this, 'tour_settings'));

        }

        /*  function callback($args){

          }*/
        public function tour_settings($post)
        {
            if ($post->post_type !== 'tour') {
                return;
            }
            $args = array(
                'title' => esc_html__('Tour Additional Information', 'yatra')
            );
            yatra_load_admin_template('metabox.tour.box', $args);
        }

        public function tour_meta()
        {
            global $post;

            $post_id = $post->ID ?? 0;

            $args['tabs'] = yatra_tour_metabox_tabs();

            $args['active_tab'] = get_post_meta($post_id, 'yatra_tour_meta_tour_admin_active_tab', true);

            yatra_load_admin_template('metabox.tour.tab', $args);

            yatra_load_admin_template('metabox.tour.tab-content', $args);

        }

        public function general_tab_content($content)
        {
            $settings = isset($content['settings']) ? $content['settings'] : array();

            foreach ($settings as $field) {

                $this->metabox_html($field);
            }

        }

        public function pricing_tab_content($content)
        {
            global $post;

            $post_id = isset($post->ID) ? $post->ID : '';

            $multiple_pricing = $post_id != '' ? get_post_meta($post_id, 'yatra_multiple_pricing', true) : array();


            $settings = isset($content['settings']) ? $content['settings'] : array();

            foreach ($settings as $field) {

                $this->metabox_html($field);
            }
            $currency = yatra_get_current_currency();

            $currency_symbol = yatra_get_currency_symbol($currency);

            // Load Template
            yatra_load_admin_template('metabox.tour.pricing.group-pricing-tmpl', array(
                'id' => '{%pricing_option_id%}',
                'currency_symbol' => $currency_symbol,
                'pricing_option_id' => 'yatra_multiple_pricing[{%pricing_option_id%}]',
                'multiple_pricing' => array(
                    'pricing_label' => '',
                    'pricing_description' => '',
                    'minimum_pax' => '',
                    'maximum_pax' => '',
                    'regular_price' => '',
                    'sales_price' => '',
                    'pricing_per' => '',
                    'group_size' => ''

                )
            ));

            $default_pricing =
                array(
                    'pricing_label' => '',
                    'pricing_description' => '',
                    'minimum_pax' => '',
                    'maximum_pax' => '',
                    'regular_price' => '',
                    'sales_price' => '',
                    'pricing_per' => '',
                    'group_size' => ''
                );
            // Load Original Data
            $multiple_pricing = is_array($multiple_pricing) ? $multiple_pricing : array();
            foreach ($multiple_pricing as $pricing_option_id => $pricing) {
                $pricing = wp_parse_args($pricing, $default_pricing);
                yatra_load_admin_template('metabox.tour.pricing.group-pricing', array(
                    'id' => $pricing_option_id,
                    'currency_symbol' => $currency_symbol,
                    'pricing_option_id' => 'yatra_multiple_pricing[' . $pricing_option_id . ']',
                    'multiple_pricing' => $pricing
                ));
            }
            yatra_load_admin_template('metabox.tour.pricing.add-new');

        }

        public function attributes_tab_content()
        {
            $settings = yatra_tour_attributes();

            foreach ($settings as $field) {

                $this->metabox_html($field);
            }

            echo '<div style="clear:both" class="mb-clear"></div>';

            global $post;

            $post_id = $post->ID;

            $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);

            if (!is_array($tour_meta_custom_attributes)) {

                $tour_meta_custom_attributes = array();
            }

            $yatra_tour_attribute_type_options = array_keys(yatra_tour_attribute_type_options());

            foreach ($tour_meta_custom_attributes as $term_id => $term_value_array) {

                $field_type = get_term_meta($term_id, 'attribute_field_type', true);


                if (in_array($field_type, $yatra_tour_attribute_type_options)) {

                    echo '<div class="mb-tour-attributes">';

                    echo $this->parse_attribute($field_type, $term_id, $term_value_array);

                    echo '<div style="clear:both" class="mb-clear"></div>';

                    echo '</div>';
                }

            }
        }

        public function tour_tabs_tab_content($content)
        {

            $settings = $content['settings'] ?? array();

            echo '<ul  class="mb-meta-vertical-tab">';

            $index = 0;

            global $post;

            $post_id = $post->ID;

            $yatra_tour_meta_tour_tabs_ordering_array = yatra_frontend_tour_tabs_ordering('array', $post_id);

            $config_array_keys = array_keys($settings);

            $array_diff = array_diff($config_array_keys, $yatra_tour_meta_tour_tabs_ordering_array);

            $final_ordered_config_keys = $yatra_tour_meta_tour_tabs_ordering_array;

            if (count($array_diff) > 0) {

                $final_ordered_config_keys = array_merge($yatra_tour_meta_tour_tabs_ordering_array, $array_diff);
            }

            $active_tab_config = get_post_meta($post_id, 'yatra_tour_meta_tour_admin_subtab_active_tab', true);

            foreach ($final_ordered_config_keys as $config) {

                if (isset($settings[$config])) {

                    $setting = $settings[$config];

                    if ($active_tab_config === '' || !$active_tab_config) {

                        $active_tab_config = $index == 0 ? $config : '';
                    }
                    $class = $config === $active_tab_config ? 'active wowitsworking' : '';

                    $icon = isset($setting['icon']) ? '<span class="icon ' . esc_attr($setting['icon']) . '"></span>' : '';

                    $eye_icon_class = 'dashicons-visibility';

                    if (!yatra_has_tab_visible($config, $post_id)) {

                        $eye_icon_class = 'dashicons-hidden';

                        $class .= ' hide';

                    }
                    $eye_icon = '<span style="float:right; z-index:9999" class="yatra-tab-visibility dashicons ' . esc_attr($eye_icon_class) . '"></span>';

                    echo '<li class="' . $class . '" data-tab-content="' . $config . '">' . $icon . $setting['label'] . $eye_icon . '</li>';

                    $index++;
                }
            }


            echo '</ul>';

            echo '<div class="mb-meta-vertical-tab-content">';

            foreach ($settings as $config_key => $setting_value) {

                $class = 'mb-meta-vertical-tab-content-item';

                $class .= $config_key === $active_tab_config ? ' active' : '';

                echo '<div class="' . $class . '" data-tab-content="' . $config_key . '">';

                foreach ($setting_value as $setting_key => $setting_args) {

                    switch ($setting_key) {

                        case "label":
                            echo "<h2>{$setting_args}</h2>";
                            break;

                        case "options":
                            foreach ($setting_args as $option) {
                                $this->metabox_html($option);
                            }
                            break;

                    }

                }


                echo '</div>';
            }
            echo '</div>';
        }


        /**
         * When the post is saved, saves our custom data.
         *
         * @param int $post_id The ID of the post being saved.
         */
        public function save($post_id)
        {

            if (get_post_type($post_id) !== 'tour') {
                return;
            }
            /*
             * We need to verify this came from our screen and with proper authorization,
             * because the save_post action can be triggered at other times.
             */
            $nonce = isset($_POST['yatra_tour_cpt_meta_nonce']) ? ($_POST['yatra_tour_cpt_meta_nonce']) : '';

            $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_tour_post_type_metabox_nonce');

            if (!$is_valid_nonce) {
                return;
            }

            $metabox_tabs = yatra_tour_metabox_tabs();

            foreach ($metabox_tabs as $tab_content_key => $tab_content) {

                $settings = isset($tab_content['settings']) ? $tab_content['settings'] : array();

                switch ($tab_content_key) {

                    case "general":
                        $this->save_general_options($settings, $post_id);

                        break;
                    case "pricing":
                        $this->save_pricing_options($settings, $post_id);

                        break;

                    case "attributes":
                        $this->save_tour_attributes($settings, $post_id);
                        break;

                    case "tour_tabs":
                        $this->save_tour_tabs($settings, $post_id);
                        break;
                }
            }


            do_action('yatra_after_tour_update', $post_id);
        }

        private function save_tour_attributes($configs, $post_id)
        {

            $tour_meta_custom_attributes = isset($_POST['tour_meta_custom_attributes']) ? $_POST['tour_meta_custom_attributes'] : array();

            if (!is_array($tour_meta_custom_attributes)) {

                $tour_meta_custom_attributes = array();
            }

            $valid_tour_meta_custom_attributes = array();

            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();

            foreach ($tour_meta_custom_attributes as $term_id => $meta_attribute) {

                $term_id = absint($term_id);

                $field_type = get_term_meta($term_id, 'attribute_field_type', true);

                $field_option = isset($yatra_tour_attribute_type_options[$field_type]) ? $yatra_tour_attribute_type_options[$field_type] : array();

                $options = isset($field_option['options']) ? $field_option['options'] : array();


                $field_valid_option = array();

                foreach ($options as $option) {

                    $type = isset($option['type']) ? $option['type'] : '';

                    $name = isset($option['name']) ? $option['name'] : '';

                    $field_value = isset($meta_attribute[$name]) ? $meta_attribute[$name] : '';

                    if (!empty($name) && !empty($type)) {

                        $valid_field_value = $this->sanitize($field_value, $option);

                        $field_valid_option[$name] = $valid_field_value;

                    }

                }

                if (count($field_valid_option) > 0) {

                    $valid_tour_meta_custom_attributes[$term_id] = $field_valid_option;

                }


            }

            update_post_meta($post_id, 'tour_meta_custom_attributes', $valid_tour_meta_custom_attributes);

        }

        private function save_general_options($configs, $post_id)
        {
            foreach ($configs as $field_key => $field) {

                $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                $valid_field_value = $this->sanitize($field_value, $field);

                update_post_meta($post_id, $field_key, $valid_field_value);
            }
        }

        private function save_pricing_options($configs, $post_id)
        {
            foreach ($configs as $field_key => $field) {

                $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                $valid_field_value = $this->sanitize($field_value, $field);

                update_post_meta($post_id, $field_key, $valid_field_value);

                $multiple_pricing = isset($_POST['yatra_multiple_pricing']) ? $_POST['yatra_multiple_pricing'] : array();

                $pricing_array = array();
                foreach ($multiple_pricing as $pricing_key => $pricing) {
                    $label = isset($pricing['pricing_label']) ? sanitize_text_field($pricing['pricing_label']) : '';
                    $description = isset($pricing['pricing_description']) ? sanitize_text_field($pricing['pricing_description']) : '';
                    $minimum_pax = isset($pricing['minimum_pax']) ? yatra_maybeintempty($pricing['minimum_pax']) : '';
                    $maximum_pax = isset($pricing['maximum_pax']) ? yatra_maybeintempty($pricing['maximum_pax']) : '';
                    $price_per = isset($pricing['pricing_per']) ? sanitize_text_field($pricing['pricing_per']) : '';
                    $group_size = isset($pricing['group_size']) ? yatra_maybeintempty($pricing['group_size']) : '';
                    $regular_price = isset($pricing['regular_price']) ? absint($pricing['regular_price']) : '';
                    $sales_price = isset($pricing['sales_price']) ? ($pricing['sales_price']) : '';
                    $sales_price = $sales_price == '' ? '' : absint($sales_price);
                    $option_id = isset($pricing['option_id']) ? sanitize_text_field($pricing['option_id']) : '';
                    if ($label != '' && $option_id === $pricing_key && $option_id != '{%pricing_option_id%}') {
                        $pricing_array[$pricing_key]['pricing_label'] = $label;
                        $pricing_array[$pricing_key]['pricing_description'] = $description;
                        $pricing_array[$pricing_key]['minimum_pax'] = $minimum_pax;
                        $pricing_array[$pricing_key]['maximum_pax'] = $maximum_pax;
                        $pricing_array[$pricing_key]['pricing_per'] = $price_per;
                        $pricing_array[$pricing_key]['group_size'] = $group_size;
                        $pricing_array[$pricing_key]['regular_price'] = $regular_price;
                        $pricing_array[$pricing_key]['sales_price'] = $sales_price;
                    }
                }
                update_post_meta($post_id, 'yatra_multiple_pricing', $pricing_array);


            }
        }

        private function save_tour_tabs($configs, $post_id)
        {

            foreach ($configs as $config) {

                $options = isset($config['options']) ? $config['options'] : array();

                foreach ($options as $option => $option_field) {

                    $field_key = isset($option_field['name']) ? $option_field['name'] : '';

                    $type = isset($option_field['type']) ? $option_field['type'] : '';

                    if (!empty($field_key)) {

                        if ($type != 'repeator') {

                            $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                            $valid_field_value = $this->sanitize($field_value, $option_field);

                            update_post_meta($post_id, $field_key, $valid_field_value);

                        } else {

                            $repeator_options = isset($option_field['options']) ? $option_field['options'] : array();

                            $repeator = isset($_POST[$field_key]) ? $_POST[$field_key] : array();

                            $repeator_array = isset($repeator_options[0]) ? $repeator_options[0] : array();

                            $final_field_value = array();

                            foreach ($repeator as $repeator_key => $repeator_value) {

                                $valid_field_value_array = array();

                                foreach ($repeator_value as $single_repeator_value) {

                                    if (isset($repeator_array[$repeator_key])) {

                                        $valid_field_value = $this->sanitize($single_repeator_value, $repeator_array[$repeator_key]);

                                        array_push($valid_field_value_array, $valid_field_value);

                                    }

                                }
                                $final_field_value[$field_key][$repeator_key] = $valid_field_value_array;


                            }

                            if (isset($final_field_value[$field_key])) {

                                update_post_meta($post_id, $field_key, $final_field_value[$field_key]);
                            }


                        }

                    }

                }
            }
        }

        public function yatra_add_attribute_meta()
        {
            $nonce_value = isset($_REQUEST['yatra_nonce']) ? $_REQUEST['yatra_nonce'] : '';

            $is_valid_nonce = wp_verify_nonce($nonce_value, 'wp_yatra_add_attribute_meta_nonce');

            $term_id = isset($_POST['term_id']) ? absint($_POST['term_id']) : 0;

            $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;

            if (!$is_valid_nonce || $term_id < 1 || $post_id < 1) {

                wp_send_json_error(array('error' => 'somethig wrong'));
            }
            $term = get_term($term_id);

            $field_type = get_term_meta($term_id, 'attribute_field_type', true);

            $yatra_tour_attribute_type_options = array_keys(yatra_tour_attribute_type_options());

            if ((!isset($term->term_id)) || (!in_array($field_type, $yatra_tour_attribute_type_options))) {

                wp_send_json_error();
            }

            $content = $this->parse_attribute($field_type, $term_id, array(), $post_id);

            wp_send_json_success($content);

        }

        public function parse_attribute($field_type, $term_id, $term_value_array = array(), $post_id = 0)
        {

            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();

            $tour_attributes = array();

            if (isset($yatra_tour_attribute_type_options[$field_type])) {

                $tour_attributes = $yatra_tour_attribute_type_options[$field_type];
            }

            if (count($tour_attributes) < 1) {
                return false;
            }


            ob_start();

            echo '<div class="mb-tour-attributes-fields" data-term-id="' . absint($term_id) . '">';

            echo '<span class="mb-remove-item dashicons dashicons-dismiss"></span>';

            $options = isset($tour_attributes['options']) ? $tour_attributes['options'] : array();

            $yatra_attribute_meta = get_term_meta($term_id, 'yatra_attribute_meta', true);

            $term = get_term($term_id);

            $term_name = isset($term->name) ? $term->name : '';

            foreach ($options as $option) {

                echo '<h2>' . esc_attr($term_name) . '</h2>';

                if (isset($term_value_array[$option['name']])) {

                    $option['default'] = $term_value_array[$option['name']];

                } else {

                    $option['default'] = isset($yatra_attribute_meta[$option['name']]) ? $yatra_attribute_meta[$option['name']] : '';
                }

                $option['name'] = 'tour_meta_custom_attributes[' . $term_id . '][' . $option['name'] . ']';


                $this->metabox_html($option, $post_id);


            }

            echo '</div>';
            $content = ob_get_clean();

            return $content;


        }


    }
}
