/**
 * Yatra Single Trip Page JavaScript
 * Class-based implementation for trip page features
 */

(function() {
    'use strict';

    /**
     * Gallery Modal Class
     * Handles image gallery modal functionality
     */
    class GalleryModal {
        constructor() {
            this.modal = null;
            this.images = [];
            this.currentIndex = 0;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.modal = document.getElementById('hero-gallery');
            if (!this.modal) return;

            this.collectImages();
            this.createThumbnails();
            this.attachEventListeners();
        }

        collectImages() {
            this.images = [];

            // Collect from hero slides
            const heroSlides = document.querySelectorAll('.yatra-trip-hero-slide img');
            heroSlides.forEach((img, index) => {
                this.images.push({
                    src: img.src,
                    alt: img.alt || `Gallery Image ${index + 1}`
                });
            });

            // Collect from gallery section
            const galleryItems = document.querySelectorAll('.yatra-trip-gallery .yatra-gallery-item img');
            galleryItems.forEach((img) => {
                const exists = this.images.some(i => i.src === img.src);
                if (!exists) {
                    this.images.push({
                        src: img.src,
                        alt: img.alt || `Gallery Image ${this.images.length + 1}`
                    });
                }
            });
        }

        createThumbnails() {
            const container = this.modal.querySelector('.yatra-gallery-thumbnails-container');
            if (!container) return;

            container.innerHTML = '';
            const totalCount = this.modal.querySelector('.yatra-gallery-total-count');
            if (totalCount) {
                totalCount.textContent = this.images.length;
            }

            this.images.forEach((img, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'yatra-gallery-thumbnail';
                thumbnail.setAttribute('data-index', index);
                if (index === 0) thumbnail.classList.add('active');

                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = img.src;
                thumbnailImg.alt = img.alt;
                thumbnail.appendChild(thumbnailImg);

                thumbnail.addEventListener('click', () => this.showImage(index));
                container.appendChild(thumbnail);
            });
        }

        showImage(index) {
            if (index < 0 || index >= this.images.length) return;

            this.currentIndex = index;
            const image = this.images[index];
            const modalImage = this.modal.querySelector('.yatra-gallery-modal-image');
            const modalLoader = this.modal.querySelector('.yatra-gallery-modal-loader');
            const currentIndexSpan = this.modal.querySelector('.yatra-gallery-current-index');
            const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
            const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');

            if (currentIndexSpan) {
                currentIndexSpan.textContent = index + 1;
            }

            // Update thumbnails
            const thumbnails = this.modal.querySelectorAll('.yatra-gallery-thumbnail');
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });

            // Show loader
            if (modalLoader) modalLoader.classList.add('active');
            if (modalImage) modalImage.classList.remove('loaded');

            // Load image
            const img = new Image();
            img.onload = () => {
                if (modalImage) {
                    modalImage.src = image.src;
                    modalImage.alt = image.alt;
                    modalImage.classList.add('loaded');
                }
                if (modalLoader) modalLoader.classList.remove('active');
            };
            img.onerror = () => {
                if (modalLoader) modalLoader.classList.remove('active');
                if (modalImage) modalImage.src = image.src;
            };
            img.src = image.src;

            // Update button states
            if (prevBtn) {
                prevBtn.style.opacity = index === 0 ? '0.5' : '1';
                prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
            }
            if (nextBtn) {
                nextBtn.style.opacity = index === this.images.length - 1 ? '0.5' : '1';
                nextBtn.style.pointerEvents = index === this.images.length - 1 ? 'none' : 'auto';
            }
        }

        open(startIndex = 0) {
            if (this.images.length === 0) return;
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.showImage(startIndex);
        }

        close() {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        next() {
            if (this.currentIndex < this.images.length - 1) {
                this.showImage(this.currentIndex + 1);
            }
        }

        prev() {
            if (this.currentIndex > 0) {
                this.showImage(this.currentIndex - 1);
            }
        }

        attachEventListeners() {
            // Close button
            const closeBtn = this.modal.querySelector('.yatra-gallery-modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            // Overlay
            const overlay = this.modal.querySelector('.yatra-gallery-modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', () => this.close());
            }

            // Navigation buttons
            const prevBtn = this.modal.querySelector('.yatra-gallery-modal-prev');
            const nextBtn = this.modal.querySelector('.yatra-gallery-modal-next');
            if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
            if (nextBtn) nextBtn.addEventListener('click', () => this.next());

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!this.modal.classList.contains('active')) return;
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
            });

            // Open from play button
            const playButton = document.querySelector('.yatra-hero-gallery-play');
            const galleryPlayBtn = document.querySelector('.yatra-gallery-play-btn');
            if (playButton) {
                playButton.addEventListener('click', () => this.open(0));
            }
            if (galleryPlayBtn) {
                galleryPlayBtn.addEventListener('click', () => this.open(0));
            }

            // Open from gallery items
            const galleryItems = document.querySelectorAll('.yatra-trip-gallery .yatra-gallery-item');
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    const img = item.querySelector('img');
                    if (img) {
                        const imageIndex = this.images.findIndex(i => i.src === img.src);
                        this.open(imageIndex >= 0 ? imageIndex : index);
                    }
                });
            });

            // Open from side images
            const sideImages = document.querySelectorAll('.yatra-side-image-item');
            sideImages.forEach((item) => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.yatra-favorite-btn') || e.target.closest('.yatra-view-all-photos-btn')) {
                        return;
                    }
                    const img = item.querySelector('img');
                    if (img) {
                        const imageIndex = this.images.findIndex(i => i.src === img.src);
                        this.open(imageIndex >= 0 ? imageIndex : 0);
                    }
                });
            });
        }
    }

    /**
     * Booking Sidebar Class
     * Handles booking form interactions (Check Availability & Make Enquiry buttons)
     * Also handles date picker and travelers selector for main booking form
     */
    class BookingSidebar {
        constructor() {
            this.checkAvailabilityBtn = null;
            this.makeEnquiryBtn = null;
            this.dateInput = null;
            this.participantsSelect = null;
            this.datepickerInstance = null;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.checkAvailabilityBtn = document.getElementById('check-availability-btn');
            this.makeEnquiryBtn = document.getElementById('open-enquiry-modal');
            this.dateInput = document.getElementById('travel_date');
            this.participantsSelect = document.querySelector('.yatra-participants-select');

            if (!this.checkAvailabilityBtn) {
                console.warn('Check Availability button not found');
            }
            
            this.attachEventListeners();
            this.initDateField();
            this.initTravelersField();
        }

        attachEventListeners() {
            // Check Availability button
            if (this.checkAvailabilityBtn) {
                this.checkAvailabilityBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCheckAvailability();
                });
            }

            // Make Enquiry button
            if (this.makeEnquiryBtn) {
                this.makeEnquiryBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleMakeEnquiry();
                });
            }
        }

        initDateField() {
            if (!this.dateInput || typeof flatpickr === 'undefined') return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Format today's date as Y-m-d
            const todayStr = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');

            // Set today's date as default value
            this.dateInput.value = todayStr;

            // Destroy existing instance if any
            if (this.dateInput._flatpickr) {
                this.dateInput._flatpickr.destroy();
            }

            this.datepickerInstance = flatpickr(this.dateInput, {
                dateFormat: 'Y-m-d',
                minDate: today,
                defaultDate: today,
                enableTime: false,
                clickOpens: true,
                allowInput: false,
                static: false,
                monthSelectorType: 'static',
                animate: true,
                locale: {
                    firstDayOfWeek: 1
                },
                onChange: (selectedDates, dateStr) => {
                    this.dateInput.value = dateStr;
                }
            });

            // Make container clickable
            const container = this.dateInput.closest('.yatra-booking-field-select');
            if (container) {
                container.style.cursor = 'pointer';
                container.onclick = (e) => {
                    if (e.target === this.dateInput) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.datepickerInstance.isOpen) {
                        this.datepickerInstance.close();
                    } else {
                        this.datepickerInstance.open();
                    }
                };
            }
        }

        initTravelersField() {
            if (!this.participantsSelect) return;

            const display = document.getElementById('participants-display');
            const selector = document.getElementById('quantity-selector');
            const adultsInput = document.getElementById('adults');
            const childrenInput = document.getElementById('children');

            if (!display || !selector || !adultsInput || !childrenInput) return;

            // Make display clickable
            display.style.cursor = 'pointer';

            // Toggle dropdown
            this.participantsSelect.onclick = (e) => {
                if (e.target.closest('.yatra-quantity-btn')) return;
                if (selector.contains(e.target)) return;
                e.preventDefault();
                e.stopPropagation();
                this.participantsSelect.classList.toggle('active');
            };

            // Update display function
            const updateDisplay = () => {
                const adults = parseInt(adultsInput.value || 1);
                const children = parseInt(childrenInput.value || 0);
                let text = '';
                if (adults > 0 && children > 0) {
                    text = `Adult x ${adults}, Child x ${children}`;
                } else if (adults > 0) {
                    text = `Adult x ${adults}`;
                } else if (children > 0) {
                    text = `Child x ${children}`;
                } else {
                    text = 'Adult x 1';
                }
                display.textContent = text;
            };

            // Quantity button handlers
            selector.onclick = (e) => {
                const btn = e.target.closest('.yatra-quantity-btn');
                if (!btn) return;

                e.preventDefault();
                e.stopPropagation();

                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;

                const current = parseInt(input.value || 0);
                const min = parseInt(input.getAttribute('min') || 0);
                const max = parseInt(input.getAttribute('max') || 999);
                const isPlus = btn.classList.contains('yatra-quantity-plus');
                const isMinus = btn.classList.contains('yatra-quantity-minus');

                let newValue = current;
                if (isPlus && current < max) {
                    newValue = current + 1;
                } else if (isMinus && current > min) {
                    newValue = current - 1;
                }

                if (newValue !== current) {
                    input.value = newValue;
                    updateDisplay();

                    // Update button states
                    const row = input.closest('.yatra-quantity-row');
                    if (row) {
                        const minusBtn = row.querySelector('.yatra-quantity-minus');
                        const plusBtn = row.querySelector('.yatra-quantity-plus');
                        if (minusBtn) minusBtn.disabled = newValue <= min;
                        if (plusBtn) plusBtn.disabled = newValue >= max;
                    }
                }
            };

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.participantsSelect.contains(e.target)) {
                    this.participantsSelect.classList.remove('active');
                }
            });

            // Initialize
            updateDisplay();
            [adultsInput, childrenInput].forEach((input) => {
                const value = parseInt(input.value || 0);
                const min = parseInt(input.getAttribute('min') || 0);
                const max = parseInt(input.getAttribute('max') || 999);
                const row = input.closest('.yatra-quantity-row');
                if (row) {
                    const minusBtn = row.querySelector('.yatra-quantity-minus');
                    const plusBtn = row.querySelector('.yatra-quantity-plus');
                    if (minusBtn) minusBtn.disabled = value <= min;
                    if (plusBtn) plusBtn.disabled = value >= max;
                }
            });
        }

        handleCheckAvailability() {
            console.log('Check Availability clicked');
            
            // Get form values
            const dateInput = document.getElementById('travel_date');
            const adultsInput = document.getElementById('adults');
            const childrenInput = document.getElementById('children');

            const date = dateInput ? dateInput.value : '';
            const adults = adultsInput ? parseInt(adultsInput.value) || 0 : 0;
            const children = childrenInput ? parseInt(childrenInput.value) || 0 : 0;

            console.log('Form values:', { date, adults, children });

            // Basic validation
            if (!date) {
                alert('Please select a travel date');
                return;
            }

            if (adults === 0 && children === 0) {
                alert('Please select number of travelers');
                return;
            }

            // Show loading state
            const originalText = this.checkAvailabilityBtn ? this.checkAvailabilityBtn.textContent : 'Check availability';
            if (this.checkAvailabilityBtn) {
                this.checkAvailabilityBtn.textContent = 'Checking...';
                this.checkAvailabilityBtn.disabled = true;
            }

            // Get trip ID from data attribute or global variable
            const tripId = this.checkAvailabilityBtn?.dataset?.tripId || 
                          document.querySelector('[data-trip-id]')?.dataset?.tripId ||
                          (window.yatraTripData && window.yatraTripData.tripId) ||
                          1; // Fallback to 1 for dummy data

            // Check if availability section already exists
            let availabilitySection = document.getElementById('availability');
            
            if (availabilitySection) {
                // Section already loaded, just show it
                availabilitySection.style.display = 'block';
                this.scrollToAvailability(availabilitySection);
                this.resetButton(originalText);
                return;
            }

            // Make AJAX call to get availability template
            let baseUrl = '/wp-json';
            if (window.yatraTripData && window.yatraTripData.restUrl) {
                baseUrl = window.yatraTripData.restUrl;
            } else if (window.wpApiSettings && window.wpApiSettings.root) {
                baseUrl = window.wpApiSettings.root;
            }
            
            // Ensure baseUrl doesn't end with slash
            baseUrl = baseUrl.replace(/\/$/, '');
            
            // Check if baseUrl already includes /yatra/v1 (rest_url('yatra/v1') includes it)
            let restUrl;
            if (baseUrl.includes('/yatra/v1')) {
                // baseUrl already includes the namespace, just add the endpoint
                restUrl = baseUrl + '/trips/' + tripId + '/availability-template';
            } else {
                // Need to add the namespace
                restUrl = baseUrl + '/yatra/v1/trips/' + tripId + '/availability-template';
            }
            const nonce = (window.yatraTripData && window.yatraTripData.nonce) || '';

            console.log('Fetching availability from:', restUrl);

            fetch(restUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin'
            })
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    // Try to get error message from response
                    return response.json().then(err => {
                        console.error('API Error:', err);
                        throw new Error(err.message || 'Failed to fetch availability');
                    }).catch(() => {
                        throw new Error('Failed to fetch availability (Status: ' + response.status + ')');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (!data || !data.html) {
                    throw new Error('No HTML returned from server');
                }

                // Find the currently active section (first visible section or overview)
                const activeSection = this.findActiveSection();
                
                // Create a temporary container to parse HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.html;
                const newSection = tempDiv.firstElementChild;

                if (!newSection) {
                    throw new Error('Invalid HTML structure');
                }

                // Insert before the active section
                if (activeSection && activeSection.parentNode) {
                    activeSection.parentNode.insertBefore(newSection, activeSection);
                } else {
                    // Fallback: insert at the end of main content
                    const mainContent = document.querySelector('.yatra-trip-main');
                    if (mainContent) {
                        mainContent.appendChild(newSection);
                    }
                }

                // Add menu item to sticky nav at the same position
                // Pass the activeSection so we can find the corresponding menu item
                this.addAvailabilityMenuItem(activeSection);

                // Initialize availability section handlers
                if (window.availabilitySection) {
                    window.availabilitySection.setup();
                } else {
                    // Initialize if not already done
                    window.availabilitySection = new AvailabilitySection();
                    window.availabilitySection.setup();
                }

                // Re-setup sticky nav to include the new menu item
                if (window.stickyNav) {
                    window.stickyNav.setup();
                }

                // Scroll to the new section
                this.scrollToAvailability(newSection);

                // Reset button state
                this.resetButton(originalText);
            })
            .catch(error => {
                console.error('Error loading availability:', error);
                alert('Failed to load availability. Please try again.');
                this.resetButton(originalText);
            });
        }

        findActiveSection() {
            // Find the first visible section or default to overview
            const sections = document.querySelectorAll('.yatra-trip-section');
            for (let section of sections) {
                const rect = section.getBoundingClientRect();
                if (rect.top >= 0 && rect.top < window.innerHeight) {
                    return section;
                }
            }
            // Default to overview section
            return document.getElementById('overview') || sections[0];
        }

        addAvailabilityMenuItem(activeSection) {
            const stickyNav = document.querySelector('.yatra-sticky-nav-container');
            if (!stickyNav) return;

            // Check if menu item already exists
            if (document.querySelector('.yatra-sticky-nav-item[href="#availability"]')) {
                return;
            }

            // Find the corresponding menu item for the active section
            let insertBeforeItem = null;
            let activeSectionId = null;
            
            if (activeSection) {
                activeSectionId = activeSection.id;
                if (activeSectionId) {
                    // Find the menu item that links to this section
                    insertBeforeItem = document.querySelector('.yatra-sticky-nav-item[href="#' + activeSectionId + '"]');
                }
            }
            
            // If no active section or menu item found, default to inserting after "What's Included"
            if (!insertBeforeItem) {
                insertBeforeItem = document.querySelector('.yatra-sticky-nav-item[href="#included"]');
                if (insertBeforeItem) {
                    insertBeforeItem = insertBeforeItem.nextSibling; // Insert after "What's Included"
                }
            }

            // Create new menu item
            const newItem = document.createElement('a');
            newItem.href = '#availability';
            newItem.className = 'yatra-sticky-nav-item';
            newItem.innerHTML = `
                <svg class="yatra-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Availability</span>
            `;

            // Insert before the target item (or after "What's Included" if no target)
            if (insertBeforeItem && insertBeforeItem.parentNode) {
                insertBeforeItem.parentNode.insertBefore(newItem, insertBeforeItem);
            } else {
                // Fallback: append to the end
                stickyNav.appendChild(newItem);
            }

            // Update sticky nav to handle new item
            if (window.stickyNav) {
                // Add availability to sections array if not already there
                // Insert it in the correct position based on where the section was inserted
                if (!window.stickyNav.sections.includes('availability')) {
                    if (activeSectionId) {
                        const activeIndex = window.stickyNav.sections.indexOf(activeSectionId);
                        if (activeIndex >= 0) {
                            // Insert availability before the active section
                            window.stickyNav.sections.splice(activeIndex, 0, 'availability');
                        } else {
                            window.stickyNav.sections.push('availability');
                        }
                    } else {
                        window.stickyNav.sections.push('availability');
                    }
                }
                // Re-setup to attach event listeners to new menu item
                window.stickyNav.setup();
            }
        }

        scrollToAvailability(section) {
            setTimeout(() => {
                const offset = 150;
                const elementPosition = section.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Update sticky nav active state after scroll completes
                setTimeout(() => {
                    if (window.stickyNav) {
                        window.stickyNav.updateActiveNav();
                    }
                }, 300); // Wait for smooth scroll to complete
            }, 100);
        }

        resetButton(originalText) {
            if (this.checkAvailabilityBtn) {
                this.checkAvailabilityBtn.textContent = originalText;
                this.checkAvailabilityBtn.disabled = false;
            }
        }

        handleMakeEnquiry() {
            // This will be handled by EnquiryModal class
            // Just trigger the modal open
            if (window.enquiryModal) {
                window.enquiryModal.open();
            }
        }

        setTravelers(adults, children) {
            const adultsInput = document.getElementById('adults');
            const childrenInput = document.getElementById('children');
            
            if (adultsInput) {
                adultsInput.value = adults;
                // Trigger change event to update display
                const event = new Event('change', { bubbles: true });
                adultsInput.dispatchEvent(event);
            }
            
            if (childrenInput) {
                childrenInput.value = children;
                // Trigger change event to update display
                const event = new Event('change', { bubbles: true });
                childrenInput.dispatchEvent(event);
            }
        }
    }

    /**
     * Enquiry Modal Class
     * Handles enquiry form modal functionality
     */
    class EnquiryModal {
        constructor() {
            this.modal = null;
            this.form = null;
            this.dateInput = null;
            this.participantsSelect = null;
            this.datepickerInstance = null;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.modal = document.getElementById('enquiry-modal');
            if (!this.modal) return;

            this.form = document.getElementById('enquiry-form');
            this.dateInput = document.getElementById('enquiry-travel-date');
            this.participantsSelect = document.querySelector('.yatra-enquiry-participants');

            this.attachEventListeners();
        }

        attachEventListeners() {
            // Close button
            const closeBtn = document.getElementById('close-enquiry-modal');
            const modalClose = document.querySelector('.yatra-enquiry-modal-close');
            const overlay = document.querySelector('.yatra-enquiry-modal-overlay');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            if (modalClose) {
                modalClose.addEventListener('click', () => this.close());
            }
            if (overlay) {
                overlay.addEventListener('click', () => this.close());
            }

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                    this.close();
                }
            });

            // Form submission
            if (this.form) {
                this.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });
            }
        }

        open() {
            if (!this.modal) return;
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Initialize form fields after modal is visible
            setTimeout(() => {
                this.initDateField();
                this.initTravelersField();
            }, 300);
        }

        close() {
            if (!this.modal) return;
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        initDateField() {
            if (!this.dateInput || typeof flatpickr === 'undefined') return;

            // Sync date from main form
            const mainDateInput = document.getElementById('travel_date');
            if (mainDateInput && mainDateInput.value) {
                this.dateInput.value = mainDateInput.value;
            }

            // Destroy existing instance
            if (this.dateInput._flatpickr) {
                this.dateInput._flatpickr.destroy();
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            this.datepickerInstance = flatpickr(this.dateInput, {
                dateFormat: 'Y-m-d',
                minDate: today,
                enableTime: false,
                clickOpens: true,
                allowInput: false,
                static: false,
                monthSelectorType: 'static',
                animate: true,
                locale: {
                    firstDayOfWeek: 1
                },
                onChange: (selectedDates, dateStr) => {
                    this.dateInput.value = dateStr;
                }
            });

            // Make container clickable
            const container = this.dateInput.closest('.yatra-booking-field-select');
            if (container) {
                container.style.cursor = 'pointer';
                container.onclick = (e) => {
                    if (e.target === this.dateInput) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.datepickerInstance.isOpen) {
                        this.datepickerInstance.close();
                    } else {
                        this.datepickerInstance.open();
                    }
                };
            }
        }

        initTravelersField() {
            if (!this.participantsSelect) return;

            const display = document.getElementById('enquiry-participants-display');
            const selector = document.getElementById('enquiry-quantity-selector');
            const adultsInput = document.getElementById('enquiry-adults');
            const childrenInput = document.getElementById('enquiry-children');

            if (!display || !selector || !adultsInput || !childrenInput) return;

            // Make display clickable
            display.style.cursor = 'pointer';

            // Toggle dropdown
            this.participantsSelect.onclick = (e) => {
                if (e.target.closest('.yatra-quantity-btn')) return;
                if (selector.contains(e.target)) return;
                e.preventDefault();
                e.stopPropagation();
                this.participantsSelect.classList.toggle('active');
            };

            // Update display function
            const updateDisplay = () => {
                const adults = parseInt(adultsInput.value || 1);
                const children = parseInt(childrenInput.value || 0);
                let text = '';
                if (adults > 0 && children > 0) {
                    text = `Adult x ${adults}, Child x ${children}`;
                } else if (adults > 0) {
                    text = `Adult x ${adults}`;
                } else if (children > 0) {
                    text = `Child x ${children}`;
                } else {
                    text = 'Adult x 1';
                }
                display.textContent = text;
            };

            // Quantity button handlers
            selector.onclick = (e) => {
                const btn = e.target.closest('.yatra-quantity-btn');
                if (!btn) return;

                e.preventDefault();
                e.stopPropagation();

                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;

                const current = parseInt(input.value || 0);
                const min = parseInt(input.getAttribute('min') || 0);
                const max = parseInt(input.getAttribute('max') || 999);
                const isPlus = btn.classList.contains('yatra-quantity-plus');
                const isMinus = btn.classList.contains('yatra-quantity-minus');

                let newValue = current;
                if (isPlus && current < max) {
                    newValue = current + 1;
                } else if (isMinus && current > min) {
                    newValue = current - 1;
                }

                if (newValue !== current) {
                    input.value = newValue;
                    updateDisplay();

                    // Update button states
                    const row = input.closest('.yatra-quantity-row');
                    if (row) {
                        const minusBtn = row.querySelector('.yatra-quantity-minus');
                        const plusBtn = row.querySelector('.yatra-quantity-plus');
                        if (minusBtn) minusBtn.disabled = newValue <= min;
                        if (plusBtn) plusBtn.disabled = newValue >= max;
                    }
                }
            };

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.participantsSelect.contains(e.target)) {
                    this.participantsSelect.classList.remove('active');
                }
            });

            // Initialize
            updateDisplay();
            [adultsInput, childrenInput].forEach((input) => {
                const value = parseInt(input.value || 0);
                const min = parseInt(input.getAttribute('min') || 0);
                const max = parseInt(input.getAttribute('max') || 999);
                const row = input.closest('.yatra-quantity-row');
                if (row) {
                    const minusBtn = row.querySelector('.yatra-quantity-minus');
                    const plusBtn = row.querySelector('.yatra-quantity-plus');
                    if (minusBtn) minusBtn.disabled = value <= min;
                    if (plusBtn) plusBtn.disabled = value >= max;
                }
            });
        }

        handleSubmit() {
            if (!this.form) return;

            const formData = new FormData(this.form);
            const messageBox = document.getElementById('enquiry-message-box');
            
            // Get values from hidden inputs for adults/children
            const adults = document.getElementById('enquiry-adults')?.value || 1;
            const children = document.getElementById('enquiry-children')?.value || 0;
            
            // Add adults and children to formData
            formData.set('adults', adults);
            formData.set('children', children);

            // Validation
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            if (!name || !email || !message) {
                this.showMessage('error', 'Please fill in all required fields.');
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showMessage('error', 'Please enter a valid email address.');
                return;
            }

            if (message.length < 10) {
                this.showMessage('error', 'Please enter a message (at least 10 characters).');
                return;
            }

            // Show loading
            const submitBtn = this.form.querySelector('.yatra-enquiry-submit');
            const originalText = submitBtn ? submitBtn.textContent : 'Send Enquiry';
            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
            }

            // Hide any existing messages
            if (messageBox) {
                messageBox.style.display = 'none';
            }

            // Submit via AJAX
            fetch(window.yatraAjax?.ajaxUrl || '/wp-admin/admin-ajax.php', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    this.showMessage('success', result.data.message || 'Thank you for your enquiry! We will get back to you soon.');
                    this.form.reset();
                    
                    // Reset the travelers display
                    const display = document.getElementById('enquiry-participants-display');
                    if (display) {
                        display.textContent = 'Adult x 1';
                    }
                    const adultsInput = document.getElementById('enquiry-adults');
                    const childrenInput = document.getElementById('enquiry-children');
                    if (adultsInput) adultsInput.value = 1;
                    if (childrenInput) childrenInput.value = 0;
                    
                    // Close modal after delay
                    setTimeout(() => {
                        this.close();
                        if (messageBox) {
                            messageBox.style.display = 'none';
                        }
                    }, 3000);
                } else {
                    this.showMessage('error', result.data?.message || 'Failed to submit enquiry. Please try again.');
                }
            })
            .catch(error => {
                console.error('Enquiry submission error:', error);
                this.showMessage('error', 'An error occurred. Please try again later.');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }

        showMessage(type, text) {
            const messageBox = document.getElementById('enquiry-message-box');
            if (!messageBox) return;
            
            messageBox.style.display = 'block';
            messageBox.className = `yatra-enquiry-message yatra-enquiry-message-${type}`;
            messageBox.innerHTML = `<p>${text}</p>`;
            
            // Scroll message into view
            messageBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Sticky Navigation Class
     * Handles sticky navigation bar functionality
     */
    class StickyNav {
        constructor() {
            this.nav = null;
            this.sidebar = null;
            this.navItems = [];
            this.sections = [];
            this.scrollThreshold = 200;
            this.lastScrollTop = 0;
            this.navHeight = 0;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.nav = document.querySelector('.yatra-sticky-nav');
            if (!this.nav) return;

            this.sidebar = document.querySelector('.yatra-trip-sidebar');
            this.navItems = this.nav.querySelectorAll('.yatra-sticky-nav-item');
            this.sections = ['overview', 'trip-details', 'itinerary', 'included', 'availability'];
            
            // Calculate nav height
            this.navHeight = this.nav.offsetHeight || 60;

            this.attachEventListeners();
            this.handleScroll(); // Initial check
            this.updateActiveNav(); // Initial check
            this.updateSidebarPosition(); // Initial check
        }

        attachEventListeners() {
            // Handle clicks on nav items
            this.navItems.forEach((item) => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = item.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        const sectionId = href.substring(1);
                        this.scrollToSection(sectionId);
                        
                        // Update active state
                        this.navItems.forEach((nav) => nav.classList.remove('active'));
                        item.classList.add('active');
                    }
                });
            });

            // Handle scroll events
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });
            
            // Update sidebar position when nav visibility changes
            const observer = new MutationObserver(() => {
                this.updateSidebarPosition();
            });
            observer.observe(this.nav, { attributes: true, attributeFilter: ['class'] });
        }

        updateSidebarPosition() {
            if (!this.sidebar) return;
            
            const isNavVisible = this.nav.classList.contains('visible');
            const isAdminBar = document.body.classList.contains('admin-bar');
            
            // Calculate base top position
            let topPosition = 0;
            
            if (isAdminBar) {
                // Check if mobile admin bar (782px breakpoint)
                if (window.innerWidth <= 782) {
                    topPosition = 46; // Mobile admin bar
                } else {
                    topPosition = 32; // Desktop admin bar
                }
            }
            
            // Add sticky nav height if visible
            if (isNavVisible) {
                topPosition += this.navHeight;
            }
            
            // Apply to sidebar
            this.sidebar.style.top = topPosition + 'px';
        }

        scrollToSection(sectionId) {
            const section = document.getElementById(sectionId);
            if (!section) return;

            const offset = 100;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Show nav when scrolling down past threshold
            if (scrollTop > this.scrollThreshold) {
                this.nav.classList.add('visible');
            } else {
                this.nav.classList.remove('visible');
            }

            this.lastScrollTop = scrollTop;
        }

        updateActiveNav() {
            const scrollPos = window.scrollY + 150;
            let activeSectionId = null;
            
            // Find which section is currently in view
            this.sections.forEach((sectionId) => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    
                    if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                        activeSectionId = sectionId;
                    }
                }
            });
            
            // Update active state based on section ID (not index)
            if (activeSectionId) {
                this.navItems.forEach((nav) => {
                    nav.classList.remove('active');
                    const href = nav.getAttribute('href');
                    if (href === '#' + activeSectionId) {
                        nav.classList.add('active');
                    }
                });
            }
        }

        onScroll() {
            this.handleScroll();
            this.updateActiveNav();
            this.updateSidebarPosition();
        }
    }

    /**
     * Availability Section Class
     * Handles availability section interactions (filters, load more)
     */
    class AvailabilitySection {
        constructor() {
            this.section = null;
            this.filterButtons = [];
            this.availabilityItems = [];
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.section = document.getElementById('availability');
            if (!this.section) return;

            this.filterButtons = this.section.querySelectorAll('.yatra-availability-filter-btn');
            this.availabilityItems = this.section.querySelectorAll('.yatra-availability-card');

            this.attachEventListeners();
        }

        attachEventListeners() {
            // Month filter buttons
            this.filterButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const filter = btn.getAttribute('data-filter');
                    this.filterByMonth(filter);
                    
                    // Update active state
                    this.filterButtons.forEach((b) => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // Sort dropdown
            const sortSelect = document.getElementById('availability-sort');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.sortItems(e.target.value);
                });
            }

            this.setupToggleHandlers();

            // Traveler selector buttons
            this.initTravelerSelectors();

            // Book Now buttons - redirect to booking page with parameters
            const bookButtons = this.section.querySelectorAll('.yatra-card-book-btn');
            bookButtons.forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    // Get booking details
                    const date = btn.getAttribute('data-date');
                    const price = btn.getAttribute('data-price');
                    const itemIndex = btn.getAttribute('data-item');
                    const adults = this.getTravelerCount(itemIndex, 'adults');
                    const children = this.getTravelerCount(itemIndex, 'children');
                    
                    // Build URL with parameters
                    const baseUrl = btn.getAttribute('href');
                    const params = new URLSearchParams({
                        date: date,
                        adults: adults,
                        children: children,
                        price: price
                    });
                    
                    // Navigate to booking page with parameters
                    window.location.href = baseUrl + '?' + params.toString();
                    e.preventDefault();
                });
            });

            // Load more button
            const loadMoreBtn = this.section.querySelector('.yatra-availability-load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    this.handleLoadMore();
                });
            }
        }

        initTravelerSelectors() {
            const participantsSelects = this.section.querySelectorAll('.yatra-availability-participants');
            
            participantsSelects.forEach((select) => {
                const itemIndex = select.getAttribute('data-item');
                const display = select.querySelector('.yatra-availability-participants-display');
                const adultsInput = select.querySelector('.yatra-availability-adults');
                const childrenInput = select.querySelector('.yatra-availability-children');
                
                if (!display || !adultsInput || !childrenInput) return;
                
                // Toggle dropdown on display click
                display.addEventListener('click', (e) => {
                    e.stopPropagation();
                    select.classList.toggle('active');
                });
                
                // Update display text
                const updateDisplay = () => {
                    const adults = parseInt(adultsInput.value) || 0;
                    const children = parseInt(childrenInput.value) || 0;
                    let displayText = '';
                    if (adults > 0) {
                        displayText = `Adult${adults > 1 ? 's' : ''} x ${adults}`;
                    }
                    if (children > 0) {
                        if (displayText) displayText += ', ';
                        displayText += `Child${children > 1 ? 'ren' : ''} x ${children}`;
                    }
                    if (!displayText) displayText = 'Adult x 1';
                    display.textContent = displayText;
                };
                
                // Quantity button handlers
                const quantityButtons = select.querySelectorAll('.yatra-quantity-btn');
                quantityButtons.forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const target = btn.getAttribute('data-target');
                        const input = target === 'adults' ? adultsInput : childrenInput;
                        const isMinus = btn.classList.contains('yatra-quantity-minus');
                        const isPlus = btn.classList.contains('yatra-quantity-plus');
                        
                        let current = parseInt(input.value) || 0;
                        const min = parseInt(input.getAttribute('min')) || 0;
                        const max = parseInt(input.getAttribute('max')) || 999;
                        let newValue = current;
                        
                        if (isPlus && current < max) {
                            newValue = current + 1;
                        } else if (isMinus && current > min) {
                            newValue = current - 1;
                        }
                        
                        if (newValue !== current) {
                            input.value = newValue;
                            updateDisplay();
                            
                            // Update button states
                            const row = btn.closest('.yatra-quantity-row');
                            if (row) {
                                const minusBtn = row.querySelector('.yatra-quantity-minus');
                                const plusBtn = row.querySelector('.yatra-quantity-plus');
                                if (minusBtn) minusBtn.disabled = newValue <= min;
                                if (plusBtn) plusBtn.disabled = newValue >= max;
                            }
                            
                            // Update total price
                            this.updateTotalPrice(itemIndex);
                        }
                    });
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!select.contains(e.target)) {
                        select.classList.remove('active');
                    }
                });
                
                // Initialize display
                updateDisplay();
                
                // Initialize button states
                [adultsInput, childrenInput].forEach((input) => {
                    const value = parseInt(input.value || 0);
                    const min = parseInt(input.getAttribute('min') || 0);
                    const max = parseInt(input.getAttribute('max') || 999);
                    const row = input.closest('.yatra-quantity-row');
                    if (row) {
                        const minusBtn = row.querySelector('.yatra-quantity-minus');
                        const plusBtn = row.querySelector('.yatra-quantity-plus');
                        if (minusBtn) minusBtn.disabled = value <= min;
                        if (plusBtn) plusBtn.disabled = value >= max;
                    }
                });
            });
        }

        setupToggleHandlers() {
            if (!this.availabilityItems || !this.availabilityItems.length) return;
            this.availabilityItems.forEach((item) => {
                const toggle = item.querySelector('.yatra-availability-toggle');
                if (!toggle) return;

                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isOpen = item.classList.contains('open');
                    this.availabilityItems.forEach((other) => other.classList.remove('open'));
                    if (!isOpen) {
                        item.classList.add('open');
                    }
                });
            });
        }

        getTravelerCount(itemIndex, type) {
            const select = this.section.querySelector(
                `.yatra-availability-participants[data-item="${itemIndex}"]`
            );
            if (!select) return type === 'adults' ? 1 : 0;
            
            const input = select.querySelector(
                type === 'adults' ? '.yatra-availability-adults' : '.yatra-availability-children'
            );
            if (!input) return type === 'adults' ? 1 : 0;
            const value = parseInt(input.value) || 0;
            return type === 'adults' && value === 0 ? 1 : value;
        }

        updateTotalPrice(itemIndex) {
            const adults = this.getTravelerCount(itemIndex, 'adults');
            const children = this.getTravelerCount(itemIndex, 'children');
            const totalTravelers = adults + children;

            const totalAmountElement = this.section.querySelector(
                `.yatra-availability-total-amount[data-item="${itemIndex}"]`
            );
            if (!totalAmountElement) return;

            const basePrice = parseFloat(totalAmountElement.getAttribute('data-base-price')) || 0;
            // Assume children are 50% of adult price (can be adjusted)
            const childPrice = basePrice * 0.5;
            const totalPrice = (adults * basePrice) + (children * childPrice);

            // Get currency from data attribute or default to USD
            const currency = totalAmountElement.getAttribute('data-currency') || 'USD';
            totalAmountElement.textContent = currency + totalPrice.toFixed(2);

            const noteElement = this.section.querySelector(
                `.yatra-availability-total-note[data-item="${itemIndex}"]`
            );
            if (noteElement) {
                const travelerText = totalTravelers === 1
                    ? 'for 1 traveler'
                    : `for ${totalTravelers} travelers`;
                noteElement.textContent = travelerText;
            }
        }

        filterByMonth(filter) {
            this.availabilityItems.forEach((item) => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else {
                    const itemMonth = item.getAttribute('data-month');
                    if (itemMonth === filter) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        }

        sortItems(sortBy) {
            const items = Array.from(this.availabilityItems);
            const list = this.section.querySelector('.yatra-availability-list');
            if (!list) return;

            items.sort((a, b) => {
                switch (sortBy) {
                    case 'date-asc':
                        return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
                    case 'date-desc':
                        return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
                    case 'price-asc':
                        return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
                    case 'price-desc':
                        return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
                    case 'seats-desc':
                        return parseInt(b.getAttribute('data-seats')) - parseInt(a.getAttribute('data-seats'));
                    default:
                        return 0;
                }
            });

            // Re-append sorted items
            items.forEach((item) => {
                list.appendChild(item);
            });
        }

        handleBookNow(date, price, button, adults = 1, children = 0) {
            // Get travelers from the availability card if not provided
            const itemIndex = button.getAttribute('data-item');
            if (itemIndex) {
                adults = this.getTravelerCount(itemIndex, 'adults');
                children = this.getTravelerCount(itemIndex, 'children');
            }
            
            // Update the main booking form with selected date
            const dateInput = document.getElementById('travel_date');
            if (dateInput) {
                // Format date for display (YYYY-MM-DD)
                dateInput.value = date;
                // Trigger change event if using Flatpickr
                if (dateInput._flatpickr) {
                    dateInput._flatpickr.setDate(date, true);
                }
            }

            // Update travelers in booking sidebar
            if (window.bookingSidebar) {
                window.bookingSidebar.setTravelers(adults, children);
            }

            // Scroll to booking sidebar
            const bookingSidebar = document.getElementById('booking');
            if (bookingSidebar) {
                bookingSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Show success feedback
            const originalText = button.textContent;
            button.textContent = 'Selected!';
            button.style.background = '#10b981';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }

        handleLoadMore() {
            // Simulate loading more departures
            const btn = this.section.querySelector('.yatra-availability-load-more-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Loading...';
                btn.disabled = true;

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    // In real implementation, this would load more items via AJAX
                }, 1000);
            }
        }
    }

    /**
     * Itinerary Section Class
     * Handles day toggle functionality for itinerary timeline
     */
    class ItinerarySection {
        constructor() {
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.container = document.querySelector('.yatra-itinerary-timeline');
            if (!this.container) return;

            this.days = this.container.querySelectorAll('.yatra-itinerary-day');
            this.expandAllBtn = document.getElementById('yatra-expand-all');
            this.collapseAllBtn = document.getElementById('yatra-collapse-all');
            this.attachEventListeners();
            this.initializeDefaultState();
        }

        // Initialize default state: collapse all except first day
        initializeDefaultState() {
            this.days.forEach((day, index) => {
                const content = day.querySelector('.yatra-itinerary-day-content');
                const toggle = day.querySelector('.yatra-day-toggle');
                
                if (content) {
                    if (index === 0) {
                        // Keep first day expanded
                        content.style.display = 'block';
                        day.setAttribute('data-expanded', 'true');
                        if (toggle) {
                            toggle.setAttribute('aria-expanded', 'true');
                            const icon = toggle.querySelector('.yatra-chevron-icon');
                            if (icon) icon.style.transform = 'rotate(0deg)';
                        }
                    } else {
                        // Collapse all other days
                        content.style.display = 'none';
                        day.setAttribute('data-expanded', 'false');
                        if (toggle) {
                            toggle.setAttribute('aria-expanded', 'false');
                            const icon = toggle.querySelector('.yatra-chevron-icon');
                            if (icon) icon.style.transform = 'rotate(-90deg)';
                        }
                    }
                }
            });
        }

        attachEventListeners() {
            // Expand All button
            if (this.expandAllBtn) {
                this.expandAllBtn.addEventListener('click', () => this.expandAll());
            }

            // Collapse All button
            if (this.collapseAllBtn) {
                this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
            }

            this.days.forEach(day => {
                const header = day.querySelector('.yatra-itinerary-day-header');
                const toggle = day.querySelector('.yatra-day-toggle');
                const content = day.querySelector('.yatra-itinerary-day-content');

                if (header && content) {
                    header.addEventListener('click', (e) => {
                        // Don't toggle if clicking on a link inside header
                        if (e.target.tagName === 'A') return;
                        this.toggleDay(day, content, toggle);
                    });
                }
            });
        }

        toggleDay(day, content, toggle) {
            const isExpanded = content.style.display !== 'none';
            
            if (isExpanded) {
                content.style.display = 'none';
                day.setAttribute('data-expanded', 'false');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    const icon = toggle.querySelector('.yatra-chevron-icon');
                    if (icon) icon.style.transform = 'rotate(-90deg)';
                }
            } else {
                content.style.display = 'block';
                day.setAttribute('data-expanded', 'true');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'true');
                    const icon = toggle.querySelector('.yatra-chevron-icon');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            }
        }

        expandAll() {
            this.days.forEach(day => {
                const content = day.querySelector('.yatra-itinerary-day-content');
                const toggle = day.querySelector('.yatra-day-toggle');
                if (content) {
                    content.style.display = 'block';
                    day.setAttribute('data-expanded', 'true');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'true');
                        const icon = toggle.querySelector('.yatra-chevron-icon');
                        if (icon) icon.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }

        collapseAll() {
            this.days.forEach(day => {
                const content = day.querySelector('.yatra-itinerary-day-content');
                const toggle = day.querySelector('.yatra-day-toggle');
                if (content) {
                    content.style.display = 'none';
                    day.setAttribute('data-expanded', 'false');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        const icon = toggle.querySelector('.yatra-chevron-icon');
                        if (icon) icon.style.transform = 'rotate(-90deg)';
                    }
                }
            });
        }
    }

    // ============================================
    // REVIEW FORM
    // ============================================
    class ReviewForm {
        constructor() {
            this.form = document.getElementById('yatra-review-form');
            if (this.form) {
                this.init();
            }
        }

        init() {
            this.setupStarRating();
            this.setupFormSubmission();
        }

        setupStarRating() {
            const ratingContainer = this.form.querySelector('.yatra-star-rating-input');
            if (!ratingContainer) return;

            const ratingInputs = Array.from(ratingContainer.querySelectorAll('input[type="radio"]'));
            const ratingLabels = Array.from(ratingContainer.querySelectorAll('.yatra-star-label'));

            // Get the rating value for a label by its associated input
            const getLabelRating = (label) => {
                const forAttr = label.getAttribute('for');
                if (forAttr) {
                    const input = document.getElementById(forAttr);
                    return input ? parseInt(input.value) : 0;
                }
                return 0;
            };

            // Function to update visual state
            const updateStars = (rating) => {
                ratingLabels.forEach((label) => {
                    const labelRating = getLabelRating(label);
                    if (labelRating <= rating) {
                        label.classList.add('selected');
                    } else {
                        label.classList.remove('selected');
                    }
                });
            };

            // Initialize visual state based on currently checked rating
            const checkedInput = ratingContainer.querySelector('input:checked');
            if (checkedInput) {
                updateStars(parseInt(checkedInput.value));
            }

            // Handle rating changes via input change event
            ratingInputs.forEach(input => {
                input.addEventListener('change', () => {
                    updateStars(parseInt(input.value));
                });
            });

            // Handle direct clicks on labels
            ratingLabels.forEach((label) => {
                label.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const forAttr = label.getAttribute('for');
                    if (!forAttr) return;
                    
                    const targetInput = document.getElementById(forAttr);
                    if (targetInput && !targetInput.disabled) {
                        targetInput.checked = true;
                        const ratingValue = parseInt(targetInput.value);
                        updateStars(ratingValue);
                        // Trigger change event for any other listeners
                        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });

                // Hover effect
                label.addEventListener('mouseenter', () => {
                    const hoverRating = getLabelRating(label);
                    ratingLabels.forEach((l) => {
                        const lRating = getLabelRating(l);
                        if (lRating <= hoverRating) {
                            l.classList.add('hover');
                        } else {
                            l.classList.remove('hover');
                        }
                    });
                });
            });

            // Remove hover effect when leaving the container
            ratingContainer.addEventListener('mouseleave', () => {
                ratingLabels.forEach(l => l.classList.remove('hover'));
            });
        }

        setupFormSubmission() {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = this.form.querySelector('.yatra-review-submit-btn');
                const originalText = submitBtn.innerHTML;

                // Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="yatra-loading-spinner"></span> Submitting...';

                try {
                    const formData = new FormData(this.form);
                    formData.append('action', 'yatra_submit_review');

                    const response = await fetch(yatraTripData?.ajaxUrl || '/wp-admin/admin-ajax.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Show success message
                        this.showMessage('success', result.data?.message || 'Thank you for your review!');
                        
                        // Check if this was an edit or new submission
                        const isEdit = this.form.querySelector('input[name="action_type"]')?.value === 'edit';
                        
                        if (!isEdit) {
                            // Only reset form for new submissions, not edits
                            this.form.reset();
                            
                            // Reset star rating to 5 stars
                            const fiveStarInput = this.form.querySelector('input[name="rating"][value="5"]');
                            if (fiveStarInput) {
                                fiveStarInput.checked = true;
                                // Also update the visual display
                                const ratingLabels = this.form.querySelectorAll('.yatra-star-label');
                                ratingLabels.forEach(label => label.classList.add('selected'));
                            }
                        }
                    } else {
                        this.showMessage('error', result.data?.message || 'Failed to submit review. Please try again.');
                    }
                } catch (error) {
                    console.error('Review submission error:', error);
                    this.showMessage('error', 'An error occurred. Please try again.');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        showMessage(type, message) {
            // Remove any existing messages
            const existingMsg = this.form.querySelector('.yatra-review-message');
            if (existingMsg) existingMsg.remove();

            const msgEl = document.createElement('div');
            msgEl.className = `yatra-review-message yatra-review-message-${type}`;
            msgEl.innerHTML = `<p>${message}</p>`;

            this.form.insertBefore(msgEl, this.form.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                msgEl.remove();
            }, 5000);
        }
    }

    /**
     * Similar Adventures Carousel
     * Handles carousel navigation for similar trips section
     */
    class SimilarTripsCarousel {
        constructor() {
            this.track = null;
            this.prevBtn = null;
            this.nextBtn = null;
            this.items = [];
            this.currentPosition = 0;
            this.itemWidth = 0;
            this.visibleItems = 4;
            this.gap = 24;
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.track = document.getElementById('similar-carousel');
            this.prevBtn = document.getElementById('similar-prev');
            this.nextBtn = document.getElementById('similar-next');
            
            if (!this.track || !this.prevBtn || !this.nextBtn) return;
            
            this.items = Array.from(this.track.querySelectorAll('.yatra-carousel-item'));
            if (this.items.length === 0) return;
            
            this.calculateDimensions();
            this.attachEventListeners();
            this.updateButtonStates();
            
            // Recalculate on resize
            window.addEventListener('resize', () => {
                this.calculateDimensions();
                this.updateButtonStates();
            });
        }

        calculateDimensions() {
            const wrapper = this.track.parentElement;
            const wrapperWidth = wrapper.offsetWidth;
            
            // Determine visible items based on screen width
            if (window.innerWidth <= 600) {
                this.visibleItems = 1;
            } else if (window.innerWidth <= 900) {
                this.visibleItems = 2;
            } else if (window.innerWidth <= 1200) {
                this.visibleItems = 3;
            } else {
                this.visibleItems = 4;
            }
            
            // Calculate item width
            this.itemWidth = (wrapperWidth - (this.gap * (this.visibleItems - 1))) / this.visibleItems;
            
            // Apply width to items
            this.items.forEach(item => {
                item.style.flex = `0 0 ${this.itemWidth}px`;
                item.style.minWidth = `${this.itemWidth}px`;
            });
            
            // Reset position if out of bounds
            const maxPosition = Math.max(0, this.items.length - this.visibleItems);
            if (this.currentPosition > maxPosition) {
                this.currentPosition = maxPosition;
                this.updateTrackPosition();
            }
        }

        attachEventListeners() {
            this.prevBtn.addEventListener('click', () => this.slide('prev'));
            this.nextBtn.addEventListener('click', () => this.slide('next'));
            
            // Touch/swipe support for mobile
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            this.track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            }, { passive: true });
            
            this.track.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
            }, { passive: true });
            
            this.track.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                
                const diff = startX - currentX;
                const threshold = 50;
                
                if (diff > threshold) {
                    this.slide('next');
                } else if (diff < -threshold) {
                    this.slide('prev');
                }
            });
        }

        slide(direction) {
            const maxPosition = Math.max(0, this.items.length - this.visibleItems);
            
            if (direction === 'next' && this.currentPosition < maxPosition) {
                this.currentPosition++;
            } else if (direction === 'prev' && this.currentPosition > 0) {
                this.currentPosition--;
            }
            
            this.updateTrackPosition();
            this.updateButtonStates();
        }

        updateTrackPosition() {
            const offset = this.currentPosition * (this.itemWidth + this.gap);
            this.track.style.transform = `translateX(-${offset}px)`;
        }

        updateButtonStates() {
            const maxPosition = Math.max(0, this.items.length - this.visibleItems);
            
            this.prevBtn.disabled = this.currentPosition <= 0;
            this.nextBtn.disabled = this.currentPosition >= maxPosition;
            
            // Hide navigation if all items are visible
            const shouldHideNav = this.items.length <= this.visibleItems;
            this.prevBtn.style.display = shouldHideNav ? 'none' : 'flex';
            this.nextBtn.style.display = shouldHideNav ? 'none' : 'flex';
        }
    }

    // Initialize all classes
    window.galleryModal = new GalleryModal();
    window.bookingSidebar = new BookingSidebar();
    window.enquiryModal = new EnquiryModal();
    window.stickyNav = new StickyNav();
    window.availabilitySection = new AvailabilitySection();
    window.itinerarySection = new ItinerarySection();
    window.reviewForm = new ReviewForm();
    window.similarTripsCarousel = new SimilarTripsCarousel();

})();

