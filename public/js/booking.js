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
        // Use global currency from settings (prioritize yatraBookingData which uses global currency)
        const currency = window.yatraBookingData?.currency || $('input[name="currency"]').val() || 'USD';
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
            // Check if we have category-based pricing (dropdown style)
            const categoryInputs = $('.yatra-qty-input[data-category-id]');
            if (categoryInputs.length > 0) {
                let total = 0;
                categoryInputs.each(function() {
                    total += parseInt($(this).val()) || 0;
                });
                return total || 1;
            }
            
            // Fallback to simple number input or traveler forms
            const simpleInput = $('#number-of-travelers').val();
            if (simpleInput) {
                return parseInt(simpleInput) || 1;
            }
            
            return $('.yatra-traveler-form').length || 1;
        }
        
        /**
         * Check if using traveler-based pricing
         */
        function isTravelerBasedPricing() {
            return $('.yatra-summary-pricing').data('pricing-type') === 'traveler_based';
        }
        
        /**
         * Calculate total for traveler-based pricing
         */
        function calculateTravelerBasedTotal() {
            let total = 0;
            $('.yatra-qty-input[data-category-id]').each(function() {
                const count = parseInt($(this).val()) || 0;
                const price = parseFloat($(this).data('price')) || 0;
                total += count * price;
            });
            return total;
        }

        /**
         * Update booking summary prices
         */
        function updateBookingSummary() {
            let total = 0;
            let travelers = 0;
            
            if (isTravelerBasedPricing()) {
                // Traveler-based pricing: sum up category prices
                total = calculateTravelerBasedTotal();
                travelers = getTravelerCount();
                
                // Update category breakdown
                $('#price-breakdown-categories').empty();
                $('.yatra-qty-input[data-category-id]').each(function() {
                    const count = parseInt($(this).val()) || 0;
                    const price = parseFloat($(this).data('price')) || 0;
                    const categoryId = $(this).data('category-id');
                    const quantityRow = $(this).closest('.yatra-quantity-row');
                    const categoryLabel = quantityRow.find('.yatra-quantity-title').text();
                    
                    if (count > 0) {
                        const subtotal = count * price;
                        $('#price-breakdown-categories').append(
                            `<div class="yatra-price-row yatra-category-subtotal" data-category-id="${categoryId}">
                                <span>${categoryLabel} x <span class="category-count">${count}</span></span>
                                <span class="category-subtotal">${formatCurrency(subtotal, currency)}</span>
                            </div>`
                        );
                    }
                });
                
                // Update the dropdown display text
                updateTravelersDisplayText();
            } else {
                // Regular pricing
                travelers = getTravelerCount();
                total = pricePerPerson * travelers;
                $('#summary-travelers').text(travelers);
                
                // Update display for regular pricing
                updateRegularTravelersDisplayText(travelers);
            }
            
            const paymentMethod = $('input[name="payment_method"]:checked').val() || 'full';
            const selectedGateway = $('input[name="payment_gateway"]:checked').val() || 'pay_later';
            
            let dueNow = total;
            if (paymentMethod === 'deposit') {
                dueNow = total * (depositPercentage / 100);
            } else if (paymentMethod === 'partial') {
                dueNow = total * (partialPercentage / 100);
            }

            // Update UI
            $('#summary-total').html('<strong>' + formatCurrency(total, currency) + '</strong>');
            $('#summary-due strong').text(formatCurrency(dueNow, currency));
            $('#pay-amount').text(formatCurrency(dueNow, currency));
            
            if ($form && $form.length) {
                $form.data('paymentDue', dueNow);
                $form.attr('data-payment-due', dueNow);
            }
            window.yatraBookingData = window.yatraBookingData || {};
            window.yatraBookingData.paymentDue = dueNow;

            // Update deposit display
            if ($('.yatra-price-deposit').length) {
                $('#summary-deposit').text(formatCurrency(total * (depositPercentage / 100), currency));
            }
            
            // Update button text based on gateway
            updateButtonText(selectedGateway, dueNow);
        }
        
        /**
         * Update the dropdown display text for traveler-based pricing
         */
        function updateTravelersDisplayText() {
            const parts = [];
            $('.yatra-qty-input[data-category-id]').each(function() {
                const count = parseInt($(this).val()) || 0;
                const categoryLabel = $(this).closest('.yatra-quantity-row').find('.yatra-quantity-title').text();
                if (count > 0) {
                    parts.push(categoryLabel + ' x ' + count);
                }
            });
            const displayText = parts.length > 0 ? parts.join(', ') : 'Select travelers';
            $('#yatra-travelers-display').text(displayText);
        }
        
        /**
         * Update display text for regular pricing
         */
        function updateRegularTravelersDisplayText(count) {
            const label = count === 1 ? 'traveler' : 'travelers';
            $('#yatra-travelers-display-regular').text(count + ' ' + label);
        }

        /**
         * Format currency
         */
        function formatCurrency(amount, currencyCode) {
            // Get currency formatting settings from global settings
            const currencyPosition = window.yatraBookingData?.currencyPosition || 'before';
            const decimalPlaces = window.yatraBookingData?.decimalPlaces || 2;
            const thousandSeparator = window.yatraBookingData?.thousandSeparator || ',';
            const decimalSeparator = window.yatraBookingData?.decimalSeparator || '.';
            
            // Currency symbols matching PHP yatra_get_currency_symbol function
            const symbols = {
                'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
                'INR': '₹', 'NPR': 'Rs', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF',
                'NZD': 'NZ$', 'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'THB': '฿',
                'MYR': 'RM', 'PHP': '₱', 'IDR': 'Rp', 'VND': '₫', 'BRL': 'R$',
                'MXN': 'MX$', 'RUB': '₽', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': '﷼',
                'TRY': '₺', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł',
                'CZK': 'Kč', 'HUF': 'Ft', 'ILS': '₪', 'TWD': 'NT$', 'PKR': '₨',
                'BDT': '৳', 'LKR': 'Rs', 'EGP': 'E£', 'NGN': '₦', 'KES': 'KSh',
                'GHS': 'GH₵', 'ARS': 'AR$', 'CLP': 'CL$', 'COP': 'CO$', 'PEN': 'S/'
            };
            
            const symbol = symbols[currencyCode?.toUpperCase()] || (currencyCode ? currencyCode + ' ' : '');
            
            // Format amount with proper separators
            // First format with standard separators, then replace with custom ones
            const tempFormatted = amount.toLocaleString('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            });
            // Replace thousand separator
            const formattedAmount = tempFormatted
                .split(',').join('__THOUSAND__')
                .split('.').join('__DECIMAL__')
                .replace(/__THOUSAND__/g, thousandSeparator)
                .replace(/__DECIMAL__/g, decimalSeparator);
            
            // Position currency based on settings (before or after)
            if (currencyPosition === 'right' || currencyPosition === 'after') {
                return formattedAmount + ' ' + symbol;
            }
            
            return symbol + ' ' + formattedAmount;
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
        
        // Dropdown toggle for traveler selector
        $(document).on('click', '.yatra-booking-participants-select', function(e) {
            // Don't toggle if clicking on buttons or inputs inside
            if ($(e.target).closest('.yatra-qty-btn, .yatra-qty-input, .yatra-quantity-controls').length) {
                return;
            }
            
            const $select = $(this);
            const wasActive = $select.hasClass('active');
            
            // Close all dropdowns first
            $('.yatra-booking-participants-select').removeClass('active');
            
            // Toggle this one
            if (!wasActive) {
                $select.addClass('active');
            }
        });
        
        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.yatra-booking-participants-select').length) {
                $('.yatra-booking-participants-select').removeClass('active');
            }
        });

        // Quantity selector for regular pricing (dropdown style)
        $(document).on('click', '.yatra-qty-btn[data-field="travelers"]', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $btn = $(this);
            const $input = $('#number-of-travelers');
            let currentValue = parseInt($input.val()) || 1;
            const min = parseInt($input.attr('min')) || 1;
            const max = parseInt($input.attr('max')) || 20;

            if ($btn.hasClass('yatra-qty-plus')) {
                if (currentValue < max) {
                    currentValue++;
                    addTravelerForm(currentValue);
                }
            } else if ($btn.hasClass('yatra-qty-minus')) {
                if (currentValue > min) {
                    removeTravelerForm(currentValue);
                    currentValue--;
                }
            }

            $input.val(currentValue);
            
            // Update button disabled states
            $btn.closest('.yatra-quantity-controls').find('.yatra-qty-minus').prop('disabled', currentValue <= min);
            $btn.closest('.yatra-quantity-controls').find('.yatra-qty-plus').prop('disabled', currentValue >= max);
            
            updateBookingSummary();
            updateBookingSession();
        });
        
        // Quantity selector for traveler-based category pricing (dropdown style)
        $(document).on('click', '.yatra-qty-btn[data-category]', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $btn = $(this);
            const $row = $btn.closest('.yatra-quantity-row');
            const $input = $row.find('.yatra-qty-input');
            let currentValue = parseInt($input.val()) || 0;
            const min = parseInt($input.attr('min')) || 0;
            const max = parseInt($input.attr('max')) || 20;

            if ($btn.hasClass('yatra-qty-plus')) {
                if (currentValue < max) {
                    currentValue++;
                }
            } else if ($btn.hasClass('yatra-qty-minus')) {
                if (currentValue > min) {
                    currentValue--;
                }
            }

            $input.val(currentValue);
            
            // Update button disabled states
            $row.find('.yatra-qty-minus').prop('disabled', currentValue <= min);
            $row.find('.yatra-qty-plus').prop('disabled', currentValue >= max);
            
            // Update traveler forms based on total count
            updateTravelerFormsForCategories();
            
            // Update travelers display text immediately
            updateTravelersDisplayText();

            
            updateBookingSummary();
            updateBookingSession();
        });
        
        /**
         * Update traveler forms based on category selections
         */
        function updateTravelerFormsForCategories() {
            const targetCount = getTravelerCount();
            const currentFormCount = $('.yatra-traveler-form').length;
            
            if (targetCount > currentFormCount) {
                // Add forms
                for (let i = currentFormCount + 1; i <= targetCount; i++) {
                    addTravelerForm(i);
                }
            } else if (targetCount < currentFormCount && targetCount > 0) {
                // Remove forms
                for (let i = currentFormCount; i > targetCount; i--) {
                    removeTravelerForm(i);
                }
            }
        }
        
        /**
         * Update booking session with new traveler counts
         * This ensures checkout/confirmation reflects the updated travelers
         */
        function updateBookingSession() {
            const sessionPayload = {
                travelers: getTravelerCount()
            };
            
            // Add traveler_counts for category-based pricing
            if (isTravelerBasedPricing()) {
                const travelerCounts = {};
                $('.yatra-qty-input[data-category-id]').each(function() {
                    const categoryId = $(this).data('category-id');
                    const count = parseInt($(this).val()) || 0;
                    if (categoryId !== undefined) {
                        travelerCounts[categoryId] = count;
                    }
                });
                sessionPayload.traveler_counts = travelerCounts;
            }
            
            // Update session via REST API
            fetch(apiUrl + '/booking/session', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify(sessionPayload)
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.warn('Failed to update booking session:', data.message);
                }
            })
            .catch(error => {
                console.error('Error updating booking session:', error);
            });
        }

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

            // Toggle gateway-specific content containers
            $('.yatra-gateway-extra').removeClass('active');
            const $gatewayExtra = $('#yatra-gateway-extra-' + gateway);
            if ($gatewayExtra.length) {
                $gatewayExtra.addClass('active');
            }
        });

        // Ensure default-selected gateway shows its content on load
        const $defaultGateway = $('input[name="payment_gateway"]:checked');
        if ($defaultGateway.length) {
            $defaultGateway.trigger('change');
        }

        // Form submission - using FormData API
        $form.on('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }

            const originalBtnHtml = $submitBtn.html();
            
            // Collect form data using FormData API
            const formData = new FormData(this);
            
            // Convert to structured object
            const bookingData = formDataToObject(formData);
            
            // Add checkbox values explicitly (unchecked checkboxes aren't in FormData)
            bookingData.accept_terms = $('input[name="accept_terms"]').is(':checked');
            bookingData.accept_privacy = $('input[name="accept_privacy"]').is(':checked');
            bookingData.subscribe_newsletter = $('input[name="subscribe_newsletter"]').is(':checked');
            bookingData.payment_due = parseFloat($form.attr('data-payment-due')) || window.yatraBookingData?.paymentDue || null;
            bookingData.currency = window.yatraBookingData?.currency || bookingData.currency || $('input[name="currency"]').val() || 'USD';

            // Allow payment gateways (e.g., Stripe) to intercept submission
            const beforeSubmitEvent = new CustomEvent('yatraBeforeBookingSubmit', {
                detail: {
                    form: this,
                    bookingData,
                    submitButton: $submitBtn[0],
                    originalBtnHtml
                },
                cancelable: true
            });

            const handledByGateway = !document.dispatchEvent(beforeSubmitEvent);
            if (handledByGateway) {
                return;
            }

            // Show loading state for default gateways
            $submitBtn.prop('disabled', true).html(
                '<svg class="animate-spin" style="display: inline-block; width: 20px; height: 20px; margin-right: 8px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle></svg>' +
                '<span>Processing...</span>'
            );

            // For other payment gateways, submit normally
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
        
        // =====================
        // Coupon Handling
        // =====================
        
        let appliedCoupon = null;
        
        // Toggle coupon form visibility
        $('#yatra-coupon-toggle-btn').on('click', function() {
            const $form = $('#yatra-coupon-form');
            const $chevron = $(this).find('.yatra-coupon-chevron');
            
            $form.slideToggle(200);
            $chevron.toggleClass('rotated');
        });
        
        // Apply coupon
        $('#yatra-apply-coupon').on('click', function() {
            applyCoupon();
        });
        
        // Apply coupon on Enter key
        $('#yatra-coupon-code').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                applyCoupon();
            }
        });
        
        // Remove coupon
        $('#yatra-remove-coupon').on('click', function() {
            removeCoupon();
        });

        function applyCoupon() {
            const code = $('#yatra-coupon-code').val().trim().toUpperCase();
            const $btn = $('#yatra-apply-coupon');
            const $message = $('#yatra-coupon-message');
            
            if (!code) {
                showCouponMessage('Please enter a coupon code.', 'error');
                return;
            }
            
            // Show loading state
            $btn.prop('disabled', true).text('Applying...');
            $message.hide();
            
            fetch(apiUrl + '/booking/coupon/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify({ code: code })
            })
            .then(response => response.json())
            .then(response => {
                $btn.prop('disabled', false).text('Apply');
                
                if (response.success) {
                    appliedCoupon = response.data;
                    
                    // Hide the form and show applied coupon
                    $('#yatra-coupon-form').hide();
                    $('#yatra-coupon-toggle-btn').hide();
                    
                    // Show applied coupon display
                    const $applied = $('#yatra-applied-coupon');
                    $applied.find('.yatra-coupon-code-display').text(response.data.code);
                    $applied.find('.yatra-coupon-discount').text('-' + response.data.discount_formatted);
                    $applied.show();
                    
                    // Update price display
                    updatePriceWithDiscount(response.data);
                    
                    showCouponMessage(response.message, 'success');
                } else {
                    showCouponMessage(response.message || 'Invalid coupon code.', 'error');
                }
            })
            .catch(error => {
                console.error('Coupon error:', error);
                $btn.prop('disabled', false).text('Apply');
                showCouponMessage('An error occurred. Please try again.', 'error');
            });
        }
        
        function removeCoupon() {
            const $btn = $('#yatra-remove-coupon');
            
            $btn.prop('disabled', true);
            
            fetch(apiUrl + '/booking/coupon/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify({})
            })
            .then(response => response.json())
            .then(response => {
                $btn.prop('disabled', false);
                
                if (response.success) {
                    appliedCoupon = null;
                    
                    // Hide applied coupon and show toggle button
                    $('#yatra-applied-coupon').hide();
                    $('#yatra-coupon-toggle-btn').show();
                    $('#yatra-coupon-code').val('');
                    $('#yatra-coupon-message').hide();
                    
                    // Hide discount rows
                    $('#yatra-discount-row, #yatra-discount-row-regular').hide();
                    
                    // Update the summary
                    updateBookingSummary();
                }
            })
            .catch(error => {
                console.error('Remove coupon error:', error);
                $btn.prop('disabled', false);
            });
        }
        
        function showCouponMessage(message, type) {
            const $message = $('#yatra-coupon-message');
            $message.removeClass('success error').addClass(type);
            $message.text(message).show();
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => $message.fadeOut(), 3000);
            }
        }
        
        function updatePriceWithDiscount(couponData) {
            const discountAmount = parseFloat(couponData.discount_amount) || 0;
            const discountFormatted = couponData.discount_formatted || formatCurrency(discountAmount, currency);
            
            // Show discount row
            const $discountRow = isTravelerBasedPricing() ? $('#yatra-discount-row') : $('#yatra-discount-row-regular');
            $discountRow.find('.yatra-discount-code').text('(' + couponData.code + ')');
            $discountRow.find('.yatra-discount-amount').text('-' + discountFormatted);
            $discountRow.show();
            
            // Recalculate and update totals
            updateBookingSummaryWithDiscount();
        }
        
        function updateBookingSummaryWithDiscount() {
            let subtotal = 0;
            
            if (isTravelerBasedPricing()) {
                subtotal = calculateTravelerBasedTotal();
            } else {
                subtotal = pricePerPerson * getTravelerCount();
            }
            
            let discountAmount = 0;
            if (appliedCoupon) {
                discountAmount = parseFloat(appliedCoupon.discount_amount) || 0;
            }
            
            const total = Math.max(0, subtotal - discountAmount);
            
            const paymentMethod = $('input[name="payment_method"]:checked').val() || 'full';
            let dueNow = total;
            if (paymentMethod === 'deposit') {
                dueNow = total * (depositPercentage / 100);
            } else if (paymentMethod === 'partial') {
                dueNow = total * (partialPercentage / 100);
            }
            
            // Update UI
            $('#summary-total').html('<strong>' + formatCurrency(total, currency) + '</strong>');
            $('#summary-due strong').text(formatCurrency(dueNow, currency));
            $('#pay-amount').text(formatCurrency(dueNow, currency));
            
            // Update deposit display
            if ($('.yatra-price-deposit').length) {
                $('#summary-deposit').text(formatCurrency(total * (depositPercentage / 100), currency));
            }
        }
        
        // Override the original updateBookingSummary to include discount
        const originalUpdateBookingSummary = updateBookingSummary;
        updateBookingSummary = function() {
            originalUpdateBookingSummary();
            
            // If we have an applied coupon, recalculate with discount
            if (appliedCoupon) {
                updateBookingSummaryWithDiscount();
            }
        };
        

        /**
         * Load existing coupon from session and display it
         */
        function loadCouponFromSession() {
            fetch(apiUrl + '/booking/session', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(response => {
                if (response.success && response.data && response.data.coupon) {
                    const coupon = response.data.coupon;
                    // Calculate discount formatted if not present
                    const discountFormatted = coupon.discount_formatted || formatCurrency(coupon.discount_amount || 0, currency);
                    
                    appliedCoupon = {
                        code: coupon.code,
                        type: coupon.type,
                        discount_amount: parseFloat(coupon.discount_amount) || 0,
                        discount_formatted: discountFormatted,
                        new_total: coupon.new_total || 0,
                        new_total_formatted: coupon.new_total_formatted || ''
                    };
                    
                    // Hide the form and show applied coupon
                    $('#yatra-coupon-form').hide();
                    $('#yatra-coupon-toggle-btn').hide();
                    
                    // Show applied coupon display
                    const $applied = $('#yatra-applied-coupon');
                    $applied.find('.yatra-coupon-code-display').text(coupon.code);
                    $applied.find('.yatra-coupon-discount').text('-' + appliedCoupon.discount_formatted);
                    $applied.show();
                    
                    // Update price display
                    updatePriceWithDiscount(appliedCoupon);
                }
            })
            .catch(error => {
                console.error('Error loading coupon from session:', error);
            });
        }
        
        /**
         * Check URL for coupon parameter and auto-apply
         */
        function checkUrlForCoupon() {
            const urlParams = new URLSearchParams(window.location.search);
            const couponCode = urlParams.get('coupon');
            
            if (couponCode && couponCode.trim()) {
                // Set the coupon code in the input
                $('#yatra-coupon-code').val(couponCode.trim().toUpperCase());
                
                // Auto-apply the coupon
                applyCoupon();
                
                // Remove coupon parameter from URL without page reload
                urlParams.delete('coupon');
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }
        }
        
        // Check URL for coupon parameter first (takes priority)
        // If URL has coupon, it will be applied and session updated
        // If no URL coupon, load existing coupon from session
        const urlParams = new URLSearchParams(window.location.search);
        const urlCoupon = urlParams.get('coupon');
        
        if (urlCoupon && urlCoupon.trim()) {
            // URL coupon takes priority - apply it
            checkUrlForCoupon();
        } else {
            // No URL coupon - load from session
            loadCouponFromSession();
        }
        
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

    // End of document ready
})(jQuery);
