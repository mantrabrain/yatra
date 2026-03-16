/**
 * Single Trip Page JavaScript
 *
 * Handles frontend interactions for the single trip page including:
 * - Group discount calculations
 * - Traveler count management
 * - Pricing updates
 * - Flatpickr initialization
 *
 * @package Yatra
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers when DOM is ready
    const bookingDateInput = document.getElementById('travel_date');
    if (bookingDateInput) {
        const form = bookingDateInput.closest('.yatra-booking-form');
        const bookingMode = form ? form.getAttribute('data-booking-mode') : 'regular';
        
        if (bookingMode === 'availability') {
            // Availability-based: Only specific dates
            const availabilityDates = window.yatraTripData?.availabilityDates || [];
            
            if (availabilityDates.length > 0) {
                flatpickr(bookingDateInput, {
                    dateFormat: 'Y-m-d',
                    minDate: 'today',
                    enable: availabilityDates,
                    disableMobile: false
                });
            }
        } else {
            // Flexible booking: Any future date with constraints
            const minDate = bookingDateInput.getAttribute('data-min-date') || 'today';
            const maxDate = bookingDateInput.getAttribute('data-max-date');
            
            const config = {
                dateFormat: 'Y-m-d',
                minDate: minDate,
                disableMobile: false
            };
            
            if (maxDate) {
                config.maxDate = maxDate;
            }
            
            flatpickr(bookingDateInput, config);
        }
    }
    
    // Enquiry modal date picker (always flexible)
    const enquiryDateInput = document.getElementById('enquiry-travel-date');
    if (enquiryDateInput) {
        flatpickr(enquiryDateInput, {
            dateFormat: 'Y-m-d',
            minDate: 'today',
            disableMobile: false
        });
    }
});

// Group Discount Calculation for Booking Widget
document.addEventListener('DOMContentLoaded', function () {
    const bookingForm = document.querySelector('.yatra-booking-form');
    const totalAmountElement = document.getElementById('total-amount');
    const travelerInputs = document.querySelectorAll('input[name*="travelers["], input[name="num_travelers"]');
    let currentGroupDiscounts = null;
    
    // Load group discounts for this trip
    async function loadGroupDiscounts() {
        try {
            const response = await fetch(window.yatraTripData?.groupDiscountsUrl || '', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trip_ids: [window.yatraTripData?.tripId]
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data[window.yatraTripData?.tripId] && data[window.yatraTripData?.tripId].has_group_discounts) {
                    currentGroupDiscounts = data[window.yatraTripData?.tripId].discounts;
                }
            }
        } catch (error) {
            console.warn('Failed to load group discounts:', error);
        }
    }
    
    // Calculate total travelers
    function calculateTotalTravelers() {
        let total = 0;
        
        // Handle traveler-based pricing (multiple categories)
        const travelerCategoryInputs = document.querySelectorAll('input[name*="travelers["]');
        travelerCategoryInputs.forEach(input => {
            total += parseInt(input.value) || 0;
        });
        
        // Handle simple pricing (single traveler count)
        const simpleTravelerInput = document.querySelector('input[name="num_travelers"]');
        if (simpleTravelerInput) {
            total = parseInt(simpleTravelerInput.value) || 0;
        }
        
        return total;
    }
    
    // Calculate group discount for current traveler count
    function calculateGroupDiscount(totalTravelers, basePrice) {
        if (!currentGroupDiscounts || totalTravelers < 2) {
            return 0;
        }
        
        // Find applicable discount for this group size
        let applicableDiscount = null;
        for (const discount of currentGroupDiscounts) {
            const minSize = discount.min_group_size;
            const maxSize = discount.max_group_size;
            
            if (totalTravelers >= minSize && (!maxSize || totalTravelers <= maxSize)) {
                applicableDiscount = discount;
                break;
            }
        }
        
        if (!applicableDiscount) {
            return 0;
        }
        
        let discountAmount = 0;
        
        if (applicableDiscount.discount_mode === 'category_based' && applicableDiscount.category_discounts) {
            // Calculate category-based discount
            const travelerCounts = getTravelerCountsByCategory();
            
            for (const [category, discountConfig] of Object.entries(applicableDiscount.category_discounts)) {
                const count = travelerCounts[category] || 0;
                if (count > 0) {
                    // Calculate category-specific price
                    const categoryMultiplier = getCategoryMultiplier(category);
                    const categoryPrice = basePrice * categoryMultiplier;
                    const categoryTotal = categoryPrice * count;
                    
                    if (discountConfig.type === 'percentage') {
                        discountAmount += categoryTotal * (discountConfig.amount / 100);
                    } else {
                        // Fixed amount per person
                        discountAmount += Math.min(discountConfig.amount * count, categoryTotal);
                    }
                }
            }
        } else {
            // Total-based discount
            if (applicableDiscount.discount_type === 'percentage') {
                discountAmount = basePrice * totalTravelers * (applicableDiscount.discount_amount / 100);
            } else {
                discountAmount = Math.min(applicableDiscount.discount_amount, basePrice * totalTravelers);
            }
        }
        
        return discountAmount;
    }
    
    // Update pricing display
    function updatePricing() {
        const totalTravelers = calculateTotalTravelers();
        const basePrice = window.yatraTripData?.basePrice || 0;
        
        // Calculate subtotal
        let subtotal = 0;
        
        const categoryInputs = document.querySelectorAll('input[name*="travelers["]');
        if (categoryInputs.length > 0) {
            // Traveler-based pricing: read actual prices from data attributes
            categoryInputs.forEach(input => {
                const count = parseInt(input.value) || 0;
                const price = parseFloat(input.dataset.price) || 0;
                const pricingMode = input.dataset.pricingMode || 'per_person';
                
                if (pricingMode === 'per_group') {
                    // Per group: charge flat price once if any travelers
                    if (count > 0) {
                        subtotal += price;
                    }
                } else {
                    // Per person: charge per traveler
                    subtotal += price * count;
                }
            });
        } else {
            // Simple pricing
            subtotal = basePrice * totalTravelers;
        }
        
        // Calculate group discount
        const groupDiscount = calculateGroupDiscount(totalTravelers, basePrice);
        const finalTotal = subtotal - groupDiscount;
        
        // Update display
        if (totalAmountElement) {
            totalAmountElement.textContent = (window.yatraTripData?.currencySymbol || '$') + finalTotal.toFixed(2);
        }
        
        // Show/hide group discount indicator
        updateGroupDiscountIndicator(totalTravelers, groupDiscount);
    }
    
    // Update group discount indicator
    function updateGroupDiscountIndicator(totalTravelers, discountAmount) {
        let indicator = document.querySelector('.yatra-group-discount-indicator');
        
        if (discountAmount > 0) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'yatra-group-discount-indicator';
                totalAmountElement.parentNode.appendChild(indicator);
            }
            
            indicator.innerHTML = `
                <div class="yatra-group-discount-badge">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Group discount applied: -${window.yatraTripData?.currencySymbol || '$'}${discountAmount.toFixed(2)}
                </div>
            `;
        } else if (indicator) {
            indicator.remove();
        }
    }
    
    // Initialize
    if (window.yatraTripData) {
        loadGroupDiscounts().then(() => {
            // Set up event listeners for traveler count changes
            travelerInputs.forEach(input => {
                input.addEventListener('change', updatePricing);
                input.addEventListener('input', updatePricing);
            });
            
            // Initial pricing update
            updatePricing();
        });
        
        // Handle group discount CTA buttons
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('yatra-group-discount-btn')) {
                const groupSize = parseInt(e.target.dataset.groupSize);
                if (groupSize) {
                    // Set traveler count to trigger discount
                    if (document.querySelector('input[name="num_travelers"]')) {
                        // Simple pricing
                        document.querySelector('input[name="num_travelers"]').value = groupSize;
                    } else {
                        // Traveler-based pricing - set adults to group size
                        const adultInput = document.querySelector('input[name*="travelers[adults]"]');
                        if (adultInput) {
                            adultInput.value = groupSize;
                            // Update display
                            const display = document.querySelector('.yatra-participants-display');
                            if (display) {
                                display.textContent = `Adult x ${groupSize}`;
                            }
                        }
                    }
                    
                    // Trigger pricing update
                    updatePricing();
                    
                    // Scroll to booking widget
                    document.getElementById('yatra-booking-widget').scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    }
});
