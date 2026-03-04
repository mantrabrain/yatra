jQuery(document).ready(function($) {
    'use strict';

    // Initialize search functionality
    initHorizontalSearchDropdowns();
    
    // Horizontal Search Dropdowns - moved from listing.js
    function initHorizontalSearchDropdowns() {
        const dropdowns = document.querySelectorAll('.yatra-search-dropdown');
        
        if (dropdowns.length === 0) return;

        // Close all dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.yatra-search-dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });

        dropdowns.forEach(dropdown => {
            // Ensure dropdown starts in closed state
            dropdown.classList.remove('open');
            
            const trigger = dropdown.querySelector('.yatra-dropdown-trigger');
            const menu = dropdown.querySelector('.yatra-dropdown-menu');
            const options = dropdown.querySelectorAll('.yatra-dropdown-option');
            const valueSpan = dropdown.querySelector('.yatra-dropdown-value');

            if (trigger) {
                trigger.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent any default behavior
                    e.stopPropagation();
                    e.stopImmediatePropagation(); // Prevent other listeners
                    
                    // Close other dropdowns first
                    dropdowns.forEach(d => {
                        if (d !== dropdown) {
                            d.classList.remove('open');
                            const otherMenu = d.querySelector('.yatra-dropdown-menu');
                            if (otherMenu) {
                                otherMenu.classList.remove('show');
                            }
                        }
                    });
                    
                    // Toggle current dropdown
                    const menu = dropdown.querySelector('.yatra-dropdown-menu');
                    
                    if (dropdown.classList.contains('open')) {
                        dropdown.classList.remove('open');
                        if (menu) {
                            menu.classList.remove('show');
                        }
                    } else {
                        dropdown.classList.add('open');
                        
                        if (menu) {
                            // Remove inline styles that might override CSS
                            menu.removeAttribute('style');
                            
                            // Add show class to the menu element itself
                            menu.classList.add('show');
                        }
                    }
                }, true); // Use capture phase
            }

            // Handle option selection
            options.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Remove selected from siblings
                    options.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected to clicked option
                    this.classList.add('selected');
                    
                    // Update the display value
                    if (valueSpan) {
                        valueSpan.textContent = this.textContent;
                        valueSpan.classList.add('selected');
                    }
                    
                    // Close dropdown
                    dropdown.classList.remove('open');
                });
            });

            // Keep dropdown open when clicking inside (for duration slider)
            if (menu) {
                menu.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        });
    }

    // Duration Slider - moved from listing.js
    function initDurationSlider() {
        const durationDropdown = document.querySelector('[data-dropdown="duration"]');
        if (!durationDropdown) return;

        const minSlider = durationDropdown.querySelector('#durationMin');
        const maxSlider = durationDropdown.querySelector('#durationMax');
        const minBadge = durationDropdown.querySelector('.yatra-duration-min-badge');
        const maxBadge = durationDropdown.querySelector('.yatra-duration-max-badge');
        const minLabel = durationDropdown.querySelector('.yatra-duration-labels span:first-child');
        const maxLabel = durationDropdown.querySelector('.yatra-duration-labels span:last-child');
        const sliderRange = durationDropdown.querySelector('.yatra-slider-range');
        const valueSpan = durationDropdown.querySelector('.yatra-dropdown-value');

        if (!minSlider || !maxSlider) return;

        function updateDurationDisplay() {
            let min = parseInt(minSlider.value);
            let max = parseInt(maxSlider.value);

            // Ensure min doesn't exceed max
            if (min > max) {
                [min, max] = [max, min];
                minSlider.value = min;
                maxSlider.value = max;
            }

            // Update badges
            if (minBadge) minBadge.textContent = min + ' Days';
            if (maxBadge) maxBadge.textContent = max + ' Days';
            
            // Update labels
            if (minLabel) minLabel.textContent = min + ' Days';
            if (maxLabel) maxLabel.textContent = max + ' Days';

            // Update the dropdown value display
            if (valueSpan) {
                valueSpan.textContent = min + ' - ' + max + ' Days';
                valueSpan.classList.add('selected');
            }

            // Update the slider range track
            if (sliderRange) {
                const minPercent = ((min - 1) / 29) * 100;
                const maxPercent = ((max - 1) / 29) * 100;
                sliderRange.style.left = minPercent + '%';
                sliderRange.style.width = (maxPercent - minPercent) + '%';
            }
        }

        minSlider.addEventListener('input', updateDurationDisplay);
        maxSlider.addEventListener('input', updateDurationDisplay);

        // Initial display
        updateDurationDisplay();
    }

    // Search functionality - moved from listing.js pattern
    function initSearchFunctionality() {
        const searchBtn = document.querySelector('.yatra-search-main-btn');
        
        if (!searchBtn) return;

        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Collect all filter values
            const filters = {};
            
            // Destination
            const destDropdown = document.querySelector('[data-dropdown="destination"]');
            if (destDropdown) {
                const selectedOption = destDropdown.querySelector('.yatra-dropdown-option.selected');
                if (selectedOption) {
                    filters.destination = selectedOption.getAttribute('data-value');
                }
            }
            
            // Activities
            const actDropdown = document.querySelector('[data-dropdown="activities"]');
            if (actDropdown) {
                const selectedOption = actDropdown.querySelector('.yatra-dropdown-option.selected');
                if (selectedOption) {
                    filters.activity = selectedOption.getAttribute('data-value');
                }
            }
            
            // Duration
            const durationDropdown = document.querySelector('[data-dropdown="duration"]');
            if (durationDropdown) {
                const minInput = durationDropdown.querySelector('#durationMin');
                const maxInput = durationDropdown.querySelector('#durationMax');
                if (minInput && maxInput) {
                    const min = minInput.value;
                    const max = maxInput.value;
                    if (min && max) {
                        filters.duration = min + '-' + max;
                    }
                }
            }
            
            // Budget
            const budgetDropdown = document.querySelector('[data-dropdown="budget"]');
            if (budgetDropdown) {
                const selectedOption = budgetDropdown.querySelector('.yatra-dropdown-option.selected');
                if (selectedOption) {
                    filters.budget = selectedOption.getAttribute('data-value');
                }
            }
            
            // Build URL and redirect
            const baseUrl = '/trip'; // Or use the configured trip archive URL
            const url = new URL(window.location.origin + baseUrl);
            
            // Add filters to URL
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    url.searchParams.set(key, filters[key]);
                }
            });
            
            // Redirect to filtered results
            window.location.href = url.toString();
        });
    }

    // Initialize all components
    initHorizontalSearchDropdowns();
    initDurationSlider();
    initSearchFunctionality();
});
