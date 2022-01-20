<?php
/**
 * Abstract Form.
 *
 * Handles different types of form for frontend
 *
 * @class       Yatra_Form
 * @version     2.0.5
 * @package     Yatra/Classes
 */

if (!defined('ABSPATH')) {
    exit;
}


abstract class Yatra_Form
{

    protected function valid_data($data = array(), $form_fields_all = array(), $error_code = 'yatra_form_validation_errors')
    {
        $valid_data = array();

        foreach ($form_fields_all as $field_option) {

            $field = isset($field_option['name']) ? $field_option['name'] : '';

            if (isset($form_fields_all[$field]['group_id'])) {

                if (isset($data[$form_fields_all[$field]['group_id']][$field])) {

                    $this->form_validation($data[$form_fields_all[$field]['group_id']], $field_option, $error_code);

                    $valid_data[$form_fields_all[$field]['group_id']][$field] = $this->sanitization($data[$form_fields_all[$field]['group_id']][$field], $field_option);
                }

            } else {

                if (isset($data[$field])) {

                    $this->form_validation($data, $field_option, $error_code);

                    $valid_data[$field] = $this->sanitization($data[$field], $field_option);
                }
            }

        }
        return $valid_data;
    }

    private function form_validation($data, $single_field, $error_code)
    {
        $field_key = isset($single_field['name']) ? $single_field['name'] : '';

        $value = $data[$field_key];

        $validation = isset($single_field['validation']) ? $single_field['validation'] : array();


        foreach ($validation as $validation_type => $validation_config) {

            $error_message = !isset($validation_config['message']) ? sprintf(__('Validation error for %s field', 'yatra'), $single_field['label']) : $validation_config['message'];

            switch ($validation_type) {

                case "required":

                    if (empty($value) || $value == '' || is_null($value)) {
                        yatra()->yatra_error->add($error_code, $error_message);
                    }
                    break;
                case "email":
                    if (!is_email($value)) {
                        yatra()->yatra_error->add($error_code, $error_message);
                    }

                case "equal_compare":
                    $rule = isset($validation_config['rule']) ? $validation_config['rule'] : '';

                    $rule_fields = explode('|', $rule);

                    if (count($rule_fields) == 2) {

                        if ($data[$rule_fields[0]] != $data[$rule_fields[1]]) {

                            yatra()->yatra_error->add($error_code, $error_message);

                        }
                    }

                    break;
                default:
                    do_action('yatra_form_field_validation_' . $validation_type, $validation_config, $data, $single_field);
                    break;

            }

        }


    }

    private function sanitization($field_value, $field_option)
    {
        $type = isset($field_option['type']) ? $field_option['type'] : '';
        if (empty($type)) {
            return '';
        }
        $updated_value = '';

        switch ($type) {
            // Allow only integers in number fields
            case 'number':
                $updated_value = absint($field_value);
                break;

            case 'text':
                $updated_value = sanitize_text_field($field_value);
                break;

            case 'email':
                $updated_value = sanitize_email($field_value);
                break;

            // Allow some tags in textareas
            case 'textarea':

                if (isset($field_option['allowed_tags'])) {

                    $allowed_tags = $field_option['allowed_tags'];

                } else {

                    $allowed_tags = array(
                        'p' => array(),
                        'em' => array(),
                        'strong' => array(),
                        'img' => array(
                            'src' => array()
                        ),
                        'ul' => array(),
                        'ol' => array(),
                        'li' => array(),
                        'a' => array(
                            'href' => array(),
                        ),
                    );
                }

                $updated_value = wp_kses($field_value, $allowed_tags);


                break;
            // No allowed tags for all other fields
            case 'url':
                $updated_value = esc_url_raw($field_value);
                break;
            case 'select':
                $is_multiple = isset($meta_field['is_multiple']) && (boolean)$field_option['is_multiple'] ? true : false;

                if ($is_multiple) {
                    $field_value = empty($field_value) ? array() : $field_value;
                    $array = array_map('sanitize_text_field', wp_unslash($field_value));

                    $updated_value = array_map('wp_kses_post', $array);

                } else {

                    $updated_value = wp_kses_post(sanitize_text_field($field_value));
                }
                break;
            default:
                $updated_value = apply_filters('yatra_form_field_sanitization_', $type, $field_value);
                break;

        }


        return $updated_value;
    }

