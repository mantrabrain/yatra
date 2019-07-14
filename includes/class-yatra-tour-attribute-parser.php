<?php
/**
 * Yatra_Tour_Attribute_Parser
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

if (!class_exists('Yatra_Tour_Attribute_Parser')) {
    /**
     * Yatra Metabox Class.
     *
     * @class Yatra
     */
    class Yatra_Tour_Attribute_Parser
    {

        private $tour_attribute = array();

        private $attribute_index = 'yatra_attribute_meta';

        private $attribute_type = '';

        private $term_id = 0;

        public function __construct($attribute_type = '', $term_id = 0)
        {
            $yatra_tour_attribute_type_options = yatra_tour_attribute_type_options();

            if (isset($yatra_tour_attribute_type_options[$attribute_type])) {

                $this->attribute_type = $attribute_type;

                $this->tour_attribute = $yatra_tour_attribute_type_options[$attribute_type];

            }
            if ($term_id > 0) {
                $this->term_id = $term_id;
            }

        }

        public function parse($return = false, $is_edit = false)
        {
            if (count($this->tour_attribute) < 1) {
                return false;
            }


            $html = '';

            foreach (@$this->tour_attribute['options'] as $option_key => $option) {

                $name = isset($option['name']) ? $this->attribute_index . '[' . $option['name'] . ']' : '';

                $type = isset($option['type']) ? $option['type'] : '';

                $placeholder = isset($option['placeholder']) ? $option['placeholder'] : '';

                $value = isset($option['default']) ? $option['default'] : '';

                if ($this->term_id > 0) {

                    $yatra_attribute_meta = get_term_meta($this->term_id, 'yatra_attribute_meta', true);

                    $value = isset($yatra_attribute_meta[$option['name']]) ? $yatra_attribute_meta[$option['name']] : $value;
                }

                if (!empty($name) && $option_key == $option['name'] && !empty($type)) {

                    if ($is_edit) {

                        $html .= '<tr class="form-field term-group yatra-taxonomy-group ' . esc_attr($name) . '">';

                    } else {

                        $html .= '<div class="form-field term-group yatra-taxonomy-group ' . esc_attr($name) . '">';

                    }

                    if ($is_edit) {

                        $html .= '<th scope="row">';
                    }
                    if (isset($option['title'])) {

                        $html .= '<label for="' . esc_attr($name) . '">' . esc_html($option['title']) . '</label>';
                    }
                    if ($is_edit) {

                        $html .= '</th>';
                        $html .= '<td>';
                    }
                    switch ($type) {

                        case "text":
                        case "number":

                            $html .= '<input type="' . esc_attr($type) . '" name="' . esc_attr($name) . '" id="' . esc_attr($name) . '" size="40" placeholder="' . esc_attr($placeholder) . '" value="' . esc_attr($value) . '"/>';

                            break;
                        case "shortcode":

                            $html .= '<input type="text" name="' . esc_attr($name) . '" id="' . esc_attr($name) . '" size="40" placeholder="' . esc_attr($placeholder) . '" value="' . esc_attr($value) . '"/>';

                            break;

                        case "textarea":
                            $html .= '<textarea name="' . esc_attr($name) . '" id="' . esc_attr($name) . '" rows="5" cols="40" placeholder="' . esc_attr($placeholder) . '">' . esc_html($value) . '</textarea>';
                            break;

                    }
                    if (isset($option['description'])) {

                        $html .= '<p class="description">' . esc_html($option['description']) . '</p>';
                    }
                    if ($is_edit) {

                        $html .= '</td>';
                        $html .= '</tr>';
                    } else {
                        $html .= '</div>';
                    }

                }


            }

            if ($return) {

                return $html;
            }
            echo $html;
        }

    }

}
