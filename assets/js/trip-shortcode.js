jQuery(document).ready(function($) {
    'use strict';

    // Handle pagination clicks
    $(document).on('click', '.yatra-tour-pagination a', function(e) {
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
        
        // Debug: Log the data being sent
        console.log('Yatra Trip Shortcode - Sending AJAX request:', {
            page: page,
            atts: atts
        });
        
        // AJAX request
        $.post(yatraTripShortcode.ajaxurl, {
            action: 'yatra_trip_shortcode_load',
            nonce: yatraTripShortcode.nonce,
            page: page,
            atts: atts
        }, function(response) {
            if (response.success) {
                // Update container content
                $container.html(response.data.html);
                
                // Scroll to top of container
                $('html, body').animate({
                    scrollTop: $container.offset().top - 100
                }, 300);
                
                // Trigger custom event
                $(document).trigger('yatraTripShortcodeUpdated', [response.data]);
            } else {
                console.error('Error loading trips:', response.data.message);
            }
        }).fail(function(xhr, status, error) {
            console.error('AJAX Error:', error);
        }).always(function() {
            // Remove loading state
            $container.removeClass('yatra-loading');
        });
    });
    
    // Initialize shortcode data
    $('.yatra-tour-shortcode').each(function() {
        var $container = $(this);
        var atts = $container.data('atts');
        
        // Debug: Log the stored attributes
        console.log('Yatra Trip Shortcode - Stored attributes:', atts);
        
        if (!atts) {
            console.warn('Yatra Trip Shortcode - No attributes found in container');
        }
    });
});
