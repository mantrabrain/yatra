function yatraScrollToBooking() {
    const bookingForm = document.querySelector('.yatra-booking-form');
    if (bookingForm) {
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback to main sidebar
        const sidebar = document.querySelector('.yatra-trip-sidebar');
        if (sidebar) {
            sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function yatraScrollToContact() {
    const contactSection = document.querySelector('#contact') || document.querySelector('.yatra-contact-form');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


function yatraCloseMobileSidebar() {
    const sidebar = document.getElementById('yatra-mobile-sticky-sidebar');
    if (sidebar) {
        sidebar.classList.add('user-closed');
        
        // Save closed state in sessionStorage (persists until page reload)
        sessionStorage.setItem('yatra-mobile-sidebar-closed', 'true');
        
        // Hide sidebar with animation
        setTimeout(() => {
            sidebar.style.transform = 'translateY(100%)';
            sidebar.style.opacity = '0';
        }, 100);
    }
}

// Auto-show on page load (reset closed state)
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('yatra-mobile-sticky-sidebar');
    
    if (sidebar) {
        // Clear any previous closed state on page load
        sessionStorage.removeItem('yatra-mobile-sidebar-closed');
        
        // Ensure sidebar is visible on page load (CSS will handle responsive)
        sidebar.classList.remove('user-closed');
        sidebar.classList.remove('hidden');
    }
    
    // Initialize mobile booking form functionality
    initializeMobileBookingForm();
});

function initializeMobileBookingForm() {
    // Mobile quantity controls
    const mobileMinusBtns = document.querySelectorAll('.yatra-mobile-quantity-minus');
    const mobilePlusBtns = document.querySelectorAll('.yatra-mobile-quantity-plus');
    
    mobileMinusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const current = parseInt(input.value) || 1;
                const min = parseInt(input.getAttribute('min')) || 1;
                if (current > min) {
                    input.value = current - 1;
                    updateMobileTotal();
                }
            }
        });
    });
    
    mobilePlusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const current = parseInt(input.value) || 1;
                const max = parseInt(input.getAttribute('max')) || 20;
                if (current < max) {
                    input.value = current + 1;
                    updateMobileTotal();
                }
            }
        });
    });
    
    // Mobile date picker - Initialize exactly like main date picker
    const mobileDateInput = document.getElementById('mobile_travel_date');
    if (mobileDateInput && mobileDateInput.tagName === 'SELECT') {
        // Pro "date-as-dropdown" mode: native <select>. Mirror selection to the
        // desktop counterpart (kept off-screen on mobile) so the rest of the
        // booking flow — which reads #travel_date — picks the same value.
        mobileDateInput.addEventListener('change', function () {
            var desktop = document.getElementById('travel_date');
            if (desktop) {
                if (desktop.tagName === 'SELECT') {
                    desktop.value = mobileDateInput.value;
                    desktop.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (desktop._flatpickr) {
                    desktop._flatpickr.setDate(mobileDateInput.value, true);
                } else {
                    desktop.value = mobileDateInput.value;
                }
            }
            updateMobileTotal();
        });
    } else if (mobileDateInput) {
        // Default value: today (desktop behavior). If availability mode doesn't allow today,
        // we will swap to the first enabled date after Flatpickr initializes.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
        if (!mobileDateInput.value) {
            mobileDateInput.value = todayStr;
        }

        // Check if Flatpickr is available
        if (typeof flatpickr === 'undefined') {
            // Make it a regular date input as fallback
            mobileDateInput.type = 'date';
            mobileDateInput.removeAttribute('readonly');
        } else {
            // Get availability dates from global trip data with fallback
            let availabilityDates = [];
            try {
                if (window.yatraTripData && Array.isArray(window.yatraTripData.availabilityDates)) {
                    availabilityDates = window.yatraTripData.availabilityDates;
                }
            } catch (e) {
            }
            
            var flatpickrLocale = (window.yatraTripData && window.yatraTripData.flatpickrLocale)
                ? window.yatraTripData.flatpickrLocale
                : { firstDayOfWeek: 1 };
            var mobileFpCommon = {
                locale: flatpickrLocale,
                clickOpens: true,
                appendTo: document.body,
                static: false,
                onReady: function(selectedDates, dateStr, instance) {
                    if (instance.calendarContainer) {
                        instance.calendarContainer.style.zIndex = '100050';
                    }

                    // Ensure we have a selected date (desktop behavior).
                    // If current value is empty, use today.
                    if (!instance.selectedDates || instance.selectedDates.length === 0) {
                        instance.setDate(mobileDateInput.value || todayStr, true);
                    }
                },
                onChange: function(selectedDates, dateStr, instance) {
                    var mainDateInput = document.getElementById('travel_date');
                    if (mainDateInput && mainDateInput._flatpickr) {
                        mainDateInput._flatpickr.setDate(dateStr);
                    }
                    updateMobileTotal();
                }
            };
            function yatraBindMobileDatepickerTouch(inputEl) {
                if (!inputEl || !inputEl._flatpickr) {
                    return;
                }
                var fp = inputEl._flatpickr;
                var btn = document.querySelector('.yatra-mobile-date-btn');
                var fallbackWrap = inputEl.closest('.yatra-mobile-date-section');
                var target = btn || fallbackWrap;
                if (!target) return;
                target.addEventListener('click', function(e) {
                    e.stopPropagation();
                    fp.open();
                });
                target.addEventListener('keydown', function(e) {
                    var key = e.key || e.code;
                    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                        e.preventDefault();
                        e.stopPropagation();
                        fp.open();
                    }
                });
            }
            // Initialize Flatpickr with same configuration as main date picker
            var altFormat = (window.yatraTripData && (window.yatraTripData.flatpickrAltFormat || window.yatraTripData.altDateFormat))
                ? (window.yatraTripData.flatpickrAltFormat || window.yatraTripData.altDateFormat)
                : null;
            if (!altFormat && window.yatraTripData && (window.yatraTripData.dateFormat || window.yatraTripData.date_format)) {
                // Keep in sync with assets/js/trip.js helper (minimal mapping)
                var php = window.yatraTripData.dateFormat || window.yatraTripData.date_format;
                var map = { d:'d', j:'j', D:'D', l:'l', m:'m', n:'n', M:'M', F:'F', Y:'Y', y:'y' };
                altFormat = '';
                var esc = false;
                for (var i = 0; i < php.length; i++) {
                    var ch = php[i];
                    if (esc) { altFormat += ch; esc = false; continue; }
                    if (ch === '\\\\') { esc = true; continue; }
                    altFormat += map[ch] || ch;
                }
            }
            if (!altFormat) {
                altFormat = 'F j, Y';
            }

            if (availabilityDates.length > 0) {
                // Availability-based booking - enable only specific dates
                flatpickr(mobileDateInput, Object.assign({}, mobileFpCommon, {
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: altFormat,
                    minDate: 'today',
                    enable: availabilityDates,
                    defaultDate: availabilityDates[0] || todayStr,
                }));
            } else {
                // Regular booking - flexible dates with min/max constraints
                var config = Object.assign({}, mobileFpCommon, {
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: altFormat,
                    minDate: 'today',
                    defaultDate: mobileDateInput.value || todayStr,
                });
                var minDate = mobileDateInput.getAttribute('data-min-date');
                var maxDate = mobileDateInput.getAttribute('data-max-date');
                if (minDate) {
                    config.minDate = minDate;
                    if (!mobileDateInput.value) {
                        config.defaultDate = minDate;
                    }
                }
                if (maxDate) {
                    config.maxDate = maxDate;
                }
                flatpickr(mobileDateInput, config);
            }
            yatraBindMobileDatepickerTouch(mobileDateInput);
        }
    }

    // Travelers selector is rendered in the sticky bar using the same component as desktop.
    
    // Mobile check availability button
    const mobileCheckBtn = document.getElementById('mobile-check-availability-btn');
    if (mobileCheckBtn) {
        mobileCheckBtn.addEventListener('click', function() {
            // Sync mobile form data with main form
            syncMobileToMainForm();
            // Trigger main check availability
            const mainCheckBtn = document.getElementById('check-availability-btn');
            if (mainCheckBtn) {
                mainCheckBtn.click();
            }
        });
    }
}

