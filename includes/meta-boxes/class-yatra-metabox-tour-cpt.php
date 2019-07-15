<?php
if (!class_exists('Yatra_Metabox_Tour_CPT')) {

    class Yatra_Metabox_Tour_CPT extends Yatra_Metabox_Base
    {

        function __construct()
        {
            add_action('add_meta_boxes', array($this, 'metabox_form'));

            add_action('save_post', array($this, 'save'));

            add_action('wp_ajax_yatra_add_attribute_meta', array($this, 'yatra_add_attribute_meta'));


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
            $screens = array('tour');

            foreach ($screens as $screen) {
                add_meta_box(
                    'tour_meta_information',
                    __('Tour Additional Information', 'yatra'),
                    array($this, 'callback'),
                    $screen,
                    'normal',
                    'high'
                );
            }
        }

        // Tab for notice listing and settings
        public function callback($args)
        {


            $metabox_tabs = yatra_tour_metabox_tabs();


            ?>
            <div class="yatra-tabs">

                <ul class="mb-tab-list">
                    <?php foreach ($metabox_tabs as $tab_key => $tab) { ?>
                        <li><a href="#<?php echo esc_attr($tab_key); ?>"><?php echo esc_html($tab['label']); ?></a></li>
                    <?php } ?>
                </ul>
                <?php

                $index = 0;

                foreach ($metabox_tabs as $tab_content_key => $tab_content) {
                    $index++;
                    ?>
                    <section id="<?php echo esc_attr($tab_content_key); ?>" style="display:none;"
                             class="yatra-tab-section">
                        <?php

                        $configs = isset($tab_content['config']) ? $tab_content['config'] : array();

                        switch ($tab_content_key) {

                            case "tour-options":
                                $this->tour_options($configs, $tab_content_key);

                                break;

                            case "tour-attributes":
                                $this->tour_attributes($configs, $tab_content_key);

                                break;

                            case "tour-tabs":
                                $this->tour_tabs($configs, $tab_content_key);

                                break;
                        }
                        ?>
                    </section>
                <?php } ?>
                <input type="hidden" value="<?php echo wp_create_nonce('yatra_tour_post_type_metabox_nonce') ?>"
                       name="yatra_tour_cpt_meta_nonce"/>
                <?php
                global $post;

                ?>
                <input type="hidden" value="<?php echo $post->ID ?>"
                       name="yatra_tour_cpt_meta_post_id" class="yatra_tour_cpt_meta_post_id"/>
            </div>
            <?php
        }

        /**
         * When the post is saved, saves our custom data.
         *
         * @param int $post_id The ID of the post being saved.
         */
        public function save($post_id)
        {

            /*
             * We need to verify this came from our screen and with proper authorization,
             * because the save_post action can be triggered at other times.
             */
            $nonce = isset($_POST['yatra_tour_cpt_meta_nonce']) ? ($_POST['yatra_tour_cpt_meta_nonce']) : '';


            if (isset($_POST['yatra_tour_cpt_meta_nonce'])) {

                $is_valid_nonce = wp_verify_nonce($nonce, 'yatra_tour_post_type_metabox_nonce');

                if ($is_valid_nonce) {

                    $metabox_tabs = yatra_tour_metabox_tabs();

                    foreach ($metabox_tabs as $tab_content_key => $tab_content) {

                        $configs = isset($tab_content['config']) ? $tab_content['config'] : array();

                        echo $tab_content_key . '<br/>';
                        switch ($tab_content_key) {

                            case "tour-options":
                                $this->save_tour_options($configs, $post_id);

                                break;

                            case "tour-attributes":
                                $this->save_tour_attributes($configs, $post_id);
                                break;

                            case "tour-tabs":
                                $this->save_tour_tabs($configs, $post_id);
                                break;
                        }
                    }

                }
            }
        }

        private function save_tour_attributes($configs = array(), $post_id)
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

        private function save_tour_options($configs = array(), $post_id)
        {
            foreach ($configs as $field_key => $field) {

                $field_value = isset($_POST[$field_key]) ? $_POST[$field_key] : '';

                $valid_field_value = $this->sanitize($field_value, $field);

                update_post_meta($post_id, $field_key, $valid_field_value);
            }
        }

        private function save_tour_tabs($configs = array(), $post_id)
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

        private function tour_options($configs = array(), $tab_content_key)
        {
            foreach ($configs as $field) {
                $this->metabox_html($field);
            }

        }

        private function tour_attributes($configs = array(), $tab_content_key)
        {

            foreach ($configs as $field) {

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

        private function tour_tabs($configs = array(), $tab_content_key)
        {

            echo '<ul  class="mb-meta-vertical-tab">';

            $index = 0;

            global $post;

            $post_id = $post->ID;

            $yatra_tour_meta_tour_tabs_ordering = get_post_meta($post_id, 'yatra_tour_meta_tour_tabs_ordering', true);

            $yatra_tour_meta_tour_tabs_ordering_array = explode(',', $yatra_tour_meta_tour_tabs_ordering);

            $config_array_keys = array_keys($configs);

            $array_diff = array_diff($config_array_keys, $yatra_tour_meta_tour_tabs_ordering_array);

            $final_ordered_config_keys = $yatra_tour_meta_tour_tabs_ordering_array;

            if (count($array_diff) > 0) {

                $final_ordered_config_keys = array_merge($yatra_tour_meta_tour_tabs_ordering_array, $array_diff);
            }

            $active_tab_config = '';

            foreach ($final_ordered_config_keys as $config) {

                if (isset($configs[$config])) {

                    $setting = $configs[$config];

                    $class = $index === 0 ? 'active' : '';

                    if ($index === 0) {

                        $active_tab_config = $config;
                    }

                    $icon = isset($setting['icon']) ? '<span class="' . esc_attr($setting['icon']) . '"></span>' : '';

                    echo '<li class="' . $class . '" data-tab-content="' . $config . '">' . $icon . $setting['label'] . '</li>';

                    $index++;
                }
            }


            echo '</ul>';

            echo '<div class="mb-meta-vertical-tab-content">';

            foreach ($configs as $config_key => $setting_value) {

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


        public function yatra_add_attribute_meta()
        {
            $nonce_value = isset($_REQUEST['yatra_nonce']) ? $_REQUEST['yatra_nonce'] : '';

            $is_valid_nonce = wp_verify_nonce($nonce_value, 'wp_yatra_add_attribute_meta_nonce');

            $term_id = isset($_POST['term_id']) ? absint($_POST['term_id']) : 0;

            $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;

            if (!$is_valid_nonce || $term_id < 1 || $post_id < 1) {

                wp_send_json_error();
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

        public function parse_attribute($field_type, $term_id, $term_value_array = array(), $post_id)
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