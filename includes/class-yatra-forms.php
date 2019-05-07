<?php
defined('ABSPATH') || exit;

class Yatra_Forms
{
    private static $instance;


    public static function get_instance()
    {
        if (empty(self::$instance)) {

            self::$instance = new self();
        }
        return self::$instance;

    }

    public function tour_checkout_data()
    {
        $tour_cart = yatra_get_session('tour_cart');

        return $tour_cart;
    }

    public function chekcout_form_fields()
    {
        $tour_cart_data = $this->tour_checkout_data();

        $form_fields = apply_filters('tour_checkout_form_fields', array(
                'fullname' => array(
                    'name' => 'fullname',
                    'title' => __('Your full name', 'yatra'),
                    'type' => 'text',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your full name', 'yatra'),
                        'required' => 'required'
                    ),
                    'group_id' => 'tour_meta',
                    'row_start' => true,
                ), 'email' => array(
                    'name' => 'email',
                    'title' => __('Email', 'yatra'),
                    'type' => 'email',
                    'value' => '',
                    'group_id' => 'tour_meta',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Email address', 'yatra'),
                        'required' => 'required'
                    ),
                    'row_start' => true,
                ), 'tour_package' => array(
                    'name' => 'tour_package',
                    'title' => __('Tour Package', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'tour_meta',
                    'value' => isset($tour_cart_data->post_title) ? $tour_cart_data->post_title . ' (' . $tour_cart_data->ID . ') ' : '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your full name', 'yatra'),
                        'readonly' => 'readonly',
                        'required' => 'required'
                    ),
                    'row_start' => true,
                ), 'phone_number' => array(
                    'name' => 'phone_number',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'tour_meta',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                    'row_start' => true,
                )
            )
        );
        return $form_fields;
    }

    public function get_valid_form_data($data = array())
    {
        $form_fields_all = $this->chekcout_form_fields();

        $form_fields = array_keys($form_fields_all);

        $valid_data = array();

        foreach ($form_fields as $field) {

            if (isset($form_fields_all[$field]['group_id'])) {

                if (isset($data[$form_fields_all[$field]['group_id']][$field])) {

                    $valid_data[$form_fields_all[$field]['group_id']][$field] = $this->sanitization($data[$form_fields_all[$field]['group_id']][$field]);
                }

            } else {

                if (isset($data[$field])) {

                    $valid_data[$field] = $this->sanitization($data[$field]);
                }
            }

        }

        return $valid_data;
    }

    public function sanitization($data)
    {
        return $data; // Need to write sanitization code.
    }

    public function tour_checkout_form()
    {

        $form_fields = $this->chekcout_form_fields();

        foreach ($form_fields as $field) {

            $this->form_html($field);
        }
    }

    private function form_html($field = array())
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
                if ($field['type'] != "hidden") {
                    ?>
                    <p>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                        :</label>
                <?php }
                ?>
                <input class="yatra_field"
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
                        for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    :</label>
                <?php
                if ($editor) {
                    echo '</p>';
                    wp_editor($value, $field_key, $editor_settings);
                } else {
                    ?>
                    <textarea class="yatra_field"
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
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                        :</label>
                    <?php
                    $options = isset($field['options']) ? $field['options'] : array();
                    $is_multi_select = isset($field['is_multiple']) ? (boolean)$field['is_multiple'] : false;
                    $is_select2 = isset($field['select2']) ? (boolean)$field['select2'] : false;
                    if ($is_multi_select) {
                        $extra_attribute_text .= ' multiple="multiple"';
                    }
                    $select_class = 'yatra_field';
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
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                        :</label>
                <div class="media-uploader" id="<?php echo('background_image'); ?>">
                    <div class="custom_media_preview">
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
                                data-choose="<?php esc_attr_e('Choose an image', 'mantranews'); ?>"
                                data-update="<?php esc_attr_e('Use image', 'mantranews'); ?>"
                                style="width:100%;margin-top:6px;margin-right:30px;"><?php esc_html_e('Select an Image', 'mantranews'); ?></button>
                    </div>

                </div>
                </p>
                <?php
                break;

        }
        echo "</div>";

        $row_end = isset($field['row_end']) ? (boolean)$field['row_end'] : false;

        if ($row_end) {

            echo '</div>';
        }


    }
}

