/**
 * Yatra Single Trip Page JavaScript
 * Interactive features for trip page
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
        initHeroSlider();
        initGalleryModal();
        initFAQ();
        initBookingForm();
        initPriceCalculation();
    }

    /**
     * Hero Image Slider (disabled - showing single image only)
     */
    function initHeroSlider() {
        // Single image hero - no slider functionality needed
        // Just ensure the active slide is visible
        const slides = document.querySelectorAll('.yatra-trip-hero-slide');
        slides.forEach((slide, i) => {
            if (i === 0) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }

    /**
     * Gallery Modal System
     */
    function initGalleryModal() {
        const galleryImages = [];
        
        // Collect all gallery images from hero slides and gallery section
        const heroSlides = document.querySelectorAll('.yatra-trip-hero-slide img');
        const galleryItems = document.querySelectorAll('.yatra-trip-gallery .yatra-gallery-item img');
        
        heroSlides.forEach((img, index) => {
            galleryImages.push({
                src: img.src,
                alt: img.alt || `Gallery Image ${index + 1}`,
                index: index
            });
        });

        galleryItems.forEach((img, index) => {
            const existingIndex = galleryImages.findIndex(g => g.src === img.src);
            if (existingIndex === -1) {
                galleryImages.push({
                    src: img.src,
                    alt: img.alt || `Gallery Image ${galleryImages.length + 1}`,
                    index: galleryImages.length
                });
            }
        });

        if (galleryImages.length === 0) return;

        const modal = document.getElementById('hero-gallery');
        if (!modal) return;

        const modalImage = modal.querySelector('.yatra-gallery-modal-image');
        const modalLoader = modal.querySelector('.yatra-gallery-modal-loader');
        const currentIndexSpan = modal.querySelector('.yatra-gallery-current-index');
        const totalCountSpan = modal.querySelector('.yatra-gallery-total-count');
        const thumbnailsContainer = modal.querySelector('.yatra-gallery-thumbnails-container');
        const prevBtn = modal.querySelector('.yatra-gallery-modal-prev');
        const nextBtn = modal.querySelector('.yatra-gallery-modal-next');
        const closeBtn = modal.querySelector('.yatra-gallery-modal-close');
        const overlay = modal.querySelector('.yatra-gallery-modal-overlay');

        let currentIndex = 0;

        // Set total count
        totalCountSpan.textContent = galleryImages.length;

        // Create thumbnails
        function createThumbnails() {
            thumbnailsContainer.innerHTML = '';
            galleryImages.forEach((img, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'yatra-gallery-thumbnail';
                thumbnail.setAttribute('data-index', index);
                if (index === 0) thumbnail.classList.add('active');
                
                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = img.src;
                thumbnailImg.alt = img.alt;
                thumbnail.appendChild(thumbnailImg);
                
                thumbnail.addEventListener('click', () => {
                    showImage(index);
                });
                
                thumbnailsContainer.appendChild(thumbnail);
            });
        }

        // Show image in modal
        function showImage(index) {
            if (index < 0 || index >= galleryImages.length) return;
            
            currentIndex = index;
            const image = galleryImages[index];
            
            // Update counter
            currentIndexSpan.textContent = index + 1;
            
            // Update thumbnails
            const thumbnails = thumbnailsContainer.querySelectorAll('.yatra-gallery-thumbnail');
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            // Show loader
            modalLoader.classList.add('active');
            modalImage.classList.remove('loaded');
            
            // Load image
            const img = new Image();
            img.onload = function() {
                modalImage.src = image.src;
                modalImage.alt = image.alt;
                modalImage.classList.add('loaded');
                modalLoader.classList.remove('active');
            };
            img.onerror = function() {
                modalLoader.classList.remove('active');
                modalImage.src = image.src; // Try anyway
            };
            img.src = image.src;
            
            // Update button states
            prevBtn.style.opacity = index === 0 ? '0.5' : '1';
            prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
            nextBtn.style.opacity = index === galleryImages.length - 1 ? '0.5' : '1';
            nextBtn.style.pointerEvents = index === galleryImages.length - 1 ? 'none' : 'auto';
        }

        // Open modal
        function openModal(startIndex = 0) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            showImage(startIndex);
        }

        // Close modal
        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Navigation
        function nextImage() {
            if (currentIndex < galleryImages.length - 1) {
                showImage(currentIndex + 1);
            }
        }

        function prevImage() {
            if (currentIndex > 0) {
                showImage(currentIndex - 1);
            }
        }

        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        prevBtn.addEventListener('click', prevImage);
        nextBtn.addEventListener('click', nextImage);

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!modal.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        });

        // Initialize thumbnails
        createThumbnails();

        // Open modal from play button
        const playButton = document.querySelector('.yatra-hero-gallery-play');
        const galleryPlayBtn = document.querySelector('.yatra-gallery-play-btn');
        
        if (playButton) {
            playButton.addEventListener('click', () => openModal(0));
        }
        
        if (galleryPlayBtn) {
            galleryPlayBtn.addEventListener('click', () => openModal(0));
        }

        // Open modal from gallery items
        galleryItems.forEach((item, index) => {
            const galleryItem = item.closest('.yatra-gallery-item');
            if (galleryItem) {
                galleryItem.addEventListener('click', () => {
                    const imageIndex = galleryImages.findIndex(g => g.src === item.src);
                    openModal(imageIndex >= 0 ? imageIndex : index);
                });
            }
        });

        // Open modal from side images
        const sideImages = document.querySelectorAll('.yatra-side-image-item img');
        sideImages.forEach((img, index) => {
            const sideImageItem = img.closest('.yatra-side-image-item');
            if (sideImageItem) {
                sideImageItem.addEventListener('click', (e) => {
                    // Don't open if clicking on buttons
                    if (e.target.closest('.yatra-favorite-btn') || e.target.closest('.yatra-view-all-photos-btn')) {
                        return;
                    }
                    const imageIndex = galleryImages.findIndex(g => g.src === img.src);
                    openModal(imageIndex >= 0 ? imageIndex : index + 1);
                });
            }
        });
    }

    /**
     * FAQ Accordion
     */
    function initFAQ() {
        const faqItems = document.querySelectorAll('.yatra-faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.yatra-faq-question');
            if (!question) return;

            question.addEventListener('click', function(e) {
                e.preventDefault();
                const isActive = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        });
    }

    /**
     * Booking Form Validation
     */
    function initBookingForm() {
        const bookingForm = document.querySelector('.yatra-booking-form');
        if (!bookingForm) return;

        const bookingButton = bookingForm.querySelector('.yatra-booking-button');
        if (!bookingButton) return;

        bookingButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get form values
            const date = bookingForm.querySelector('[name="travel_date"]')?.value;
            const travelers = bookingForm.querySelector('[name="travelers"]')?.value;
            
            // Basic validation
            if (!date) {
                alert('Please select a travel date');
                return;
            }
            
            if (!travelers || parseInt(travelers) < 1) {
                alert('Please enter number of travelers');
                return;
            }

            // Show loading state
            const originalText = bookingButton.textContent;
            bookingButton.textContent = 'Processing...';
            bookingButton.disabled = true;

            // Simulate booking process (replace with actual API call)
            setTimeout(() => {
                alert('Booking functionality will be implemented soon!');
                bookingButton.textContent = originalText;
                bookingButton.disabled = false;
            }, 1000);
        });
    }

    /**
     * Smooth scroll to section
     */
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offset = 100;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Sticky Navigation
     */
    function initStickyNav() {
        const stickyNav = document.querySelector('.yatra-sticky-nav');
        if (!stickyNav) return;

        const navItems = document.querySelectorAll('.yatra-sticky-nav-item');
        const sections = ['overview', 'trip-details', 'itinerary', 'included'];
        let lastScrollTop = 0;
        const scrollThreshold = 200; // Show nav after scrolling 200px

        // Handle click on nav items
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    scrollToSection(sectionId);
                    
                    // Update active state
                    navItems.forEach(nav => nav.classList.remove('active'));
                    this.classList.add('active');
                }
            });
        });

        // Show/hide nav based on scroll
        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Show nav when scrolling down past threshold
            if (scrollTop > scrollThreshold) {
                stickyNav.classList.add('visible');
            } else {
                stickyNav.classList.remove('visible');
            }

            lastScrollTop = scrollTop;
        }

        // Update active nav item on scroll
        function updateActiveNav() {
            const scrollPos = window.scrollY + 150;
            
            sections.forEach((sectionId, index) => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    
                    if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                        navItems.forEach(nav => nav.classList.remove('active'));
                        if (navItems[index]) {
                            navItems[index].classList.add('active');
                        }
                    }
                }
            });
        }

        // Combined scroll handler
        function onScroll() {
            handleScroll();
            updateActiveNav();
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        handleScroll(); // Initial check
        updateActiveNav(); // Initial check
    }

    /**
     * Quantity Selector (Plus/Minus buttons)
     */
    function initQuantitySelector() {
        const participantsSelect = document.querySelector('.yatra-participants-select');
        const participantsDisplay = document.getElementById('participants-display');
        const quantitySelector = document.getElementById('quantity-selector');
        
        if (!participantsSelect || !participantsDisplay || !quantitySelector) return;
        
        // Toggle dropdown on click
        participantsSelect.addEventListener('click', function(e) {
            e.stopPropagation();
            participantsSelect.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!participantsSelect.contains(e.target)) {
                participantsSelect.classList.remove('active');
            }
        });
        
        // Update display text
        function updateDisplay() {
            const adults = parseInt(document.getElementById('adults')?.value || 1);
            const children = parseInt(document.getElementById('children')?.value || 0);
            
            let displayText = '';
            if (adults > 0 && children > 0) {
                displayText = `Adult x ${adults}, Child x ${children}`;
            } else if (adults > 0) {
                displayText = `Adult x ${adults}`;
            } else if (children > 0) {
                displayText = `Child x ${children}`;
            } else {
                displayText = 'Adult x 1';
            }
            
            participantsDisplay.textContent = displayText;
        }
        
        // Quantity button handlers
        const quantityButtons = document.querySelectorAll('.yatra-quantity-btn');
        
        quantityButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const target = this.getAttribute('data-target');
                const input = document.getElementById(target);
                if (!input) return;
                
                const currentValue = parseInt(input.value) || 0;
                const min = parseInt(input.getAttribute('min')) || 0;
                const max = parseInt(input.getAttribute('max')) || 999;
                const isPlus = this.classList.contains('yatra-quantity-plus');
                const isMinus = this.classList.contains('yatra-quantity-minus');
                
                let newValue = currentValue;
                
                if (isPlus && currentValue < max) {
                    newValue = currentValue + 1;
                } else if (isMinus && currentValue > min) {
                    newValue = currentValue - 1;
                }
                
                if (newValue !== currentValue) {
                    input.value = newValue;
                    updateDisplay();
                    
                    // Update button states
                    const row = input.closest('.yatra-quantity-row');
                    if (row) {
                        const minusBtn = row.querySelector('.yatra-quantity-minus');
                        const plusBtn = row.querySelector('.yatra-quantity-plus');
                        
                        if (minusBtn) {
                            minusBtn.disabled = newValue <= min;
                        }
                        if (plusBtn) {
                            plusBtn.disabled = newValue >= max;
                        }
                    }
                }
            });
        });
        
        // Initialize button states and display
        document.querySelectorAll('.yatra-quantity-input').forEach(input => {
            const value = parseInt(input.value) || 0;
            const min = parseInt(input.getAttribute('min')) || 0;
            const max = parseInt(input.getAttribute('max')) || 999;
            const row = input.closest('.yatra-quantity-row');
            
            if (row) {
                const minusBtn = row.querySelector('.yatra-quantity-minus');
                const plusBtn = row.querySelector('.yatra-quantity-plus');
                
                if (minusBtn) {
                    minusBtn.disabled = value <= min;
                }
                if (plusBtn) {
                    plusBtn.disabled = value >= max;
                }
            }
        });
        
        updateDisplay();
    }

    /**
     * Initialize Datepicker
     */
    function initDatepicker() {
        const dateInput = document.getElementById('travel_date');
        if (!dateInput || typeof flatpickr === 'undefined') return;

        // Get minimum date (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        flatpickr(dateInput, {
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
            onChange: function(selectedDates, dateStr, instance) {
                // Update the input value
                dateInput.value = dateStr;
            }
        });
    }

    function init() {
        initHeroSlider();
        initGalleryModal();
        initFAQ();
        initBookingForm();
        initStickyNav();
        initQuantitySelector();
        initDatepicker();
    }

    // Expose scroll function globally if needed
    window.yatraScrollToSection = scrollToSection;

    /**
     * Dynamic Price Calculation
     * Updates total price based on number of adults and children
     */
    function initPriceCalculation() {
        const adultsInput = document.getElementById('adults');
        const childrenInput = document.getElementById('children');
        const totalDisplay = document.getElementById('booking-total');
        const totalAmount = document.getElementById('total-amount');
        const pricePerPerson = 1650; // Base price per person (should come from data attribute)
        const childDiscount = 0.5; // Children pay 50% of adult price

        if (!adultsInput || !childrenInput || !totalDisplay || !totalAmount) return;

        function calculateTotal() {
            const adults = parseInt(adultsInput.value) || 0;
            const children = parseInt(childrenInput.value) || 0;
            
            if (adults === 0 && children === 0) {
                totalDisplay.style.display = 'none';
                return;
            }

            const adultTotal = adults * pricePerPerson;
            const childTotal = children * (pricePerPerson * childDiscount);
            const grandTotal = adultTotal + childTotal;

            // Format and display total
            totalAmount.textContent = '$' + grandTotal.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            totalDisplay.style.display = 'flex';
        }

        // Listen for changes in quantity inputs
        adultsInput.addEventListener('change', calculateTotal);
        childrenInput.addEventListener('input', calculateTotal);
        adultsInput.addEventListener('input', calculateTotal);
        childrenInput.addEventListener('change', calculateTotal);

        // Also listen to quantity button changes
        const quantityButtons = document.querySelectorAll('.yatra-quantity-btn');
        quantityButtons.forEach(button => {
            button.addEventListener('click', function() {
                setTimeout(calculateTotal, 100); // Small delay to ensure value is updated
            });
        });

        // Initial calculation
        calculateTotal();
    }

})();
