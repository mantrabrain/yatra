/**
 * Booking Page JavaScript
 * 
 * Uses FormData API to automatically collect all form fields
 * and submit via REST API
 * 
 * @package Yatra
 */

(function($) {
    'use strict';

    // API configuration - available throughout the module
    const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
    const nonce = window.yatraBookingData?.nonce || '';

    $(document).ready(function() {
        const $form = $('#yatra-booking-form');
        const $submitBtn = $('#yatra-submit-booking');
        
        // Get pricing data
        const pricePerPerson = parseFloat($('input[name="trip_price"]').val()) || window.yatraBookingData?.tripPrice || 0;
        const currency = $('input[name="currency"]').val() || window.yatraBookingData?.currency || 'USD';
        const depositPercentage = window.yatraBookingData?.depositPercentage || 20;
        const partialPercentage = window.yatraBookingData?.partialPercentage || 30;

        // Country options for dynamically added travelers
        const countryOptions = generateCountryOptions();

        /**
         * Generate country select options HTML
         */
        function generateCountryOptions() {
            const countries = {
                'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AR': 'Argentina',
                'AU': 'Australia', 'AT': 'Austria', 'BD': 'Bangladesh', 'BE': 'Belgium',
                'BR': 'Brazil', 'BT': 'Bhutan', 'CA': 'Canada', 'CN': 'China',
                'CO': 'Colombia', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EG': 'Egypt',
                'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
                'HK': 'Hong Kong', 'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India',
                'ID': 'Indonesia', 'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy',
                'JP': 'Japan', 'KE': 'Kenya', 'KR': 'South Korea', 'MY': 'Malaysia',
                'MV': 'Maldives', 'MX': 'Mexico', 'NL': 'Netherlands', 'NZ': 'New Zealand',
                'NP': 'Nepal', 'NO': 'Norway', 'PK': 'Pakistan', 'PE': 'Peru',
                'PH': 'Philippines', 'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania',
                'RU': 'Russia', 'SA': 'Saudi Arabia', 'SG': 'Singapore', 'ZA': 'South Africa',
                'ES': 'Spain', 'LK': 'Sri Lanka', 'SE': 'Sweden', 'CH': 'Switzerland',
                'TW': 'Taiwan', 'TH': 'Thailand', 'TR': 'Turkey', 'AE': 'United Arab Emirates',
                'GB': 'United Kingdom', 'US': 'United States', 'VN': 'Vietnam'
            };
            
            let options = '<option value="">Select Country</option>';
            for (const [code, name] of Object.entries(countries)) {
                options += `<option value="${code}">${name}</option>`;
            }
            return options;
        }

        /**
         * Get current traveler count
         */
        function getTravelerCount() {
            return $('.yatra-traveler-form').length || 1;
        }

        /**
         * Update booking summary prices
         */
        function updateBookingSummary() {
            const travelers = getTravelerCount();
            const total = pricePerPerson * travelers;
            const paymentMethod = $('input[name="payment_method"]:checked').val() || 'full';
            const selectedGateway = $('input[name="payment_gateway"]:checked').val() || 'pay_later';
            
            let dueNow = total;
            if (paymentMethod === 'deposit') {
                dueNow = total * (depositPercentage / 100);
            } else if (paymentMethod === 'partial') {
                dueNow = total * (partialPercentage / 100);
            }

            // Update UI
            $('#summary-travelers').text(travelers);
            $('#summary-total').html('<strong>' + formatCurrency(total, currency) + '</strong>');
            $('#summary-due strong').text(formatCurrency(dueNow, currency));
            $('#pay-amount').text(formatCurrency(dueNow, currency));
            
            // Update button text based on gateway
            updateButtonText(selectedGateway, dueNow);
        }

        /**
         * Format currency
         */
        function formatCurrency(amount, currencyCode) {
            const symbols = {
                'USD': '$', 'EUR': '€', 'GBP': '£', 'NPR': 'Rs.', 'INR': '₹',
                'AUD': 'A$', 'CAD': 'C$', 'JPY': '¥', 'CNY': '¥'
            };
            const symbol = symbols[currencyCode] || currencyCode + ' ';
            return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        /**
         * Update button text based on selected gateway
         */
        function updateButtonText(gateway, amount) {
            const $buttonText = $('#pay-button-text');
            const $payAmount = $('#pay-amount');
            
            // Check if it's an offline gateway
            const offlineGateways = ['pay_later', 'bank_transfer'];
            const isOffline = offlineGateways.includes(gateway);
            
            if (isOffline) {
                $buttonText.text('Complete Booking');
                $payAmount.hide();
            } else {
                $buttonText.text('Pay Now');
                $payAmount.show();
            }
        }

        /**
         * Add a new traveler form dynamically
         */
        function addTravelerForm(index) {
            const $container = $('#yatra-travelers-container');
            
            // Get field configuration from the first traveler form
            const $firstTraveler = $container.find('.yatra-traveler-form').first();
            if (!$firstTraveler.length) return;
            
            // Clone the first traveler form
            const $newTraveler = $firstTraveler.clone();
            
            // Update index references
            $newTraveler.attr('data-traveler-index', index);
            $newTraveler.find('.yatra-traveler-title').text('Traveler ' + index);
            
            // Add "Additional traveler" note
            if (!$newTraveler.find('.yatra-traveler-note').length) {
                $newTraveler.find('.yatra-traveler-header').append('<span class="yatra-traveler-note">Additional traveler</span>');
            }
            
            // Update all field IDs and names
            $newTraveler.find('input, select, textarea').each(function() {
                const $field = $(this);
                const oldId = $field.attr('id');
                const oldName = $field.attr('name');
                
                if (oldId) {
                    // Replace traveler-1- with traveler-{index}-
                    const newId = oldId.replace(/traveler-\d+-/, 'traveler-' + index + '-');
                    $field.attr('id', newId);
                }
                
                if (oldName) {
                    // Replace travelers[1] with travelers[{index}]
                    const newName = oldName.replace(/travelers\[\d+\]/, 'travelers[' + index + ']');
                    $field.attr('name', newName);
                }
                
                // Clear values
                $field.val('');
                $field.removeClass('error');
            });
            
            // Update associated labels
            $newTraveler.find('label').each(function() {
                const $label = $(this);
                const forAttr = $label.attr('for');
                if (forAttr) {
                    const newFor = forAttr.replace(/traveler-\d+-/, 'traveler-' + index + '-');
                    $label.attr('for', newFor);
                }
            });
            
            $container.append($newTraveler);
        }

        /**
         * Remove the last traveler form
         */
        function removeTravelerForm(index) {
            const $container = $('#yatra-travelers-container');
            $container.find(`.yatra-traveler-form[data-traveler-index="${index}"]`).remove();
        }

        /**
         * Convert FormData to nested object structure
         */
        function formDataToObject(formData) {
            const obj = {};
            
            for (const [key, value] of formData.entries()) {
                // Handle array notation like travelers[1][first_name]
                const matches = key.match(/^([^\[]+)(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?$/);
                
                if (matches) {
                    const [, base, index, field] = matches;
                    
                    if (index !== undefined && field !== undefined) {
                        // Array of objects: travelers[1][first_name]
                        if (!obj[base]) obj[base] = {};
                        if (!obj[base][index]) obj[base][index] = {};
                        obj[base][index][field] = value;
                    } else if (index !== undefined) {
                        // Simple array: items[0]
                        if (!obj[base]) obj[base] = [];
                        obj[base][index] = value;
                    } else {
                        // Simple key
                        obj[key] = value;
                    }
                } else {
                    obj[key] = value;
                }
            }
            
            // Convert travelers object to array
            if (obj.travelers && typeof obj.travelers === 'object') {
                obj.travelers = Object.values(obj.travelers);
            }
            
            return obj;
        }

        /**
         * Validate form before submission
         */
        function validateForm() {
            let isValid = true;
            const errors = [];
            
            // Remove previous error states
            $form.find('.error').removeClass('error');
            $('.yatra-form-error').remove();
            
            // Validate all required fields
            $form.find('input[required], select[required], textarea[required]').each(function() {
                const $field = $(this);
                const value = $field.val();
                
                if (!value || value.trim() === '') {
                    isValid = false;
                    $field.addClass('error');
                    const label = $field.closest('.yatra-form-group').find('label').text().replace('*', '').trim();
                    errors.push(label + ' is required');
                }
            });
            
            // Validate email format
            const emailFields = $form.find('input[type="email"]');
            emailFields.each(function() {
                const $field = $(this);
                const value = $field.val();
                if (value && !isValidEmail(value)) {
                    isValid = false;
                    $field.addClass('error');
                    errors.push('Please enter a valid email address');
                }
            });
            
            // Validate terms checkbox
            if (!$('input[name="accept_terms"]').is(':checked')) {
                isValid = false;
                errors.push('Please accept the Terms and Conditions');
            }
            
            // Validate privacy checkbox
            if (!$('input[name="accept_privacy"]').is(':checked')) {
                isValid = false;
                errors.push('Please accept the Privacy Policy');
            }
            
            if (!isValid && errors.length > 0) {
                showFormError(errors[0]);
            }
            
            return isValid;
        }

        /**
         * Validate email format
         */
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        /**
         * Show form error message
         */
        function showFormError(message) {
            // Remove any existing error
            $('.yatra-form-error').remove();
            
            const $error = $('<div class="yatra-form-error" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">' +
                '<svg style="display: inline-block; vertical-align: middle; margin-right: 8px; width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' +
                '<span style="vertical-align: middle;">' + message + '</span>' +
                '</div>');
            
            $form.find('.yatra-booking-form-content').prepend($error);
            
            // Scroll to error
            $('html, body').animate({
                scrollTop: $error.offset().top - 100
            }, 300);
        }

        /**
         * Show success message
         */
        function showSuccessMessage(message, reference) {
            const $success = $('<div class="yatra-booking-success" style="text-align: center; padding: 60px 20px;">' +
                '<svg style="width: 80px; height: 80px; color: #22c55e; margin-bottom: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10"></circle><polyline points="9,12 12,15 16,10"></polyline></svg>' +
                '<h2 style="font-size: 28px; margin-bottom: 12px; color: #111827;">Booking Confirmed!</h2>' +
                '<p style="font-size: 18px; color: #6b7280; margin-bottom: 8px;">' + message + '</p>' +
                '<p style="font-size: 16px; color: #111827; font-weight: 600;">Reference: ' + reference + '</p>' +
                '<p style="margin-top: 24px; color: #6b7280;">A confirmation email has been sent to your email address.</p>' +
                '</div>');
            
            $form.html($success);
        }

        // =====================
        // Event Handlers
        // =====================

        // Quantity selector - add/remove traveler forms dynamically
        $('.yatra-quantity-btn').on('click', function() {
            const $btn = $(this);
            const $input = $('#number-of-travelers');
            let currentValue = parseInt($input.val()) || 1;
            const min = parseInt($input.attr('min')) || 1;
            const max = parseInt($input.attr('max')) || 20;

            if ($btn.hasClass('plus')) {
                if (currentValue < max) {
                    currentValue++;
                    addTravelerForm(currentValue);
                }
            } else if ($btn.hasClass('minus')) {
                if (currentValue > min) {
                    removeTravelerForm(currentValue);
                    currentValue--;
                }
            }

            $input.val(currentValue);
            updateBookingSummary();
        });

        // Update summary when payment method changes
        $('input[name="payment_method"]').on('change', function() {
            updateBookingSummary();
        });

        // Update when gateway changes
        $('input[name="payment_gateway"]').on('change', function() {
            updateBookingSummary();
            
            // Show gateway-specific info
            const gateway = $(this).val();
            const $gatewayInfo = $('#yatra-gateway-info');
            const $gatewayDetails = $('#yatra-gateway-details');
            
            const gatewayMessages = {
                'pay_later': '<p>Your booking will be reserved. Full payment is required before the trip date.</p>',
                'bank_transfer': '<p>After completing your booking, you will receive bank details via email. Your booking will be confirmed once payment is received.</p>',
                'stripe': '<p>You will be securely redirected to complete your payment with credit or debit card.</p>',
                'paypal': '<p>You will be redirected to PayPal to complete your payment securely.</p>',
                'razorpay': '<p>You will be redirected to Razorpay to complete your payment.</p>',
                'esewa': '<p>You will be redirected to eSewa to complete your payment.</p>',
                'khalti': '<p>You will be redirected to Khalti to complete your payment.</p>',
            };
            
            if (gatewayMessages[gateway] && $gatewayDetails.length) {
                $gatewayDetails.html(gatewayMessages[gateway]);
                $gatewayInfo.show();
            } else if ($gatewayInfo.length) {
                $gatewayInfo.hide();
            }
        });

        // Form submission - using FormData API
        $form.on('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            // Show loading state
            const originalBtnHtml = $submitBtn.html();
            $submitBtn.prop('disabled', true).html(
                '<svg class="animate-spin" style="display: inline-block; width: 20px; height: 20px; margin-right: 8px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle></svg>' +
                '<span>Processing...</span>'
            );
            
            // Collect form data using FormData API
            const formData = new FormData(this);
            
            // Convert to structured object
            const bookingData = formDataToObject(formData);
            
            // Add checkbox values explicitly (unchecked checkboxes aren't in FormData)
            bookingData.accept_terms = $('input[name="accept_terms"]').is(':checked');
            bookingData.accept_privacy = $('input[name="accept_privacy"]').is(':checked');
            bookingData.subscribe_newsletter = $('input[name="subscribe_newsletter"]').is(':checked');
            
            // Submit via REST API
            fetch(apiUrl + '/booking/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify(bookingData)
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    if (response.data && response.data.payment_url) {
                        // Redirect to payment gateway
                        window.location.href = response.data.payment_url;
                    } else if (response.data && response.data.redirect_url) {
                        // Redirect to confirmation page
                        window.location.href = response.data.redirect_url;
                    } else {
                        // Show success message inline
                        const reference = response.data?.reference || 'N/A';
                        showSuccessMessage(response.message || 'Your booking has been confirmed!', reference);
                    }
                } else {
                    showFormError(response.message || 'An error occurred. Please try again.');
                    $submitBtn.prop('disabled', false).html(originalBtnHtml);
                }
            })
            .catch(error => {
                console.error('Booking error:', error);
                showFormError('Network error. Please check your connection and try again.');
                $submitBtn.prop('disabled', false).html(originalBtnHtml);
            });
        });

        // Set minimum date to today for travel date
        const today = new Date().toISOString().split('T')[0];
        $('input[name="travel_date"], #travel-date').attr('min', today);
        
        // Initial update
        updateBookingSummary();
        
        // Trigger gateway change to show initial info
        $('input[name="payment_gateway"]:checked').trigger('change');
    });

    // Add CSS for spinner animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);

    // =====================
    // Auth Forms (Login/Register)
    // =====================
    
    // Tab switching
    $(document).on('click', '.yatra-auth-tab, .yatra-switch-tab', function() {
        const tab = $(this).data('tab');
        
        // Update tabs
        $('.yatra-auth-tab').removeClass('active');
        $(`.yatra-auth-tab[data-tab="${tab}"]`).addClass('active');
        
        // Update content
        $('.yatra-auth-content').hide();
        $(`#yatra-auth-${tab}`).show();
    });

    // Toggle password visibility
    $(document).on('click', '.yatra-toggle-password', function() {
        const $input = $(this).parent().find('input');
        const $eyeOpen = $(this).find('.eye-open');
        const $eyeClosed = $(this).find('.eye-closed');
        
        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $eyeOpen.hide();
            $eyeClosed.show();
        } else {
            $input.attr('type', 'password');
            $eyeOpen.show();
            $eyeClosed.hide();
        }
    });

    // Password strength indicator
    $(document).on('input', '#yatra-reg-password', function() {
        const password = $(this).val();
        const $strengthMeter = $('#yatra-password-strength');
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        $strengthMeter.removeClass('weak fair good strong');
        if (password.length > 0) {
            if (strength <= 1) $strengthMeter.addClass('weak');
            else if (strength === 2) $strengthMeter.addClass('fair');
            else if (strength === 3) $strengthMeter.addClass('good');
            else $strengthMeter.addClass('strong');
        }
    });

    // Login form submission via REST API
    $(document).on('submit', '#yatra-login-form', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $btn = $form.find('.yatra-auth-submit');
        const $btnText = $btn.find('.btn-text');
        const $btnLoading = $btn.find('.btn-loading');
        const $messageEl = $('#yatra-login-message');
        
        // Remove any existing resend link
        $('.yatra-resend-verification').remove();
        
        // Show loading
        $btn.prop('disabled', true);
        $btnText.hide();
        $btnLoading.css('display', 'flex');
        $messageEl.hide();
        
        // Prepare data for REST API
        const loginData = {
            username: $('#yatra-login-email').val(),
            password: $('#yatra-login-password').val(),
            remember: $('input[name="rememberme"]').is(':checked')
        };
        
        fetch(apiUrl + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            },
            credentials: 'same-origin',
            body: JSON.stringify(loginData)
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                $messageEl.removeClass('error').addClass('success');
                $messageEl.text(response.message || 'Login successful! Redirecting...');
                $messageEl.show();
                
                // Reload page to show booking form
                setTimeout(function() {
                    window.location.reload();
                }, 1000);
            } else {
                $messageEl.removeClass('success').addClass('error');
                $messageEl.html(response.message || 'Invalid credentials. Please try again.');
                $messageEl.show();
                
                // If email needs verification, show resend option
                if (response.needs_verification && response.email) {
                    const $resendLink = $('<div class="yatra-resend-verification" style="margin-top: 12px; text-align: center;">' +
                        '<span style="color: #6b7280; font-size: 14px;">Didn\'t receive the email? </span>' +
                        '<button type="button" class="yatra-resend-btn" data-email="' + response.email + '" style="background: none; border: none; color: #3b82f6; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline;">Resend verification link</button>' +
                        '</div>');
                    $messageEl.after($resendLink);
                }
                
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            }
        })
        .catch(function() {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text('An error occurred. Please try again.');
            $messageEl.show();
            
            $btn.prop('disabled', false);
            $btnText.show();
            $btnLoading.hide();
        });
    });

    // Resend verification email
    $(document).on('click', '.yatra-resend-btn', function(e) {
        e.preventDefault();
        
        const $btn = $(this);
        const email = $btn.data('email');
        const $messageEl = $('#yatra-login-message');
        
        // Don't allow click if countdown is active
        if ($btn.data('countdown-active')) {
            return;
        }
        
        // Disable button and show loading
        $btn.prop('disabled', true).text('Sending...');
        
        fetch(apiUrl + '/auth/resend-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                $messageEl.removeClass('error').addClass('success');
                $messageEl.text(response.message);
                $messageEl.show();
                $('.yatra-resend-verification').remove();
            } else if (response.rate_limited && response.remaining_seconds) {
                // Start countdown timer
                startResendCountdown($btn, response.remaining_seconds);
                $messageEl.removeClass('success').addClass('error');
                $messageEl.text('Please wait before requesting another email.');
                $messageEl.show();
            } else {
                $messageEl.removeClass('success').addClass('error');
                $messageEl.text(response.message);
                $messageEl.show();
                $btn.prop('disabled', false).text('Resend verification link');
            }
        })
        .catch(function() {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text('An error occurred. Please try again.');
            $messageEl.show();
            $btn.prop('disabled', false).text('Resend verification link');
        });
    });

    // Countdown timer for resend button
    function startResendCountdown($btn, seconds) {
        $btn.data('countdown-active', true);
        $btn.prop('disabled', true);
        
        const updateCountdown = () => {
            if (seconds <= 0) {
                $btn.data('countdown-active', false);
                $btn.prop('disabled', false);
                $btn.html('Resend verification link');
                return;
            }
            
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeStr = mins > 0 
                ? `${mins}:${secs.toString().padStart(2, '0')}` 
                : `${secs}s`;
            
            $btn.html(`<span style="color: #9ca3af;">Resend in </span><span style="color: #3b82f6; font-weight: 700;">${timeStr}</span>`);
            
            seconds--;
            setTimeout(updateCountdown, 1000);
        };
        
        updateCountdown();
    }

    // Registration form submission via REST API
    $(document).on('submit', '#yatra-register-form', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $btn = $form.find('.yatra-auth-submit');
        const $btnText = $btn.find('.btn-text');
        const $btnLoading = $btn.find('.btn-loading');
        const $messageEl = $('#yatra-register-message');
        
        // Validate passwords match
        const password = $('#yatra-reg-password').val();
        const confirmPassword = $('#yatra-reg-confirm-password').val();
        
        if (password !== confirmPassword) {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text('Passwords do not match.');
            $messageEl.show();
            return;
        }
        
        // Show loading
        $btn.prop('disabled', true);
        $btnText.hide();
        $btnLoading.css('display', 'flex');
        $messageEl.hide();
        
        // Prepare data for REST API
        const registerData = {
            first_name: $('#yatra-reg-first-name').val(),
            last_name: $('#yatra-reg-last-name').val(),
            email: $('#yatra-reg-email').val(),
            phone: $('#yatra-reg-phone').val(),
            password: password,
            confirm_password: confirmPassword
        };
        
        fetch(apiUrl + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            },
            credentials: 'same-origin',
            body: JSON.stringify(registerData)
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                $messageEl.removeClass('error').addClass('success');
                $messageEl.text(response.message || 'Account created! Please check your email to verify.');
                $messageEl.show();
                
                // Reset form
                $form[0].reset();
                $('#yatra-password-strength').removeClass('weak fair good strong');
                
                // If verification is required, switch to login tab after a delay
                if (response.require_verification) {
                    $btn.prop('disabled', false);
                    $btnText.show();
                    $btnLoading.hide();
                    
                    // Show message and switch to login tab after 3 seconds
                    setTimeout(function() {
                        // Switch to login tab
                        $('.yatra-auth-tab').removeClass('active');
                        $('.yatra-auth-tab[data-tab="login"]').addClass('active');
                        $('.yatra-auth-content').hide();
                        $('#yatra-auth-login').show();
                        
                        // Show info message on login tab
                        const $loginMessage = $('#yatra-login-message');
                        $loginMessage.removeClass('error').addClass('success');
                        $loginMessage.text('Please check your email and click the verification link, then login here.');
                        $loginMessage.show();
                    }, 3000);
                } else {
                    // Reload page if no verification required (shouldn't happen normally)
                    setTimeout(function() {
                        window.location.reload();
                    }, 1000);
                }
            } else {
                $messageEl.removeClass('success').addClass('error');
                $messageEl.text(response.message || 'Registration failed. Please try again.');
                $messageEl.show();
                
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            }
        })
        .catch(function() {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text('An error occurred. Please try again.');
            $messageEl.show();
            
            $btn.prop('disabled', false);
            $btnText.show();
            $btnLoading.hide();
        });
    });

})(jQuery);
