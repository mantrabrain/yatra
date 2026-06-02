/**
 * Yatra Trip Listing Filters - URL-based filtering system
 * 
 * This script handles all filter interactions and updates the URL parameters
 * to trigger server-side filtering with page reload for SEO and bookmarkability.
 */

(function() {
    'use strict';

    function showListingLoading() {
        var el = document.getElementById('yatra-listing-loading-overlay');
        if (el) {
            el.classList.add('yatra-listing-loading-overlay--visible');
            el.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Remove all trip-attribute filter params (attributes[ID]…) from the URL.
     */
    function stripAttributeParamsFromUrl(url) {
        var toRemove = [];
        url.searchParams.forEach(function(_, key) {
            if (key.indexOf('attributes[') === 0) {
                toRemove.push(key);
            }
        });
        toRemove.forEach(function(key) {
            url.searchParams.delete(key);
        });
    }

    /**
     * Parse name="attributes[12]", attributes[12][], attributes[12][min], etc.
     */
    function parseAttributeInputName(name) {
        var m = String(name).match(/^attributes\[(\d+)\](.*)$/);
        if (!m) {
            return null;
        }
        var id = m[1];
        var tail = m[2] || '';
        if (tail === '' || tail === '[]') {
            return { id: id, mode: tail === '[]' ? 'multi' : 'single' };
        }
        var sm = tail.match(/^\[(min|max|from|to)\]$/);
        if (sm) {
            return { id: id, mode: 'range', sub: sm[1] };
        }
        return null;
    }

    /**
     * Read current trip-attribute filter values from the sidebar for URL rebuild.
     */
    function collectAttributeFilters() {
        var sidebar = document.querySelector('.yatra-filter-sidebar');
        if (!sidebar) {
            return {};
        }

        var byId = {};

        sidebar.querySelectorAll('input[name^="attributes["]').forEach(function(el) {
            var parsed = parseAttributeInputName(el.getAttribute('name'));
            if (!parsed) {
                return;
            }
            var id = parsed.id;

            if (parsed.mode === 'range') {
                if (!byId[id] || byId[id].type === 'empty') {
                    byId[id] = { type: 'range', parts: {} };
                }
                if (byId[id].type !== 'range') {
                    return;
                }
                var rv = String(el.value || '').trim();
                if (rv !== '') {
                    byId[id].parts[parsed.sub] = rv;
                }
                return;
            }

            if (el.type === 'checkbox') {
                if (!el.checked) {
                    return;
                }
                if (parsed.mode === 'multi') {
                    if (!byId[id] || byId[id].type === 'empty') {
                        byId[id] = { type: 'multi', values: [] };
                    }
                    if (byId[id].type !== 'multi') {
                        return;
                    }
                    byId[id].values.push(el.value);
                } else {
                    byId[id] = { type: 'single', value: el.value || '1' };
                }
                return;
            }

            if (parsed.mode === 'single' && (el.type === 'text' || el.type === 'search' || el.type === 'number' || el.type === 'date')) {
                var sv = String(el.value || '').trim();
                if (sv !== '') {
                    byId[id] = { type: 'single', value: sv };
                }
            }
        });

        var out = {};
        Object.keys(byId).forEach(function(id) {
            var slot = byId[id];
            if (!slot || slot.type === 'empty') {
                return;
            }
            if (slot.type === 'multi' && slot.values.length) {
                out[id] = { kind: 'multi', values: slot.values };
            } else if (slot.type === 'single') {
                out[id] = { kind: 'single', value: slot.value };
            } else if (slot.type === 'range') {
                var keys = Object.keys(slot.parts);
                if (keys.length) {
                    out[id] = { kind: 'range', parts: slot.parts };
                }
            }
        });

        return out;
    }

    function appendAttributeFiltersToUrl(url, attrMap) {
        Object.keys(attrMap).forEach(function(id) {
            var entry = attrMap[id];
            if (entry.kind === 'multi') {
                entry.values.forEach(function(v) {
                    url.searchParams.append('attributes[' + id + '][]', v);
                });
            } else if (entry.kind === 'single') {
                url.searchParams.set('attributes[' + id + ']', entry.value);
            } else if (entry.kind === 'range') {
                Object.keys(entry.parts).forEach(function(sub) {
                    url.searchParams.set('attributes[' + id + '][' + sub + ']', entry.parts[sub]);
                });
            }
        });
    }

    /**
     * Text / number / date attribute fields: no separate "Apply" button — same model as price (apply on change).
     */
    function initializeAttributeFieldFilters() {
        var sidebar = document.querySelector('.yatra-filter-sidebar');
        if (!sidebar) {
            return;
        }
        sidebar.querySelectorAll('input[name^="attributes["]').forEach(function(input) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                return;
            }
            input.addEventListener('change', function() {
                updateFiltersFromForm();
            });
            if (input.type === 'text' || input.type === 'search') {
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        updateFiltersFromForm();
                    }
                });
            }
        });
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeFilters();
        initPaginationLoadingClicks();
    });

    /**
     * Expand/collapse long checkbox lists in the sidebar ("Show more" / "Show less").
     */
    function initializeFilterCollapsibles() {
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.yatra-filter-show-more-toggle');
            if (!btn) {
                return;
            }
            var group = btn.closest('.yatra-filter-collapsible');
            if (!group) {
                return;
            }
            var expanded = group.classList.toggle('is-expanded');
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    }

    function initializeFilters() {
        // Initialize all filter components
        initializeCheckboxFilters();
        initializeRadioFilters();
        initializePriceRangeFilter();
        initializeRatingFilter();
        initializeAttributeFieldFilters();
        initializeClearFilters();
        initializeFilterToggle();
        initializeFilterCollapsibles();
        
        // Set initial filter states from URL
        setFiltersFromURL();
        initTaxonomyTripContextUi();
        initSortSelectNavigation();
    }

    /**
     * Sync legacy horizontal search dropdowns when arriving from a taxonomy URL (data on #yatra-trip-context).
     */
    function initTaxonomyTripContextUi() {
        var ctxEl = document.getElementById('yatra-trip-context');
        if (!ctxEl) {
            return;
        }
        var type = ctxEl.getAttribute('data-type');
        var slug = ctxEl.getAttribute('data-slug');
        var name = ctxEl.getAttribute('data-name');
        if (!type || !slug) {
            return;
        }
        if (type === 'destination') {
            var destDropdown = document.querySelector('.yatra-search-dropdown[data-dropdown="destination"]');
            if (destDropdown) {
                var valueEl = destDropdown.querySelector('.yatra-dropdown-value');
                if (valueEl && name) {
                    valueEl.textContent = name;
                }
                var option = destDropdown.querySelector('.yatra-dropdown-option[data-value="' + slug + '"]');
                if (option) {
                    option.classList.add('active');
                }
            }
        }
        if (type === 'activity') {
            var actDropdown = document.querySelector('.yatra-search-dropdown[data-dropdown="activities"]');
            if (actDropdown) {
                var valueEl2 = actDropdown.querySelector('.yatra-dropdown-value');
                if (valueEl2 && name) {
                    valueEl2.textContent = name;
                }
                var option2 = actDropdown.querySelector('.yatra-dropdown-option[data-value="' + slug + '"]');
                if (option2) {
                    option2.classList.add('active');
                }
            }
        }
    }

    function initSortSelectNavigation() {
        var sortEl = document.getElementById('yatra-sort-filter');
        if (!sortEl) {
            return;
        }
        sortEl.addEventListener('change', function() {
            if (this.value) {
                showListingLoading();
                window.location.href = this.value;
            }
        });
    }

    /**
     * Initialize checkbox-based filters (categories, destinations, activities, etc.)
     */
    function initializeCheckboxFilters() {
        const checkboxes = document.querySelectorAll('.yatra-filter-sidebar input[type="checkbox"]');
        
        checkboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                // Small delay to allow UI update
                setTimeout(function() {
                    updateFiltersFromForm();
                }, 100);
            });
        });
    }

    /**
     * Initialize radio-based filters (trip type, etc.)
     */
    function initializeRadioFilters() {
        const radioButtons = document.querySelectorAll('.yatra-filter-sidebar input[type="radio"]');
        
        radioButtons.forEach(function(radio) {
            radio.addEventListener('change', function() {
                // Small delay to allow UI update
                setTimeout(function() {
                    updateFiltersFromForm();
                }, 100);
            });
        });
    }

    /**
     * Initialize price range filter with sliders and inputs
     */
    function initializePriceRangeFilter() {
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');
        const minSlider = document.getElementById('priceRangeMin');
        const maxSlider = document.getElementById('priceRangeMax');
        const priceDisplay = document.querySelector('.yatra-price-display');
        const priceRangeEl = document.querySelector('.yatra-price-slider-range');

        if (!minInput || !maxInput || !minSlider || !maxSlider) return;

        function updatePriceRangeVisual() {
            if (!priceRangeEl) {
                return;
            }
            var lo = parseInt(minSlider.min, 10);
            var hi = parseInt(maxSlider.max, 10);
            if (isNaN(lo) || isNaN(hi) || hi <= lo) {
                return;
            }
            var span = hi - lo;
            var min = parseInt(minSlider.value, 10);
            var max = parseInt(maxSlider.value, 10);
            var minPercent = ((min - lo) / span) * 100;
            var maxPercent = ((max - lo) / span) * 100;
            priceRangeEl.style.left = minPercent + '%';
            priceRangeEl.style.width = Math.max(0, maxPercent - minPercent) + '%';
        }

        // Sync inputs with sliders
        function syncInputsWithSliders() {
            const minVal = parseInt(minSlider.value);
            const maxVal = parseInt(maxSlider.value);
            
            // Ensure min doesn't exceed max
            if (minVal >= maxVal) {
                minSlider.value = maxVal - 1;
            }
            
            // Ensure max doesn't go below min
            if (maxVal <= minVal) {
                maxSlider.value = minVal + 1;
            }
            
            minInput.value = minSlider.value;
            maxInput.value = maxSlider.value;
            
            updatePriceDisplay();
        }

        // Sync sliders with inputs
        function syncSlidersWithInputs() {
            const minVal = parseInt(minInput.value) || parseInt(minSlider.min);
            const maxVal = parseInt(maxInput.value) || parseInt(maxSlider.max);
            
            minSlider.value = Math.max(minVal, parseInt(minSlider.min));
            maxSlider.value = Math.min(maxVal, parseInt(maxSlider.max));
            
            syncInputsWithSliders();
        }

        // Update price display
        function updatePriceDisplay() {
            if (priceDisplay && window.yatra_format_price) {
                const minPrice = parseInt(minSlider.value);
                const maxPrice = parseInt(maxSlider.value);
                priceDisplay.textContent = window.yatra_format_price(minPrice) + ' - ' + window.yatra_format_price(maxPrice);
            }
            updatePriceRangeVisual();
        }

        // Event listeners
        minSlider.addEventListener('input', syncInputsWithSliders);
        maxSlider.addEventListener('input', syncInputsWithSliders);
        minInput.addEventListener('input', syncSlidersWithInputs);
        maxInput.addEventListener('input', syncSlidersWithInputs);

        /* Dual range: bring active thumb above so it stays grabbable when handles overlap */
        function elevateThumb(el) {
            minSlider.style.zIndex = el === minSlider ? '6' : '4';
            maxSlider.style.zIndex = el === maxSlider ? '6' : '4';
        }
        function resetThumbStack() {
            minSlider.style.zIndex = '';
            maxSlider.style.zIndex = '';
        }
        minSlider.addEventListener('pointerdown', function() {
            elevateThumb(minSlider);
        });
        maxSlider.addEventListener('pointerdown', function() {
            elevateThumb(maxSlider);
        });
        document.addEventListener('pointerup', resetThumbStack);
        document.addEventListener('pointercancel', resetThumbStack);

        // Apply filters on change (with debounce)
        let priceTimeout;
        function debouncedPriceUpdate() {
            clearTimeout(priceTimeout);
            priceTimeout = setTimeout(function() {
                updateFiltersFromForm();
            }, 500); // 500ms delay for price changes
        }

        minSlider.addEventListener('change', debouncedPriceUpdate);
        maxSlider.addEventListener('change', debouncedPriceUpdate);
        minInput.addEventListener('change', debouncedPriceUpdate);
        maxInput.addEventListener('change', debouncedPriceUpdate);

        updatePriceDisplay();
    }

    /**
     * Initialize rating filter
     */
    function initializeRatingFilter() {
        const ratingCheckboxes = document.querySelectorAll('input[name="rating[]"]');
        
        ratingCheckboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                setTimeout(function() {
                    updateFiltersFromForm();
                }, 100);
            });
        });
    }

    /**
     * Initialize clear filters functionality
     */
    function initializeClearFilters() {
        const clearButton = document.querySelector('.yatra-clear-filters');
        
        if (clearButton) {
            // Remove any existing listeners to prevent conflicts
            clearButton.replaceWith(clearButton.cloneNode(true));
            const newClearButton = document.querySelector('.yatra-clear-filters');
            
            newClearButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                 // Debug log
                clearAllFilters();
            });
        } else {
             // Debug log
        }

        // Initialize individual section clear buttons
        const sectionClearButtons = document.querySelectorAll('.yatra-clear-section');
        
        sectionClearButtons.forEach(function(button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent filter toggle
                const section = this.getAttribute('data-section');
                clearFilterSection(section);
            });
        });
    }

    /**
     * Initialize filter section toggle functionality.
     *
     * Uses event delegation on `document` rather than binding to each
     * .yatra-filter-title once at load. Two reasons:
     *
     *   1. Robust to re-renders: when a filter changes the listing
     *      area may re-fetch + replace the sidebar HTML; per-element
     *      listeners attached at DOMContentLoaded would silently
     *      stop firing after replacement. Delegation survives that.
     *
     *   2. Handles SVG-target edge cases: clicking the down-arrow
     *      SVG fires the click on the SVG element. The previous
     *      `title.addEventListener` relied on the click bubbling up
     *      to the title parent — which works in modern browsers but
     *      is fragile across older WebKit variants and any future
     *      CSS that introduces a stacking context inside the title.
     *      `closest('.yatra-filter-title')` catches the click no
     *      matter which descendant element was the actual target.
     *
     * Clicks on `.yatra-clear-section` (the "clear this filter" X)
     * are explicitly excluded so they don't ALSO trigger a toggle.
     */
    var YATRA_OPEN_SECTIONS_KEY = 'yatraOpenFilterSections';

    // Stable per-section key — the filter title's unique data-toggle value
    // (price, trip-type, rating, …).
    function yatraSectionKey(section) {
        var title = section.querySelector('.yatra-filter-title');
        return title ? (title.getAttribute('data-toggle') || '') : '';
    }

    // Remember which sections are currently open (used only in mobile-collapse
    // mode) so a filter change — which reloads the page — can re-open them.
    function yatraSaveOpenSections() {
        try {
            var open = [];
            document.querySelectorAll('.yatra-filter-section.open').forEach(function(s) {
                var k = yatraSectionKey(s);
                if (k) { open.push(k); }
            });
            window.sessionStorage.setItem(YATRA_OPEN_SECTIONS_KEY, JSON.stringify(open));
        } catch (e) { /* sessionStorage blocked/full — non-fatal */ }
    }

    function yatraGetSavedOpenSections() {
        try {
            var raw = window.sessionStorage.getItem(YATRA_OPEN_SECTIONS_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }

    function initializeFilterToggle() {
        document.addEventListener('click', function(e) {
            // Skip clicks on the clear-section button (and any of its
            // children, eg the X icon SVG) — those have their own
            // handler and shouldn't toggle the section open/closed.
            if (e.target.closest('.yatra-clear-section')) {
                return;
            }

            var title = e.target.closest('.yatra-filter-title');
            if (!title) {
                return;
            }

            var section = title.closest('.yatra-filter-section');
            if (section) {
                section.classList.toggle('open');
                // In mobile-collapse mode, persist the open set so the next
                // (filter-triggered) reload can restore it.
                if (shouldCollapseFiltersOnMobile()) {
                    yatraSaveOpenSections();
                }
            }
        });

        // Open all sections by default — EXCEPT when the owner enabled
        // "Collapse filters on mobile" (the [data-yatra-collapse-mobile] marker
        // is printed on the sidebar) AND we're on a mobile viewport. In that
        // case sections stay collapsed so trip listings are visible immediately;
        // visitors tap a title to expand (the delegated handler above).
        //
        // With NO marker — i.e. every existing free/pro site that hasn't opted
        // in — this branch always runs and opens all sections on every viewport,
        // identical to the previous behaviour. Desktop is never collapsed here.
        // Filter changes do a full page reload (window.location), so this runs
        // fresh on every load.
        if (!shouldCollapseFiltersOnMobile()) {
            document.querySelectorAll('.yatra-filter-section').forEach(function(section) {
                section.classList.add('open');
            });
        } else {
            // Mobile + collapse enabled: start collapsed, but RE-OPEN any
            // sections the visitor had open before the reload (e.g. the one they
            // just applied a filter in) so it doesn't snap shut on them. First
            // visit (nothing saved) → everything stays collapsed.
            var saved = yatraGetSavedOpenSections();
            if (saved.length) {
                document.querySelectorAll('.yatra-filter-section').forEach(function(section) {
                    if (saved.indexOf(yatraSectionKey(section)) !== -1) {
                        section.classList.add('open');
                    } else {
                        section.classList.remove('open');
                    }
                });
            }
        }
    }

    /**
     * True only when the owner opted into collapsed mobile filters AND the
     * current viewport is mobile (≤768px, matching the listing CSS breakpoint).
     */
    function shouldCollapseFiltersOnMobile() {
        return !!document.querySelector('[data-yatra-collapse-mobile="1"]')
            && window.matchMedia('(max-width: 768px)').matches;
    }

    /**
     * Collect all active filters from the form
     */
    function collectActiveFilters() {
        const filters = {};

        // Price range: send both bounds whenever the range is narrower than catalog min/max
        // (avoids dropping one param or losing price when changing other filters).
        const minPrice = document.getElementById('priceMin');
        const maxPrice = document.getElementById('priceMax');
        const minSlider = document.getElementById('priceRangeMin');
        const maxSlider = document.getElementById('priceRangeMax');

        function parseBound(v, fallback) {
            var n = parseInt(v, 10);
            return isNaN(n) ? fallback : n;
        }

        var fullMin = 0;
        var fullMax = 1000000;
        if (minSlider && minSlider.getAttribute('data-default') !== null) {
            fullMin = parseBound(minSlider.getAttribute('data-default'), fullMin);
        }
        if (maxSlider && maxSlider.getAttribute('data-default') !== null) {
            fullMax = parseBound(maxSlider.getAttribute('data-default'), fullMax);
        }

        var curMin = minSlider ? parseBound(minSlider.value, fullMin) : fullMin;
        var curMax = maxSlider ? parseBound(maxSlider.value, fullMax) : fullMax;
        if (minPrice && minPrice.value !== '' && minPrice.value.trim() !== '') {
            curMin = parseBound(minPrice.value, curMin);
        }
        if (maxPrice && maxPrice.value !== '' && maxPrice.value.trim() !== '') {
            curMax = parseBound(maxPrice.value, curMax);
        }
        if (curMin > curMax) {
            var swap = curMin;
            curMin = curMax;
            curMax = swap;
        }

        if (curMin > fullMin || curMax < fullMax) {
            filters.price_min = String(curMin);
            filters.price_max = String(curMax);
        }

        // Radio button filters (trip type, etc.)
        const radioGroups = {
            'trip_type': 'trip_type'
        };

        Object.keys(radioGroups).forEach(function(name) {
            const selectedRadio = document.querySelector('input[name="' + name + '"]:checked');
            if (selectedRadio && selectedRadio.value) {
                filters[radioGroups[name]] = selectedRadio.value;
            }
        });

        // Checkbox filters
        const checkboxGroups = {
            'difficulty[]': 'difficulty',
            'categories[]': 'categories',
            'destinations[]': 'destinations',
            'activities[]': 'activities',
            'accommodation[]': 'accommodation',
            'services[]': 'services',
            'offers[]': 'offers',
            'booking[]': 'booking',
            'age[]': 'age',
            'rating[]': 'rating'
        };

        Object.keys(checkboxGroups).forEach(function(name) {
            const checkboxes = document.querySelectorAll('input[name="' + name + '"]:checked');
            if (checkboxes.length > 0) {
                filters[checkboxGroups[name]] = Array.from(checkboxes).map(function(cb) {
                    return cb.value;
                });
            }
        });

        return filters;
    }

    /**
     * Update URL and reload page with new filters
     */
    function updateFiltersFromForm() {
        const filters = collectActiveFilters();
        const url = new URL(window.location);

        var preserved = {};
        /* Plain permalinks: keep yatra_page=trip_base on trip archive when changing filters */
        ['s', 'sort', 'yatra_page'].forEach(function(k) {
            var v = url.searchParams.get(k);
            if (v !== null && v !== '') {
                preserved[k] = v;
            }
        });
        
        // Clear existing filter parameters (both single and array formats)
        const filterParams = ['price_min', 'price_max', 'trip_type', 'difficulty', 'categories', 'destinations',
            'activities', 'accommodation', 'services', 'offers', 'booking', 'age', 'rating',
            'budget', 'duration', 'destination', 'activity', 'category'];
        
        filterParams.forEach(function(param) {
            url.searchParams.delete(param);
            url.searchParams.delete(param + '[]'); // Also clear array format
        });

        stripAttributeParamsFromUrl(url);

        Object.keys(preserved).forEach(function(k) {
            url.searchParams.set(k, preserved[k]);
        });

        // Add new filter parameters
        Object.keys(filters).forEach(function(key) {
            const value = filters[key];
            if (Array.isArray(value)) {
                // For array filters, use key[] format for proper PHP array handling
                value.forEach(function(v) {
                    url.searchParams.append(key + '[]', v);
                });
            } else {
                url.searchParams.set(key, value);
            }
        });

        appendAttributeFiltersToUrl(url, collectAttributeFilters());

        // Reset to first page when filters change (WordPress archives use paged)
        url.searchParams.delete('page');
        url.searchParams.delete('paged');

        // Update URL and reload
        showListingLoading();
        window.location.href = url.toString();
    }

    function initPaginationLoadingClicks() {
        var pag = document.querySelector('.yatra-listing-pagination');
        if (!pag) {
            return;
        }
        pag.addEventListener('click', function(e) {
            var a = e.target.closest('a.yatra-pagination-btn');
            if (!a || a.classList.contains('disabled')) {
                return;
            }
            var href = a.getAttribute('href');
            if (href && href.indexOf('javascript:') !== 0) {
                showListingLoading();
            }
        });
    }

    /**
     * Set filter states from current URL parameters
     */
    function setFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        // Set price range
        const priceMin = urlParams.get('price_min');
        const priceMax = urlParams.get('price_max');
        
        if (priceMin) {
            const minInput = document.getElementById('priceMin');
            const minSlider = document.getElementById('priceRangeMin');
            if (minInput) minInput.value = priceMin;
            if (minSlider) {
                minSlider.value = priceMin;
                minSlider.setAttribute('data-user-set', 'true');
            }
        }

        if (priceMax) {
            const maxInput = document.getElementById('priceMax');
            const maxSlider = document.getElementById('priceRangeMax');
            if (maxInput) maxInput.value = priceMax;
            if (maxSlider) {
                maxSlider.value = priceMax;
                maxSlider.setAttribute('data-user-set', 'true');
            }
        }

        // Set trip type radio button
        const tripType = urlParams.get('trip_type');
        if (tripType) {
            const tripTypeRadio = document.querySelector('input[name="trip_type"][value="' + tripType + '"]');
            if (tripTypeRadio) {
                tripTypeRadio.checked = true;
            }
        }

        // Set checkbox filters
        const checkboxParams = {
            'difficulty': 'difficulty[]',
            'categories': 'categories[]',
            'destinations': 'destinations[]',
            'activities': 'activities[]',
            'accommodation': 'accommodation[]',
            'services': 'services[]',
            'offers': 'offers[]',
            'booking': 'booking[]',
            'age': 'age[]',
            'rating': 'rating[]'
        };

        Object.keys(checkboxParams).forEach(function(param) {
            const bracketKey = param + '[]';
            let values = urlParams.getAll(bracketKey);
            if (values.length === 0) {
                values = urlParams.getAll(param);
            }
            const name = checkboxParams[param];
            
            values.forEach(function(value) {
                const checkbox = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        });

        // Update price display if needed
        const priceDisplay = document.querySelector('.yatra-price-display');
        if (priceDisplay && (priceMin || priceMax)) {
            const minSlider = document.getElementById('priceRangeMin');
            const maxSlider = document.getElementById('priceRangeMax');
            if (minSlider && maxSlider && window.yatra_format_price) {
                priceDisplay.textContent = window.yatra_format_price(parseInt(minSlider.value)) + 
                                         ' - ' + window.yatra_format_price(parseInt(maxSlider.value));
            }
        }
    }

    /**
     * Clear all filters and reload page
     */
    function clearAllFilters() {
         // Debug log
        const url = new URL(window.location);
         // Debug log
        
        // Remove all filter parameters (both single and array formats)
        const filterParams = ['price_min', 'price_max', 'trip_type', 'difficulty', 'categories', 'destinations',
            'activities', 'accommodation', 'services', 'offers', 'booking', 'age', 'rating', 'page', 'paged', 's',
            'destination', 'activity', 'category', 'duration', 'sort', 'budget'];
        
        filterParams.forEach(function(param) {
            url.searchParams.delete(param);
            url.searchParams.delete(param + '[]'); // Also clear array format
        });

        stripAttributeParamsFromUrl(url);
        
         // Debug log

        showListingLoading();
        window.location.href = url.toString();
    }

    /**
     * Clear filters for a specific section
     */
    function clearFilterSection(section) {
        const url = new URL(window.location);
        
        switch(section) {
            case 'price':
                url.searchParams.delete('price_min');
                url.searchParams.delete('price_max');
                break;
            case 'difficulty':
                url.searchParams.delete('difficulty');
                url.searchParams.delete('difficulty[]');
                break;
            case 'rating':
                url.searchParams.delete('rating');
                url.searchParams.delete('rating[]');
                break;
            case 'categories':
                url.searchParams.delete('categories');
                url.searchParams.delete('categories[]');
                break;
            case 'destinations':
                url.searchParams.delete('destinations');
                url.searchParams.delete('destinations[]');
                break;
            case 'activities':
                url.searchParams.delete('activities');
                url.searchParams.delete('activities[]');
                break;
            case 'offers':
                url.searchParams.delete('offers');
                url.searchParams.delete('offers[]');
                break;
            case 'booking':
                url.searchParams.delete('booking');
                url.searchParams.delete('booking[]');
                break;
            case 'age':
                url.searchParams.delete('age');
                url.searchParams.delete('age[]');
                break;
            case 'trip-type':
                url.searchParams.delete('trip_type');
                break;
            case 'trip-attributes':
                stripAttributeParamsFromUrl(url);
                break;
        }

        // Reset to first page when filters change
        url.searchParams.delete('page');
        url.searchParams.delete('paged');

        showListingLoading();
        window.location.href = url.toString();
    }

    // Add event listeners to track user interaction with price sliders
    document.addEventListener('DOMContentLoaded', function() {
        const minSlider = document.getElementById('priceRangeMin');
        const maxSlider = document.getElementById('priceRangeMax');
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');
        
        // Mark sliders as user-set when moved
        if (minSlider) {
            minSlider.addEventListener('input', function() {
                this.setAttribute('data-user-set', 'true');
            });
        }
        if (maxSlider) {
            maxSlider.addEventListener('input', function() {
                this.setAttribute('data-user-set', 'true');
            });
        }
        
        // Sync sliders with input fields
        if (minInput && minSlider) {
            minInput.addEventListener('input', function() {
                if (this.value) {
                    minSlider.value = this.value;
                    minSlider.setAttribute('data-user-set', 'true');
                }
            });
        }
        if (maxInput && maxSlider) {
            maxInput.addEventListener('input', function() {
                if (this.value) {
                    maxSlider.value = this.value;
                    maxSlider.setAttribute('data-user-set', 'true');
                }
            });
        }
    });

    // Expose functions globally if needed
    window.YatraFilters = {
        updateFilters: updateFiltersFromForm,
        clearFilters: clearAllFilters,
        clearSection: clearFilterSection,
        collectFilters: collectActiveFilters
    };

})();
