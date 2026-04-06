jQuery(document).ready(function() {
    'use strict';

    function getListingUrl() {
        var root = document.querySelector('.yatra-trip-search-shortcode');
        var u = root && root.getAttribute('data-listing-url');
        if (u) {
            return u;
        }
        return window.location.origin + '/trip/';
    }

    function initHorizontalSearchDropdowns() {
        var dropdowns = document.querySelectorAll('.yatra-search-dropdown');

        if (dropdowns.length === 0) {
            return;
        }

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.yatra-search-dropdown')) {
                dropdowns.forEach(function(dropdown) {
                    dropdown.classList.remove('open');
                });
            }
        });

        dropdowns.forEach(function(dropdown) {
            dropdown.classList.remove('open');

            var trigger = dropdown.querySelector('.yatra-dropdown-trigger');
            var menu = dropdown.querySelector('.yatra-dropdown-menu');
            var options = dropdown.querySelectorAll('.yatra-dropdown-option');
            var valueSpan = dropdown.querySelector('.yatra-dropdown-value');

            if (trigger) {
                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    dropdowns.forEach(function(d) {
                        if (d !== dropdown) {
                            d.classList.remove('open');
                            var otherMenu = d.querySelector('.yatra-dropdown-menu');
                            if (otherMenu) {
                                otherMenu.classList.remove('show');
                            }
                        }
                    });

                    var m = dropdown.querySelector('.yatra-dropdown-menu');

                    if (dropdown.classList.contains('open')) {
                        dropdown.classList.remove('open');
                        if (m) {
                            m.classList.remove('show');
                        }
                    } else {
                        dropdown.classList.add('open');
                        if (m) {
                            m.removeAttribute('style');
                            m.classList.add('show');
                        }
                    }
                }, true);
            }

            options.forEach(function(option) {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();

                    options.forEach(function(opt) {
                        opt.classList.remove('selected');
                    });

                    this.classList.add('selected');

                    if (valueSpan) {
                        valueSpan.textContent = this.textContent;
                        valueSpan.classList.add('selected');
                    }

                    dropdown.classList.remove('open');
                });
            });

            if (menu) {
                menu.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        });
    }

    function initDurationSlider() {
        var durationDropdown = document.querySelector('[data-dropdown="duration"]');
        if (!durationDropdown) {
            return;
        }

        var minSlider = durationDropdown.querySelector('#durationMin');
        var maxSlider = durationDropdown.querySelector('#durationMax');
        var minBadge = durationDropdown.querySelector('.yatra-duration-min-badge');
        var maxBadge = durationDropdown.querySelector('.yatra-duration-max-badge');
        var labelSpans = durationDropdown.querySelectorAll('.yatra-duration-labels span');
        var minLabel = labelSpans[0];
        var maxLabel = labelSpans[labelSpans.length - 1];
        var sliderRange = durationDropdown.querySelector('.yatra-slider-range');
        var valueSpan = durationDropdown.querySelector('.yatra-dropdown-value');

        if (!minSlider || !maxSlider) {
            return;
        }

        function bounds() {
            var lo = parseInt(durationDropdown.getAttribute('data-duration-min') || minSlider.min, 10);
            var hi = parseInt(durationDropdown.getAttribute('data-duration-max') || maxSlider.max, 10);
            if (isNaN(lo)) {
                lo = 1;
            }
            if (isNaN(hi) || hi < lo) {
                hi = lo;
            }
            return { lo: lo, hi: hi, span: Math.max(1, hi - lo) };
        }

        function updateDurationDisplay() {
            var b = bounds();
            var min = parseInt(minSlider.value, 10);
            var max = parseInt(maxSlider.value, 10);

            if (min > max) {
                var t = min;
                min = max;
                max = t;
                minSlider.value = min;
                maxSlider.value = max;
            }

            if (minBadge) {
                minBadge.textContent = min + ' Days';
            }
            if (maxBadge) {
                maxBadge.textContent = max + ' Days';
            }
            if (minLabel) {
                minLabel.textContent = min + ' Days';
            }
            if (maxLabel) {
                maxLabel.textContent = max + ' Days';
            }

            if (valueSpan) {
                valueSpan.textContent = min + ' - ' + max + ' Days';
                valueSpan.classList.add('selected');
            }

            if (sliderRange) {
                var minPercent = ((min - b.lo) / b.span) * 100;
                var maxPercent = ((max - b.lo) / b.span) * 100;
                sliderRange.style.left = minPercent + '%';
                sliderRange.style.width = Math.max(0, maxPercent - minPercent) + '%';
            }
        }

        minSlider.addEventListener('input', updateDurationDisplay);
        maxSlider.addEventListener('input', updateDurationDisplay);

        updateDurationDisplay();
    }

    function runTripSearch() {
        var filters = {};

        var kw = document.querySelector('.yatra-search-keyword-input');
        if (kw && kw.value.trim()) {
            filters.s = kw.value.trim();
        }

        var destDropdown = document.querySelector('[data-dropdown="destination"]');
        if (destDropdown) {
            var selectedDest = destDropdown.querySelector('.yatra-dropdown-option.selected');
            if (selectedDest) {
                var dv = selectedDest.getAttribute('data-value');
                if (dv) {
                    filters.destination = dv;
                }
            }
        }

        var actDropdown = document.querySelector('[data-dropdown="activities"]');
        if (actDropdown) {
            var selectedAct = actDropdown.querySelector('.yatra-dropdown-option.selected');
            if (selectedAct) {
                var av = selectedAct.getAttribute('data-value');
                if (av) {
                    filters.activity = av;
                }
            }
        }

        var durationDropdown = document.querySelector('[data-dropdown="duration"]');
        if (durationDropdown) {
            var minInput = durationDropdown.querySelector('#durationMin');
            var maxInput = durationDropdown.querySelector('#durationMax');
            if (minInput && maxInput) {
                var min = parseInt(minInput.value, 10);
                var max = parseInt(maxInput.value, 10);
                var lo = parseInt(durationDropdown.getAttribute('data-duration-min') || minInput.min, 10);
                var hi = parseInt(durationDropdown.getAttribute('data-duration-max') || maxInput.max, 10);
                if (!isNaN(min) && !isNaN(max) && (min !== lo || max !== hi)) {
                    filters.duration = min + '-' + max;
                }
            }
        }

        var budgetDropdown = document.querySelector('[data-dropdown="budget"]');
        if (budgetDropdown) {
            var selectedBudget = budgetDropdown.querySelector('.yatra-dropdown-option.selected');
            if (selectedBudget) {
                var bv = selectedBudget.getAttribute('data-value');
                if (bv) {
                    filters.budget = bv;
                }
            }
        }

        var listing = getListingUrl();
        var url = new URL(listing, window.location.href);

        Object.keys(filters).forEach(function(key) {
            if (filters[key]) {
                url.searchParams.set(key, filters[key]);
            }
        });

        window.location.href = url.toString();
    }

    function initSearchFunctionality() {
        var searchBtn = document.querySelector('.yatra-search-main-btn');
        var kwInput = document.querySelector('.yatra-search-keyword-input');

        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                runTripSearch();
            });
        }

        if (kwInput) {
            kwInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runTripSearch();
                }
            });
        }
    }

    initHorizontalSearchDropdowns();
    initDurationSlider();
    initSearchFunctionality();
});
