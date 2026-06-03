/**
 * Booking Page JavaScript
 *
 * Uses FormData API to automatically collect all form fields
 * and submit via REST API
 *
 * @package Yatra
 */

// Translation helper. Resolves through `wp.i18n.__` when WordPress's i18n
// runtime is enqueued (it is — `yatra-booking` declares `wp-i18n` as a
// dependency in FrontendAssetsProvider). Falls back to the source string if
// wp.i18n is unavailable so the page never breaks on older environments.
(function () {
    if (typeof window.__ === 'function') return;
    if (window.wp && window.wp.i18n && typeof window.wp.i18n.__ === 'function') {
        window.__ = function (text, domain) { return window.wp.i18n.__(text, domain || 'yatra'); };
        window._n = function (s, p, n, domain) { return window.wp.i18n._n(s, p, n, domain || 'yatra'); };
        window._x = function (text, ctx, domain) { return window.wp.i18n._x(text, ctx, domain || 'yatra'); };
        window.sprintf = window.sprintf || (window.wp.i18n.sprintf || function (fmt) { return fmt; });
    } else {
        window.__ = function (text) { return text; };
        window._n = function (s, p, n) { return n === 1 ? s : p; };
        window._x = function (text) { return text; };
        window.sprintf = window.sprintf || function (fmt) { return fmt; };
    }
})();

