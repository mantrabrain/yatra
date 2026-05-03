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
    const dateInput = document.getElementById('travel_date');
    let currentGroupDiscounts = null;
    let selectedAvailability = null;
    
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

    function getSidebarAvailabilities() {
        const raw = window.yatraTripData && window.yatraTripData.sidebarAvailability;
        return Array.isArray(raw) ? raw : [];
    }
    
    // Update pricing when date changes
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const selectedDate = this.value;
            const availabilities = getSidebarAvailabilities();
            if (availabilities.length > 0) {
                selectedAvailability = availabilities.find(a => a.departure_date === selectedDate);

                if (selectedAvailability && selectedAvailability.pricing_type === 'traveler_based' && selectedAvailability.price_types) {
                    selectedAvailability.price_types.forEach((pt) => {
                        const input = document.querySelector(`input[name="travelers[${pt.category_id}]"]`);
                        if (input) {
                            const price = pt.discounted_price || pt.original_price || 0;
                            input.setAttribute('data-price', price);
                        }
                    });
                }
            } else {
                selectedAvailability = null;
            }

            updatePricing();
        });
        
        // Set today's date by default if available, otherwise use trip fallback pricing
        const today = new Date().toISOString().split('T')[0];
        if (!dateInput.value) {
            const availabilities = getSidebarAvailabilities();
            if (availabilities.length > 0) {
                const todayAvailability = availabilities.find(a => a.departure_date === today);
                if (todayAvailability) {
                    dateInput.value = today;
                    dateInput.dispatchEvent(new Event('change'));
                } else {
                    updatePricing();
                }
            }
        }
    }
    
    // Update pricing display
    function updatePricing() {
        const totalTravelers = calculateTotalTravelers();
        let basePrice = window.yatraTripData?.basePrice || 0;
        
        // Calculate subtotal
        let subtotal = 0;
        
        const categoryInputs = document.querySelectorAll('input[name*="travelers["]');
        if (categoryInputs.length > 0) {
            // Traveler-based pricing: read actual prices from data attributes (updated by date change)
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
            // Simple pricing - use selected availability price if available
            if (selectedAvailability && selectedAvailability.price) {
                basePrice = parseFloat(selectedAvailability.price);
            }
            subtotal = basePrice * totalTravelers;
        }
        
        // Calculate group discount
        const groupDiscount = calculateGroupDiscount(totalTravelers, basePrice);
        const finalTotal = subtotal - groupDiscount;
        
        // Update display (total element has been removed from sidebar)
        // The total price display is no longer shown in the sidebar
        // This code is kept for reference but will not execute as totalAmountElement is null
        if (totalAmountElement) {
            totalAmountElement.textContent = (window.yatraTripData?.currencySymbol || '$') + finalTotal.toFixed(2);
        }
        
        // Show/hide group discount indicator
        updateGroupDiscountIndicator(totalTravelers, groupDiscount);
    }
    
    // Update group discount indicator (total element has been removed)
    function updateGroupDiscountIndicator(totalTravelers, discountAmount) {
        let indicator = document.querySelector('.yatra-group-discount-indicator');
        
        if (discountAmount > 0) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'yatra-group-discount-indicator';
                // Find a suitable parent to append the indicator
                const bookingForm = document.querySelector('.yatra-booking-form');
                if (bookingForm) {
                    bookingForm.appendChild(indicator);
                }
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
            
            // Also listen for plus/minus button clicks
            document.addEventListener('click', function(e) {
                if (e.target.closest('.yatra-quantity-plus') || e.target.closest('.yatra-quantity-minus')) {
                    // Delay to ensure input value is updated first
                    setTimeout(updatePricing, 50);
                }
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

    /**
     * Traveler Synchronization Across All Locations
     * Syncs traveler inputs between sidebar, enquiry modal, and availability section
     */
    
    // Handle +/- button clicks for traveler inputs
    document.addEventListener('click', function(e) {
        // Check if click is on a quantity button or its children (SVG, path, etc.)
        const btn = e.target.closest('.yatra-quantity-btn, .yatra-quantity-plus, .yatra-quantity-minus');
        if (!btn) return;
        
        // Prevent default button behavior
        e.preventDefault();
        e.stopPropagation();
        
        const target = btn.getAttribute('data-target');
        if (!target) return;
        
        // Try to find input by ID first (for simple inputs)
        let input = document.getElementById(target);
        
        // If not found by ID, find by data-target in the same row (for category inputs)
        if (!input) {
            const row = btn.closest('.yatra-quantity-row');
            if (row) {
                input = row.querySelector('input[type="number"]');
            }
        }
        
        if (!input) return;
        
        const min = parseInt(input.getAttribute('min')) || 0;
        const max = parseInt(input.getAttribute('max')) || 99;
        let value = parseInt(input.value) || 0;
        
        // Update value based on button type
        if (btn.classList.contains('yatra-quantity-plus')) {
            value = Math.min(value + 1, max);
        } else if (btn.classList.contains('yatra-quantity-minus')) {
            value = Math.max(value - 1, min);
        }
        
        // Update the input
        input.value = value;
        
        // Update button states
        const minusBtn = btn.classList.contains('yatra-quantity-minus') ? btn : btn.parentElement.querySelector('.yatra-quantity-minus');
        const plusBtn = btn.classList.contains('yatra-quantity-plus') ? btn : btn.parentElement.querySelector('.yatra-quantity-plus');
        
        if (minusBtn) minusBtn.disabled = value <= min;
        if (plusBtn) plusBtn.disabled = value >= max;
        
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Sync to other locations
        syncTravelerInputs(input);
    });
    
    // Handle direct input changes
    document.addEventListener('change', function(e) {
        const input = e.target;
        
        // Check if it's a traveler input
        if (input.classList.contains('yatra-quantity-input') || 
            input.classList.contains('yatra-quantity-input-simple') ||
            input.id === 'num_travelers' ||
            input.id === 'enquiry_adults' ||
            input.name?.startsWith('travelers[') ||
            input.id?.startsWith('traveler_')) {
            
            syncTravelerInputs(input);
        }
    });
    
    /**
     * Sync traveler input value to all matching inputs across locations
     */
    function syncTravelerInputs(sourceInput) {
        const sourceId = sourceInput.id;
        const sourceName = sourceInput.name;
        const sourceCategory = sourceInput.getAttribute('data-category');
        const sourceValue = parseInt(sourceInput.value) || 0;
        
        // Determine if this is regular pricing or traveler-based pricing
        if (sourceId === 'num_travelers' || sourceId === 'enquiry_adults' || sourceId?.startsWith('num-travelers-')) {
            // Regular pricing - sync all num_travelers and enquiry_adults inputs
            const regularInputs = document.querySelectorAll('#num_travelers, #enquiry_adults');
            regularInputs.forEach(input => {
                if (input !== sourceInput) {
                    const max = parseInt(input.getAttribute('max')) || 99;
                    input.value = Math.min(sourceValue, max);
                }
            });
            
            // Also sync to availability section inputs
            const availabilityInputs = document.querySelectorAll('input[id^="num-travelers-"]');
            availabilityInputs.forEach(input => {
                if (input !== sourceInput) {
                    const max = parseInt(input.getAttribute('max')) || 99;
                    input.value = Math.min(sourceValue, max);
                }
            });
            
        } else if (sourceId?.startsWith('traveler_') || sourceName?.startsWith('travelers[') || sourceCategory) {
            // Traveler-based pricing - extract category ID
            let categoryId = '';
            
            if (sourceCategory) {
                // From availability section (data-category attribute)
                categoryId = sourceCategory;
            } else if (sourceId?.startsWith('traveler_')) {
                categoryId = sourceId.replace('traveler_', '');
            } else if (sourceName?.includes('[')) {
                const match = sourceName.match(/travelers\[(\d+)\]/);
                if (match) categoryId = match[1];
            }
            
            if (categoryId) {
                // Sync all inputs for this category across all locations
                const categoryInputs = document.querySelectorAll(
                    `input[id="traveler_${categoryId}"], input[name="travelers[${categoryId}]"], input[data-category="${categoryId}"]`
                );
                
                categoryInputs.forEach(input => {
                    if (input !== sourceInput) {
                        const max = parseInt(input.getAttribute('max')) || 99;
                        input.value = Math.min(sourceValue, max);
                        
                        // Update button states for this input
                        const row = input.closest('.yatra-quantity-row');
                        if (row) {
                            const min = parseInt(input.getAttribute('min')) || 0;
                            const minusBtn = row.querySelector('.yatra-quantity-minus');
                            const plusBtn = row.querySelector('.yatra-quantity-plus');
                            if (minusBtn) minusBtn.disabled = input.value <= min;
                            if (plusBtn) plusBtn.disabled = input.value >= max;
                        }
                    }
                });
                
                // Update dropdown display text if exists
                updateTravelerDisplayText();
            }
        }
    }
    
    /**
     * Update traveler dropdown display text
     */
    function updateTravelerDisplayText() {
        const displays = document.querySelectorAll('.yatra-traveler-selector-display, .yatra-participants-display');
        
        displays.forEach(display => {
            // Find all traveler inputs in the same container
            const container = display.closest('.yatra-traveler-selector, .yatra-booking-field-select');
            if (!container) return;
            
            const dropdown = container.querySelector('.yatra-traveler-selector-dropdown, .yatra-booking-quantity-selector');
            if (!dropdown) return;
            
            const inputs = dropdown.querySelectorAll('input[type="number"]');
            const parts = [];
            let total = 0;
            
            inputs.forEach(input => {
                const value = parseInt(input.value) || 0;
                if (value > 0) {
                    const label = input.getAttribute('data-category-label') || 'Traveler';
                    parts.push(`${label} x ${value}`);
                    total += value;
                }
            });
            
            if (parts.length > 0) {
                display.textContent = parts.join(', ');
            } else {
                display.textContent = 'Select travelers';
            }
        });
    }
});
