<?php
if (!class_exists('Yatra_Taxonomy_Attributes')) {

    class Yatra_Taxonomy_Attributes
    {
        private $attribute_index = 'yatra_taxonomy_attribute';

        public function __construct()
        {
            add_action('init', array($this, 'register'));
            add_action('attributes_add_form_fields', array($this, 'form'), 10, 2);
            add_action('attributes_edit_form_fields', array($this, 'edit'), 10, 2);
            add_action('edited_attributes', array($this, 'save'), 10, 2);
            add_action('created_attributes', array($this, 'save'), 10, 2);

        }


        public function save($term_id, $id)
        {


            $attribute_field_type = isset($_POST['attribute_field_type']) ? sanitize_text_field($_POST['attribute_field_type']) : '';

            $attribute_available_for_tour = isset($_POST['attribute_available_for_tour']) ? absint($_POST['attribute_available_for_tour']) : 0;

            $yatra_tour_attribute_type = yatra_tour_attribute_type();

            $meta_array = array(

                'attribute_available_for_tour' => $attribute_available_for_tour
            );


            if (isset($yatra_tour_attribute_type[$attribute_field_type])) {

                $meta_array['attribute_field_type'] = $attribute_field_type;

                $options = isset($yatra_tour_attribute_type[$attribute_field_type]['options']) ? $yatra_tour_attribute_type[$attribute_field_type]['options'] : array();


                $field = isset($_POST[$this->attribute_index]) ? $_POST[$this->attribute_index] : array();

                foreach ($options as $option_key => $option) {

                    $type = isset($option['type']) ? $option['type'] : '';

                    $value = isset($field[$option_key]) ? $field[$option_key] : '';

                    $updated_value = '';

                    switch ($type) {

                        case "text":
                            $updated_value = sanitize_text_field($value);
                            break;
                        case "number":
                            $updated_value = absint($value);
                            break;


                        case "textarea":

                            $allowed_tags = array(
                                'p' => array(),
                                'em' => array(),
                                'strong' => array(),
                                'img' => array(
                                    'src' => array()
                                ),
                                'a' => array(
                                    'href' => array(),
                                ),
                            );

                            $updated_value = wp_kses($value, $allowed_tags);
                            break;


                    }
                    $meta_array[$this->attribute_index][$option_key] = $updated_value;


                }


            }


            foreach ($meta_array as $meta_key => $meta_value) {

                $current_screen = get_current_screen();

                if ($current_screen->base == 'edit-tags') {

                    update_term_meta($term_id, $meta_key, $meta_value, '');

                } else {
                    add_term_meta($term_id, $meta_key, $meta_value, true);
                }
            }

        }


        public function edit($term, $taxonomy)
        {
            $attribute_available_for_tour = (boolean)get_term_meta($term->term_id, 'attribute_available_for_tour', true);
            ?>
            <tr class="form-field term-group-wrap">
                <th scope="row">
                    <label
                            for="attribute_available_for_tour"><?php _e('Always Available for All Tours', 'yatra'); ?></label>
                </th>
                <td>

                    <p>
                        <input type="checkbox" name="attribute_available_for_tour"
                               value="1" <?php echo $attribute_available_for_tour ? 'checked="checked"' : '' ?>/>
                    </p>
                </td>
            </tr>

            <tr class="form-field term-group-wrap">
                <th scope="row">
                    <label for="attribute_field_type"><?php _e('Attribute Type', 'yatra'); ?></label>
                </th>
                <td>
                    <?php $attribute_field_type_key = get_term_meta($term->term_id, 'attribute_field_type', true); ?>
                    <p>
                        <select name="attribute_field_type" required="required">
                            <?php
                            $yatra_tour_attribute_type = yatra_tour_attribute_type();
                            foreach ($yatra_tour_attribute_type as $attribute_key => $attribute_type) {

                                echo '<option ' . selected($attribute_field_type_key, $attribute_key) . ' value="' . esc_attr($attribute_key) . '">' . $attribute_type['label'] . '</option>';
                            }
                            ?>
                        </select>
                    </p>
                </td>
            </tr>
            <?php

            $attribute_parser = new Yatra_Tour_Attribute_Parser($attribute_field_type_key, $term->term_id);

            $attribute_parser->parse(false, true);

        }


        public function register()
        {
            $permalinks = yatra_get_permalink_structure();
            // Add new taxonomy, make it hierarchical (like categories)
            $labels = array(
                'name' => __('Attributes', 'yatra'),
                'singular_name' => __('Attributes', 'yatra'),
                'search_items' => __('Search Attributes', 'yatra'),
                'all_items' => __('All Attributes', 'yatra'),
                'parent_item' => __('Parent Attributes', 'yatra'),
                'parent_item_colon' => __('Parent Attributes:', 'yatra'),
                'edit_item' => __('Edit Attributes', 'yatra'),
                'update_item' => __('Update Attributes', 'yatra'),
                'add_new_item' => __('Add New Attributes', 'yatra'),
                'new_item_name' => __('New Attributes Name', 'yatra'),
                'menu_name' => __('Attributes', 'yatra'),
            );
            $args = array(
                'hierarchical' => false,
                'labels' => $labels,
                'show_ui' => true,
                'show_admin_column' => true,
                'query_var' => true,
                'rewrite' => array(
                    'slug' => $permalinks['yatra_attributes_base'],
                    'with_front' => true
                )
            );
            register_taxonomy('attributes', array('tour'), $args);


        }

        public function form($taxonomy)
        { ?>
            <div class="form-field term-group">


                <p>
                    <input type="checkbox" name="attribute_available_for_tour" value="1"/>
                    <label style="display:inline"
                           for="attribute_available_for_tour"><?php _e('Always Available for All Tours', 'yatra'); ?></label>
                </p>
            </div>
            <div class="form-field term-group">
                <label for="attribute_field_type"><?php _e('Attribute Type', 'yatra'); ?></label>

                <p>

                    <select name="attribute_field_type" required="required">
                        <?php
                        $yatra_tour_attribute_type = yatra_tour_attribute_type();
                        foreach ($yatra_tour_attribute_type as $attribute_key => $attribute_type) {

                            echo '<option value="' . esc_attr($attribute_key) . '">' . $attribute_type['label'] . '</option>';
                        }
                        ?>
                    </select>
                </p>
            </div>
            <?php

        }


    }
}