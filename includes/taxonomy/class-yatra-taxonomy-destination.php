<?php
if (!class_exists('Yatra_Taxonomy_Destination')) {

    class Yatra_Taxonomy_Destination
    {


        public function __construct()
        {
            add_action('init', array($this, 'register'));
            add_action('destination_add_form_fields', array($this, 'form_meta_destination_image'), 10, 2);
            add_action('destination_edit_form_fields', array($this, 'edit_meta_destination_image'), 10, 2);
            add_action('edited_destination', array($this, 'update_meta_destination_image'), 10, 2);
            add_action('admin_enqueue_scripts', array($this, 'load_media'));
            add_action('admin_footer', array($this, 'footer_script'));
            add_action('created_destination', array($this, 'save'), 10, 2);
        }

        public function save($term_id, $id)
        {
            if (isset($_POST['destination_image_id']) && '' !== $_POST['destination_image_id']) {
                $image = $_POST['destination_image_id'];
                add_term_meta($term_id, 'destination_image_id', $image, true);
            }
        }

        public function update_meta_destination_image($term_id, $id)
        {
            if (isset($_POST['destination_image_id']) && '' !== $_POST['destination_image_id']) {
                $image = $_POST['destination_image_id'];
                update_term_meta($term_id, 'destination_image_id', $image);
            } else {
                update_term_meta($term_id, 'destination_image_id', '');
            }
        }

        public function edit_meta_destination_image($term, $taxonomy)
        { ?>
            <tr class="form-field term-group-wrap">
                <th scope="row">
                    <label for="destination_image_id"><?php _e('Image', 'yatra'); ?></label>
                </th>
                <td>
                    <?php $image_id = get_term_meta($term->term_id, 'destination_image_id', true); ?>
                    <input type="hidden" id="destination_image_id" name="destination_image_id"
                           value="<?php echo $image_id; ?>">
                    <div id="destination_image_wrapper">
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
            $permalinks = yatra_get_permalink_structure();
            // Add new taxonomy, make it hierarchical (like categories)
            $labels = array(
                'name' => __('Destinations', 'yatra'),
                'singular_name' => __('Destination', 'yatra'),
                'search_items' => __('Search Destinations', 'yatra'),
                'all_items' => __('All Destinations', 'yatra'),
                'parent_item' => __('Parent Destination', 'yatra'),
                'parent_item_colon' => __('Parent Destination:', 'yatra'),
                'edit_item' => __('Edit Destination', 'yatra'),
                'update_item' => __('Update Destination', 'yatra'),
                'add_new_item' => __('Add New Destination', 'yatra'),
                'new_item_name' => __('New Destination Name', 'yatra'),
                'menu_name' => __('Destination', 'yatra'),
            );
            $args = array(
                'hierarchical' => true,
                'labels' => $labels,
                'show_ui' => true,
                'show_admin_column' => true,
                'query_var' => true,
                'rewrite' => array(
                    'slug' => $permalinks['yatra_destination_base'],
                    'with_front' => true
                )
            );
            register_taxonomy('destination', array('tour'), $args);


        }

        public function form_meta_destination_image($taxonomy)
        { ?>
            <div class="form-field term-group">
                <label for="destination_image_id"><?php _e('Image', 'yatra'); ?></label>
                <input type="hidden" id="destination_image_id" name="destination_image_id" class="custom_media_url"
                       value="">
                <div id="destination_image_wrapper"></div>
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
                            $('#destination_image_id').val(attachment.id);
                            $('#destination_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');
                            $('#destination_image_wrapper .custom_media_image').attr('src', attachment.url).css('display', 'block');
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

                                }
                            }

                            // Hack for "Insert Media" Dialog (new plupload uploader)

                            // Hooking on the uploader queue (on reset):
                            if (typeof wp.Uploader !== 'undefined' && typeof wp.Uploader.queue !== 'undefined') {
                                wp.Uploader.queue.on('reset', function () {

                                });
                            }
                        });
                        // Open the uploader dialog
                        mediaUploader.open();
                    });

                    $('body').on('click', '.mb_taxonomy_remove_media', function () {
                        $('#destination_image_id').val('');
                        $('#destination_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');
                    });

                    $(document).ajaxComplete(function (event, xhr, settings) {
                        var queryStringArr = settings.data.split('&');
                        if ($.inArray('action=add-tag', queryStringArr) !== -1) {
                            var xml = xhr.responseXML;
                            $response = $(xml).find('term_id').text();
                            if ($response != "") {
                                // Clear the thumb image
                                $('#destination_image_wrapper').html('');
                            }
                        }
                    });
                });
            </script>
        <?php }

    }
}