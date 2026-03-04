jQuery(document).ready(function($) {
    'use strict';

    // Handle pagination clicks for discount shortcode
    $(document).on('click', '.yatra-tour-shortcode .yatra-tour-pagination a', function(e) {
        e.preventDefault();
        
        var $link = $(this);
        var $container = $link.closest('.yatra-tour-shortcode');
        var page = $link.data('page');
        var atts = $container.data('atts');
        
        // Check if this is a discount shortcode by looking for discount-specific data or content
        var isDiscountShortcode = $container.find('.yatra-discount-badge').length > 0 || 
                                 $container.find('h2').text().includes('Deals') ||
                                 $container.find('h2').text().includes('Discount');
        
        if (!page || !atts) {
            return;
        }
        
        // Add loading state
        $container.addClass('yatra-loading');
        
        // Debug: Log the data being sent
        console.log('Yatra Discount Trip Shortcode - Sending AJAX request:', {
            page: page,
            atts: atts,
            isDiscountShortcode: isDiscountShortcode
        });
        
        // Choose the correct AJAX action and nonce based on shortcode type
        var ajaxAction, nonceVar;
        if (isDiscountShortcode) {
            ajaxAction = 'yatra_discount_trip_shortcode_load';
            nonceVar = 'yatraDiscountTripShortcode';
        } else {
            ajaxAction = 'yatra_trip_shortcode_load';
            nonceVar = 'yatraTripShortcode';
        }
        
        // AJAX request
        $.post(yatraTripShortcode.ajaxurl, {
            action: ajaxAction,
            nonce: window[nonceVar].nonce,
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
                if (isDiscountShortcode) {
                    $(document).trigger('yatraDiscountTripShortcodeUpdated', [response.data]);
                } else {
                    $(document).trigger('yatraTripShortcodeUpdated', [response.data]);
                }
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
});
