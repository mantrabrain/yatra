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

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeFilters();
        initPaginationLoadingClicks();
    });

    function initializeFilters() {
        // Initialize all filter components
        initializeCheckboxFilters();
        initializeRadioFilters();
        initializePriceRangeFilter();
        initializeRatingFilter();
        initializeClearFilters();
        initializeFilterToggle();
        
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

        if (!minInput || !maxInput || !minSlider || !maxSlider) return;

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
        }

        // Event listeners
        minSlider.addEventListener('input', syncInputsWithSliders);
        maxSlider.addEventListener('input', syncInputsWithSliders);
        minInput.addEventListener('input', syncSlidersWithInputs);
        maxInput.addEventListener('input', syncSlidersWithInputs);

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
     * Initialize filter section toggle functionality
     */
    function initializeFilterToggle() {
        const filterTitles = document.querySelectorAll('.yatra-filter-title');
        
        filterTitles.forEach(function(title) {
            title.addEventListener('click', function() {
                const section = this.closest('.yatra-filter-section');
                if (section) {
                    section.classList.toggle('open');
                }
            });
        });

        // Open all sections by default
        document.querySelectorAll('.yatra-filter-section').forEach(function(section) {
            section.classList.add('open');
        });
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
        ['s', 'sort'].forEach(function(k) {
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
