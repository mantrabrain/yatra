<?php
/**
 * Mobile Sticky Sidebar Template
 * 
 * Displays booking card in sticky bottom position on mobile devices
 * SEO-friendly approach - separate template, no content duplication
 *
 * @package Yatra
 */

if (!defined('ABSPATH')) {
    exit;
}

// Expected variables: $trip, $has_availability, $has_traveler_pricing, $base_price, $pricing_type

// Determine if this is a multi-day trip
$is_multi_day = ($trip->getDurationDays() ?? 1) > 1;

// Check for group discounts availability (premium feature)
$sidebar_has_group_discounts = false;
$sidebar_group_discounts_data = [];
try {
    if (class_exists('\Yatra\Services\DiscountService') &&
        method_exists('\Yatra\Services\DiscountService', 'getGroupDiscountsForTrip')) {
        $discountService = new \Yatra\Services\DiscountService();
        $groupDiscountsResult = $discountService->getGroupDiscountsForTrip((int) $trip->getId());
        if (!empty($groupDiscountsResult)) {
            $sidebar_has_group_discounts = true;
            $sidebar_group_discounts_data = $groupDiscountsResult;
        }
    }
} catch (\Exception $e) {
    $sidebar_has_group_discounts = false;
}

// Prepare availability data for JavaScript
$availability_json = [];
$booking_mode = $trip->getBookingMode();
if ($has_availability) {
    foreach ($trip->getAvailabilityDates() as $avail) {
        $availability_json[] = [
            'id' => (int) $avail->id,
            'date' => $avail->departure_date,
            'departure_date' => $avail->departure_date,
            'return_date' => (isset($avail->return_date) && $avail->return_date !== '')
                ? $avail->return_date
                : (isset($avail->arrival_date) ? $avail->arrival_date : null),
            'price' => $avail->effective_price ?? $avail->original_price,
            'original_price' => $avail->original_price,
            'discounted_price' => $avail->discounted_price,
            'seats_available' => $avail->seats_available,
            'seats_total' => $avail->seats_total,
            'status' => $avail->status,
            'is_limited' => $avail->is_limited ?? false,
            'is_sold_out' => $avail->is_sold_out ?? false,
        ];
    }
}

// Calculate pricing - use pre-computed values from SingleTripController
$pricing = [
    'has_price' => false,
    'current_price' => '',
    'original_price' => '',
    'price_prefix' => '',
    'has_discount' => false,
    'raw_current_price' => 0,
    'raw_original_price' => 0,
    'is_traveler_based' => $has_traveler_pricing
];

$discount = [
    'has_discount' => false,
    'discount_text' => '',
    'discount_percentage' => 0
];

// Use effective_price_min computed in SingleTripController
$effective_min = (float) ($trip->effective_price_min ?? 0);
$original_min = (float) ($trip->min_category_original_price ?? 0);
$max_discount_pct = (int) ($trip->max_discount_percentage ?? 0);

