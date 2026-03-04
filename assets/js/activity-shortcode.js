jQuery(document).ready(function($) {
    'use strict';

    // Handle pagination clicks
    $(document).on('click', '.yatra-activity-pagination a', function(e) {
        e.preventDefault();
        
        var $link = $(this);
        var $container = $link.closest('.yatra-activity-shortcode');
        var page = $link.data('page');
        var atts = $container.data('atts');
        
        if (!page || !atts) {
            return;
        }
        
        // Add loading state
        $container.addClass('yatra-loading');
        
        // Debug: Log the data being sent
        console.log('Yatra Activity Shortcode - Sending AJAX request:', {
            page: page,
            atts: atts
        });
        
        // AJAX request
        $.post(yatraActivityShortcode.ajaxurl, {
            action: 'yatra_activity_shortcode_load',
            nonce: yatraActivityShortcode.nonce,
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
                $(document).trigger('yatraActivityShortcodeUpdated', [response.data]);
            } else {
                console.error('Error loading activities:', response.data.message);
            }
        }).fail(function(xhr, status, error) {
            console.error('AJAX Error:', error);
        }).always(function() {
            // Remove loading state
            $container.removeClass('yatra-loading');
        });
    });
    
    // Initialize shortcode data
    $('.yatra-activity-shortcode').each(function() {
        var $container = $(this);
        var atts = $container.data('atts');
        
        // Debug: Log the stored attributes
        console.log('Yatra Activity Shortcode - Stored attributes:', atts);
        
        if (!atts) {
            console.warn('Yatra Activity Shortcode - No attributes found in container');
        }
    });
});
