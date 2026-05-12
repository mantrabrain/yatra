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
        initStretchedCardClicks();
        // Search functionality moved to shortcode-specific JS
        // initHorizontalSearchDropdowns();
        // initDurationSlider();
    }

    // Whole-card click target for the destination / activity / trip-category
    // shortcode-as-block "category" cards. Trip listing cards intentionally
    // opt out — those have multiple visible CTAs (View Details button, image
    // link, title link, favorite, category/activity chips) and shouldn't
    // hijack ambient clicks; the user navigates via the explicit controls.
    //
    // CSS-only "stretched link" (title link ::after with inset:0) is the
    // canonical implementation and remains in place for screen-reader and
    // crawler semantics — but in some layouts an intermediate ancestor with
    // `position: relative` traps the absolute overlay, leaving the upper
    // portion of the card non-clickable. This delegated click handler is the
    // belt-and-braces fallback: it catches any click that didn't already land
    // on a real interactive element and forwards it to the card's primary
    // link. Modifier keys (ctrl/cmd/middle-click) open in a new tab to match
    // the browser's normal `<a>` behavior.
    function initStretchedCardClicks() {
        const cardSelector = '.yatra-category-card';
        const linkSelector = 'a.yatra-category-card-title-link';
        // Click targets that should be allowed to handle their own event.
        const interactive = 'a, button, input, select, textarea, label, [role="button"], [data-no-card-click]';

        document.addEventListener('click', function (event) {
            // Allow native links/buttons to do their thing.
            if (event.target.closest(interactive)) {
                return;
            }
            const card = event.target.closest(cardSelector);
            if (!card) return;

            const link = card.querySelector(linkSelector);
            if (!link || !link.href) return;

            // Cmd/Ctrl/middle-click → new tab. Plain click → same tab.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) {
                window.open(link.href, '_blank', 'noopener');
            } else {
                window.location.href = link.href;
            }
        });

        // Keyboard parity: Enter on a focused card root navigates to the link.
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter') return;
            if (event.target.closest(interactive)) return;
            const card = event.target.closest(cardSelector);
            if (!card) return;
            const link = card.querySelector(linkSelector);
            if (link && link.href) {
                window.location.href = link.href;
            }
        });
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

    // View toggle (grid/list): one grid per page; localStorage key is per grid id (not global).
    function initViewToggle() {
        const grids = [
            document.getElementById('trip-grid'),
            document.getElementById('category-grid'),
            document.getElementById('destination-grid'),
            document.getElementById('activity-grid')
        ].filter(function (el) {
            return el !== null;
        });

        if (grids.length === 0) {
            return;
        }

        const grid = grids[0];
        const storageKey = 'yatra_listing_view_' + (grid.id || 'listing');

        const viewButtons = document.querySelectorAll('.yatra-view-btn[data-view]');
        if (viewButtons.length === 0) {
            return;
        }

        const listingRoot = grid.closest('.yatra-listing-page') || document.body;

        function applyView(view) {
            if (view !== 'list') {
                view = 'grid';
            }

            listingRoot.querySelectorAll('.yatra-results-controls .yatra-view-btn[data-view]').forEach(function (btn) {
                const btnView = btn.getAttribute('data-view');
                btn.classList.toggle('active', btnView === view);
            });

            if (view === 'list') {
                grid.classList.add('list-view');
                grid.classList.remove('yatra-list-view');
            } else {
                grid.classList.remove('list-view');
                grid.classList.remove('yatra-list-view');
            }
        }

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

        viewButtons.forEach(function (button) {
            button.addEventListener('click', function () {
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

    // Clear filters functionality is handled by listing-filters.js
    // Removed conflicting event listener to prevent interference

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
        const sliderRange = durationDropdown.querySelector('.yatra-slider-range');
        const valueSpan = durationDropdown.querySelector('.yatra-dropdown-value');

        if (!minSlider || !maxSlider) return;

        function durationBounds() {
            const lo = parseInt(durationDropdown.getAttribute('data-duration-min') || minSlider.min, 10);
            const hi = parseInt(durationDropdown.getAttribute('data-duration-max') || maxSlider.max, 10);
            const safeLo = isNaN(lo) ? 1 : lo;
            const safeHi = isNaN(hi) || hi < safeLo ? safeLo : hi;
            return { lo: safeLo, hi: safeHi, span: Math.max(1, safeHi - safeLo) };
        }

        function updateDurationDisplay() {
            let min = parseInt(minSlider.value, 10);
            let max = parseInt(maxSlider.value, 10);

            // Ensure min doesn't exceed max
            if (min > max) {
                [min, max] = [max, min];
                minSlider.value = min;
                maxSlider.value = max;
            }

            // Update badges
            if (minBadge) minBadge.textContent = min + ' Days';
            if (maxBadge) maxBadge.textContent = max + ' Days';

            // Update the dropdown value display
            if (valueSpan) {
                valueSpan.textContent = min + ' - ' + max + ' Days';
                valueSpan.classList.add('selected');
            }

            // Update the slider range track
            if (sliderRange) {
                const b = durationBounds();
                const minPercent = ((min - b.lo) / b.span) * 100;
                const maxPercent = ((max - b.lo) / b.span) * 100;
                sliderRange.style.left = minPercent + '%';
                sliderRange.style.width = Math.max(0, maxPercent - minPercent) + '%';
            }
        }

        minSlider.addEventListener('input', updateDurationDisplay);
        maxSlider.addEventListener('input', updateDurationDisplay);

        // Initial display
        updateDurationDisplay();
    }

})();

