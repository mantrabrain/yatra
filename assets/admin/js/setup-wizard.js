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
            this.ensureRedirectField();
        },

        /**
         * Ensure redirect field exists so links can autosave + navigate.
         */
        ensureRedirectField: function() {
            $('.yatra-setup-content form.wizard-step').each(function() {
                var $form = $(this);
                if ($form.find('input[name="yatra_redirect_to"]').length === 0) {
                    $form.append('<input type="hidden" name="yatra_redirect_to" value="" />');
                }
            });
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

            // Currency preview (decimal field id matches currency.php: #decimal_places)
            $('#currency, #currency_position, #thousand_separator, #decimal_separator, #decimal_places, #number_of_decimals').on('change input', function() {
                YatraSetupWizard.updateCurrencyPreview();
            });

            // Skip step confirmation (matches .btn-skip links in wizard templates)
            $(document).on('click', '.yatra-setup-content a.btn-skip', function(e) {
                var msg = (typeof yatraSetupWizard !== 'undefined' && yatraSetupWizard.skipConfirmMessage)
                    ? yatraSetupWizard.skipConfirmMessage
                    : 'Skip this step without saving?';
                if (!window.confirm(msg)) {
                    e.preventDefault();
                    return false;
                }
            });

            // Autosave current step when navigating via links (Back / completed steps).
            $(document).on('click', '.yatra-setup-wrapper .yatra-setup-steps a, .yatra-setup-content a.wizard-footer-back', function(e) {
                var $link = $(this);
                var href = $link.attr('href');
                if (!href) {
                    return;
                }

                var $form = $('.yatra-setup-content form.wizard-step').first();
                if ($form.length === 0) {
                    return;
                }

                // Do not interfere with modifier keys / new tab.
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0) {
                    return;
                }

                e.preventDefault();

                // Set redirect target and submit so PHP saves before redirecting.
                $form.find('input[name="yatra_redirect_to"]').val(href);
                $form.trigger('submit');
                return false;
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
            var decimalsRaw = $('#decimal_places').val();
            if (decimalsRaw === undefined || decimalsRaw === '') {
                decimalsRaw = $('#number_of_decimals').val();
            }
            var decimals = parseInt(decimalsRaw, 10);
            if (isNaN(decimals)) {
                decimals = 2;
            }

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
            var $anchor = $('#decimal_places').length ? $('#decimal_places').closest('.form-group') : $('#currency').closest('.form-group');
            if ($('#currency-preview').length === 0 && $anchor.length) {
                $anchor.after(
                    '<div class="form-group" id="currency-preview-wrap"><label class="form-label">Preview</label>' +
                    '<p class="form-control" style="background:#f9fafb;font-weight:600;" id="currency-preview">' + preview + '</p></div>'
                );
            } else if ($('#currency-preview').length) {
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
