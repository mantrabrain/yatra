var YatraActivityTaxonomy = function ($) {
    return {

        init: function () {

            this.initElement();
            this.InitUpload();
            this.ajaxComplete();
        },
        initElement: function () {
            this.taxonomy_activity_media_frame = '';

        },
        InitUpload: function () {
            var uploadBtn = $('.mb_taxonomy_media_upload_btn.button');
            var $this = this;
            uploadBtn.on('click', function (event) {
                event.preventDefault();
                $this.initMediaUploader(uploadBtn);
            });
            $('body').on('click', '.mb_taxonomy_remove_media', function (event) {
                event.preventDefault();
                $this.removeGalleryItem($(this).closest('li'), parent);

            });
        },
        initMediaUploader: function (uploadBtn, wrapper) {

            var $this = this;
            if (this.taxonomy_activity_media_frame) this.taxonomy_activity_media_frame.close();

            this.taxonomy_activity_media_frame = wp.media.frames.file_frame = wp.media({
                title: uploadBtn.data('uploader-title'),
                button: {
                    text: uploadBtn.data('uploader-button-text'),
                },
                multiple: false
            });

            this.taxonomy_activity_media_frame.on('select', function () {

                var attachment = $this.taxonomy_activity_media_frame.state().get('selection').first().toJSON();

                $('#image-url').val(attachment.url);

                $('#activity_image_id').val(attachment.id);

                $('#activity_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');

                $('#activity_image_wrapper .custom_media_image').attr('src', attachment.url).css('display', 'block');

                var selection = $this.taxonomy_activity_media_frame.state().get('selection');

            });


            this.taxonomy_activity_media_frame.open();
        },
        removeGalleryItem: function (gallery_item, wrapper) {
            $('#activity_image_id').val('');
            $('#activity_image_wrapper').html('<img class="custom_media_image" src="" style="margin:0;padding:0;max-height:100px;float:none;" />');
        },
        ajaxComplete: function () {
            $(document).ajaxComplete(function (event, xhr, options) {
                var queryStringArr = options.data.split('&');
                if ($.inArray('action=add-tag', queryStringArr) !== -1) {
                    var xml = xhr.responseXML;
                    var $response = $(xml).find('term_id').text();
                    if ($response != "") {
                        // Clear the thumb image
                        $('#mb_taxonomy_remove_media').trigger('click');
                    }
                }
            });
        }

    };
}(jQuery);
(function ($) {

    $(document).ready(function () {
        YatraActivityTaxonomy.init();

    });
}(jQuery));