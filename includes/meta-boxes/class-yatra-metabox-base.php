<?php
if (!class_exists('Yatra_Metabox_Base')) {
    abstract class Yatra_Metabox_Base
    {
        abstract function save($post_id);

        abstract function metabox_form();

        abstract function metabox_config($key);

        //abstract function callback($args);

        public function sanitize($field_value, $meta_field = array())
        {
            $updated_value = '';

            switch ($meta_field['type']) {
                // Allow only integers in number fields
                case 'number':
                    $updated_value = $field_value == '' ? '' : absint($field_value);
                    break;
                case 'shortcode':
                case 'date':
                    $updated_value = sanitize_text_field($field_value);
                    break;
                case 'checkbox':
                case 'switch':
                    $updated_value = absint($field_value);
                    $updated_value = 1 == $updated_value ? 1 : 0;
                    break;
                case 'gallery':
                    $gallery_item_array = explode(',', $field_value);
                    $updated_value = '';
                    foreach ($gallery_item_array as $item_index => $item) {
                        if ($item_index + 1 == count($gallery_item_array)) {
                            $updated_value .= absint($item);
                        } else {
                            $updated_value .= absint($item) . ',';
                        }
                    }

                    break;
                // Allow some tags in textareas
                case 'textarea':

                    if (isset($meta_field['allowed_tags'])) {

                        $allowed_tags = $meta_field['allowed_tags'];

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
                    if (isset($meta_field['allow-html'])) {

                        $updated_value = ($field_value);

                    } else {

                        $updated_value = wp_kses($field_value, $allowed_tags);

                    }

                    break;
                // No allowed tags for all other fields
                case 'url':
                case 'image':
                    $updated_value = esc_url_raw($field_value);
                    break;
                case 'select':
                    $is_multiple = isset($meta_field['is_multiple']) && (boolean)$meta_field['is_multiple'] ? true : false;

                    if ($is_multiple) {
                        $field_value = empty($field_value) ? array() : $field_value;
                        $array = array_map('sanitize_text_field', wp_unslash($field_value));

                        $updated_value = array_map('wp_kses_post', $array);

                    } else {

                        $updated_value = wp_kses_post(sanitize_text_field($field_value));
                    }
                    break;
                default:
                    $updated_value = wp_kses_post(sanitize_text_field($field_value));
                    break;

            }


            return $updated_value;
        }

        public function parse_repeator_options($repeator_options_raw, $field, $post_id)
        {
            $post_meta = get_post_meta($post_id, $field['name'], true);

            $post_meta = is_array($post_meta) ? $post_meta : array();

            $post_meta_keys = array_keys($post_meta);

            $repeator_count = isset($post_meta_keys[0]) ? count($post_meta[$post_meta_keys[0]]) : count($repeator_options_raw);

            $new_repeator_options = $repeator_options_raw;

            for ($i = 0; $i < $repeator_count; $i++) {

                $repeator_options = isset($repeator_options_raw[0]) ? $repeator_options_raw[0] : array();

                foreach ($repeator_options as $option_key => $option) {

                    $default = isset($option['default']) ? $option['default'] : '';

                    $option_value = isset($post_meta[$option_key]) && isset($post_meta[$option_key][$i]) ? $post_meta[$option_key][$i] : $default;

                    $repeator_options[$option_key]['default'] = $option_value;
                }
                $new_repeator_options[$i] = $repeator_options;
            }


            return $new_repeator_options;
        }

        public function metabox_html($field = array(), $post_id = 0)
        {

            global $post;

            $post_id = $post_id < 1 ? $post->ID : $post_id;

            $extra_attributes = array();

            if (!isset($field['name']) || !isset($field['type'])) {
                return;
            }
            if (empty($field['name'])) {

                return;
            }


            if ($field['type'] == 'repeator') {

                $repeator_options_raw = isset($field['options']) ? $field['options'] : array();

                $repeator_options = $this->parse_repeator_options($repeator_options_raw, $field, $post_id);

                foreach ($repeator_options as $repeator_key => $repeator_field) {

                    echo '<div class="yatra-field-wrap">';
                    echo '<div class="mb-repeator">';
                    echo '<div class="mb-repeator-heading">';
                    echo '<span class="toggle dashicons dashicons-arrow-down-alt2"></span>';
                    echo '<span class="repeator-title"></span>';
                    echo '<span class="add dashicons dashicons-plus"></span>';
                    echo '<span class="remove dashicons dashicons-minus"></span>';
                    echo '</div>';
                    echo '<div class="mb-repeator-fields">';
                    foreach ($repeator_field as $repeator_single) {

                        $single_name = $repeator_single['name'];
                        $repeator_single['name'] = $field['name'] . "[" . $single_name . "][]";
                        $repeator_single['repeator_id'] = $repeator_key + 1;
                        $repeator_single['repeator_name'] = $field['name'] . "-" . $single_name . "-" . ($repeator_key + 1);


                        $this->metabox_html($repeator_single);
                    }

                    echo '</div>';
                    echo '</div>';
                    echo '</div>';
                }
            }

            $field_key = $field['name'];

            $post_meta = get_post_meta($post_id, $field_key, true);

            if (!isset($field['repeator_id']) && metadata_exists('post', $post_id, $field_key)) {

                $value = $post_meta;

            } else {

                $value = isset($field['default']) ? $field['default'] : '';
            }

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
            $is_visible = true;

            if (isset($field['visibility_condition'])) {

                $visibility_total = 0;
                $visibility_condition = $field['visibility_condition'];

                foreach ($visibility_condition as $visibility_meta_key => $visibility_meta_val) {

                    $visibility_post_meta = get_post_meta($post_id, $visibility_meta_key, true);

                    if ($visibility_post_meta == $visibility_meta_val) {
                        $visibility_total++;
                    }

                }
                if (!$visibility_total == count($visibility_condition)) {
                    $is_visible = false;
                }

            }

            $wrap_class .= !$is_visible ? ' yatra-hide' : '';
            echo '<div class="yatra-field-wrap ' . esc_attr($wrap_class) . '" data-wrap-id="' . esc_attr($field_key) . '">';

            $field_class = isset($field['class']) ? 'widefat ' . $field['class'] : 'widefat';
            switch ($field['type']) {
                case "heading":
                    ?>


                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <span><?php echo esc_html($value); ?></span>
                    <input class="<?php echo esc_attr($field_class) ?>"
                           id="<?php echo esc_attr(($field_key)); ?>"
                           name="<?php echo esc_attr(($field_key)); ?>"
                           type="hidden"
                           value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>

                    <?php
                    break;
                case "text":
                case "number":
                case "shortcode":
                    ?>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <input class="<?php echo esc_attr($field_class) ?>"
                           id="<?php echo esc_attr(($field_key)); ?>"
                           name="<?php echo esc_attr(($field_key)); ?>"
                           type="<?php echo esc_attr($field_type) ?>"
                           value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>


                    <?php
                    break;
                case "date":
                    ?>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <input autocomplete="off"
                           class="<?php echo esc_attr($field_class) ?>"
                           id="<?php echo esc_attr(($field_key)); ?>"
                           name="<?php echo esc_attr(($field_key)); ?>"
                           type="text"
                           value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>


                    <?php
                    break;
                case "checkbox":
                    ?>


                    <label
                            for="<?php echo esc_attr(($field_key)); ?>">
                        <input
                                class="<?php echo esc_attr($field_class) ?>"
                                id="<?php echo esc_attr(($field_key)); ?>"
                                name="<?php echo esc_attr(($field_key)); ?>"
                                type="checkbox"
                                value="1" <?php echo absint($value) == 1 ? 'checked="checked"' : '';
                        echo $extra_attribute_text; ?>/>
                        <?php echo esc_html($field['title']); ?></label>


                    <?php
                    break;
                case "switch":
                    $switch_args = array(
                        'off' => 'Off',
                        'on' => 'On',
                    );
                    ?>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <div class="yatra-switch-control-wrap">
                        <label class="yatra-switch-control">
                            <input class="<?php echo esc_attr($field_class) ?>"
                                   id="<?php echo esc_attr(($field_key)); ?>"
                                   name="<?php echo esc_attr(($field_key)); ?>"
                                   type="checkbox"
                                   value="1" <?php echo absint($value) == 1 ? 'checked="checked"' : '';
                            echo $extra_attribute_text; ?>/>
                            <span class="slider round" data-on="<?php echo esc_attr($switch_args['on']); ?>"
                                  data-off="<?php echo esc_attr($switch_args['off']); ?>"></span>
                        </label>
                    </div>
                    <?php
                    break;
                case "hidden":

                    ?>
                    <input class="<?php echo esc_attr($field_class) ?>"
                           id="<?php echo esc_attr(($field_key)); ?>"
                           name="<?php echo esc_attr(($field_key)); ?>"
                           type="hidden"
                           value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>


                    <?php
                    break;
                case "button":
                    ?>
                    <label style="display: block;">&nbsp;&nbsp;</label>
                    <input class="button-primary"
                           id="<?php echo esc_attr(($field_key)); ?>"
                           name="<?php echo esc_attr(($field_key)); ?>"
                           type="button"
                           value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>


                    <?php
                    break;
                case "textarea":

                    $editor = isset($field['editor']) ? (boolean)$field['editor'] : false;

                    $editor_settings = isset($field['editor_settings']) ? $field['editor_settings'] : array();

                    $editor_height = isset($editor_settings['editor_height']) ? (int)$field['editor_height'] : 350;

                    $editor_default_settings = array(
                        'textarea_name' => $field_key,
                        'tinymce' => array(
                            'init_instance_callback ' => 'function(inst) {
                                       jQuery("#" + inst.id + "_ifr").css({minHeight: "' . $editor_height . 'px"});
                                }'
                        ),
                        'wpautop' => true


                    );


                    $editor_settings = wp_parse_args($editor_default_settings, $editor_settings);

                    ?>

                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <?php
                    if ($editor) {
                        echo '</p>';
                        $field_key = isset($field['repeator_name']) ? $field['repeator_name'] : $field_key;
                        wp_editor($value, $field_key, $editor_settings);
                    } else {
                        ?>
                        <textarea class="<?php echo esc_attr($field_class) ?>"
                                  id="<?php echo esc_attr(($field_key)); ?>"
                                  name="<?php echo esc_attr(($field_key)); ?>"
                            <?php echo $extra_attribute_text; ?>

                        ><?php echo esc_html($value); ?></textarea>


                    <?php }
                    break;
                case "select":
                    ?>

                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <?php
                    $options = isset($field['options']) ? $field['options'] : array();
                    $is_multi_select = isset($field['is_multiple']) ? (boolean)$field['is_multiple'] : false;
                    $is_select2 = isset($field['select2']) ? (boolean)$field['select2'] : false;
                    if ($is_multi_select) {
                        $extra_attribute_text .= ' multiple="multiple"';
                    }

                    $field_class .= $is_select2 ? ' yatra-select2' : '';
                    ?>

                    <select class="<?php echo esc_attr($field_class); ?>"
                            id="<?php echo esc_attr(($field_key)); ?>"
                            name="<?php echo esc_attr(($field_key));
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


                    <?php
                    break;
                case "image":
                    ?>
                    <label
                            for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                    </label>
                    <div class="media-uploader" id="<?php echo('background_image'); ?>">
                        <div class="custom_media_preview">
                            <img style="<?php echo empty($value) ? 'display:none;' : '' ?>max-width:100%;"
                                 class="media_preview_image"
                                 src="<?php echo esc_url($value); ?>" alt=""/>

                            <input class="widefat custom_media_input" type="hidden"
                                   id="<?php echo esc_attr(($field_key)); ?>"
                                   name="<?php echo esc_attr(($field_key)); ?>"
                                <?php echo $extra_attribute_text; ?>
                                   type="text" value="<?php echo esc_html($value); ?>"/>
                            <button class="media_upload button"
                                    id="<?php echo('background_image'); ?>"
                                    data-choose="<?php esc_attr_e('Choose an image', 'yatra'); ?>"
                                    data-update="<?php esc_attr_e('Use image', 'yatra'); ?>"
                                    style="width:100%;margin-top:6px;margin-right:30px;"><?php esc_html_e('Select an Image', 'yatra'); ?></button>
                        </div>

                    </div>

                    <?php
                    break;
                case "gallery":
                    ?>
                    <div class="mb-admin-gallery">

                        <p><label
                                    for="<?php echo esc_attr(($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            </label>

                            <input class="<?php echo esc_attr($field_class) ?>"
                                   id="<?php echo esc_attr(($field_key)); ?>"
                                   name="<?php echo esc_attr(($field_key)); ?>"
                                   type="hidden"
                                   value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>
                            <a class="mb-gallery-add" href="#"
                               data-uploader-title="<?php esc_attr_e('Add image(s) to gallery', 'yatra'); ?>"
                               data-uploader-button-text="<?php esc_attr_e('Add image(s)', 'yatra'); ?>"
                            ><span><?php esc_html_e('Add image(s)', 'yatra'); ?></span></a>
                            <?php
                            $gallery_item_array = explode(',', $value);
                            echo '<ul class="mb-selected-gallery-list">';
                            if (count($gallery_item_array) > 0) {
                                //wp_attachment_is_image

                                for ($i = 0; $i < count($gallery_item_array); $i++) {
                                    $src = wp_get_attachment_url($gallery_item_array[$i]);
                                    if (wp_attachment_is_image($gallery_item_array[$i]) && $src) {

                                        echo '<li data-id="' . absint($gallery_item_array[$i]) . '">';
                                        echo '<a class="remove dashicons dashicons-trash"></a>';
                                        echo '<img src="' . esc_url_raw($src) . '"/>';
                                        echo '</li>';
                                    }
                                }


                            }
                            echo '</ul>';
                            ?>
                        </p>
                    </div>
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
}