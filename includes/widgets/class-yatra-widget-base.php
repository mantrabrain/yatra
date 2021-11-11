<?php
if (!class_exists('Yatra_Widget_Base')) {

    abstract class Yatra_Widget_Base extends WP_Widget
    {
        /*
         * @var object Yatra_Widget_Validation
         */
        public $validation;

        public function __construct($id_base, $name, $widget_options = array(), $control_options = array())
        {


            parent::__construct(
                $id_base,
                $name,
                $widget_options,
                $control_options
            );
            $this->validation = Yatra_Widget_Validation::instance();
        }

        abstract function widget_fields();


        public function form($instance)
        {
            $widget_fields = $this->widget_fields();


            // Loop through fields
            foreach ($widget_fields as $field_key => $field) {

                if (!isset($field['name']) || !isset($field['type'])) {
                    continue;
                }
                if ($field_key != $field['name']) {
                    continue;
                }
                $this->form_single($field_key, $field, $instance);

            }


        }

        private function form_single($field_key, $field, $instance)
        {
            $field_default = array(
                'name' => '',
                'title' => '',
                'type' => 'text',

            );
            $extra_attributes = array();

            $field = wp_parse_args($field, $field_default);


            $value = isset($instance[$field_key]) ? $instance[$field_key] : ((isset($field['default']) && $field['type'] != 'checkbox') ? $field['default'] : '');

            $extra_attributes = isset($field['extra_attributes']) ? $field['extra_attributes'] : array();

            $extra_attribute_text = $this->get_extra_attribute_text($extra_attributes);

            switch ($field['type']) {
                case "repeator":
                    $repeator_number = isset($field['repeator_num']) ? absint($field['repeator_num']) : 3;
                    ?>
                    <div class="mb-repeator-field-container"
                         data-repeator-num="<?php echo absint($repeator_number); ?>">
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                        </label>
                        <?php

                        $this->get_repeator_template($field, $field_key, $instance, $value);
                        ?>
                    </div>
                    <?php
                    break;
                case "title":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                        </label>

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "text":
                case "number":
                case "email":
                case "url":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <input class="widefat"
                               id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                               name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                               type="<?php echo esc_attr($field['type']); ?>"
                               value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "color":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <input class="widefat color-picker"
                               id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                               name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                               type="<?php echo esc_attr($field['type']); ?>"
                               value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>
                            <?php echo isset($field['default']) ? 'data-default-color="' . esc_attr($field['default']) . '" ' : ''; ?>/>

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "checkbox":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <input class="widefat"
                               id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                               name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                               type="checkbox"
                               value="1" <?php echo (boolean)$value ? 'checked="checked"' : '';
                        echo $extra_attribute_text; ?>/>

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "textarea":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <textarea class="widefat"
                                  id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                                  name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                            <?php echo $extra_attribute_text; ?>

                        ><?php echo esc_html($value); ?></textarea>

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "select":
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <?php
                        $options = isset($field['options']) ? $field['options'] : array();
                        $is_multi_select = isset($field['is_multiple']) ? (boolean)$field['is_multiple'] : false;
                        if ($is_multi_select) {
                            $extra_attribute_text .= ' multiple="multiple"';
                        }
                        ?>
                        <select class="widefat"
                                id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                                name="<?php echo esc_attr($this->get_field_name($field_key));
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

                        <?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "dropdown_categories":

                    $args = isset($field['args']) ? $field['args'] : array();
                    $cat_default_args = array(
                        'orderby' => 'name',
                        'hide_empty' => 0,
                        'class' => 'widefat',
                        'taxonomy' => 'category',
                        'selected' => is_array($value) ? implode(",", $value) : $value,
                        'name' => esc_attr($this->get_field_name($field_key)),
                        'id' => esc_attr($this->get_field_id($field_key)),
                        'show_option_all' => esc_html__('All Categories', 'yatra'),
                        'echo' => false,
                        'multiple' => false

                    );
                    $cat_args = wp_parse_args($args, $cat_default_args);
                    ?>
                    <p>
                        <label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                        <?php
                        $taxonomy = isset($cat_args['taxonomy']) ? $cat_args['taxonomy'] : '';

                        if (taxonomy_exists($taxonomy)) {
                            $output = wp_dropdown_categories($cat_args);
                            echo $this->wp_dropdown_cats_multiple($output, $cat_args);
                        } else {
                            /* translators: 1: taxonomy */

                            echo '<h4>' . sprintf(esc_html__('Taxonomy (%s) not found', 'yatra'), $taxonomy) . '</h4>';
                        }
                        $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "image":
                    ?>
                    <p><label
                                for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                            :</label>
                <div class="media-uploader" id="<?php echo $this->get_field_id('background_image'); ?>">
                    <div class="custom_media_preview" style="position:relative;">

                        <button type="button" class="button remove"
                                style="position:absolute;right:0; <?php echo empty($value) ? 'display:none;' : '' ?>">x
                        </button>
                        <img style="<?php echo empty($value) ? 'display:none;' : '' ?>max-width:100%;"
                             class="media_preview_image"
                             src="<?php echo esc_url($value); ?>" alt=""/>

                        <input class="widefat custom_media_input" type="hidden"
                               id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                               name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                            <?php echo $extra_attribute_text; ?>
                               type="text" value="<?php echo esc_html($value); ?>"/>
                        <button class="media_upload button"
                                id="<?php echo $this->get_field_id('background_image'); ?>"
                                data-choose="<?php esc_attr_e('Choose an image', 'yatra'); ?>"
                                data-update="<?php esc_attr_e('Use image', 'yatra'); ?>"
                                style="width:100%;margin-top:6px;margin-right:30px;"><?php esc_html_e('Select an Image', 'yatra'); ?></button>
                    </div>

                    </div><?php $this->description($field) ?>
                    </p>
                    <?php
                    break;
                case "icon-picker":
                    ?>

                    <div class="mb-icon-picker-wrapper">
                        <p>
                            <label
                                    for="<?php echo esc_attr($this->get_field_id($field_key)); ?>"><?php echo esc_html($field['title']); ?>
                                :</label>
                            <input class="widefat"
                                   id="<?php echo esc_attr($this->get_field_id($field_key)); ?>"
                                   name="<?php echo esc_attr($this->get_field_name($field_key)); ?>"
                                   type="<?php echo esc_attr($field['type']); ?>" readonly="readonly"
                                   value="<?php echo esc_attr($value); ?>" <?php echo $extra_attribute_text; ?>/>
                            <i class="selected-icon fa <?php echo esc_attr($value) ?>"></i>
                            <i class="toggle-icon fa fa-chevron-down"></i>

                            <?php $this->description($field) ?>
                        <div class="mb-icon-list">
                            <?php
                            $font_awesome_icon_lists = apply_filters('mantrabrain_theme_fontawesome_list', array());
                            ?>
                            <ul>
                                <?php
                                foreach ($font_awesome_icon_lists as $icon_key => $icon_value) {

                                    $class = $value == $icon_key ? 'active' : '';

                                    echo '<li data-icon="' . esc_attr($icon_key) . '" class="icon ' . esc_attr($class) . '"><i class="fa ' . esc_attr($icon_key) . '"></i></li>';
                                }
                                ?>

                            </ul>
                        </div>
                        </p>
                    </div>

                    <?php
                    break;

            }


        }

        public function get_repeator_template($field, $field_key, $instance, $value)
        {
            // Template File

            $repeator_options = isset($field['options']) ? $field['options'] : array();

            $repeator_option_keys = array_keys($repeator_options);
            ?>

            <div class="mb-repeator-field-tmpl">
                <button type="button" class="action-btn add button button-primary"><i class="dashicons"></i>
                </button>
                <button type="button" class="toggle-action button button-primary"><i class="dashicons"></i></button>
                <div class="mb-repeator-content">
                    <?php

                    $this->description($field);


                    foreach ($repeator_options as $rp_key => $rp_option) {

                        if (!empty($rp_option['name'])) {

                            $rp_option['name'] = $field_key . '[__mb_index__][' . $rp_option['name'] . ']';

                        }
                        $rp_field_key = isset($rp_option['name']) ? $rp_option['name'] : '';

                        if (!empty($rp_field_key)) {

                            $this->form_single($rp_field_key, $rp_option, $instance);
                        }
                    }

                    // Main Content
                    ?>
                </div>

            </div>
            <?php // Main Content

            $value = !is_array($value) ? array() : $value;

            if (count($value) < 1) {

                echo '<div class="mb-repeator-field">';

                echo '<button type="button" class="action-btn add button button-primary"><i class="dashicons"></i></button>';
                echo '<button type="button" class="toggle-action button button-primary"><i class="dashicons"></i></button>';
                echo '<div class="mb-repeator-content">';

                $this->description($field);

                foreach ($repeator_options as $rp_single_key => $rp_option_single) {

                    if (!empty($rp_option_single['name'])) {

                        $rp_option_single['name'] = $field_key . '[0][' . $rp_option_single['name'] . ']';

                    }
                    $rp_field_key = isset($rp_option_single['name']) ? $rp_option_single['name'] : '';

                    if (!empty($rp_field_key)) {

                        $this->form_single($rp_field_key, $rp_option_single, $instance);
                    }
                }


                echo '</div>';
                echo '</div>';

            } else {


                foreach ($value as $value_index => $value_content) {

                    echo '<div class="mb-repeator-field">';

                    $class = 'remove';

                    $class = count($value) == ($value_index + 1) ? 'add' : $class;

                    echo '<button type="button" class="action-btn ' . esc_attr($class) . ' button button-primary"><i class="dashicons"></i></button>';
                    echo '<button type="button" class="toggle-action button button-primary"><i class="dashicons"></i></button>';
                    echo '<div class="mb-repeator-content">';
                    foreach ($repeator_options as $_single_key => $_option_single) {

                        if (!empty($_option_single['name'])) {

                            $_option_single['name'] = $field_key . '[' . $value_index . '][' . $_option_single['name'] . ']';

                            $_option_single['default'] = isset($value_content[$_single_key]) ? $value_content[$_single_key] : '';

                        }
                        $_field_key = isset($_option_single['name']) ? $_option_single['name'] : '';

                        if (!empty($_field_key)) {

                            $this->form_single($_field_key, $_option_single, $instance);
                        }
                    }


                    echo '</div>';
                    echo '</div>';
                }
            }


        }

        public function description($field)
        {

            if (isset($field['description'])) {

                $allowed_tags = array(
                    'p' => array(),
                    'em' => array(),
                    'strong' => array(),
                    'a' => array(
                        'href' => array(),
                        'target' => array(),
                    ),
                );

                $updated_value = wp_kses($field['description'], $allowed_tags);

                ?>
                <br/>
                <small><?php echo $updated_value; ?></small>
            <?php }
        }

        public function get_extra_attribute_text($extra_attributes = array())
        {
            $extra_attribute_text = '';

            foreach ($extra_attributes as $attribute_key => $attribute_value) {

                $extra_attribute_text .= ' ' . esc_html($attribute_key) . '="' . esc_attr($attribute_value) . '"';
            }
            return $extra_attribute_text;

        }

        public function update($new_instance, $old_instance)
        {

            $instance = $old_instance;

            $widget_fields = $this->widget_fields();

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

                $new_field_value = isset($new_instance[$field_key]) ? $new_instance[$field_key] : '';

                $instance[$field['name']] = $this->validation->sanitize($new_field_value, $field);

            }


            return $instance;
        }

        function wp_dropdown_cats_multiple($output, $r)
        {

            if (isset($r['multiple']) && $r['multiple']) {

                $output = preg_replace('/^<select/i', '<select multiple data-live-search="true" data-style="btn-info"', $output);

                $output = str_replace("name='{$r['name']}'", "name='{$r['name']}[]'", $output);

                $selected = is_array($r['selected']) ? $r['selected'] : explode(",", $r['selected']);

                foreach (array_map('trim', $selected) as $value)

                    $output = str_replace("value=\"{$value}\"", "value=\"{$value}\" selected", $output);

            }

            return $output;
        }

    }


}



