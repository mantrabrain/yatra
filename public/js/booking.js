/**
 * Booking Page JavaScript
 * 
 * @package Yatra
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        const pricePerPerson = 1650; // This should come from PHP
        const currency = 'USD';

        // Generate initial traveler forms
        generateTravelerForms(2);

        // Quantity selector
        $('.yatra-quantity-btn').on('click', function() {
            const $btn = $(this);
            const $input = $('#number-of-travelers');
            let currentValue = parseInt($input.val()) || 2;
            const min = parseInt($input.attr('min')) || 2;
            const max = parseInt($input.attr('max')) || 12;

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

        // Update booking summary when travelers change
        function updateBookingSummary() {
            const travelers = parseInt($('#number-of-travelers').val()) || 2;
            const paymentMethod = $('input[name="payment_method"]:checked').val();
            let total = pricePerPerson * travelers;
            
            // Calculate deposit if selected
            if (paymentMethod === 'deposit') {
                total = total * 0.3; // 30% deposit
            }

            $('#summary-travelers').text(travelers);
            $('#summary-total').html('<strong>' + currency + ' ' + total.toLocaleString() + '</strong>');
            $('#pay-amount').text(currency + ' ' + total.toLocaleString());
        }

        // Update summary when payment method changes
        $('input[name="payment_method"]').on('change', function() {
            updateBookingSummary();
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

            if (!isValid) {
                alert('Please fill in all required fields for all travelers.');
                return;
            }
            
            // Get selected payment gateway
            const paymentGateway = $('input[name="payment_gateway"]:checked').val();
            
            // Here you would normally submit to the server
            // For now, just show an alert
            alert('Redirecting to ' + paymentGateway.toUpperCase() + ' payment gateway...');
            
            // In production, you would do:
            // $.ajax({
            //     url: yatraBookingData.restUrl + '/bookings',
            //     method: 'POST',
            //     data: $(this).serialize(),
            //     beforeSend: function(xhr) {
            //         xhr.setRequestHeader('X-WP-Nonce', yatraBookingData.nonce);
            //     },
            //     success: function(response) {
            //         // Redirect to payment gateway or thank you page
            //         if (response.payment_url) {
            //             window.location.href = response.payment_url;
            //         } else {
            //             window.location.href = response.redirect_url;
            //         }
            //     },
            //     error: function(xhr) {
            //         alert('Error: ' + xhr.responseJSON.message);
            //     }
            // });
        });

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        $('#travel-date').attr('min', today);
    });

})(jQuery);