function syncMobileToMainForm() {
    // Sync date
    const mobileDate = document.getElementById('mobile_travel_date');
    const mainDate = document.getElementById('travel_date');
    if (mobileDate && mainDate) {
        // If main date has Flatpickr instance, use it
        if (mainDate._flatpickr) {
            mainDate._flatpickr.setDate(mobileDate.value);
        } else {
            mainDate.value = mobileDate.value;
            // Native <select> consumers (date-as-dropdown Pro mode) listen for
            // `change` — emit one so downstream handlers wake up.
            if (mainDate.tagName === 'SELECT') {
                mainDate.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
    
    // Sync travelers
    const mobileTravelers = document.getElementById('mobile_num_travelers');
    const mainTravelers = document.getElementById('num_travelers');
    if (mobileTravelers && mainTravelers) {
        mainTravelers.value = mobileTravelers.value;
    }

    // Sync traveler-based pricing (mobile selector -> desktop selector)
    const mobileTravelerInputs = document.querySelectorAll('#mobile-quantity-selector input[id^="mobile_traveler_"]');
    if (mobileTravelerInputs && mobileTravelerInputs.length > 0) {
        mobileTravelerInputs.forEach((input) => {
            const desktopId = input.id.replace(/^mobile_/, '');
            const desktopInput = document.getElementById(desktopId);
            if (desktopInput) {
                desktopInput.value = input.value;
            }
        });
    }
}

function updateMobileTotal() {
    const sidebar = document.getElementById('yatra-mobile-sticky-sidebar');
    if (!sidebar) return;
    
    const pricingType = (window.yatraTripData && window.yatraTripData.pricingType) ? window.yatraTripData.pricingType : 'regular';
    const mobileTotal = document.getElementById('mobile-total-amount');
    if (!mobileTotal) return;
    
    let total = 0;
    
    if (pricingType === 'traveler_based') {
        // Traveler-based pricing: sum all category quantities × prices
        const travelerInputs = document.querySelectorAll('[id^="mobile_traveler_"]');
        travelerInputs.forEach(input => {
            const qty = parseInt(input.value) || 0;
            const price = parseFloat(input.getAttribute('data-price')) || 0;
            total += qty * price;
        });
    } else {
        // Regular pricing: simple multiplication
        const travelersInput = document.getElementById('mobile_num_travelers');
        if (travelersInput) {
            const travelers = parseInt(travelersInput.value) || 1;
            const basePrice = parseFloat(travelersInput.getAttribute('data-price')) || 0;
            total = travelers * basePrice;
        }
    }
    
    // Format and update display (mobile total element has been removed)
    // The mobile total price display is no longer shown
    if (mobileTotal) {
        if (window.yatraTripData && window.yatraTripData.currencySymbol) {
            mobileTotal.textContent = window.yatraTripData.currencySymbol + total.toFixed(2);
        } else {
            mobileTotal.textContent = formatCurrency(total);
        }
    }
    
    // Also sync with main form total if it exists (main total also removed)
    const mainTotal = document.getElementById('total-amount');
    if (mainTotal && window.yatraTripData && window.yatraTripData.currencySymbol) {
        mainTotal.textContent = window.yatraTripData.currencySymbol + total.toFixed(2);
    }
}

function formatCurrency(amount) {
    // Simple currency formatting (can be enhanced)
    return '$' + amount.toFixed(2);
}

// Auto-hide on scroll down, show on scroll up (also works for enquiry-only sticky)
let lastScrollTop = 0;
const mobileSidebar = document.getElementById('yatra-mobile-sticky-sidebar');
const scrollThreshold = 100;

window.addEventListener('scroll', function() {
    if (!mobileSidebar) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        // Scrolling down - hide sidebar
        mobileSidebar.classList.add('hidden');
    } else {
        // Scrolling up - show sidebar
        mobileSidebar.classList.remove('hidden');
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, false);
