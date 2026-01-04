<?php
/**
 * Single Trip Template - Dynamic Version
 *
 * Industry-standard trip single page design following Laravel patterns.
 * Uses global $trip object (similar to WordPress $post).
 * All data comes from SingleTripController - no business logic in template.
 *
 * @package Yatra
 * @global object $trip Trip data object (set by AppServiceProvider)
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Access global $trip object (similar to WordPress $post)
global $trip;

// Bail if no trip data - return proper 404
if (!$trip) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

// Set up page title
add_filter('wp_title', function ($title) {
    global $trip;
    return esc_html($trip->title) . ' - ' . get_bloginfo('name');
}, 10, 1);

get_header();

// Calculate base price (for display) - used in hero, quick facts, sticky nav, and sidebar
// Check if availability dates exist (PRIORITY)
$has_availability = !empty($trip->availability_dates) && is_array($trip->availability_dates) && count($trip->availability_dates) > 0;

// Debug: Log how many availability dates are available for rendering
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('Yatra Debug: Template - Trip ID ' . ($trip->id ?? 'unknown') . ' - Rendering ' . count($trip->availability_dates ?? []) . ' availability dates');
}

// Determine pricing type from trip settings
$pricing_type = $trip->pricing_type ?? 'regular';
$has_traveler_pricing = ($pricing_type === 'traveler_based' && !empty($trip->price_types));

// Calculate base price (for display)
if ($has_availability) {
    // Get the lowest price from availability dates
    $min_price = PHP_FLOAT_MAX;
    foreach ($trip->availability_dates as $avail) {
        $avail_price = $avail->effective_price ?? $avail->original_price ?? 0;
        if ($avail_price > 0 && $avail_price < $min_price) {
            $min_price = $avail_price;
        }

        // Also check price_types within availability if traveler-based
        if (!empty($avail->price_types) && is_array($avail->price_types)) {
            foreach ($avail->price_types as $pt) {
                $pt = (object)$pt;
                $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                if ($pt_price > 0 && $pt_price < $min_price) {
                    $min_price = $pt_price;
                }
            }
        }
    }

    // If no price found from availability, check traveler-based pricing
    if ($min_price >= PHP_FLOAT_MAX && $has_traveler_pricing) {
        foreach ($trip->price_types as $pt) {
            $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
            if ($pt_price > 0 && $pt_price < $min_price) {
                $min_price = $pt_price;
            }
        }
    }

    $base_price = ($min_price < PHP_FLOAT_MAX) ? $min_price : ($trip->sale_price ?: $trip->original_price);
} elseif ($has_traveler_pricing) {
    // Get default or first traveler category price
    $default_price_type = null;
    foreach ($trip->price_types as $pt) {
        if (!empty($pt->is_default)) {
            $default_price_type = $pt;
            break;
        }
    }
    if (!$default_price_type && !empty($trip->price_types)) {
        $default_price_type = $trip->price_types[0];
    }

    // Get the price from the price type - check multiple possible fields
    if ($default_price_type) {
        $base_price = 0;
        // Try effective_price first, then discounted_price, then original_price
        if (!empty($default_price_type->effective_price) && $default_price_type->effective_price > 0) {
            $base_price = (float)$default_price_type->effective_price;
        } elseif (!empty($default_price_type->discounted_price) && $default_price_type->discounted_price > 0) {
            $base_price = (float)$default_price_type->discounted_price;
        } elseif (!empty($default_price_type->original_price) && $default_price_type->original_price > 0) {
            $base_price = (float)$default_price_type->original_price;
        } elseif (!empty($default_price_type->sale_price) && $default_price_type->sale_price > 0) {
            $base_price = (float)$default_price_type->sale_price;
        }

        // If still no price, try to get the minimum from all price types
        if ($base_price <= 0) {
            foreach ($trip->price_types as $pt) {
                $pt_price = (float)($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                if ($pt_price > 0 && ($base_price <= 0 || $pt_price < $base_price)) {
                    $base_price = $pt_price;
                }
            }
        }
    } else {
        $base_price = $trip->sale_price ?: $trip->original_price;
    }
} else {
    // Regular pricing
    $base_price = $trip->sale_price > 0 ? $trip->sale_price : $trip->original_price;
}

// Apply dynamic pricing if module is enabled
if (!empty($base_price) && apply_filters('yatra_dynamic_pricing_enabled', false)) {
    $base_price = apply_filters('yatra_trip_display_price', $base_price, $trip->id ?? 0, [
        'departure_date' => null, // Generic display for single trip page
        'spots_remaining' => null,
    ]);
}
?>

<!-- Flatpickr CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<!-- Flatpickr JS -->
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script>
    // Initialize date pickers when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        // Main booking form date picker
        const bookingDateInput = document.getElementById('travel_date');
        if (bookingDateInput) {
            const form = bookingDateInput.closest('.yatra-booking-form');
            const bookingMode = form ? form.getAttribute('data-booking-mode') : 'regular';

            if (bookingMode === 'availability') {
                // Availability-based: Only specific dates
                const availabilityDates = <?php echo json_encode(array_map(function ($avail) {
                    return $avail->departure_date ?? $avail->date;
                }, $trip->availability_dates ?? [])); ?>;

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
</script>

<div class="yatra-single-trip">

    <!-- Category, Activity, Destination Tags -->

    <?php

    yatra_get_template('partials/single-trip/hero', ['trip' => $trip, 'base_price' => $base_price]);


    $destinations = isset($trip->destinations) ? $trip->destinations : [];
    $activities = isset($trip->activities) ? $trip->activities : [];
    $trip_categories = isset($trip->trip_categories) ? $trip->trip_categories : [];
    ?>
    <?php if (!empty($trip_categories) || !empty($activities) || !empty($destinations)):

        yatra_get_template('partials/single-trip/tags', ['trip' => $trip, 'trip_categories' => $trip_categories, 'activities' => $activities, 'destinations' => $destinations]);
        ?>

    <?php endif;

    yatra_get_template('partials/single-trip/quick-facts', ['trip' => $trip]);


    if (!empty($trip->attributes)):
        yatra_get_template('partials/single-trip/trip-attributes', ['trip' => $trip]);
    endif; ?>

    <!-- Sticky Navigation Bar -->
    <?php
    yatra_get_template('partials/single-trip/sticky-nav', ['trip' => $trip, 'base_price' => $base_price, 'has_availability' => $has_availability, 'has_traveler_pricing' => $has_traveler_pricing]);

    yatra_get_template('partials/single-trip/gallery-modal', ['trip' => $trip]);

    ?>
    <!-- Gallery Modal -->


    <!-- Main Container -->
    <div class="yatra-trip-container">
        <!-- Main Content -->
        <div class="yatra-trip-main">
            <!-- Overview Section -->
            <?php
            yatra_get_template('partials/single-trip/content-overview', ['trip' => $trip, 'has_traveler_pricing' => $has_traveler_pricing, 'has_availability' => $has_availability, 'base_price' => $base_price]);

            ?>


            <!-- What Makes This Trip Special Section -->
            <?php if (!empty($trip->what_makes_special ?? '')):
                yatra_get_template('partials/single-trip/content-whats-make-special', ['trip' => $trip]);

            endif; ?>

            <!-- Trip Details Section -->
            <?php
            yatra_get_template('partials/single-trip/content-trip-details', ['trip' => $trip]);
            yatra_get_template('partials/single-trip/content-itinerary', ['trip' => $trip]);
            ?>

            <!-- Itinerary Section -->


            <!-- What's Included/Excluded -->
            <?php if (!empty($trip->included_items) || !empty($trip->excluded_items)):
                yatra_get_template('partials/single-trip/content-included-excluded', ['trip' => $trip]);
            endif; ?>

            <!-- Gallery Section -->
            <?php if (!empty($trip->gallery_images) && is_array($trip->gallery_images)):
                yatra_get_template('partials/single-trip/content-gallery', ['trip' => $trip]);
            endif; ?>

            <!-- Location/Map Section -->
            <?php
            yatra_get_template('partials/single-trip/content-location', ['trip' => $trip]);
            yatra_get_template('partials/single-trip/content-important-info', ['trip' => $trip]);
            ?>

            <!-- Important Information Section -->


            <!-- FAQ Section -->
            <?php if (!empty($trip->faqs) && is_array($trip->faqs)):
                yatra_get_template('partials/single-trip/content-faq', ['trip' => $trip]);
            endif; ?>

        </div>

        <!-- Sidebar - Booking Card -->
        <?php
        yatra_get_template('partials/single-trip/content-sidebar', ['trip' => $trip, 'has_availability' => $has_availability, 'has_traveler_pricing' => $has_traveler_pricing, 'base_price' => $base_price, 'pricing_type' => $trip->pricing_type]);
        ?>

    </div>
    <!-- End of Main Container -->

    <!-- Group Discount Section -->
    <?php
    // Check for group discounts availability
    $has_group_discounts = false;
    $group_discounts_data = [];
    try {
        // Call the group discount API to get detailed discount information
        $api_url = rest_url('yatra/v1/discounts/group-discounts');
        $response = wp_remote_post($api_url, [
            'method' => 'GET',
            'body' => [
                'trip_ids' => [$trip->id]
            ],
            'headers' => [
                'Content-Type' => 'application/json',
            ],
        ]);

        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($data[$trip->id]) && $data[$trip->id]['has_group_discounts']) {
                $has_group_discounts = true;
                $group_discounts_data = $data[$trip->id]['discounts'];
            }
        }
    } catch (Exception $e) {
        // Silently fail if API call fails - don't break the page
        $has_group_discounts = false;
    }
    ?>

    <?php if ($has_group_discounts && !empty($group_discounts_data)):
        yatra_get_template('partials/single-trip/group-discounts', ['trip' => $trip, 'group_discounts_data' => $group_discounts_data]);

    endif;
    yatra_get_template('partials/single-trip/similar-trips', ['trip' => $trip]);

    ?>


    <!-- Reviews Section - Full Width -->
    <?php if (yatra_reviews_enabled()):
        yatra_get_template('partials/single-trip/reviews', ['trip' => $trip]);
    endif; ?>
</div>

<!-- Enquiry Modal -->


<?php
yatra_get_template('partials/single-trip/enquiry-modal', ['trip' => $trip]);

get_footer();
?>

<script>
    // Group Discount Calculation for Booking Widget
    document.addEventListener('DOMContentLoaded', function () {
        const bookingForm = document.querySelector('.yatra-booking-form');
        const totalAmountElement = document.getElementById('total-amount');
        const travelerInputs = document.querySelectorAll('input[name*="travelers["], input[name="num_travelers"]');
        let currentGroupDiscounts = null;

        // Load group discounts for this trip
        async function loadGroupDiscounts() {
            try {
                const response = await fetch('<?php echo esc_url(rest_url('yatra/v1/discounts/group-discounts')); ?>', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        trip_ids: [<?php echo (int)$trip->id; ?>]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data[<?php echo (int)$trip->id; ?>] && data[<?php echo (int)$trip->id; ?>].has_group_discounts) {
                        currentGroupDiscounts = data[<?php echo (int)$trip->id; ?>].discounts;
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

        // Get traveler counts by category
        function getTravelerCountsByCategory() {
            const counts = {adults: 0, children: 0, seniors: 0};

            document.querySelectorAll('input[name*="travelers["]').forEach(input => {
                const name = input.name;
                if (name.includes('[adults]')) {
                    counts.adults = parseInt(input.value) || 0;
                } else if (name.includes('[children]')) {
                    counts.children = parseInt(input.value) || 0;
                } else if (name.includes('[seniors]')) {
                    counts.seniors = parseInt(input.value) || 0;
                }
            });

            return counts;
        }

        // Get price multiplier for traveler category
        function getCategoryMultiplier(category) {
            const multipliers = {
                adults: 1.0,
                children: 0.8,  // 80% of adult price
                seniors: 0.9    // 90% of adult price
            };
            return multipliers[category] || 1.0;
        }

        // Update pricing display
        function updatePricing() {
            const totalTravelers = calculateTotalTravelers();
            const basePrice = <?php echo (float)$base_price; ?>;

            // Calculate subtotal
            let subtotal = 0;

            if (document.querySelector('input[name*="travelers["]')) {
                // Traveler-based pricing
                const travelerCounts = getTravelerCountsByCategory();
                for (const [category, count] of Object.entries(travelerCounts)) {
                    if (count > 0) {
                        const multiplier = getCategoryMultiplier(category);
                        subtotal += basePrice * multiplier * count;
                    }
                }
            } else {
                // Simple pricing
                subtotal = basePrice * totalTravelers;
            }

            // Calculate group discount
            const groupDiscount = calculateGroupDiscount(totalTravelers, basePrice);
            const finalTotal = subtotal - groupDiscount;

            // Update display
            if (totalAmountElement) {
                totalAmountElement.textContent = '<?php echo yatra_get_currency_symbol($trip->currency ?? 'USD'); ?>' + finalTotal.toFixed(2);
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
                    Group discount applied: -<?php echo yatra_get_currency_symbol(); ?>${discountAmount.toFixed(2)}
                </div>
            `;
            } else if (indicator) {
                indicator.remove();
            }
        }

        // Initialize
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
    });
</script>

</div>
<!-- End of yatra-single-trip -->