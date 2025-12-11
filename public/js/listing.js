/**
 * Listing Pages JavaScript
 * Handles filter sidebar interactions and view toggles
 * 
 * @package Yatra
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initFilterToggles();
        initViewToggle();
        initPriceRange();
        initAdvancedSearch();
        initTravelersSelect();
        initHorizontalSearchDropdowns();
        initDurationSlider();
        initListGridToggle();
    }

    // Advanced search toggle
    function initAdvancedSearch() {
        const toggleBtn = document.getElementById('advancedToggle');
        const advancedOptions = document.getElementById('advancedOptions');

        if (toggleBtn && advancedOptions) {
            toggleBtn.addEventListener('click', function() {
                const isOpen = advancedOptions.style.display !== 'none';
                advancedOptions.style.display = isOpen ? 'none' : 'block';
                toggleBtn.classList.toggle('active');
            });
        }
    }

    // Travelers selector
    function initTravelersSelect() {
        const travelersSelect = document.getElementById('travelersSelect');
        if (!travelersSelect) return;

        // Create dropdown for travelers
        const dropdown = document.createElement('div');
        dropdown.className = 'yatra-travelers-dropdown';
        dropdown.style.cssText = 'display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 4px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000;';
        
        dropdown.innerHTML = `
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">Adults</label>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button type="button" class="yatra-quantity-btn" data-action="decrease" style="width: 32px; height: 32px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                    <span class="yatra-quantity-value" style="min-width: 30px; text-align: center; font-weight: 600;">2</span>
                    <button type="button" class="yatra-quantity-btn" data-action="increase" style="width: 32px; height: 32px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                </div>
            </div>
            <button type="button" class="yatra-apply-travelers" style="width: 100%; padding: 10px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Apply</button>
        `;

        const parent = travelersSelect.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(dropdown);

        const input = travelersSelect.querySelector('input');
        let adults = 2;

        travelersSelect.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        dropdown.querySelectorAll('.yatra-quantity-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.getAttribute('data-action');
                if (action === 'increase') {
                    adults = Math.min(adults + 1, 20);
                } else {
                    adults = Math.max(adults - 1, 1);
                }
                dropdown.querySelector('.yatra-quantity-value').textContent = adults;
            });
        });

        dropdown.querySelector('.yatra-apply-travelers').addEventListener('click', function(e) {
            e.stopPropagation();
            input.value = adults + ' Adult' + (adults > 1 ? 's' : '');
            dropdown.style.display = 'none';
        });

        document.addEventListener('click', function() {
            dropdown.style.display = 'none';
        });

        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Filter section toggles
    function initFilterToggles() {
        const filterTitles = document.querySelectorAll('.yatra-filter-title');
        
        filterTitles.forEach(title => {
            title.addEventListener('click', function() {
                const section = this.closest('.yatra-filter-section');
                section.classList.toggle('open');
            });
        });

        // Open all filter sections by default
        document.querySelectorAll('.yatra-filter-section').forEach(section => {
            section.classList.add('open');
        });
    }

    // View toggle (grid/list) with localStorage persistence
    function initViewToggle() {
        const viewButtons = document.querySelectorAll('.yatra-view-btn[data-view]');

        // Find all grids that support view toggle
        const grids = [
            document.getElementById('trip-grid'),
            document.getElementById('category-grid'),
            document.getElementById('destination-grid'),
            document.getElementById('activity-grid')
        ].filter(grid => grid !== null);

        if (viewButtons.length === 0 || grids.length === 0) return;

        const storageKey = 'yatra_listing_view';

        function applyView(view) {
            if (view !== 'list') {
                view = 'grid';
            }

            // Update active state for all toggle groups
            document.querySelectorAll('.yatra-results-controls').forEach(container => {
                const buttons = container.querySelectorAll('.yatra-view-btn[data-view]');
                buttons.forEach(btn => {
                    const btnView = btn.getAttribute('data-view');
                    btn.classList.toggle('active', btnView === view);
                });
            });

            // Toggle grid/list view for all grids on the page
            grids.forEach(grid => {
                if (view === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            });
        }

        // Initial view from localStorage (shared across listing pages)
        let initialView = 'grid';
        try {
            const saved = window.localStorage.getItem(storageKey);
            if (saved === 'list' || saved === 'grid') {
                initialView = saved;
            }
        } catch (e) {
            // ignore
        }

        applyView(initialView);

        // Handle clicks
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const view = this.getAttribute('data-view') || 'grid';
                applyView(view);
                try {
                    window.localStorage.setItem(storageKey, view);
                } catch (e) {
                    // ignore
                }
            });
        });
    }

    // Price range slider - use specific IDs to avoid conflict with duration slider
    function initPriceRange() {
        const minRange = document.getElementById('priceRangeMin');
        const maxRange = document.getElementById('priceRangeMax');
        const priceDisplay = document.querySelector('.yatra-price-display');
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');

        if (!minRange || !maxRange || !priceDisplay) return;

        function updatePriceDisplay() {
            const min = parseInt(minRange.value) || 0;
            const max = parseInt(maxRange.value) || 10000;
            
            // Format with commas
            const minFormatted = min.toLocaleString();
            const maxFormatted = max.toLocaleString();
            
            priceDisplay.textContent = `$${minFormatted} - $${maxFormatted}`;
            
            if (minInput) minInput.value = min;
            if (maxInput) maxInput.value = max;
        }

        minRange.addEventListener('input', function() {
            if (parseInt(this.value) > parseInt(maxRange.value)) {
                this.value = maxRange.value;
            }
            updatePriceDisplay();
        });

        maxRange.addEventListener('input', function() {
            if (parseInt(this.value) < parseInt(minRange.value)) {
                this.value = minRange.value;
            }
            updatePriceDisplay();
        });

        if (minInput) {
            minInput.addEventListener('input', function() {
                minRange.value = this.value || 0;
                updatePriceDisplay();
            });
        }

        if (maxInput) {
            maxInput.addEventListener('input', function() {
                maxRange.value = this.value || 10000;
                updatePriceDisplay();
            });
        }

        // Initial display
        updatePriceDisplay();
    }

    // Clear filters
    const clearFiltersBtn = document.querySelector('.yatra-clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Clear all checkboxes
            document.querySelectorAll('.yatra-checkbox-label input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // Reset price range
            const minRange = document.getElementById('priceRangeMin');
            const maxRange = document.getElementById('priceRangeMax');
            const minInput = document.getElementById('priceMin');
            const maxInput = document.getElementById('priceMax');
            const priceDisplay = document.querySelector('.yatra-price-display');
            
            if (minRange) minRange.value = 0;
            if (maxRange) maxRange.value = 10000;
            if (minInput) minInput.value = 0;
            if (maxInput) maxInput.value = 10000;
            if (priceDisplay) priceDisplay.textContent = '$0 - $10,000';
        });
    }

    // Horizontal Search Dropdowns
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
            const trigger = dropdown.querySelector('.yatra-dropdown-trigger');
            const menu = dropdown.querySelector('.yatra-dropdown-menu');
            const options = dropdown.querySelectorAll('.yatra-dropdown-option');
            const valueSpan = dropdown.querySelector('.yatra-dropdown-value');

            if (trigger) {
                trigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Close other dropdowns
                    dropdowns.forEach(d => {
                        if (d !== dropdown) {
                            d.classList.remove('open');
                        }
                    });
                    
                    // Toggle current dropdown
                    dropdown.classList.toggle('open');
                });
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

    // Duration Slider
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

    // List/Grid view toggle
    function initListGridToggle() {
        const viewButtons = document.querySelectorAll('.yatra-view-btn');
        const grid = document.querySelector('.yatra-trip-grid, .yatra-destination-grid, .yatra-activity-grid');
        
        if (!viewButtons.length || !grid) return;
        
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                
                // Update active button
                viewButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update grid layout
                if (view === 'list') {
                    grid.classList.add('list-view');
                    grid.classList.remove('grid-view');
                } else {
                    grid.classList.add('grid-view');
                    grid.classList.remove('list-view');
                }
                
                // Store preference in localStorage
                localStorage.setItem('yatra-view-preference', view);
            });
        });
        
        // Load saved preference
        const savedView = localStorage.getItem('yatra-view-preference') || 'grid';
        const savedButton = document.querySelector(`[data-view="${savedView}"]`);
        if (savedButton) {
            savedButton.click();
        }
    }

})();

