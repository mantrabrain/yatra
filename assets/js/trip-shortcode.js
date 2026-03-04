jQuery(document).ready(function($) {
    'use strict';

    // Handle pagination clicks for regular trip shortcode (not discount)
    $(document).on('click', '.yatra-tour-shortcode:not(.yatra-discount-trip-shortcode) .yatra-tour-pagination a', function(e) {
        e.preventDefault();
        
        var $link = $(this);
        var $container = $link.closest('.yatra-tour-shortcode');
        var page = $link.data('page');
        var atts = $container.data('atts');
        
        if (!page || !atts) {
            return;
        }
        
        // Add loading state
        $container.addClass('yatra-loading');
        
                
        // AJAX request
        $.post(yatraTripShortcode.ajaxurl, {
            action: 'yatra_trip_shortcode_load',
            nonce: yatraTripShortcode.nonce,
            page: page,
            atts: atts
        }, function(response) {
            if (response.success) {
                // Update only the inner content, not the entire container to prevent nesting
                // The response should contain only the inner content (header, grid, pagination)
                var $innerContent = $('<div>').html(response.data.html);
                var newShortcodeElement = $innerContent.find('.yatra-tour-shortcode');
                
                if (newShortcodeElement.length) {
                    // Extract the inner content from the new shortcode element
                    var newInnerContent = newShortcodeElement.html();
                    var newAtts = newShortcodeElement.data('atts');
                    
                    // Update the existing container's inner content
                    $container.html(newInnerContent);
                    
                    // Update container data attributes
                    if (newAtts) {
                        $container.data('atts', newAtts);
                    }
                } else {
                    // Fallback: if no shortcode element found, replace directly
                    $container.html(response.data.html);
                }
                
                // Scroll to top of container
                $('html, body').animate({
                    scrollTop: $container.offset().top - 100
                }, 300);
                
                // Trigger custom event
                $(document).trigger('yatraTripShortcodeUpdated', [response.data]);
            } else {
                // Error loading trips
            }
        }).fail(function(xhr, status, error) {
        }).always(function() {
            // Remove loading state
            $container.removeClass('yatra-loading');
        });
    });
    
    // Initialize shortcode data
    $('.yatra-tour-shortcode').each(function() {
        var $container = $(this);
        var atts = $container.data('atts');
        
            });
});
