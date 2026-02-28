/**
 * Yatra Trip Listing Filters - URL-based filtering system
 * 
 * This script handles all filter interactions and updates the URL parameters
 * to trigger server-side filtering with page reload for SEO and bookmarkability.
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeFilters();
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

        // Price range - only include if user has explicitly set values
        const minPrice = document.getElementById('priceMin');
        const maxPrice = document.getElementById('priceMax');
        const minSlider = document.getElementById('priceRangeMin');
        const maxSlider = document.getElementById('priceRangeMax');
        
        
        
        // Check if user has actually entered values in input fields
        if (minPrice && minPrice.value && minPrice.value.trim() !== '') {
            filters.price_min = minPrice.value;
            
        }
        if (maxPrice && maxPrice.value && maxPrice.value.trim() !== '') {
            filters.price_max = maxPrice.value;
            
        }
        
        // Check slider values only if user has explicitly moved them or they have user-set data
        if (minSlider && minSlider.value) {
            const isUserSet = minSlider.getAttribute('data-user-set') === 'true';
            const isDifferentFromDefault = minSlider.value !== minSlider.getAttribute('data-default');
            
            if (isUserSet || isDifferentFromDefault) {
                filters.price_min = minSlider.value;
                
            }
        }
        if (maxSlider && maxSlider.value) {
            const isUserSet = maxSlider.getAttribute('data-user-set') === 'true';
            const isDifferentFromDefault = maxSlider.value !== maxSlider.getAttribute('data-default');
            
            if (isUserSet || isDifferentFromDefault) {
                filters.price_max = maxSlider.value;
                
            }
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
            'included_services[]': 'included_services',
            'special_offers[]': 'special_offers',
            'booking_options[]': 'booking_options',
            'age_suitability[]': 'age_suitability',
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
        
        // Clear existing filter parameters (both single and array formats)
        const filterParams = ['price_min', 'price_max', 'trip_type', 'difficulty', 'categories', 'destinations', 
                             'activities', 'accommodation', 'included_services', 'special_offers', 
                             'booking_options', 'age_suitability', 'rating'];
        
        filterParams.forEach(function(param) {
            url.searchParams.delete(param);
            url.searchParams.delete(param + '[]'); // Also clear array format
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

        // Reset to first page when filters change
        url.searchParams.delete('page');

        // Update URL and reload
        window.location.href = url.toString();
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
            if (minSlider) minSlider.value = priceMin;
        }
        
        if (priceMax) {
            const maxInput = document.getElementById('priceMax');
            const maxSlider = document.getElementById('priceRangeMax');
            if (maxInput) maxInput.value = priceMax;
            if (maxSlider) maxSlider.value = priceMax;
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
            'included_services': 'included_services[]',
            'special_offers': 'special_offers[]',
            'booking_options': 'booking_options[]',
            'age_suitability': 'age_suitability[]',
            'rating': 'rating[]'
        };

        Object.keys(checkboxParams).forEach(function(param) {
            const values = urlParams.getAll(param);
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
                             'activities', 'accommodation', 'included_services', 'special_offers',
                             'booking_options', 'age_suitability', 'rating', 'page'];
        
        filterParams.forEach(function(param) {
            url.searchParams.delete(param);
            url.searchParams.delete(param + '[]'); // Also clear array format
        });
        
         // Debug log

        // Reload page without filters
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
        }
        
        // Reset to first page when filters change
        url.searchParams.delete('page');
        
        // Reload page with updated filters
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
