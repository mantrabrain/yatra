/**
 * Yatra Setup Wizard JavaScript
 *
 * @package Yatra
 */

(function($) {
    'use strict';

    var YatraSetupWizard = {
        /**
         * Initialize
         */
        init: function() {
            this.bindEvents();
            this.initFormValidation();
        },

        /**
         * Bind events
         */
        bindEvents: function() {
            // Form submission with loading state
            $('.yatra-setup-content form').on('submit', function() {
                var $form = $(this);
                var $submitBtn = $form.find('button[type="submit"]');
                
                // Disable submit button and add loading class
                $submitBtn.prop('disabled', true);
                $submitBtn.css('opacity', '0.6');
                $submitBtn.css('pointer-events', 'none');
            });

            // Currency preview
            $('#currency, #currency_position, #thousand_separator, #decimal_separator, #number_of_decimals').on('change', function() {
                YatraSetupWizard.updateCurrencyPreview();
            });

            // Skip step confirmation
            $('.yatra-setup-actions a.button').on('click', function(e) {
                var $link = $(this);
                if ($link.text().indexOf('Skip') !== -1) {
                    if (!confirm(yatraSetupWizard.skipConfirmMessage || 'Are you sure you want to skip this step?')) {
                        e.preventDefault();
                        return false;
                    }
                }
            });
        },

        /**
         * Initialize form validation
         */
        initFormValidation: function() {
            // Number inputs validation
            $('input[type="number"]').on('input', function() {
                var $input = $(this);
                var min = parseFloat($input.attr('min'));
                var max = parseFloat($input.attr('max'));
                var value = parseFloat($input.val());

                if (!isNaN(min) && value < min) {
                    $input.val(min);
                }
                if (!isNaN(max) && value > max) {
                    $input.val(max);
                }
            });

            // Required fields
            $('.yatra-setup-content form').on('submit', function(e) {
                var isValid = true;
                var $form = $(this);

                // Remove previous error messages
                $form.find('.error-message').remove();

                // Check required fields
                $form.find('[required]').each(function() {
                    var $field = $(this);
                    if (!$field.val() || $field.val().trim() === '') {
                        isValid = false;
                        $field.addClass('error');
                        $field.after('<p class="error-message" style="color: #d63638; margin-top: 5px;">This field is required.</p>');
                    } else {
                        $field.removeClass('error');
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    // Scroll to first error
                    $('html, body').animate({
                        scrollTop: $form.find('.error').first().offset().top - 100
                    }, 500);
                }

                return isValid;
            });
        },

        /**
         * Update currency preview
         */
        updateCurrencyPreview: function() {
            var currency = $('#currency').val() || 'USD';
            var position = $('#currency_position').val() || 'before';
            var thousandSep = $('#thousand_separator').val() || ',';
            var decimalSep = $('#decimal_separator').val() || '.';
            var decimals = parseInt($('#number_of_decimals').val()) || 2;

            // Get currency symbol (simplified)
            var symbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'AUD': '$',
                'CAD': '$',
                'JPY': '¥',
                'INR': '₹',
                'CNY': '¥',
                'CHF': 'CHF',
                'NZD': '$'
            };
            var symbol = symbols[currency] || currency;

            // Format example number
            var number = 1234.56;
            var parts = number.toFixed(decimals).split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
            var formatted = parts.join(decimalSep);

            // Apply position
            var preview = position === 'before' ? symbol + formatted : formatted + symbol;

            // Show preview if element exists
            if ($('#currency-preview').length === 0) {
                $('#number_of_decimals').closest('tr').after(
                    '<tr id="currency-preview-row">' +
                    '<th scope="row">Preview</th>' +
                    '<td><strong id="currency-preview">' + preview + '</strong></td>' +
                    '</tr>'
                );
            } else {
                $('#currency-preview').text(preview);
            }
        },

        /**
         * Show notification
         */
        showNotification: function(message, type) {
            type = type || 'success';
            var $notice = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.yatra-setup-content').prepend($notice);
            
            // Auto dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        YatraSetupWizard.init();
    });

})(jQuery);
