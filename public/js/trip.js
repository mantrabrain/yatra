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
            // Get form values
            const dateInput = document.getElementById('travel_date');
            const adultsInput = document.getElementById('adults');
            const childrenInput = document.getElementById('children');

            const date = dateInput ? dateInput.value : '';
            const adults = adultsInput ? parseInt(adultsInput.value) || 0 : 0;
            const children = childrenInput ? parseInt(childrenInput.value) || 0 : 0;

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
            const originalText = this.checkAvailabilityBtn.textContent;
            this.checkAvailabilityBtn.textContent = 'Checking...';
            this.checkAvailabilityBtn.disabled = true;

            // Simulate API call (replace with actual implementation)
            setTimeout(() => {
                alert(`Availability checked for ${adults} adult(s) and ${children} child(ren) on ${date}`);
                this.checkAvailabilityBtn.textContent = originalText;
                this.checkAvailabilityBtn.disabled = false;
            }, 1000);
        }

        handleMakeEnquiry() {
            // This will be handled by EnquiryModal class
            // Just trigger the modal open
            if (window.enquiryModal) {
                window.enquiryModal.open();
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
            const data = Object.fromEntries(formData);

            // Validation
            if (!data.name || !data.email || !data.message) {
                alert('Please fill in all required fields');
                return;
            }

            // Show loading
            const submitBtn = this.form.querySelector('.yatra-enquiry-submit');
            const originalText = submitBtn ? submitBtn.textContent : 'Submit';
            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
            }

            // Simulate API call (replace with actual implementation)
            setTimeout(() => {
                alert('Thank you for your enquiry! We will get back to you soon.');
                this.form.reset();
                this.close();
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            }, 1000);
        }
    }

    /**
     * Sticky Navigation Class
     * Handles sticky navigation bar functionality
     */
    class StickyNav {
        constructor() {
            this.nav = null;
            this.navItems = [];
            this.sections = [];
            this.scrollThreshold = 200;
            this.lastScrollTop = 0;
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

            this.navItems = this.nav.querySelectorAll('.yatra-sticky-nav-item');
            this.sections = ['overview', 'trip-details', 'itinerary', 'included'];

            this.attachEventListeners();
            this.handleScroll(); // Initial check
            this.updateActiveNav(); // Initial check
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
            
            this.sections.forEach((sectionId, index) => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    
                    if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                        this.navItems.forEach((nav) => nav.classList.remove('active'));
                        if (this.navItems[index]) {
                            this.navItems[index].classList.add('active');
                        }
                    }
                }
            });
        }

        onScroll() {
            this.handleScroll();
            this.updateActiveNav();
        }
    }

    // Initialize all classes
    window.galleryModal = new GalleryModal();
    window.bookingSidebar = new BookingSidebar();
    window.enquiryModal = new EnquiryModal();
    window.stickyNav = new StickyNav();

})();