if ($effective_min > 0) {
    $pricing['has_price'] = true;
    $pricing['raw_current_price'] = $effective_min;
    $pricing['current_price'] = yatra_format_price($effective_min);

    if ($has_traveler_pricing || $has_availability) {
        $pricing['price_prefix'] = __('From ', 'yatra');
    }

    if ($max_discount_pct > 0 && $original_min > $effective_min) {
        $pricing['has_discount'] = true;
        $pricing['raw_original_price'] = $original_min;
        $pricing['original_price'] = yatra_format_price($original_min);

        $discount['has_discount'] = true;
        $discount['discount_percentage'] = $max_discount_pct;
        $discount['discount_text'] = sprintf(__('Up to %d%%', 'yatra'), $max_discount_pct);
    }
} else {
    $original = (float) ($trip->getOriginalPrice() ?? 0);
    $discounted = (float) ($trip->discounted_price ?? 0);

    if ($discounted > 0) {
        $current = $discounted;
    } elseif ($original > 0) {
        $current = $original;
    } elseif (!empty($trip->getSalePrice()) && (float)$trip->getSalePrice() > 0) {
        $current = (float) $trip->getSalePrice();
    } else {
        $current = 0;
    }

    if ($current > 0) {
        $pricing['has_price'] = true;
        $pricing['raw_current_price'] = $current;
        $pricing['current_price'] = yatra_format_price($current);

        if ($current < $original && $original > 0) {
            $pct = round((($original - $current) / $original) * 100);
            
            // Only show discount if percentage is greater than 0
            if ($pct > 0) {
                $pricing['has_discount'] = true;
                $pricing['raw_original_price'] = $original;
                $pricing['original_price'] = yatra_format_price($original);
                
                $discount['has_discount'] = true;
                $discount['discount_percentage'] = $pct;
                $discount['discount_text'] = sprintf(__('%d%%', 'yatra'), $pct);
            }
        }
    }
}
// Pro: check whether this trip has booking disabled (enquiry-only mode)
$booking_disabled = method_exists($trip, 'isBookingDisabled') && $trip->isBookingDisabled();
?>
<?php if ($booking_disabled): ?>
<div class="yatra-mobile-sticky-sidebar yatra-enquiry-only-sticky" id="yatra-mobile-sticky-sidebar">
    <div class="yatra-mobile-sticky-content">
        <div class="yatra-mobile-row-1" style="justify-content:space-between;align-items:center;">
            <div style="font-size:0.82rem;color:#1a5fa8;padding:0 4px;">
                <?php esc_html_e('Enquiry only — no direct booking', 'yatra'); ?>
            </div>
            <button type="button"
                    class="yatra-mobile-book-btn"
                    style="background:var(--yatra-primary,#3b82f6);"
                    onclick="window.YatraEnquiry?.open?.(); return false;">
                <?php esc_html_e('Send Enquiry', 'yatra'); ?>
            </button>
        </div>
    </div>
</div>
<?php else: ?>
<div class="yatra-mobile-sticky-sidebar" id="yatra-mobile-sticky-sidebar"
     data-has-availability="<?php echo $has_availability ? 'true' : 'false'; ?>"
     data-booking-mode="<?php echo esc_attr($booking_mode); ?>"
     data-is-multi-day="<?php echo $is_multi_day ? 'true' : 'false'; ?>"
     data-pricing-type="<?php echo esc_attr($pricing_type); ?>"
     data-availability='<?php echo esc_attr(json_encode($availability_json)); ?>'
     data-group-discounts='<?php echo esc_attr(json_encode($sidebar_group_discounts_data)); ?>'>
    <!-- Two-Row Layout -->
    <div class="yatra-mobile-sticky-content">

        <!-- Row 1: Compact fields + close (clean grid layout) -->
        <div class="yatra-mobile-row-1">

            <div class="yatra-mobile-date-section">
                <button type="button" class="yatra-mobile-field-btn yatra-mobile-date-btn" aria-label="<?php echo esc_attr__('Select date', 'yatra'); ?>">
                    <span class="yatra-mobile-field-icon" aria-hidden="true">
                        <?php echo yatra_svg_icon('calendar', 'yatra-mobile-icon'); ?>
                    </span>
                    <input type="text"
                           id="mobile_travel_date"
                           name="travel_date"
                           class="yatra-mobile-datepicker-input yatra-mobile-datepicker"
                           placeholder="<?php esc_attr_e('Date', 'yatra'); ?>"
                           data-min-date="<?php echo esc_attr($trip->getAvailableFrom() ?: date('Y-m-d')); ?>"
                           data-max-date="<?php echo esc_attr($trip->getAvailableTo() ?: ''); ?>"
                           readonly
                           required>
                    <svg class="yatra-mobile-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
            </div>

            <div class="yatra-mobile-travelers-section">
                <?php if ($has_traveler_pricing): ?>
                    <!-- Traveler-Based Pricing -->
                    <div class="yatra-mobile-booking-field">
                        <div class="yatra-mobile-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-mobile-icon'); ?>
                        </div>
                        <div class="yatra-mobile-travelers-display" id="mobile-travelers-display">
                            <?php
                            $default_label = null;
                            if (!empty($trip->price_types) && is_array($trip->price_types)) {
                                foreach ($trip->price_types as $pt) {
                                    $pt = is_array($pt) ? (object) $pt : $pt;
                                    if (!empty($pt->is_default)) {
                                        $default_label = !empty($pt->category_label) ? $pt->category_label : null;
                                        break;
                                    }
                                }
                                if ($default_label === null) {
                                    $pt0 = $trip->price_types[0];
                                    $pt0 = is_array($pt0) ? (object) $pt0 : $pt0;
                                    $default_label = !empty($pt0->category_label) ? $pt0->category_label : null;
                                }
                            }
                            echo esc_html(($default_label ?: __('Traveler', 'yatra')) . ' x 1');
                            ?>
                        </div>
                    </div>
                <?php else: ?>
                    <!-- Regular Pricing -->
                    <div class="yatra-mobile-booking-field">
                        <div class="yatra-mobile-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-mobile-icon'); ?>
                        </div>
                        <div class="yatra-mobile-quantity-controls">
                            <button type="button" class="yatra-mobile-quantity-btn yatra-mobile-quantity-minus" data-target="mobile_num_travelers">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                </svg>
                            </button>
                            <input type="number"
                                   id="mobile_num_travelers"
                                   name="num_travelers"
                                   class="yatra-mobile-quantity-input"
                                   value="1"
                                   min="<?php echo esc_attr($trip->getMinTravelers() ?: 1); ?>"
                                   max="<?php echo esc_attr($trip->getMaxTravelers() ?: 20); ?>"
                                   readonly
                                   data-price="<?php echo esc_attr($base_price); ?>">
                            <button type="button" class="yatra-mobile-quantity-btn yatra-mobile-quantity-plus" data-target="mobile_num_travelers">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Close Button (fixed in top-right of sticky container) -->
        <div class="yatra-mobile-action-buttons">
            <button type="button"
                    class="yatra-mobile-close-btn"
                    aria-label="<?php echo esc_attr__('Close', 'yatra'); ?>"
                    onclick="yatraCloseMobileSidebar()">
                <?php echo yatra_svg_icon('x', 'yatra-mobile-close-icon'); ?>
            </button>
        </div>

        <!-- Row 2: Primary Actions -->
        <div class="yatra-mobile-row-2">
            <button type="button" class="yatra-mobile-check-btn" id="mobile-check-availability-btn" data-trip-id="<?php echo esc_attr($trip->getId()); ?>">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span><?php echo esc_html__('Check', 'yatra'); ?></span>
            </button>
            <button type="button" class="yatra-mobile-enquire-btn" id="mobile-open-enquiry-modal" onclick="if (window.enquiryModal) { window.enquiryModal.open(); } else if (window.YatraEnquiry) { window.YatraEnquiry.open(); } return false;">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
                <span><?php echo esc_html__('Enquire', 'yatra'); ?></span>
            </button>
        </div>

            </div>
    
    </div>