(function($) {
    'use strict';

    // API configuration - available throughout the module
    const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
    const nonce = window.yatraBookingData?.nonce || '';

    // Unified REST base resolver with plain-permalink support
    const getRestBase = () => {
        const siteUrl = window.yatraBookingData?.siteUrl || window.location.origin || '';
        let base =
            window.yatraBookingData?.apiUrl ||
            window.yatraBookingData?.restUrl ||
            (window.wpApiSettings && window.wpApiSettings.root) ||
            `${siteUrl.replace(/\/$/, '')}/wp-json`;
        base = base.replace(/\/$/, '');
        const permalinkStructure =
            window.yatraBookingData?.permalinkStructure ||
            window.yatraTripData?.permalinkStructure ||
            window.yatraAdmin?.permalinkStructure ||
            '';
        // Default to plain when structure is unknown to avoid 404s under Plain permalinks
        const isPlain = permalinkStructure === 'plain' || !permalinkStructure;
        return { base, isPlain };
    };

    $(document).ready(function() {
        const $form = $('#yatra-booking-form');
        const $submitBtn = $('#yatra-submit-booking');
        const isRemainingPayment = Boolean(window.yatraBookingData?.isRemainingPayment) || ($form.data('is-remaining-payment') === 'yes');
        const remainingAmount = isRemainingPayment
            ? parseFloat(window.yatraBookingData?.remainingAmount ?? $form.data('payment-due')) || 0
            : 0;
        const totalRemainingAmount = isRemainingPayment
            ? parseFloat(window.yatraBookingData?.totalAmount ?? (remainingAmount + (window.yatraBookingData?.amountPaid || 0))) || remainingAmount
            : null;
        
        // Get pricing data
        const pricePerPerson = parseFloat($('input[name="trip_price"]').val()) || window.yatraBookingData?.tripPrice || 0;
        // Use global currency from settings (prioritize yatraBookingData which uses global currency)
        const currency = window.yatraBookingData?.currency || $('input[name="currency"]').val() || 'USD';
        const depositPercentage = window.yatraBookingData?.depositPercentage || 20;
        const partialPercentage = window.yatraBookingData?.partialPercentage || 30;

        window.yatraBookingSummary = window.yatraBookingSummary || {};
        
        // Coupon state
        let appliedCoupon = null;
        
        // Group discount state (used for dynamic updates when traveler count changes)
        let appliedGroupDiscount = null;
        const groupDiscounts = window.yatraBookingData?.groupDiscounts || [];

        // Country options for dynamically added travelers
        const countryOptions = generateCountryOptions();

        /**
         * Generate country select options HTML.
         *
         * Each English country name is wrapped in `__()` so it's
         * extractable and translatable per WordPress conventions.
         * Keys (ISO 3166-1 alpha-2 codes) are untranslated, as they
         * should be — they're identifiers, not user-facing text.
         */
        function generateCountryOptions() {
            const countries = {
                'AF': __('Afghanistan', 'yatra'), 'AL': __('Albania', 'yatra'), 'DZ': __('Algeria', 'yatra'), 'AR': __('Argentina', 'yatra'),
                'AU': __('Australia', 'yatra'), 'AT': __('Austria', 'yatra'), 'BD': __('Bangladesh', 'yatra'), 'BE': __('Belgium', 'yatra'),
                'BR': __('Brazil', 'yatra'), 'BT': __('Bhutan', 'yatra'), 'CA': __('Canada', 'yatra'), 'CN': __('China', 'yatra'),
                'CO': __('Colombia', 'yatra'), 'CZ': __('Czech Republic', 'yatra'), 'DK': __('Denmark', 'yatra'), 'EG': __('Egypt', 'yatra'),
                'FI': __('Finland', 'yatra'), 'FR': __('France', 'yatra'), 'DE': __('Germany', 'yatra'), 'GR': __('Greece', 'yatra'),
                'HK': __('Hong Kong', 'yatra'), 'HU': __('Hungary', 'yatra'), 'IS': __('Iceland', 'yatra'), 'IN': __('India', 'yatra'),
                'ID': __('Indonesia', 'yatra'), 'IE': __('Ireland', 'yatra'), 'IL': __('Israel', 'yatra'), 'IT': __('Italy', 'yatra'),
                'JP': __('Japan', 'yatra'), 'KE': __('Kenya', 'yatra'), 'KR': __('South Korea', 'yatra'), 'MY': __('Malaysia', 'yatra'),
                'MV': __('Maldives', 'yatra'), 'MX': __('Mexico', 'yatra'), 'NL': __('Netherlands', 'yatra'), 'NZ': __('New Zealand', 'yatra'),
                'NP': __('Nepal', 'yatra'), 'NO': __('Norway', 'yatra'), 'PK': __('Pakistan', 'yatra'), 'PE': __('Peru', 'yatra'),
                'PH': __('Philippines', 'yatra'), 'PL': __('Poland', 'yatra'), 'PT': __('Portugal', 'yatra'), 'RO': __('Romania', 'yatra'),
                'RU': __('Russia', 'yatra'), 'SA': __('Saudi Arabia', 'yatra'), 'SG': __('Singapore', 'yatra'), 'ZA': __('South Africa', 'yatra'),
                'ES': __('Spain', 'yatra'), 'LK': __('Sri Lanka', 'yatra'), 'SE': __('Sweden', 'yatra'), 'CH': __('Switzerland', 'yatra'),
                'TW': __('Taiwan', 'yatra'), 'TH': __('Thailand', 'yatra'), 'TR': __('Turkey', 'yatra'), 'AE': __('United Arab Emirates', 'yatra'),
                'GB': __('United Kingdom', 'yatra'), 'US': __('United States', 'yatra'), 'VN': __('Vietnam', 'yatra')
            };

            let options = '<option value="">' + __('Select Country', 'yatra') + '</option>';
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
                const $row = $(this).closest('.yatra-quantity-row');
                const pricingMode = $(this).data('pricing-mode') || $row.data('pricing-mode') || 'per_person';
                const groupOverflow = $(this).data('group-overflow') || $row.data('group-overflow') || 'block';
                const maxPax = parseInt($(this).data('max-pax') || $row.data('max-pax')) || 0;

                if (pricingMode === 'per_group') {
                    // Per group: one flat price for the whole group, or one flat
                    // price per block of maxPax people when overflow is "per_block".
                    if (count > 0) {
                        total += (groupOverflow === 'per_block' && maxPax > 0)
                            ? price * Math.ceil(count / maxPax)
                            : price;
                    }
                } else {
                    // Per person: charge per traveler
                    total += count * price;
                }
            });
            return total;
        }
        
        /**
         * Debounce timer for AJAX calls
         */
        let summaryDebounceTimer = null;

        /**
         * Update the dropdown display text for traveler-based pricing
         */
        function updateTravelersDisplayText() {
            const parts = [];
            $('.yatra-qty-input[data-category-id]').each(function() {
                const count = parseInt($(this).val()) || 0;
                const categoryLabel = $(this).closest('.yatra-quantity-row').find('.yatra-quantity-title').text();
                if (count > 0) {
                    parts.push(sprintf(
                        /* translators: 1: traveler category label, 2: count. */
                        __('%1$s x %2$d', 'yatra'),
                        categoryLabel,
                        count
                    ));
                }
            });
            const displayText = parts.length > 0 ? parts.join(', ') : __('Select travelers', 'yatra');
            $('#yatra-travelers-display').text(displayText);
        }
        
        /**
         * Update display text for regular pricing
         */
        function updateRegularTravelersDisplayText(count) {
            $('#yatra-travelers-display-regular').text(sprintf(
                /* translators: %d: number of travelers on this booking. */
                _n('%d traveler', '%d travelers', count, 'yatra'),
                count
            ));
        }

        
        /**
         * Format currency
         */
        function formatCurrency(amount, currencyCode) {
            // Get currency formatting settings from global settings
            const currencyPosition = window.yatraBookingData?.currencyPosition || 'before';
            let decimalPlaces = parseInt(String(window.yatraBookingData?.decimalPlaces ?? '2'), 10);
            if (Number.isNaN(decimalPlaces)) {
                decimalPlaces = 2;
            }
            decimalPlaces = Math.max(0, Math.min(4, decimalPlaces));
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
         * Build JSON body for /booking/summary (payment method, travelers, services).
         * Keeps sidebar + window.yatraBookingSummary aligned with Pro flexible payments.
         */
        function buildPricingSummaryPayload() {
            const payload = {};
            const pm = $('input[name="payment_method"]:checked').val();
            if (pm) {
                payload.payment_method = pm;
            }
            const travelDate = $('#travel-date').val() || $('input[name="travel_date"]').first().val();
            if (travelDate) {
                payload.travel_date = travelDate;
            }
            const depTime = $('input[name="departure_time"]').first().val();
            if (depTime) {
                payload.departure_time = depTime;
            }
            if ($('.yatra-qty-input[data-category-id]').length) {
                const travelerCounts = {};
                $('.yatra-qty-input[data-category-id]').each(function() {
                    const catId = $(this).data('category-id');
                    travelerCounts[catId] = parseInt($(this).val(), 10) || 0;
                });
                payload.traveler_counts = travelerCounts;
            }
            const serviceIds = [];
            $('#yatra-additional-services input[type="checkbox"]:checked').each(function() {
                const id = parseInt($(this).closest('.yatra-service-item').data('service-id'), 10);
                if (!Number.isNaN(id)) {
                    serviceIds.push(id);
                }
            });
            if (serviceIds.length) {
                payload.additional_services = serviceIds;
            }
            const pricingType = $('#yatra-summary-pricing').data('pricing-type');
            if (pricingType) {
                payload.pricing_type = pricingType;
            }
            // Carry the page URL's booking_token into the summary refresh so
            // the REST controller can rehydrate the session from the matching
            // transient when PHPSESSID isn't carried into REST scope. Without
            // this, /booking/summary returns 400 "No active booking session
            // found." on every recalculation.
            try {
                const tok = new URLSearchParams(window.location.search).get('booking_token');
                if (tok) payload.booking_token = tok;
            } catch (e) { /* URLSearchParams unavailable — skip */ }
            return payload;
        }

        /**
         * Update pay button label and amount (offline gateways still show amount due for deposit/partial).
         */
        function updateCheckoutButtonState() {
            const $buttonText = $('#pay-button-text');
            const $payAmount = $('#pay-amount');
            const gateway = $('input[name="payment_gateway"]:checked').val() || 'pay_later';
            const offlineGateways = ['pay_later', 'bank_transfer'];
            const isOffline = offlineGateways.includes(gateway);
            const paymentMethod = $('input[name="payment_method"]:checked').val() || 'full';
            const summary = window.yatraBookingSummary || {};
            let due = parseFloat(summary.amountDue);
            const total = parseFloat(summary.totalAmount);
            if (Number.isNaN(due)) {
                due = parseFloat($form.attr('data-payment-due')) || 0;
            }
            let totalSafe = total;
            if (Number.isNaN(totalSafe)) {
                totalSafe = parseFloat($form.attr('data-payment-due')) || 0;
            }
            const flexDue = paymentMethod === 'deposit' || paymentMethod === 'partial';

            if (isOffline) {
                $buttonText.text(__('Complete Booking', 'yatra'));
                const showAmount = flexDue ? due : totalSafe;
                if (showAmount > 0) {
                    $payAmount.text(formatCurrency(showAmount, currency)).show();
                } else {
                    $payAmount.hide();
                }
            } else {
                $buttonText.text(__('Pay Now', 'yatra'));
                const payVal = flexDue && due > 0 ? due : totalSafe;
                if (payVal > 0) {
                    $payAmount.text(formatCurrency(payVal, currency)).show();
                } else {
                    $payAmount.hide();
                }
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
            $newTraveler.find('.yatra-traveler-title').text(
                /* translators: %d: traveler sequence number. */
                sprintf(__('Traveler %d', 'yatra'), index)
            );
            
            // Add "Additional traveler" note. The class wrapper is
            // markup (not translatable); only the visible label runs
            // through __() so translators see a clean msgid in the
            // pot rather than HTML noise.
            if (!$newTraveler.find('.yatra-traveler-note').length) {
                $newTraveler.find('.yatra-traveler-header').append(
                    '<span class="yatra-traveler-note">' + __('Additional traveler', 'yatra') + '</span>'
                );
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
                        // Array notation. PHP/HTML produces two flavours:
                        //   items[0], items[1]  → keyed indices
                        //   items[]             → push to end (multi-checkbox)
                        // The empty-string variant is what `<input name="additional_services[]">`
                        // sends when several checkboxes are selected. Previously
                        // we did `obj[base][""] = value` which silently overwrote
                        // on each entry and JSON-serialised to `[]` — so the
                        // server saw no selected services, even when boxes were
                        // checked.
                        if (!obj[base]) obj[base] = [];
                        if (index === '') {
                            obj[base].push(value);
                        } else {
                            obj[base][index] = value;
                        }
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
            if (isRemainingPayment) {
                return true;
            }

            let isValid = true;
            const errors = [];
            
            // Remove previous error states
            $form.find('.error').removeClass('error');
            $('.yatra-form-error').remove();
            
            // Validate all required fields
            $form.find('input[required], select[required], textarea[required]').each(function() {
                const $field = $(this);
                const type = ($field.attr('type') || '').toLowerCase();

                // Checkbox/radio: .val() returns the value attribute regardless of
                // checked state, so an unchecked required box would wrongly pass.
                // Test the checked state instead.
                let invalid;
                if (type === 'checkbox' || type === 'radio') {
                    invalid = !$field.is(':checked');
                } else {
                    const value = $field.val();
                    invalid = !value || value.trim() === '';
                }

                if (invalid) {
                    isValid = false;
                    $field.addClass('error');
                    const label = $field.closest('.yatra-form-group').find('label').text().replace('*', '').trim();
                    errors.push(sprintf(
                        /* translators: %s: form field label. */
                        __('%s is required', 'yatra'),
                        label
                    ));
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
                    errors.push(__('Please enter a valid email address', 'yatra'));
                }
            });
            
            // Validate terms checkbox
            if (!$('input[name="accept_terms"]').is(':checked')) {
                isValid = false;
                errors.push(__('Please accept the Terms and Conditions', 'yatra'));
            }
            
            // Validate privacy checkbox
            if (!$('input[name="accept_privacy"]').is(':checked')) {
                isValid = false;
                errors.push(__('Please accept the Privacy Policy', 'yatra'));
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
            const $errorContainer = $('#yatra-booking-form-errors');
            if ($errorContainer.length) {
                $errorContainer.html('<div class="yatra-form-error" role="alert">' + message + '</div>');
                $('html, body').animate({ scrollTop: $errorContainer.offset().top - 100 }, 300);
            } else {
                alert(message);
            }
        }

        /**
         * Show success message
         * @param {string} message
         * @param {string} reference
         * @param {{ heading?: string, footerHtml?: string, iconColor?: string }|undefined} opts
         */
        function showSuccessMessage(message, reference, opts) {
            opts = opts || {};
            const heading = opts.heading || __('Booking Confirmed!', 'yatra');
            const iconColor = opts.iconColor || '#22c55e';
            const confirmationEmailText = __('A confirmation email has been sent to your email address.', 'yatra');
            const footerHtml = opts.footerHtml !== undefined
                ? opts.footerHtml
                : '<p style="margin-top: 24px; color: #6b7280;">' + confirmationEmailText + '</p>';
            const referenceText = sprintf(
                /* translators: %s: booking reference number. */
                __('Reference: %s', 'yatra'),
                reference
            );
            const $success = $('<div class="yatra-booking-success" style="text-align: center; padding: 60px 20px;">' +
                '<svg style="width: 80px; height: 80px; color: ' + iconColor + '; margin-bottom: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10"></circle><polyline points="9,12 12,15 16,10"></polyline></svg>' +
                '<h2 style="font-size: 28px; margin-bottom: 12px; color: #111827;">' + heading + '</h2>' +
                '<p style="font-size: 18px; color: #6b7280; margin-bottom: 8px;">' + message + '</p>' +
                '<p style="font-size: 16px; color: #111827; font-weight: 600;">' + referenceText + '</p>' +
                footerHtml +
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
            
            // Update session via REST API (needs session cookie, but no nonce)
            const { base: restBase, isPlain } = getRestBase();
            const siteBase = (window.yatraBookingData?.siteUrl || window.location.origin || '').replace(/\/$/, '');
            let sessionUrl;
            if (isPlain) {
                sessionUrl = `${siteBase}/?rest_route=/yatra/v1/booking/session`;
            } else if (restBase.includes('/yatra/v1')) {
                sessionUrl = `${restBase}/booking/session`;
            } else {
                sessionUrl = `${restBase}/yatra/v1/booking/session`;
            }

            fetch(sessionUrl, {
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
                    return;
                }
                schedulePricingSummaryRefresh();
            })
            .catch(error => {
                console.error('Error updating booking session:', error);
            });
        }

        // Initial summary figures from server-rendered sidebar (before any AJAX)
        if (!isRemainingPayment) {
            const $sbInit = $('.yatra-booking-summary').first();
            if ($sbInit.length) {
                const t = parseFloat($sbInit.attr('data-summary-total'));
                const du = parseFloat($sbInit.attr('data-summary-due'));
                window.yatraBookingSummary = {
                    totalAmount: Number.isNaN(t) ? null : t,
                    amountDue: Number.isNaN(du) ? null : du,
                    amountPaid: 0
                };
            }
            updateCheckoutButtonState();
        }

        $(document).on('change', 'input[name="payment_method"]', function() {
            schedulePricingSummaryRefresh();
        });

        // Update when gateway changes
        $('input[name="payment_gateway"]').on('change', function() {
            
            // Show gateway-specific info
            const gateway = $(this).val();
            const $gatewayInfo = $('#yatra-gateway-info');
            const $gatewayDetails = $('#yatra-gateway-details');
            
            const gatewayMessages = {
                'pay_later': '<p>' + __('Your booking will be reserved. Full payment is required before the trip date.', 'yatra') + '</p>',
                'bank_transfer': '<p>' + __('After completing your booking, you will receive bank details via email. Your booking will be confirmed once payment is received.', 'yatra') + '</p>',
                'stripe': '<p>' + __('You will be securely redirected to complete your payment with credit or debit card.', 'yatra') + '</p>',
                'paypal': '<p>' + __('You will be redirected to PayPal to complete your payment securely.', 'yatra') + '</p>',
                'razorpay': '<p>' + __('You will be redirected to Razorpay to complete your payment.', 'yatra') + '</p>',
                'esewa': '<p>' + __('You will be redirected to eSewa to complete your payment.', 'yatra') + '</p>',
                'khalti': '<p>' + __('You will be redirected to Khalti to complete your payment.', 'yatra') + '</p>',
            };
            
            if (gatewayMessages[gateway] && $gatewayDetails.length) {
                $gatewayDetails.html(gatewayMessages[gateway]);
                $gatewayInfo.show();
            } else if ($gatewayInfo.length) {
                $gatewayInfo.hide();
            }

            updateCheckoutButtonState();

            // Toggle gateway-specific content containers
            $('.yatra-gateway-extra').removeClass('active');
            const $gatewayExtra = $('#yatra-gateway-extra-' + gateway);
            // Only show if it has content (children elements)
            if ($gatewayExtra.length && $gatewayExtra.children().length > 0) {
                $gatewayExtra.addClass('active');
            }
        });

        // Ensure default-selected gateway shows its content on load
        const $defaultGateway = $('input[name="payment_gateway"]:checked');
        if ($defaultGateway.length) {
            $defaultGateway.trigger('change');
        }

        /**
         * ============================================
         * CENTRALIZED PAYMENT GATEWAY HOOK SYSTEM
         * ============================================
         * 
         * Events:
         * - yatra_booking_submit: Fired when form is submitted, gateways can intercept
         * - yatra_payment_response: Fired when server responds with payment data
         * - yatra_payment_success: Fired when payment completes successfully
         * - yatra_payment_failed: Fired when payment fails
         * - yatra_payment_cancelled: Fired when user cancels payment
         */
        
        // Store for registered gateway handlers
        window.yatraPaymentGateways = window.yatraPaymentGateways || {};
        
        /**
         * Register a payment gateway handler
         * @param {string} gatewayId - Gateway identifier (e.g., 'stripe', 'razorpay')
         * @param {object} handler - Handler object with methods: canHandle, handlePayment
         */
        window.yatraRegisterPaymentGateway = function(gatewayId, handler) {
            
            window.yatraPaymentGateways[gatewayId] = handler;
        };
        
        /**
         * Handle payment response from server
         */
        function handlePaymentResponse(response, originalBtnHtml) {



            if (!response.success) {
                const errMsg = response.message || __('An error occurred. Please try again.', 'yatra');
                showFormError(errMsg);
                $submitBtn.prop('disabled', false).html(originalBtnHtml);
                return;
            }

            // Guest email verification path — booking is held in
            // pending_verification until the customer clicks the
            // magic link in their inbox. Render a "check your email"
            // success screen and DO NOT redirect to payment.
            if (response.code === 'email_verification_required') {
                const data = response.data || {};
                const reference = data.reference || __('N/A', 'yatra');
                const email = data.email || '';
                showSuccessMessage(
                    response.message || __("We've sent a verification email. Click the link to complete your booking.", 'yatra'),
                    reference,
                    {
                        heading: __('Check your email', 'yatra'),
                        iconColor: '#2563eb',
                        footerHtml:
                            '<p style="margin-top: 20px; color: #374151;">' +
                            __('We sent a verification link to:', 'yatra') +
                            ' <strong>' + (email || __('your email', 'yatra')) + '</strong>' +
                            '</p>' +
                            '<p style="margin-top: 12px; color: #6b7280; font-size: 14px;">' +
                            __("Didn't see it? Check your spam folder. The link expires in 48 hours.", 'yatra') +
                            '</p>'
                    }
                );
                return;
            }

            const data = response.data || {};

            if (data.waitlist) {
                const reference = data.reference || __('N/A', 'yatra');
                showSuccessMessage(
                    response.message || __("You're on the waitlist for this departure.", 'yatra'),
                    reference,
                    {
                        heading: __("You're on the waitlist", 'yatra'),
                        iconColor: '#ca8a04',
                        footerHtml: '<p style="margin-top: 24px; color: #6b7280;">' + __('We will contact you if a space opens up.', 'yatra') + '</p>'
                    }
                );
                return;
            }
            
            
            // Check for redirect URLs first (PayPal, eSewa, Khalti, etc.)
            if (data.payment_url) {
                
                window.location.href = data.payment_url;
                return;
            }
            
            if (data.redirect_url && !data.requires_action) {
                
                window.location.href = data.redirect_url;
                return;
            }
            
            // Check for client-side payment actions (Stripe, Razorpay, Square, etc.)
            if (data.requires_action) {
                
                
                // Dispatch unified payment event
                const paymentEvent = new CustomEvent('yatra_payment_response', {
                    detail: {
                        ...data,
                        originalBtnHtml,
                        resetButton: () => $submitBtn.prop('disabled', false).html(originalBtnHtml)
                    }
                });
                document.dispatchEvent(paymentEvent);
                
                // Setup failure/cancel listeners
                const cleanup = () => {
                    document.removeEventListener('yatra_payment_failed', onFailed);
                    document.removeEventListener('yatra_payment_cancelled', onCancelled);
                };
                const onFailed = (e) => {
                    showFormError(e.detail?.error || __('Payment failed. Please try again.', 'yatra'));
                    $submitBtn.prop('disabled', false).html(originalBtnHtml);
                    cleanup();
                };
                const onCancelled = () => {
                    $submitBtn.prop('disabled', false).html(originalBtnHtml);
                    cleanup();
                };
                document.addEventListener('yatra_payment_failed', onFailed, { once: true });
                document.addEventListener('yatra_payment_cancelled', onCancelled, { once: true });
                return;
            }
            
            // Default: show success message
            const reference = data.reference || __('N/A', 'yatra');
            showSuccessMessage(response.message || __('Success!', 'yatra'), reference);
        }

        // Form submission - using FormData API
        $form.on('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }

            const originalBtnHtml = $submitBtn.html();
            const selectedGateway = $('input[name="payment_gateway"]:checked').val();
            
            // Collect form data using FormData API
            const formData = new FormData(this);
            
            // Convert to structured object
            const bookingData = formDataToObject(formData);
            const summary = window.yatraBookingSummary || {};
            
            // Add checkbox values explicitly (unchecked checkboxes aren't in FormData)
            bookingData.accept_terms = $('input[name="accept_terms"]').is(':checked');
            bookingData.accept_privacy = $('input[name="accept_privacy"]').is(':checked');
            bookingData.subscribe_newsletter = $('input[name="subscribe_newsletter"]').is(':checked');
            bookingData.payment_due = parseFloat($form.attr('data-payment-due')) || window.yatraBookingData?.paymentDue || null;
            // The pay button uses a fallback chain (summary.totalAmount → data-summary-total
            // attribute → data-payment-due) so it can show "$279" even before the async
            // pricing refresh populates `summary.totalAmount`. The submit path must walk
            // the same chain — otherwise the button label and the request body disagree
            // and BookingService rejects with "Total amount must be greater than zero."
            const $summaryEl = $('.yatra-booking-summary').first();
            const resolveAmount = (preferred, attr) => {
                const n = Number(preferred);
                if (Number.isFinite(n) && n > 0) return n;
                const a = parseFloat($summaryEl.attr(attr));
                if (Number.isFinite(a) && a > 0) return a;
                return null;
            };
            bookingData.total_amount =
                resolveAmount(summary.totalAmount, 'data-summary-total') ??
                resolveAmount(summary.amountDue, 'data-summary-due') ??
                (parseFloat($form.attr('data-payment-due')) || null);
            bookingData.amount_due =
                resolveAmount(summary.amountDue, 'data-summary-due') ??
                (parseFloat($form.attr('data-payment-due')) || null);
            bookingData.amount_paid = summary.amountPaid ?? null;
            bookingData.currency = window.yatraBookingData?.currency || bookingData.currency || $('input[name="currency"]').val() || 'USD';
            // Carry the booking_token from the page URL into the REST request.
            // Without this the server's `create_booking` cannot rehydrate the
            // PHP session for the user (REST runs in a separate request and
            // PHPSESSID propagation isn't guaranteed). Server falls back to
            // looking up the transient by this token to recover `traveler_counts`,
            // `pricing_type`, `price_types` — without those, `calculatePricing`
            // returns 0 for `traveler_based` trips and the booking gets
            // rejected with "Total amount must be greater than zero."
            try {
                const urlToken = new URLSearchParams(window.location.search).get('booking_token');
                if (urlToken) {
                    bookingData.booking_token = urlToken;
                }
            } catch (e) { /* URLSearchParams missing — ignore */ }

            // Dispatch unified booking submit event - gateways can intercept
            const submitEvent = new CustomEvent('yatra_booking_submit', {
                detail: {
                    gateway: selectedGateway,
                    form: this,
                    bookingData,
                    submitButton: $submitBtn[0],
                    originalBtnHtml,
                    // Helper to proceed with default submission
                    proceedWithSubmission: () => submitBookingToServer(bookingData, originalBtnHtml)
                },
                cancelable: true
            });
            
            
            const shouldProceed = document.dispatchEvent(submitEvent);
            
            // If event was not cancelled, proceed with server submission
            if (shouldProceed) {
                submitBookingToServer(bookingData, originalBtnHtml);
            }
        });
        
        /**
         * Submit booking to server
         */
        function submitBookingToServer(bookingData, originalBtnHtml) {
            const { base: restBase, isPlain } = getRestBase();
            const siteBase = (window.yatraBookingData?.siteUrl || window.location.origin || '').replace(/\/$/, '');
            let createUrl;
            if (isPlain) {
                createUrl = `${siteBase}/?rest_route=/yatra/v1/booking/create`;
            } else if (restBase.includes('/yatra/v1')) {
                createUrl = `${restBase}/booking/create`;
            } else {
                createUrl = `${restBase}/yatra/v1/booking/create`;
            }

            // Show loading state
            $submitBtn.prop('disabled', true).html(
                '<svg class="animate-spin" style="display: inline-block; width: 20px; height: 20px; margin-right: 8px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle></svg>' +
                '<span>' + __('Processing...', 'yatra') + '</span>'
            );

            // CSRF protection — the booking REST endpoint's
            // permission_callback intentionally bypasses WP's default
            // cookie/nonce check (so guests can hit it at all). The
            // server validates this booking-scoped action nonce
            // instead. Falls back to the hidden form field on the
            // booking page when the localized var isn't present (e.g.
            // older cached scripts).
            const bookingNonce = window.yatraBookingData?.bookingNonce
                || $('input[name="yatra_booking_nonce"]').val()
                || '';

            fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                    'X-Yatra-Booking-Nonce': bookingNonce
                },
                credentials: 'same-origin',
                body: JSON.stringify(bookingData)
            })
            .then(response => response.json())
            .then(response => handlePaymentResponse(response, originalBtnHtml))
            .catch(error => {
                console.error('Error:', error);
                showFormError(__('An error occurred. Please try again.', 'yatra'));
                $submitBtn.prop('disabled', false).html(originalBtnHtml);
            });
        }
        
        // Toggle coupon form visibility
        $('#yatra-coupon-toggle-btn').on('click', function() {
            const $form = $('#yatra-coupon-form');
            const $chevron = $(this).find('.yatra-coupon-chevron');
            
            if ($form.is(':visible')) {
                $form.slideUp(200);
                $chevron.css('transform', 'rotate(0deg)');
            } else {
                $form.slideDown(200);
                $chevron.css('transform', 'rotate(180deg)');
                // Focus the input field
                setTimeout(() => $('#yatra-coupon-code').focus(), 200);
            }
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
                showCouponMessage(__('Please enter a coupon code.', 'yatra'), 'error');
                return;
            }
            
            // Show loading state
            $btn.prop('disabled', true).text(__('Applying...', 'yatra'));
            $message.hide();
            
            // Carry booking_token so the REST endpoint can rehydrate the
            // session in contexts where PHPSESSID isn't passed through —
            // same pattern as the service-toggle and summary refresh.
            const couponPayload = { code: code };
            try {
                const tok = new URLSearchParams(window.location.search).get('booking_token');
                if (tok) couponPayload.booking_token = tok;
            } catch (e) { /* URLSearchParams unavailable — skip */ }

            fetch(apiUrl + '/booking/coupon/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify(couponPayload)
            })
            .then(response => response.json())
            .then(response => {
                $btn.prop('disabled', false).text(__('Apply', 'yatra'));
                
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
                    showCouponMessage(response.message || __('Invalid coupon code.', 'yatra'), 'error');
                }
            })
            .catch(error => {
                console.error('Coupon error:', error);
                $btn.prop('disabled', false).text(__('Apply', 'yatra'));
                showCouponMessage(__('An error occurred. Please try again.', 'yatra'), 'error');
            });
        }
        
        function removeCoupon() {
            const $btn = $('#yatra-remove-coupon');
            
            $btn.prop('disabled', true);
            
            const removePayload = {};
            try {
                const tok = new URLSearchParams(window.location.search).get('booking_token');
                if (tok) removePayload.booking_token = tok;
            } catch (e) { /* URLSearchParams unavailable — skip */ }

            fetch(apiUrl + '/booking/coupon/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify(removePayload)
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
                    
                    // Refresh pricing summary via AJAX
                    refreshPricingSummary();
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
        
        function applySummaryResponse(response) {
            if (!response.success || !response.data) {
                return;
            }
            const d = response.data;
            if (d.pricing_html) {
                $('#yatra-summary-pricing').html(d.pricing_html);
            }
            window.yatraBookingSummary = {
                totalAmount: typeof d.total_amount === 'number' ? d.total_amount : parseFloat(d.total_amount),
                amountDue: typeof d.amount_due === 'number' ? d.amount_due : parseFloat(d.amount_due),
                amountPaid: typeof d.amount_paid === 'number' ? d.amount_paid : parseFloat(d.amount_paid || 0) || 0
            };
            const $sb = $('.yatra-booking-summary').first();
            if ($sb.length && !Number.isNaN(window.yatraBookingSummary.totalAmount)) {
                $sb.attr('data-summary-total', String(window.yatraBookingSummary.totalAmount));
            }
            if ($sb.length && !Number.isNaN(window.yatraBookingSummary.amountDue)) {
                $sb.attr('data-summary-due', String(window.yatraBookingSummary.amountDue));
                $form.attr('data-payment-due', String(window.yatraBookingSummary.amountDue));
            }
            updateCheckoutButtonState();
        }

        function refreshPricingSummary(extraPayload) {
            const { base: restBase, isPlain } = getRestBase();
            const siteBase = (window.yatraBookingData?.siteUrl || window.location.origin || '').replace(/\/$/, '');
            let summaryUrl;
            if (isPlain) {
                summaryUrl = `${siteBase}/?rest_route=/yatra/v1/booking/summary`;
            } else if (restBase.includes('/yatra/v1')) {
                summaryUrl = `${restBase}/booking/summary`;
            } else {
                summaryUrl = `${restBase}/yatra/v1/booking/summary`;
            }

            const body = Object.assign(buildPricingSummaryPayload(), extraPayload || {});

            fetch(summaryUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .then(response => {
                applySummaryResponse(response);
            })
            .catch(error => {
                console.error('Error refreshing pricing summary:', error);
            });
        }

        function schedulePricingSummaryRefresh() {
            if (isRemainingPayment) {
                return;
            }
            clearTimeout(summaryDebounceTimer);
            summaryDebounceTimer = setTimeout(function() {
                refreshPricingSummary();
            }, 250);
        }
        
        function updatePriceWithDiscount(couponData) {
            // Refresh pricing summary after coupon applied
            refreshPricingSummary();
        }

        /**
         * Load existing coupon from session and display it
         */
        function loadCouponFromSession() {
            const { base: restBase, isPlain } = getRestBase();
            const siteBase = (window.yatraBookingData?.siteUrl || window.location.origin || '').replace(/\/$/, '');
            let sessionUrl;
            if (isPlain) {
                sessionUrl = `${siteBase}/?rest_route=/yatra/v1/booking/session`;
            } else if (restBase.includes('/yatra/v1')) {
                sessionUrl = `${restBase}/booking/session`;
            } else {
                sessionUrl = `${restBase}/yatra/v1/booking/session`;
            }

            // Append booking_token from the page URL so the REST endpoint can
            // rehydrate the session via transient when PHPSESSID hasn't been
            // carried over — otherwise this GET returns "No active session"
            // and we never reveal the applied-coupon UI (and its remove
            // button) after a page refresh.
            try {
                const tok = new URLSearchParams(window.location.search).get('booking_token');
                if (tok) {
                    const sep = sessionUrl.includes('?') ? '&' : '?';
                    sessionUrl = sessionUrl + sep + 'booking_token=' + encodeURIComponent(tok);
                }
            } catch (e) { /* URLSearchParams unavailable — skip */ }

            fetch(sessionUrl, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
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
        
        // Trigger gateway change to show initial info
        $('input[name="payment_gateway"]:checked').trigger('change');
        
        // =====================
        // Additional Services Selection
        // =====================
        
        // Handle additional service checkbox changes
        $(document).on('change', '#yatra-additional-services input[type="checkbox"]', function() {
            const $checkbox = $(this);
            const $serviceItem = $checkbox.closest('.yatra-service-item');
            const serviceId = $serviceItem.data('service-id');
            const servicePrice = parseFloat($serviceItem.data('service-price')) || 0;
            const servicePricePer = $serviceItem.data('service-price-per') || 'booking';
            const isRequired = $serviceItem.data('is-required') === 1 || $serviceItem.data('is-required') === '1';
            const isChecked = $checkbox.is(':checked');
            
            // Prevent unchecking required services
            if (isRequired && !isChecked) {
                $checkbox.prop('checked', true);
                return;
            }
            
            // Update visual state
            if (isChecked) {
                $serviceItem.addClass('yatra-service-selected');
            } else {
                $serviceItem.removeClass('yatra-service-selected');
            }
            
            // Update booking session with selected services
            updateServicesInSession();
        });
        
        /**
         * Get selected additional services
         */
        function getSelectedServices() {
            const services = [];
            $('#yatra-additional-services input[type="checkbox"]:checked').each(function() {
                const $serviceItem = $(this).closest('.yatra-service-item');
                services.push({
                    id: parseInt($serviceItem.data('service-id')),
                    price: parseFloat($serviceItem.data('service-price')) || 0,
                    price_per: $serviceItem.data('service-price-per') || 'booking'
                });
            });
            return services;
        }
        
        /**
         * Update services in booking session
         */
        function updateServicesInSession() {
            const selectedServices = getSelectedServices();
            const serviceIds = selectedServices.map(s => s.id);
            
            const { base: restBase, isPlain } = getRestBase();
            let sessionUrl;
            if (isPlain && !restBase.includes('/yatra/v1')) {
                sessionUrl = `${restBase}/?rest_route=/yatra/v1/booking/session`;
            } else if (restBase.includes('/yatra/v1')) {
                sessionUrl = `${restBase}/booking/session`;
            } else {
                sessionUrl = `${restBase}/yatra/v1/booking/session`;
            }

            // Carry booking_token from URL so the REST endpoint can rehydrate
            // the session even when PHPSESSID hasn't propagated to the REST
            // context (root cause of the "POST /booking/session 400" we saw
            // on service-toggle). Matches the same pattern the /booking/create
            // submit uses.
            const sessionPayload = { additional_services: serviceIds };
            try {
                const tok = new URLSearchParams(window.location.search).get('booking_token');
                if (tok) sessionPayload.booking_token = tok;
            } catch (e) { /* URLSearchParams unavailable — skip */ }

            fetch(sessionUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify(sessionPayload)
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    schedulePricingSummaryRefresh();
                }
            })
            .catch(error => {
                console.error('Error updating services in session:', error);
            });
        }
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
                $messageEl.text(response.message || __('Login successful! Redirecting...', 'yatra'));
                $messageEl.show();
                
                // Reload page to show booking form
                setTimeout(function() {
                    window.location.reload();
                }, 1000);
            } else {
                $messageEl.removeClass('success').addClass('error');
                $messageEl.html(response.message || __('Invalid credentials. Please try again.', 'yatra'));
                $messageEl.show();
                
                // If email needs verification, show resend option
                if (response.needs_verification && response.email) {
                    const didntReceiveText = __("Didn't receive the email?", 'yatra');
                    const resendLinkText = __('Resend verification link', 'yatra');
                    const $resendLink = $('<div class="yatra-resend-verification" style="margin-top: 12px; text-align: center;">' +
                        '<span style="color: #6b7280; font-size: 14px;">' + didntReceiveText + ' </span>' +
                        '<button type="button" class="yatra-resend-btn" data-email="' + response.email + '" style="background: none; border: none; color: #3b82f6; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline;">' + resendLinkText + '</button>' +
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
            $messageEl.text(__('An error occurred. Please try again.', 'yatra'));
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
        $btn.prop('disabled', true).text(__('Sending...', 'yatra'));
        
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
                $messageEl.text(__('Please wait before requesting another email.', 'yatra'));
                $messageEl.show();
            } else {
                $messageEl.removeClass('success').addClass('error');
                $messageEl.text(response.message);
                $messageEl.show();
                $btn.prop('disabled', false).text(__('Resend verification link', 'yatra'));
            }
        })
        .catch(function() {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text(__('An error occurred. Please try again.', 'yatra'));
            $messageEl.show();
            $btn.prop('disabled', false).text(__('Resend verification link', 'yatra'));
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
                $btn.html(__('Resend verification link', 'yatra'));
                return;
            }
            
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timeStr = mins > 0 
                ? `${mins}:${secs.toString().padStart(2, '0')}` 
                : `${secs}s`;
            
            // Resend-OTP countdown label. The %s placeholder is the
            // remaining time as MM:SS — we wrap the literal so the
            // whole sentence translates, then slot the timer in via
            // replace() to avoid a dynamic msgid that gettext can't
            // extract.
            /* translators: %s is the remaining time (e.g. "0:45") before the verification code can be resent. */
            const resendTxt = __('Resend in %s', 'yatra').replace('%s', timeStr);
            $btn.html(`<span style="color: #9ca3af;">${resendTxt}</span>`);
            
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
            $messageEl.text(__('Passwords do not match.', 'yatra'));
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
                $messageEl.text(response.message || __('Account created! Please check your email to verify.', 'yatra'));
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
                        $loginMessage.text(__('Please check your email and click the verification link, then login here.', 'yatra'));
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
                $messageEl.text(response.message || __('Registration failed. Please try again.', 'yatra'));
                $messageEl.show();
                
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            }
        })
        .catch(function() {
            $messageEl.removeClass('success').addClass('error');
            $messageEl.text(__('An error occurred. Please try again.', 'yatra'));
            $messageEl.show();
            
            $btn.prop('disabled', false);
            $btnText.show();
            $btnLoading.hide();
        });
    });

    // End of document ready
})(jQuery);
