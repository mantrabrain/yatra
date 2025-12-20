/**
 * Single Trip Date Picker Initialization
 * Handles both availability-based and flexible booking modes
 * 
 * @package Yatra
 */

(function() {
    'use strict';

    // Wait for DOM and Flatpickr to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeDatePickers();
    });

    /**
     * Initialize all date pickers on the page
     */
    function initializeDatePickers() {
        // Main booking form date picker
        const bookingDateInput = document.getElementById('travel_date');
        if (bookingDateInput) {
            initializeBookingDatePicker(bookingDateInput);
        }

        // Enquiry modal date picker
        const enquiryDateInput = document.getElementById('enquiry-travel-date');
        if (enquiryDateInput) {
            initializeEnquiryDatePicker(enquiryDateInput);
        }
    }

    /**
     * Initialize booking form date picker
     * Handles both availability-based and flexible booking modes
     */
    function initializeBookingDatePicker(input) {
        const form = input.closest('.yatra-booking-form');
        if (!form) return;

        const bookingMode = form.getAttribute('data-booking-mode');
        
        if (bookingMode === 'availability') {
            // Availability-based booking: Only allow specific dates
            initializeAvailabilityDatePicker(input);
        } else {
            // Flexible booking: Allow any future date with constraints
            initializeFlexibleDatePicker(input);
        }
    }

    /**
     * Initialize availability-based date picker
     * Only allows dates from the availability list
     */
    function initializeAvailabilityDatePicker(input) {
        // Get availability dates from data attribute or global variable
        const availabilityDates = window.yatraAvailabilityDates || [];
        
        if (availabilityDates.length === 0) {
            console.warn('Yatra: No availability dates found for availability-based booking');
            return;
        }

        // Extract just the dates (YYYY-MM-DD format)
        const enabledDates = availabilityDates.map(avail => {
            return avail.departure_date || avail.date;
        }).filter(date => date); // Remove any null/undefined

        flatpickr(input, {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            enable: enabledDates, // Only these specific dates are selectable
            disableMobile: false,
            onChange: function(selectedDates, dateStr, instance) {
                handleDateSelection(selectedDates, dateStr, availabilityDates);
            },
            onReady: function(selectedDates, dateStr, instance) {
                // Add custom styling or indicators
                addAvailabilityIndicators(instance, availabilityDates);
            }
        });

        console.log('Yatra: Initialized availability-based date picker with', enabledDates.length, 'dates');
    }

    /**
     * Initialize flexible date picker
     * Allows any future date with optional constraints
     */
    function initializeFlexibleDatePicker(input) {
        // Get date constraints from data attributes
        const minDate = input.getAttribute('data-min-date') || 'today';
        const maxDate = input.getAttribute('data-max-date') || null;
        
        // Get trip settings constraints
        const availableFrom = input.getAttribute('data-available-from');
        const availableTo = input.getAttribute('data-available-to');

        // Determine effective min/max dates
        let effectiveMinDate = minDate;
        let effectiveMaxDate = maxDate;

        // If trip has available_from, use it as minimum
        if (availableFrom) {
            const fromDate = new Date(availableFrom);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Use whichever is later: today or available_from
            effectiveMinDate = fromDate > today ? availableFrom : 'today';
        }

        // If trip has available_to, use it as maximum
        if (availableTo) {
            effectiveMaxDate = availableTo;
        }

        const config = {
            dateFormat: 'Y-m-d',
            minDate: effectiveMinDate,
            disableMobile: false,
            onChange: function(selectedDates, dateStr, instance) {
                handleFlexibleDateSelection(selectedDates, dateStr);
            }
        };

        // Add maxDate if specified
        if (effectiveMaxDate) {
            config.maxDate = effectiveMaxDate;
        }

        flatpickr(input, config);

        console.log('Yatra: Initialized flexible date picker', {
            minDate: effectiveMinDate,
            maxDate: effectiveMaxDate || 'none'
        });
    }

    /**
     * Initialize enquiry modal date picker
     * Always flexible (any future date)
     */
    function initializeEnquiryDatePicker(input) {
        flatpickr(input, {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            disableMobile: false
        });

        console.log('Yatra: Initialized enquiry date picker');
    }

    /**
     * Handle date selection for availability-based booking
     * Updates pricing and availability info based on selected date
     */
    function handleDateSelection(selectedDates, dateStr, availabilityDates) {
        if (selectedDates.length === 0) return;

        // Find the selected availability date data
        const selectedAvailability = availabilityDates.find(avail => {
            const availDate = avail.departure_date || avail.date;
            return availDate === dateStr;
        });

        if (!selectedAvailability) return;

        // Update pricing display if price varies by date
        updatePricingForDate(selectedAvailability);

        // Update seats available display
        updateSeatsDisplay(selectedAvailability);

        // Trigger custom event for other scripts
        document.dispatchEvent(new CustomEvent('yatraDateSelected', {
            detail: {
                date: dateStr,
                availability: selectedAvailability
            }
        }));

        console.log('Yatra: Date selected:', dateStr, selectedAvailability);
    }

    /**
     * Handle date selection for flexible booking
     */
    function handleFlexibleDateSelection(selectedDates, dateStr) {
        if (selectedDates.length === 0) return;

        // Trigger custom event
        document.dispatchEvent(new CustomEvent('yatraDateSelected', {
            detail: {
                date: dateStr,
                mode: 'flexible'
            }
        }));

        console.log('Yatra: Flexible date selected:', dateStr);
    }

    /**
     * Update pricing display based on selected date
     */
    function updatePricingForDate(availability) {
        const priceElement = document.getElementById('display-price');
        if (!priceElement || !availability.effective_price) return;

        // Format price with currency
        const currency = window.yatraBookingData?.currencySymbol || '$';
        const price = parseFloat(availability.effective_price);
        priceElement.textContent = currency + price.toFixed(2);

        // Update discount badge if applicable
        if (availability.discount_percentage > 0) {
            updateDiscountBadge(availability.discount_percentage);
        }
    }

    /**
     * Update seats available display
     */
    function updateSeatsDisplay(availability) {
        const seatsElement = document.querySelector('.yatra-seats-available');
        if (!seatsElement) return;

        const seatsAvailable = availability.available_seats || availability.seats_available;
        if (seatsAvailable !== undefined) {
            seatsElement.textContent = seatsAvailable + ' seats available';
            
            // Add urgency indicator if low seats
            if (seatsAvailable <= 5 && seatsAvailable > 0) {
                seatsElement.classList.add('yatra-low-seats');
            } else {
                seatsElement.classList.remove('yatra-low-seats');
            }
        }
    }

    /**
     * Update discount badge
     */
    function updateDiscountBadge(percentage) {
        let badge = document.querySelector('.yatra-booking-discount-badge');
        if (!badge && percentage > 0) {
            badge = document.createElement('div');
            badge.className = 'yatra-booking-discount-badge';
            const priceContainer = document.querySelector('.yatra-booking-price');
            if (priceContainer) {
                priceContainer.insertBefore(badge, priceContainer.firstChild);
            }
        }

        if (badge) {
            badge.textContent = percentage + '% OFF';
            badge.style.display = percentage > 0 ? 'block' : 'none';
        }
    }

    /**
     * Add visual indicators to availability dates
     */
    function addAvailabilityIndicators(instance, availabilityDates) {
        // Add custom classes to dates based on availability
        setTimeout(() => {
            availabilityDates.forEach(avail => {
                const dateStr = avail.departure_date || avail.date;
                const dayElement = instance.calendarContainer.querySelector(
                    `[aria-label*="${dateStr}"]`
                );

                if (dayElement) {
                    // Add class based on availability status
                    if (avail.is_sold_out || avail.available_seats === 0) {
                        dayElement.classList.add('yatra-sold-out');
                    } else if (avail.available_seats <= 5) {
                        dayElement.classList.add('yatra-limited-seats');
                    }

                    // Add discount indicator
                    if (avail.discount_percentage > 0) {
                        dayElement.classList.add('yatra-has-discount');
                    }
                }
            });
        }, 100);
    }

    // Expose initialization function globally for dynamic content
    window.yatraInitializeDatePickers = initializeDatePickers;

})();
