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

        // Traveler forms are now rendered in PHP, no need to generate on load

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
                    // Add a new traveler form
                    addTravelerForm(currentValue);
                }
            } else if ($btn.hasClass('minus')) {
                if (currentValue > min) {
                    // Remove the last traveler form
                    removeTravelerForm(currentValue);
                    currentValue--;
                }
            }

            $input.val(currentValue);
            updateBookingSummary();
        });

        // Add a new traveler form
        function addTravelerForm(index) {
            const $container = $('#yatra-travelers-container');
            const travelerHtml = getTravelerFormHtml(index);
            $container.append(travelerHtml);
        }

        // Remove the last traveler form
        function removeTravelerForm(index) {
            const $container = $('#yatra-travelers-container');
            $container.find(`.yatra-traveler-form[data-traveler-index="${index}"]`).remove();
        }

        // Get HTML for a traveler form
        function getTravelerFormHtml(index) {
            return `
                <div class="yatra-traveler-form" data-traveler-index="${index}">
                    <div class="yatra-traveler-header">
                        <h3 class="yatra-traveler-title">Traveler ${index}</h3>
                        <span class="yatra-traveler-note">Additional traveler</span>
                    </div>
                    
                    <div class="yatra-form-row">
                        <div class="yatra-form-group">
                            <label for="traveler-${index}-first-name">First Name <span class="required">*</span></label>
                            <input type="text" id="traveler-${index}-first-name" name="travelers[${index}][first_name]" required placeholder="As in passport">
                        </div>
                        <div class="yatra-form-group">
                            <label for="traveler-${index}-last-name">Last Name <span class="required">*</span></label>
                            <input type="text" id="traveler-${index}-last-name" name="travelers[${index}][last_name]" required placeholder="As in passport">
                        </div>
                    </div>
                    
                    <div class="yatra-form-row">
                        <div class="yatra-form-group">
                            <label for="traveler-${index}-date-of-birth">Date of Birth <span class="required">*</span></label>
                            <input type="date" id="traveler-${index}-date-of-birth" name="travelers[${index}][date_of_birth]" required>
                        </div>
                        <div class="yatra-form-group">
                            <label for="traveler-${index}-gender">Gender <span class="required">*</span></label>
                            <select id="traveler-${index}-gender" name="travelers[${index}][gender]" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="yatra-form-group">
                        <label for="traveler-${index}-nationality">Nationality <span class="required">*</span></label>
                        <select id="traveler-${index}-nationality" name="travelers[${index}][nationality]" required>
                            ${countryOptions}
                        </select>
                    </div>
                    
                    <div class="yatra-traveler-subsection">
                        <h4 class="yatra-subsection-title">Passport Details</h4>
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="traveler-${index}-passport">Passport Number <span class="required">*</span></label>
                                <input type="text" id="traveler-${index}-passport" name="travelers[${index}][passport]" required placeholder="Enter passport number">
                            </div>
                            <div class="yatra-form-group">
                                <label for="traveler-${index}-passport-expiry">Passport Expiry <span class="required">*</span></label>
                                <input type="date" id="traveler-${index}-passport-expiry" name="travelers[${index}][passport_expiry]" required min="${getMinPassportExpiry()}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="yatra-traveler-subsection">
                        <h4 class="yatra-subsection-title">Dietary & Medical Requirements</h4>
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="traveler-${index}-dietary">Dietary Requirements</label>
                                <select id="traveler-${index}-dietary" name="travelers[${index}][dietary]">
                                    <option value="none">No special requirements</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="halal">Halal</option>
                                    <option value="kosher">Kosher</option>
                                    <option value="gluten_free">Gluten Free</option>
                                    <option value="lactose_free">Lactose Free</option>
                                    <option value="other">Other (specify in notes)</option>
                                </select>
                            </div>
                            <div class="yatra-form-group">
                                <label for="traveler-${index}-medical">Medical Conditions / Allergies</label>
                                <input type="text" id="traveler-${index}-medical" name="travelers[${index}][medical]" placeholder="Any allergies or conditions we should know">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Get minimum passport expiry date (6 months from now)
        function getMinPassportExpiry() {
            const date = new Date();
            date.setMonth(date.getMonth() + 6);
            return date.toISOString().split('T')[0];
        }

        // Country options for traveler nationality
        const countryOptions = `
            <option value="">Select Nationality</option>
            <option value="AF">Afghanistan</option>
            <option value="AL">Albania</option>
            <option value="DZ">Algeria</option>
            <option value="AR">Argentina</option>
            <option value="AU">Australia</option>
            <option value="AT">Austria</option>
            <option value="BD">Bangladesh</option>
            <option value="BE">Belgium</option>
            <option value="BR">Brazil</option>
            <option value="BT">Bhutan</option>
            <option value="CA">Canada</option>
            <option value="CN">China</option>
            <option value="CO">Colombia</option>
            <option value="CZ">Czech Republic</option>
            <option value="DK">Denmark</option>
            <option value="EG">Egypt</option>
            <option value="FI">Finland</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="GR">Greece</option>
            <option value="HK">Hong Kong</option>
            <option value="HU">Hungary</option>
            <option value="IS">Iceland</option>
            <option value="IN">India</option>
            <option value="ID">Indonesia</option>
            <option value="IE">Ireland</option>
            <option value="IL">Israel</option>
            <option value="IT">Italy</option>
            <option value="JP">Japan</option>
            <option value="KE">Kenya</option>
            <option value="KR">South Korea</option>
            <option value="MY">Malaysia</option>
            <option value="MV">Maldives</option>
            <option value="MX">Mexico</option>
            <option value="NL">Netherlands</option>
            <option value="NZ">New Zealand</option>
            <option value="NP">Nepal</option>
            <option value="NO">Norway</option>
            <option value="PK">Pakistan</option>
            <option value="PE">Peru</option>
            <option value="PH">Philippines</option>
            <option value="PL">Poland</option>
            <option value="PT">Portugal</option>
            <option value="RO">Romania</option>
            <option value="RU">Russia</option>
            <option value="SA">Saudi Arabia</option>
            <option value="SG">Singapore</option>
            <option value="ZA">South Africa</option>
            <option value="ES">Spain</option>
            <option value="LK">Sri Lanka</option>
            <option value="SE">Sweden</option>
            <option value="CH">Switzerland</option>
            <option value="TW">Taiwan</option>
            <option value="TH">Thailand</option>
            <option value="TR">Turkey</option>
            <option value="AE">United Arab Emirates</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="VN">Vietnam</option>
        `;

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
                // Lead traveler / Contact information
                contact: {
                    first_name: $('#contact-first-name').val(),
                    last_name: $('#contact-last-name').val(),
                    email: $('#contact-email').val(),
                    phone: $('#contact-phone').val(),
                    country: $('#contact-country').val(),
                    nationality: $('#contact-nationality').val(),
                    address: $('#contact-address').val()
                },
                // Emergency contact
                emergency_contact: {
                    name: $('#emergency-name').val(),
                    phone: $('#emergency-phone').val(),
                    relationship: $('#emergency-relationship').val()
                },
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
                    date_of_birth: $form.find('input[name$="[date_of_birth]"]').val(),
                    gender: $form.find('select[name$="[gender]"]').val(),
                    nationality: $form.find('select[name$="[nationality]"]').val(),
                    passport: $form.find('input[name$="[passport]"]').val(),
                    passport_expiry: $form.find('input[name$="[passport_expiry]"]').val(),
                    dietary: $form.find('select[name$="[dietary]"]').val(),
                    medical: $form.find('input[name$="[medical]"]').val()
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