<?php endif; // end else (booking not disabled) ?>

<!-- JavaScript for mobile sidebar interactions -->
<script>
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
    if (mobileDateInput) {
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
            
            var mobileFpCommon = {
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

    // Travelers: on traveler-based pricing, tap should open desktop selector (same behavior).
    const mobileSidebar = document.getElementById('yatra-mobile-sticky-sidebar');
    const pricingType = mobileSidebar ? mobileSidebar.getAttribute('data-pricing-type') : '';
    if (pricingType === 'traveler_based') {
        const mobilePeopleField = document.querySelector('.yatra-mobile-travelers-section .yatra-mobile-booking-field');
        if (mobilePeopleField) {
            mobilePeopleField.style.cursor = 'pointer';
            mobilePeopleField.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Scroll to desktop sidebar and open the participants selector dropdown.
                const sidebar = document.querySelector('.yatra-trip-sidebar');
                if (sidebar) {
                    sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                const participantsDisplay = document.getElementById('participants-display') ||
                    document.querySelector('.yatra-participants-display');
                if (participantsDisplay) {
                    participantsDisplay.click();
                }
            });
        }
    }
    
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
        }
    }
    
    // Sync travelers
    const mobileTravelers = document.getElementById('mobile_num_travelers');
    const mainTravelers = document.getElementById('num_travelers');
    if (mobileTravelers && mainTravelers) {
        mainTravelers.value = mobileTravelers.value;
    }
}

function updateMobileTotal() {
    const sidebar = document.getElementById('yatra-mobile-sticky-sidebar');
    if (!sidebar) return;
    
    const pricingType = sidebar.getAttribute('data-pricing-type');
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
</script>
