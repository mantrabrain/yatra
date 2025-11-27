/**
 * Booking Page JavaScript
 * 
 * @package Yatra
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Get price from hidden input
        const pricePerPerson = parseFloat($('input[name="trip_price"]').val()) || 0;
        const currency = $('input[name="currency"]').val() || 'USD';
        const depositPercentage = window.yatraBookingData?.depositPercentage || 20;
        const partialPercentage = window.yatraBookingData?.partialPercentage || 30;

        // Generate initial traveler forms
        const initialTravelers = parseInt($('#number-of-travelers').val()) || 2;
        generateTravelerForms(initialTravelers);

        // Quantity selector
        $('.yatra-quantity-btn').on('click', function() {
            const $btn = $(this);
            const $input = $('#number-of-travelers');
            let currentValue = parseInt($input.val()) || 2;
            const min = parseInt($input.attr('min')) || 1;
            const max = parseInt($input.attr('max')) || 20;

            if ($btn.hasClass('plus')) {
                if (currentValue < max) {
                    currentValue++;
                }
            } else if ($btn.hasClass('minus')) {
                if (currentValue > min) {
                    currentValue--;
                }
            }

            $input.val(currentValue);
            generateTravelerForms(currentValue);
            updateBookingSummary();
        });

        // Generate traveler forms
        function generateTravelerForms(count) {
            const $container = $('#yatra-travelers-container');
            $container.empty();

            for (let i = 1; i <= count; i++) {
                const travelerHtml = `
                    <div class="yatra-traveler-form" data-traveler-index="${i}">
                        <div class="yatra-traveler-header">
                            <h3 class="yatra-traveler-title">Traveler ${i}</h3>
                        </div>
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-first-name">First Name <span class="required">*</span></label>
                                <input type="text" id="traveler-${i}-first-name" name="travelers[${i}][first_name]" required>
                            </div>
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-last-name">Last Name <span class="required">*</span></label>
                                <input type="text" id="traveler-${i}-last-name" name="travelers[${i}][last_name]" required>
                            </div>
                        </div>
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-email">Email Address <span class="required">*</span></label>
                                <input type="email" id="traveler-${i}-email" name="travelers[${i}][email]" required>
                            </div>
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-phone">Phone Number <span class="required">*</span></label>
                                <input type="tel" id="traveler-${i}-phone" name="travelers[${i}][phone]" required>
                            </div>
                        </div>
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-date-of-birth">Date of Birth <span class="required">*</span></label>
                                <input type="date" id="traveler-${i}-date-of-birth" name="travelers[${i}][date_of_birth]" required>
                            </div>
                            <div class="yatra-form-group">
                                <label for="traveler-${i}-gender">Gender</label>
                                <select id="traveler-${i}-gender" name="travelers[${i}][gender]">
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="yatra-form-group">
                            <label for="traveler-${i}-passport">Passport Number</label>
                            <input type="text" id="traveler-${i}-passport" name="travelers[${i}][passport]" placeholder="Optional">
                        </div>
                    </div>
                `;
                $container.append(travelerHtml);
            }
        }

        // Format currency
        function formatCurrency(amount, currencyCode) {
            const symbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'NPR': 'Rs.',
                'INR': '₹',
                'AUD': 'A$',
                'CAD': 'C$',
            };
            const symbol = symbols[currencyCode] || currencyCode + ' ';
            return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Update booking summary when travelers change
        function updateBookingSummary() {
            const travelers = parseInt($('#number-of-travelers').val()) || 1;
            const paymentMethod = $('input[name="payment_method"]:checked').val() || 'full';
            const selectedGateway = $('input[name="payment_gateway"]:checked').val();
            
            let total = pricePerPerson * travelers;
            let dueNow = total;
            
            // Calculate based on payment method
            if (paymentMethod === 'deposit') {
                dueNow = total * (depositPercentage / 100);
                $('.yatra-price-deposit').show();
                $('.yatra-price-due').show();
                $('#summary-deposit').text(formatCurrency(dueNow, currency));
            } else if (paymentMethod === 'partial') {
                dueNow = total * (partialPercentage / 100);
                $('.yatra-price-deposit').hide();
                $('.yatra-price-due').show();
            } else {
                $('.yatra-price-deposit').hide();
                $('.yatra-price-due').hide();
                dueNow = total;
            }

            // Update UI
            $('#summary-travelers').text(travelers);
            $('#summary-total').html('<strong>' + formatCurrency(total, currency) + '</strong>');
            $('#summary-due strong').text(formatCurrency(dueNow, currency));
            $('#pay-amount').text(formatCurrency(dueNow, currency));
            
            // Update button text based on gateway
            updateButtonText(selectedGateway, dueNow);
        }

        // Update button text based on selected gateway
        function updateButtonText(gateway, amount) {
            const $buttonText = $('#pay-button-text');
            const $payAmount = $('#pay-amount');
            
            // Check if it's an offline gateway (pay later, bank transfer)
            const $selectedOption = $('input[name="payment_gateway"]:checked').closest('.yatra-gateway-option');
            const isOffline = $selectedOption.hasClass('yatra-gateway-offline');
            
            if (isOffline) {
                $buttonText.text('Complete Booking');
                $payAmount.hide();
            } else {
                $buttonText.text('Pay Now');
                $payAmount.show();
            }
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
            
            // Define gateway-specific messages
            const gatewayMessages = {
                'pay_later': '<p>Your booking will be reserved. Full payment is required before the trip date.</p>',
                'bank_transfer': '<p>After completing your booking, you will receive bank details via email. Your booking will be confirmed once payment is received.</p>',
                'stripe': '<p>You will be securely redirected to complete your payment with credit or debit card.</p>',
                'paypal': '<p>You will be redirected to PayPal to complete your payment securely.</p>',
                'razorpay': '<p>You will be redirected to Razorpay to complete your payment.</p>',
                'esewa': '<p>You will be redirected to eSewa to complete your payment.</p>',
                'khalti': '<p>You will be redirected to Khalti to complete your payment.</p>',
            };
            
            if (gatewayMessages[gateway]) {
                $gatewayDetails.html(gatewayMessages[gateway]);
                $gatewayInfo.show();
            } else {
                $gatewayInfo.hide();
            }
        });

        // Form submission
        $('#yatra-booking-form').on('submit', function(e) {
            e.preventDefault();
            
            // Validate all traveler forms
            let isValid = true;
            $('.yatra-traveler-form').each(function() {
                const $form = $(this);
                const requiredFields = $form.find('input[required], select[required]');
                requiredFields.each(function() {
                    if (!$(this).val()) {
                        isValid = false;
                        $(this).addClass('error');
                    } else {
                        $(this).removeClass('error');
                    }
                });
            });

            // Check main contact fields
            const mainRequiredFields = $(this).find('.yatra-booking-section').first().find('input[required], select[required]');
            mainRequiredFields.each(function() {
                if (!$(this).val()) {
                    isValid = false;
                    $(this).addClass('error');
                } else {
                    $(this).removeClass('error');
                }
            });

            // Check travel date
            if (!$('#travel-date').val()) {
                isValid = false;
                $('#travel-date').addClass('error');
            } else {
                $('#travel-date').removeClass('error');
            }

            // Check terms
            if (!$('input[name="terms"]').is(':checked')) {
                isValid = false;
                alert('Please accept the Terms and Conditions.');
                return;
            }

            if (!isValid) {
                alert('Please fill in all required fields for all travelers.');
                return;
            }
            
            // Get selected payment gateway
            const paymentGateway = $('input[name="payment_gateway"]:checked').val();
            const $selectedOption = $('input[name="payment_gateway"]:checked').closest('.yatra-gateway-option');
            const isOffline = $selectedOption.hasClass('yatra-gateway-offline');
            
            // Show loading state
            const $submitBtn = $('#yatra-submit-booking');
            const originalBtnHtml = $submitBtn.html();
            $submitBtn.prop('disabled', true).html('<span>Processing...</span>');

            // Prepare form data
            const formData = new FormData(this);
            formData.append('action', 'yatra_create_booking');

            // Collect form data as JSON
            const bookingData = {
                trip_id: parseInt($('input[name="trip_id"]').val()) || 0,
                contact_email: $('#contact-email').val(),
                contact_phone: $('#contact-phone').val(),
                contact_country: $('#contact-country').val(),
                travel_date: $('#travel-date').val(),
                payment_method: $('input[name="payment_method"]:checked').val() || 'full',
                payment_gateway: paymentGateway,
                special_requests: $('#special-requests').val(),
                travelers: []
            };

            // Collect traveler data
            $('.yatra-traveler-form').each(function(index) {
                const $form = $(this);
                bookingData.travelers.push({
                    first_name: $form.find('input[name$="[first_name]"]').val(),
                    last_name: $form.find('input[name$="[last_name]"]').val(),
                    email: $form.find('input[name$="[email]"]').val(),
                    phone: $form.find('input[name$="[phone]"]').val(),
                    date_of_birth: $form.find('input[name$="[date_of_birth]"]').val(),
                    gender: $form.find('select[name$="[gender]"]').val(),
                    passport: $form.find('input[name$="[passport]"]').val()
                });
            });

            // Submit via REST API
            const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
            
            fetch(apiUrl + '/booking/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.yatraBookingData?.nonce || ''
                },
                body: JSON.stringify(bookingData)
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    if (response.data.payment_url) {
                        // Redirect to payment gateway
                        window.location.href = response.data.payment_url;
                    } else if (response.data.redirect_url) {
                        // Redirect to thank you page
                        window.location.href = response.data.redirect_url;
                    } else {
                        // Show success message
                        alert('Booking created successfully!');
                    }
                } else {
                    alert('Error: ' + (response.message || 'Unknown error occurred'));
                    $submitBtn.prop('disabled', false).html(originalBtnHtml);
                }
            })
            .catch(error => {
                console.error('Booking error:', error);
                alert('Error: An error occurred. Please try again.');
                $submitBtn.prop('disabled', false).html(originalBtnHtml);
            });
        });

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        $('#travel-date').attr('min', today);
        
        // Initial update
        updateBookingSummary();
        
        // Trigger gateway change to show initial info
        $('input[name="payment_gateway"]:checked').trigger('change');
    });

})(jQuery);
