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

    // View toggle (grid/list)
    function initViewToggle() {
        const viewButtons = document.querySelectorAll('.yatra-view-btn[data-view]');
        
        // Find all grids that support view toggle
        const grids = [
            document.getElementById('trip-grid'),
            document.getElementById('category-grid'),
            document.getElementById('destination-grid'),
            document.getElementById('activity-grid')
        ].filter(grid => grid !== null);

        if (grids.length === 0) return;

        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                
                // Update active state for all buttons in the same container
                const container = this.closest('.yatra-results-controls');
                if (container) {
                    container.querySelectorAll('.yatra-view-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }
                this.classList.add('active');

                // Toggle grid/list view for all grids on the page
                grids.forEach(grid => {
                    if (view === 'list') {
                        grid.classList.add('list-view');
                    } else {
                        grid.classList.remove('list-view');
                    }
                });
            });
        });
    }

    // Price range slider
    function initPriceRange() {
        const minRange = document.querySelector('.yatra-range-min');
        const maxRange = document.querySelector('.yatra-range-max');
        const priceDisplay = document.querySelector('.yatra-price-display');
        const minInput = document.querySelector('.yatra-price-inputs input:first-of-type');
        const maxInput = document.querySelector('.yatra-price-inputs input:last-of-type');

        if (!minRange || !maxRange || !priceDisplay) return;

        function updatePriceDisplay() {
            const min = parseInt(minRange.value) || 0;
            const max = parseInt(maxRange.value) || 5000;
            
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
                maxRange.value = this.value || 5000;
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
            const minRange = document.querySelector('.yatra-range-min');
            const maxRange = document.querySelector('.yatra-range-max');
            if (minRange) minRange.value = 0;
            if (maxRange) maxRange.value = 5000;
            if (minRange && maxRange) {
                const event = new Event('input');
                maxRange.dispatchEvent(event);
            }
        });
    }

})();

