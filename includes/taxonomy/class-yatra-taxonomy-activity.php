<?php
if (!class_exists('Yatra_Taxonomy_Activity')) {

    class Yatra_Taxonomy_Activity
    {

        public function __construct()
        {
            add_action('init', array($this, 'register'));
            add_action('activity_add_form_fields', array($this, 'form'), 10, 2);
            add_action('activity_edit_form_fields', array($this, 'edit'), 10, 2);
            add_action('edited_activity', array($this, 'update'), 10, 2);
            add_action('admin_enqueue_scripts', array($this, 'load_media'));
            add_action('admin_footer', array($this, 'footer_script'));
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
                               value="<?php _e('Add Image', 'yatra'); ?>"/>
                        <input type="button" class="button button-secondary mb_taxonomy_remove_media"
                               id="mb_taxonomy_remove_media" name="mb_taxonomy_remove_media"
                               value="<?php _e('Remove Image', 'yatra'); ?>"/>
                    </p>
                </td>
            </tr>
            <?php
        }

        public function load_media()
        {
            wp_enqueue_media();
        }

        public function register()
        {
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
                'rewrite' => array('slug' => 'activity'),
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
                           name="mb_taxonomy_media_upload_btn" value="<?php _e('Add Image', 'yatra'); ?>"/>
                    <input type="button" class="button button-secondary mb_taxonomy_remove_media"
                           id="mb_taxonomy_remove_media"
                           name="mb_taxonomy_remove_media" value="<?php _e('Remove Image', 'yatra'); ?>"/>
                </p>
            </div>
            <?php

        }

        public function footer_script()
        { ?>
            <script>
                jQuery(document).ready(function ($) {
                    var mediaUploader;
                    $('.mb_taxonomy_media_upload_btn.button').click(function (e) {
                        e.preventDefault();
                        if (mediaUploader) {
                            mediaUploader.open();
                            return;
                        }
                        mediaUploader = wp.media.frames.file_frame = wp.media({
                            title: 'Choose Image',
                            button: {
                                text: 'Choose Image'
                            }, multiple: false
                        });


                        mediaUploader.on('select', function () {
                            var attachment = mediaUploader.state().get('selection').first().toJSON();
                            $('#image-url').val(attachment.url);
                            $('#activity_image_id').val(attachment.id);
                            $('#activity_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');
                            $('#activity_image_wrapper .custom_media_image').attr('src', attachment.url).css('display', 'block');
                            var selection = mediaUploader.state().get('selection');
                            var selected = '';// the id of the image
                            // if (selected) {
                            selection.add(wp.media.attachment(selected));
                            if (typeof uploadSuccess !== 'undefined') {
                                // First backup the function into a new variable.
                                var uploadSuccess_original = uploadSuccess;
                                // The original uploadSuccess function with has two arguments: fileObj, serverData
                                // So we globally declare and override the function with two arguments (argument names shouldn't matter)
                                uploadSuccess = function (fileObj, serverData) {
                                    // Fire the original procedure with the same arguments
                                    uploadSuccess_original(fileObj, serverData);
                                    // Execute whatever you want here:
                                    alert('Upload Complete!');
                                }
                            }

                            // Hack for "Insert Media" Dialog (new plupload uploader)

                            // Hooking on the uploader queue (on reset):
                            if (typeof wp.Uploader !== 'undefined' && typeof wp.Uploader.queue !== 'undefined') {
                                wp.Uploader.queue.on('reset', function () {
                                    alert('Upload Complete!');
                                });
                            }
                        });
                        // Open the uploader dialog
                        mediaUploader.open();
                    });

                    $('body').on('click', '.mb_taxonomy_remove_media', function () {
                        $('#activity_image_id').val('');
                        $('#activity_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');
                    });

                    $(document).ajaxComplete(function (event, xhr, settings) {
                        var queryStringArr = settings.data.split('&');
                        if ($.inArray('action=add-tag', queryStringArr) !== -1) {
                            var xml = xhr.responseXML;
                            $response = $(xml).find('term_id').text();
                            if ($response != "") {
                                // Clear the thumb image
                                $('#activity_image_wrapper').html('');
                            }
                        }
                    });
                });
            </script>
        <?php }

    }
}