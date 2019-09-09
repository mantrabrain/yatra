<?php
if (!class_exists('Yatra_Taxonomy_Activity')) {

    class Yatra_Taxonomy_Activity
    {

        public function init()
        {
            add_action('init', array($this, 'register'));
            add_action('activity_add_form_fields', array($this, 'form'), 10, 2);
            add_action('activity_edit_form_fields', array($this, 'edit'), 10, 2);
            add_action('edited_activity', array($this, 'update'), 10, 2);
            add_action('created_activity', array($this, 'save'), 10, 2);
        }

        public function save($term_id, $id)
        {
            if (isset($_POST['activity_image_id']) && '' !== $_POST['activity_image_id']) {
                $image = $_POST['activity_image_id'];
                add_term_meta($term_id, 'activity_image_id', $image, true);
            }
        }

        public function update($term_id, $id)
        {
            if (isset($_POST['activity_image_id']) && '' !== $_POST['activity_image_id']) {
                $image = $_POST['activity_image_id'];
                update_term_meta($term_id, 'activity_image_id', $image);
            } else {
                update_term_meta($term_id, 'activity_image_id', '');
            }
        }

        public function edit($term, $taxonomy)
        { ?>
            <tr class="form-field term-group-wrap">
                <th scope="row">
                    <label for="activity_image_id"><?php _e('Image', 'yatra'); ?></label>
                </th>
                <td>
                    <?php $image_id = get_term_meta($term->term_id, 'activity_image_id', true); ?>
                    <input type="hidden" id="activity_image_id" name="activity_image_id"
                           value="<?php echo $image_id; ?>">
                    <div id="activity_image_wrapper">
                        <?php if ($image_id) { ?>
                            <?php echo wp_get_attachment_image($image_id, 'thumbnail'); ?>
                        <?php } ?>
                    </div>
                    <p>
                        <input type="button" class="button button-secondary mb_taxonomy_media_upload_btn"
                               id="mb_taxonomy_media_upload_btn" name="mb_taxonomy_media_upload_btn"
                               value="<?php _e('Add Image', 'yatra'); ?>"
                               data-uploader-title="<?php _e('Choose Image', 'yatra'); ?>"
                               data-uploader-button-text="<?php _e('Choose Image', 'yatra'); ?>"
                        />
                        <input type="button" class="button button-secondary mb_taxonomy_remove_media"
                               id="mb_taxonomy_remove_media" name="mb_taxonomy_remove_media"
                               value="<?php _e('Remove Image', 'yatra'); ?>"/>
                    </p>
                </td>
            </tr>
            <?php
        }


        public function register()
        {
            $permalinks = yatra_get_permalink_structure();
            // Add new taxonomy, make it hierarchical (like categories)
            $labels = array(
                'name' => __('Activities', 'yatra'),
                'singular_name' => __('Activity', 'yatra'),
                'search_items' => __('Search Activities', 'yatra'),
                'all_items' => __('All Activities', 'yatra'),
                'parent_item' => __('Parent Activity', 'yatra'),
                'parent_item_colon' => __('Parent Activity:', 'yatra'),
                'edit_item' => __('Edit Activity', 'yatra'),
                'update_item' => __('Update Activity', 'yatra'),
                'add_new_item' => __('Add New Activity', 'yatra'),
                'new_item_name' => __('New Activity Name', 'yatra'),
                'menu_name' => __('Activity', 'yatra'),
            );
            $args = array(
                'hierarchical' => true,
                'labels' => $labels,
                'show_ui' => true,
                'show_admin_column' => true,
                'query_var' => true,
                'rewrite' => array(
                    'slug' => $permalinks['yatra_activity_base'],
                    'with_front' => true
                )
            );
            register_taxonomy('activity', array('tour'), $args);


        }

        public function form($taxonomy)
        { ?>
            <div class="form-field term-group">
                <label for="activity_image_id"><?php _e('Image', 'yatra'); ?></label>
                <input type="hidden" id="activity_image_id" name="activity_image_id" class="custom_media_url"
                       value="">
                <div id="activity_image_wrapper"></div>
                <p>
                    <input type="button" class="button button-secondary mb_taxonomy_media_upload_btn"
                           id="mb_taxonomy_media_upload_btn"
                           name="mb_taxonomy_media_upload_btn" value="<?php _e('Add Image', 'yatra'); ?>"
                           data-uploader-title="<?php _e('Choose Image', 'yatra'); ?>"
                           data-uploader-button-text="<?php _e('Choose Image', 'yatra'); ?>"
                    />
                    <input type="button" class="button button-secondary mb_taxonomy_remove_media"
                           id="mb_taxonomy_remove_media"
                           name="mb_taxonomy_remove_media" value="<?php _e('Remove Image', 'yatra'); ?>"/>
                </p>
            </div>
            <?php

        }

    }
}