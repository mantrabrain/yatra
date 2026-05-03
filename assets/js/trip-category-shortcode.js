jQuery(document).ready(function($) {
    'use strict';

    $(document).on('click', '.yatra-trip-category-shortcode .yatra-destination-pagination a', function(e) {
        e.preventDefault();

        var $link = $(this);
        var $container = $link.closest('.yatra-trip-category-shortcode');
        var page = $link.data('page');
        var atts = $container.data('atts');

        if (!page || !atts || typeof yatraTripCategoryShortcode === 'undefined') {
            return;
        }

        $container.addClass('yatra-loading');

        $.post(yatraTripCategoryShortcode.ajaxurl, {
            action: 'yatra_trip_category_shortcode_load',
            nonce: yatraTripCategoryShortcode.nonce,
            page: page,
            atts: atts
        }, function(response) {
            if (response.success) {
                var $innerContent = $('<div>').html(response.data.html);
                var $newRoot = $innerContent.find('.yatra-trip-category-shortcode');

                if ($newRoot.length) {
                    var newInnerContent = $newRoot.html();
                    var newAtts = $newRoot.data('atts');
                    $container.html(newInnerContent);
                    if (newAtts) {
                        $container.data('atts', newAtts);
                    }
                } else {
                    $container.html(response.data.html);
                }

                $('html, body').animate({
                    scrollTop: $container.offset().top - 100
                }, 300);

                $(document).trigger('yatraTripCategoryShortcodeUpdated', [response.data]);
            }
        }).always(function() {
            $container.removeClass('yatra-loading');
        });
    });
});
