<?php
if (!class_exists('Yatra_Widget_Validation')) {

    class Yatra_Widget_Validation
    {
        /**
         * Instance
         *
         * @since 2.0.6
         *
         * @access private
         * @var object Class object.
         */
        private static $instance;

        /**
         * Initiator
         *
         * @since 2.0.6
         *
         * @return object initialized object of class.
         */
        public static function instance()
        {
            if (!isset(self::$instance)) {
                self::$instance = new self;
            }
            return self::$instance;
        }

        public function validate($instance, $widget_fields = array())
        {

            $new_instance = array();

            $field_default = array(
                'name' => '',
                'title' => '',
                'type' => 'text',

            );

            // Loop through fields
            foreach ($widget_fields as $field_key => $field) {

                if (!isset($field['name']) || !isset($field['type'])) {
                    continue;
                }
                if ($field_key != $field['name']) {
                    continue;
                }
                $field = wp_parse_args($field, $field_default);

                $value = isset($instance[$field_key]) ? $instance[$field_key] : '';

                $value = !isset($instance[$field_key]) && isset($field['default']) ? $field['default'] : $value;


                $new_instance[$field_key] = $this->sanitize($value, $field);

            }
            return $new_instance;

        }

        public function sanitize($field_value, $widget_field = array())
        {
            $updated_value = '';

            switch ($widget_field['type']) {
                // Allow only integers in number fields
                case 'number':
                    $updated_value = absint($field_value);
                    break;
                case 'text':
                    $updated_value = sanitize_text_field($field_value);
                    break;

                case 'color':
                    $updated_value = sanitize_hex_color($field_value);
                    break;
                // Allow some tags in textareas
                case 'textarea':

                    if (isset($widget_field['allowed_tags'])) {

                        $allowed_tags = $widget_field['allowed_tags'];

                    } else {

                        $allowed_tags = array(
                            'p' => array(),
                            'em' => array(),
                            'strong' => array(),
                            'a' => array(
                                'href' => array(),
                            ),
                        );
                    }
                    $updated_value = wp_kses($field_value, $allowed_tags);
                    break;
                // No allowed tags for all other fields
                case 'url':
                case 'image':
                    $updated_value = esc_url_raw($field_value);
                    break;
                case 'select':
                    $is_multiple = isset($widget_field['is_multiple']) && (boolean)$widget_field['is_multiple'] ? true : false;

                    if ($is_multiple) {

                        $array = array_map('sanitize_text_field', wp_unslash($field_value));

                        $updated_value = array_map('wp_kses_post', $array);

                    } else {

                        $updated_value = wp_kses_post(sanitize_text_field($field_value));
                    }
                    break;
                case 'dropdown_categories':

                    $is_multiple = isset($widget_field['args']) && isset($widget_field['args']['multiple']) ? (boolean)($widget_field['args']['multiple']) : false;

                    if ($is_multiple) {

                        $field_value = is_array($field_value) ? $field_value : array();

                        $array = array_map('absint', wp_unslash($field_value));

                        $updated_value = array_map('absint', $array);

                    } else {

                        $updated_value = absint(absint($field_value));
                    }
                    break;
                case 'icon-picker':
                    $updated_value = sanitize_text_field($field_value);
                    $font_awesome_icon_lists = apply_filters('yatra_theme_fontawesome_list', array());
                    $icons = array_keys($font_awesome_icon_lists);
                    $updated_value = in_array($updated_value, $icons) ? $updated_value : '';
                    break;
                case 'repeator':

                    if (isset($field_value['__mb_index__'])) {

                        unset($field_value['__mb_index__']);
                    }
                    $widget_repeator_options = isset($widget_field['options']) ? $widget_field['options'] : array();

                    $repeator_num = isset($widget_field['repeator_num']) ? $widget_field['repeator_num'] : 3;

                    $repeator_option_array_keys = array_keys($widget_repeator_options);

                    $updated_value = array();

                    $field_value = !is_array($field_value) ? array() : $field_value;

                    foreach ($field_value as $field_index => $val) {

                        $repeator_repeat_value = array();

                        foreach ($val as $rp_key => $rp_value) {

                            if (in_array($rp_key, $repeator_option_array_keys)) {

                                $repeator_repeat_value[$rp_key] = $this->sanitize($rp_value, $widget_repeator_options[$rp_key]);
                            }
                        }

                        if (count($updated_value) <= $repeator_num) {
                            array_push($updated_value, $repeator_repeat_value);
                        }
                    }
                    break;
                default:
                    $updated_value = wp_kses_post(sanitize_text_field($field_value));
                    break;

            }


            return $updated_value;
        }

    }

}