    protected function form_html($field = array())
    {


        $extra_attributes = array();

        if (!isset($field['name']) || !isset($field['type'])) {
            return;
        }
        if (empty($field['name'])) {

            return;
        }

        $field_key = $field['name'];

        $value = isset($field['value']) ? $field['value'] : '';

        $extra_attributes = isset($field['extra_attributes']) ? $field['extra_attributes'] : array();

        $required_indicator = isset($extra_attributes['required']) ? '<span class="yatra-required-indicator">*</span>' : '';

        $extra_attribute_text = '';

        foreach ($extra_attributes as $attribute_key => $attribute_value) {

            $extra_attribute_text .= ' ' . esc_html($attribute_key) . '="' . esc_attr($attribute_value) . '"';
        }

        $field_type = $field['type'];

        $wrap_class = isset($field['wrap_class']) ? $field['wrap_class'] : '';

        $row_start = isset($field['row_start']) ? (boolean)$field['row_start'] : false;

        if ($row_start) {

            echo '<div class="yatra-field-row">';
        }

        $class = 'yatra-field';

        $class .= isset($field['class']) ? ' ' . $field['class'] : '';

        $name = $field_key;

        if (isset($field['group_id'])) {

            $name = $field['group_id'] . '[' . $field_key . ']';
        }
        echo '<div class="yatra-field-wrap ' . esc_attr($wrap_class) . '">';

        switch ($field['type']) {
            case "text":
            case "number":
            case "hidden":
            case "email":
            case "date":
            case "password":
                if ($field['type'] != "hidden") {
                    ?>
                    <p>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']) . $required_indicator; ?>
                        :</label>
                <?php }
                ?>
                <input class="<?php echo esc_attr($class); ?>"
                       id="<?php echo esc_attr(($field_key)); ?>"
                       name="<?php echo esc_attr(($name)); ?>"
                       type="<?php echo esc_attr($field_type) ?>"
                       value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>
                <?php if ($field['type'] != "hidden") {
                ?>
                </p>
                <?php
            }
                break;
            case "textarea":

                $editor = isset($field['editor']) ? (boolean)$field['editor'] : false;

                $editor_settings = isset($field['editor_settings']) ? $field['editor_settings'] : array();

                $editor_height = isset($editor_settings['editor_height']) ? (int)$field['editor_height'] : 350;

                $editor_default_settings = array(
                    'textarea_name' => $field_key,
                    'tinymce' => array(
                        'init_instance_callback ' => 'function(inst) {
                                       $("#" + inst.id + "_ifr").css({minHeight: "' . $editor_height . 'px"});
                                }'
                    ),


                );


                $editor_settings = wp_parse_args($editor_default_settings, $editor_settings);

                ?>
                <p>
                <label
                        for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']) . $required_indicator; ?>
                    :</label>
                <?php
                if ($editor) {
                    echo '</p>';
                    wp_editor($value, $field_key, $editor_settings);
                } else {
                    ?>
                    <textarea class="<?php echo esc_attr($class); ?>"
                              id="<?php echo esc_attr(($field_key)); ?>"
                              name="<?php echo esc_attr(($field_key)); ?>"
                        <?php echo $extra_attribute_text; ?>

                    ><?php echo esc_html($value); ?></textarea>


                    </p>
                <?php }
                break;
            case "select":
                ?>
                <p>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']) . $required_indicator; ?>
                        :</label>
                    <?php
                    $options = isset($field['options']) ? $field['options'] : array();
                    $is_multi_select = isset($field['is_multiple']) ? (boolean)$field['is_multiple'] : false;
                    $is_select2 = isset($field['select2']) ? (boolean)$field['select2'] : false;
                    if ($is_multi_select) {
                        $extra_attribute_text .= ' multiple="multiple"';
                    }
                    $select_class = $class;
                    $select_class .= $is_select2 ? ' yatra-select2' : '';
                    ?>

                    <select class="<?php echo esc_attr($select_class); ?>"
                            id="<?php echo esc_attr(($field_key)); ?>"
                            name="<?php echo esc_attr(($name));
                            echo $is_multi_select ? '[]' : ''; ?>"
                        <?php echo $extra_attribute_text; ?>>
                        <?php foreach ($options as $option_key => $option_value) {

                            if (!$is_multi_select) {
                                if (is_array($value)) {
                                    $value = $value[0];
                                }
                                $selected = $option_key == $value ? true : false;
                            } else {
                                if (!is_array($value)) {
                                    $value = array($value);
                                }
                                $selected = in_array($option_key, $value) ? true : false;
                            }

                            ?>
                            <option <?php echo $selected ? 'selected="selected"' : ''; ?>
                            value="<?php echo esc_attr($option_key); ?>"><?php echo esc_html($option_value) ?></option><?php
                        }
                        ?>
                    </select>


                </p>
                <?php
                break;
            case "image":
                ?>
                <p><label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']) . $required_indicator; ?>
                        :</label>
                <div class="media-uploader" id="<?php echo('background_image'); ?>">
                    <div class="custom_media_preview <?php echo esc_attr($class); ?>">
                        <img style="<?php echo empty($value) ? 'display:none;' : '' ?>max-width:100%;"
                             class="media_preview_image"
                             src="<?php echo esc_url($value); ?>" alt=""/>

                        <input class="yatra_field custom_media_input" type="hidden"
                               id="<?php echo esc_attr(($field_key)); ?>"
                               name="<?php echo esc_attr(($name)); ?>"
                            <?php echo $extra_attribute_text; ?>
                               type="text" value="<?php echo esc_html($value); ?>"/>
                        <button class="media_upload button"
                                id="<?php echo('background_image'); ?>"
                                data-choose="<?php esc_attr_e('Choose an image', 'yatra'); ?>"
                                data-update="<?php esc_attr_e('Use image', 'yatra'); ?>"
                                style="width:100%;margin-top:6px;margin-right:30px;"><?php esc_html_e('Select an Image', 'yatra'); ?></button>
                    </div>

                </div>
                </p>
                <?php
                break;
            default:

                do_action('yatra_form_field_html_' . $field['type'], $field);
                break;

        }
        echo "</div>";

        $row_end = isset($field['row_end']) ? (boolean)$field['row_end'] : false;

        if ($row_end) {

            echo '</div>';
        }


    }

    public abstract function default_fields();

    public abstract function render();

    public abstract function fields();

    public abstract function get_data($data = array());

}
