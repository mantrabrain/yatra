/**
 * Yatra New Settings JavaScript
 * Modern admin interface functionality
 */

(function($) {
    'use strict';

    // Main Settings Class
    class YatraNewSettings {
        constructor() {
            this.init();
        }

        init() {
            this.bindEvents();
            this.initTooltips();
            this.initColorPickers();
        }

        bindEvents() {
            // Form submission
            $('#yatra-new-settings-form').on('submit', this.handleFormSubmit.bind(this));
            
            // Reset button
            $('.yatra-new-reset-settings').on('click', this.handleReset.bind(this));
            
            // Tab navigation
            $('.yatra-new-settings-nav-item').on('click', this.handleTabChange.bind(this));
            
            // Field validation
            $('.yatra-new-settings-field input, .yatra-new-settings-field select, .yatra-new-settings-field textarea').on('blur', this.validateField.bind(this));
            
            // Real-time validation
            $('.yatra-new-settings-field input[type="email"]').on('input', this.validateEmail.bind(this));
            $('.yatra-new-settings-field input[type="number"]').on('input', this.validateNumber.bind(this));
        }

        handleFormSubmit(e) {
            e.preventDefault();
            
            const $form = $(e.target);
            const $submitBtn = $form.find('.yatra-new-save-settings');
            const $resetBtn = $form.find('.yatra-new-reset-settings');
            
            // Validate form
            if (!this.validateForm($form)) {
                return;
            }

            // Show loading state
            this.showLoading($form, $submitBtn, $resetBtn);
            
            // Collect form data
            const formData = this.collectFormData($form);
            
            // Send AJAX request
            this.saveSettings(formData, $form, $submitBtn, $resetBtn);
        }

        validateForm($form) {
            let isValid = true;
            
            // Remove previous error states
            $form.find('.yatra-new-settings-field').removeClass('error');
            $form.find('.yatra-new-settings-message').remove();
            
            // Validate required fields
            $form.find('input[required], select[required], textarea[required]').each(function() {
                if (!$(this).val()) {
                    $(this).closest('.yatra-new-settings-field').addClass('error');
                    isValid = false;
                }
            });
            
            // Validate email fields
            $form.find('input[type="email"]').each(function() {
                if ($(this).val() && !this.validateEmail($(this).val())) {
                    $(this).closest('.yatra-new-settings-field').addClass('error');
                    isValid = false;
                }
            });
            
            // Validate number fields
            $form.find('input[type="number"]').each(function() {
                const $field = $(this);
                const value = $field.val();
                const min = $field.attr('min');
                const max = $field.attr('max');
                
                if (value && (min && value < min || max && value > max)) {
                    $field.closest('.yatra-new-settings-field').addClass('error');
                    isValid = false;
                }
            });
            
            if (!isValid) {
                this.showMessage('Please fix the errors above before saving.', 'error');
            }
            
            return isValid;
        }

        validateField(e) {
            const $field = $(e.target);
            const $fieldContainer = $field.closest('.yatra-new-settings-field');
            
            // Remove error state
            $fieldContainer.removeClass('error');
            
            // Validate based on field type
            if ($field.attr('required') && !$field.val()) {
                $fieldContainer.addClass('error');
                return false;
            }
            
            if ($field.attr('type') === 'email' && $field.val() && !this.validateEmail($field.val())) {
                $fieldContainer.addClass('error');
                return false;
            }
            
            if ($field.attr('type') === 'number') {
                const value = $field.val();
                const min = $field.attr('min');
                const max = $field.attr('max');
                
                if (value && (min && value < min || max && value > max)) {
                    $fieldContainer.addClass('error');
                    return false;
                }
            }
            
            return true;
        }

        validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        validateNumber(value) {
            return !isNaN(value) && value !== '';
        }

        collectFormData($form) {
            const formData = new FormData();
            const tab = $form.find('input[name="tab"]').val();
            
            formData.append('action', 'yatra_save_new_settings');
            formData.append('nonce', yatraNewSettings.nonce);
            formData.append('tab', tab);
            
            // Collect settings based on current tab
            const settings = {};
            $form.find('input, select, textarea').each(function() {
                const $field = $(this);
                const name = $field.attr('name');
                
                if (name && name.startsWith(tab + '_settings[')) {
                    const key = name.match(/\[([^\]]+)\]/)[1];
                    
                    if ($field.attr('type') === 'checkbox') {
                        settings[key] = $field.is(':checked') ? '1' : '0';
                    } else {
                        settings[key] = $field.val();
                    }
                }
            });
            
            formData.append('settings', JSON.stringify(settings));
            return formData;
        }

        saveSettings(formData, $form, $submitBtn, $resetBtn) {
            $.ajax({
                url: yatraNewSettings.ajaxUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    if (response.success) {
                        this.showMessage(response.data, 'success');
                        this.hideLoading($form, $submitBtn, $resetBtn);
                    } else {
                        this.showMessage(response.data, 'error');
                        this.hideLoading($form, $submitBtn, $resetBtn);
                    }
                },
                error: (xhr, status, error) => {
                    this.showMessage('Network error occurred. Please try again.', 'error');
                    this.hideLoading($form, $submitBtn, $resetBtn);
                }
            });
        }

        handleReset(e) {
            e.preventDefault();
            
            if (!confirm('Are you sure you want to reset all settings for this tab? This action cannot be undone.')) {
                return;
            }
            
            const $form = $(e.target).closest('form');
            const tab = $form.find('input[name="tab"]').val();
            
            // Reset form fields to default values
            this.resetTabSettings(tab, $form);
            
            this.showMessage('Settings have been reset to default values.', 'success');
        }

        resetTabSettings(tab, $form) {
            // Define default values for each tab
            const defaults = {
                general: {
                    site_title: $('input[name="general_settings[site_title]"]').attr('data-default') || '',
                    site_description: $('textarea[name="general_settings[site_description]"]').attr('data-default') || '',
                    admin_email: $('input[name="general_settings[admin_email]"]').attr('data-default') || '',
                    default_currency: 'USD',
                    currency_position: 'left'
                },
                tours: {
                    tours_per_page: 12,
                    show_tour_rating: true
                },
                booking: {
                    enable_booking: true,
                    booking_advance_days: 30
                },
                payment: {
                    stripe_enabled: false,
                    paypal_enabled: false
                },
                emails: {
                    booking_confirmation: true,
                    admin_notifications: true
                },
                design: {
                    primary_color: '#0073aa',
                    enable_custom_css: false
                },
                advanced: {
                    debug_mode: false,
                    cache_enabled: true
                }
            };
            
            const tabDefaults = defaults[tab] || {};
            
            // Apply defaults to form fields
            Object.keys(tabDefaults).forEach(key => {
                const $field = $form.find(`[name="${tab}_settings[${key}]"]`);
                if ($field.length) {
                    if ($field.attr('type') === 'checkbox') {
                        $field.prop('checked', tabDefaults[key]);
                    } else {
                        $field.val(tabDefaults[key]);
                    }
                }
            });
        }

        handleTabChange(e) {
            const $link = $(e.currentTarget);
            const href = $link.attr('href');
            
            // Update active state
            $('.yatra-new-settings-nav-item').removeClass('active');
            $link.addClass('active');
            
            // Navigate to new tab
            window.location.href = href;
        }

        showLoading($form, $submitBtn, $resetBtn) {
            $form.addClass('yatra-new-settings-loading');
            $submitBtn.prop('disabled', true);
            $resetBtn.prop('disabled', true);
            $submitBtn.text(yatraNewSettings.strings.saving);
        }

        hideLoading($form, $submitBtn, $resetBtn) {
            $form.removeClass('yatra-new-settings-loading');
            $submitBtn.prop('disabled', false);
            $resetBtn.prop('disabled', false);
            $submitBtn.html('<span class="dashicons dashicons-saved"></span>' + yatraNewSettings.strings.saved);
            
            // Reset button text after 3 seconds
            setTimeout(() => {
                $submitBtn.html('<span class="dashicons dashicons-saved"></span>Save Settings');
            }, 3000);
        }

        showMessage(message, type = 'success') {
            // Remove existing messages
            $('.yatra-new-settings-message').remove();
            
            // Create new message
            const icon = type === 'success' ? 'dashicons-yes-alt' : 'dashicons-warning';
            const messageHtml = `
                <div class="yatra-new-settings-message ${type}">
                    <span class="dashicons ${icon}"></span>
                    <span>${message}</span>
                </div>
            `;
            
            // Insert message after header
            $('.yatra-new-settings-content-header').after(messageHtml);
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    $('.yatra-new-settings-message.success').fadeOut();
                }, 5000);
            }
        }

        initTooltips() {
            // Add tooltips to form fields
            $('.yatra-new-settings-field').each(function() {
                const $field = $(this);
                const $label = $field.find('label');
                const description = $field.find('.description').text();
                
                if (description) {
                    $label.attr('title', description);
                    $label.css('cursor', 'help');
                }
            });
        }

        initColorPickers() {
            // Initialize color picker fields
            $('input[type="color"]').each(function() {
                const $field = $(this);
                const $container = $field.closest('.yatra-new-settings-field');
                
                // Add color preview
                const $preview = $('<div class="color-preview"></div>');
                $preview.css({
                    'display': 'inline-block',
                    'width': '24px',
                    'height': '24px',
                    'border-radius': '4px',
                    'border': '2px solid #e9ecef',
                    'margin-left': '10px',
                    'vertical-align': 'middle'
                });
                
                $field.after($preview);
                
                // Update preview on change
                $field.on('input change', function() {
                    $preview.css('background-color', $field.val());
                });
                
                // Set initial preview
                $preview.css('background-color', $field.val());
            });
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        new YatraNewSettings();
    });

    // Export for global access
    window.YatraNewSettings = YatraNewSettings;

})(jQuery);
