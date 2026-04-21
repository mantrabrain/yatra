/**
 * Yatra Premium Features - Modern SaaS UI Interactions
 * Advanced animations, micro-interactions, and scroll effects
 */

(function($) {
    'use strict';

    const YatraSaaS = {
        
        /**
         * Configuration
         */
        config: {
            animationDuration: 600,
            scrollOffset: 50,
            intersectionThreshold: 0.1,
            parallaxIntensity: 0.3
        },
        
        /**
         * State management
         */
        state: {
            isInitialized: false,
            observer: null,
            scrollY: 0,
            windowHeight: 0
        },

        /**
         * Initialize all SaaS functionality
         */
        init() {
            if (this.state.isInitialized) return;
            
            this.cacheDom();
            this.setupScrollAnimations();
            this.bindEvents();
            this.initParallaxEffects();
            this.initCounterAnimations();
            this.initCardInteractions();
            this.initButtonEffects();
            this.initKeyboardAccessibility();
            
            this.state.isInitialized = true;
            this.log('🚀 Yatra SaaS UI initialized');
        },

        /**
         * Cache DOM elements
         */
        cacheDom() {
            this.elements = {
                $window: $(window),
                $document: $(document),
                $body: $('body'),
                $saasPage: $('.yatra-saas-page'),
                $nav: $('.yatra-saas-nav'),
                $hero: $('.yatra-saas-hero'),
                $stats: $('.yatra-hero-stats .yatra-stat'),
                $featureCards: $('.yatra-feature-card'),
                $showcaseCards: $('.yatra-showcase-card'),
                $ctaButtons: $('.yatra-cta-primary, .yatra-cta-button'),
                $animatedElements: $('[data-aos]'),
                $parallaxElements: $('.yatra-hero-bg-pattern, .yatra-cta-bg-pattern')
            };
            
            this.state.windowHeight = this.elements.$window.height();
        },

        /**
         * Setup scroll-based animations using Intersection Observer
         */
        setupScrollAnimations() {
            if (!window.IntersectionObserver) return;
            
            this.state.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        this.state.observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: this.config.intersectionThreshold,
                rootMargin: '50px 0px -50px 0px'
            });
            
            // Observe elements with animation attributes
            this.elements.$animatedElements.each((index, element) => {
                this.state.observer.observe(element);
            });
        },

        /**
         * Animate individual element with stagger delay
         */
        animateElement(element) {
            const $element = $(element);
            const delay = parseInt($element.attr('data-aos-delay') || 0);
            
            setTimeout(() => {
                $element.addClass('aos-animate');
                
                // Trigger custom events for specific elements
                if ($element.hasClass('yatra-stat-number')) {
                    this.animateCounter($element);
                }
                
                if ($element.hasClass('yatra-feature-card')) {
                    this.animateFeatureCard($element);
                }
            }, delay);
        },

        /**
         * Animate counter numbers with easing
         */
        animateCounter($element) {
            const finalValue = $element.text();
            const isPercentage = finalValue.includes('%');
            const isDecimal = finalValue.includes('.');
            const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ''));
            
            if (isNaN(numericValue)) return;
            
            let currentValue = 0;
            const increment = numericValue / 60; // 60 frames for smooth animation
            const duration = 2000;
            
            $element.text('0' + (isPercentage ? '%' : ''));
            
            const counter = setInterval(() => {
                currentValue += increment;
                
                if (currentValue >= numericValue) {
                    currentValue = numericValue;
                    clearInterval(counter);
                }
                
                let displayValue = Math.floor(currentValue);
                if (isDecimal) displayValue = currentValue.toFixed(1);
                
                $element.text(displayValue + (isPercentage ? '%' : (finalValue.includes('+') ? '+' : '')));
            }, duration / 60);
        },

        /**
         * Animate feature cards with micro-interactions
         */
        animateFeatureCard($card) {
            const $icon = $card.find('.yatra-feature-icon, .yatra-showcase-icon');
            
            // Add bounce effect to icon
            setTimeout(() => {
                $icon.css('animation', 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)');
            }, 200);
        },

        /**
         * Bind event handlers
         */
        bindEvents() {
            // Smooth scroll for anchor links
            this.elements.$document.on('click', 'a[href^="#"]', this.handleSmoothScroll.bind(this));
            
            // Navigation scroll effects
            this.elements.$window.on('scroll', this.throttle(this.handleNavScroll.bind(this), 16));
            
            // Parallax scroll effects
            this.elements.$window.on('scroll', this.throttle(this.handleParallaxScroll.bind(this), 16));
            
            // Card hover effects
            this.elements.$featureCards.on('mouseenter', this.handleCardHover.bind(this));
            this.elements.$showcaseCards.on('mouseenter', this.handleShowcaseHover.bind(this));
            
            // Button interactions
            this.elements.$ctaButtons.on('mouseenter', this.handleButtonHover.bind(this));
            
            // Window resize
            this.elements.$window.on('resize', this.debounce(this.handleResize.bind(this), 250));
            
            // Form interactions for metabox
            $('.yatra-premium-features-metabox').on('click', '.yatra-feature-card', this.handleMetaboxFeatureClick.bind(this));
        },

        /**
         * Handle smooth scrolling
         */
        handleSmoothScroll(e) {
            const target = $(e.currentTarget).attr('href');
            if (target.startsWith('#') && $(target).length) {
                e.preventDefault();
                
                $('html, body').animate({
                    scrollTop: $(target).offset().top - this.config.scrollOffset
                }, this.config.animationDuration, 'easeInOutCubic');
            }
        },

        /**
         * Handle navigation scroll effects
         */
        handleNavScroll() {
            const scrollY = this.elements.$window.scrollTop();
            
            if (scrollY > 50) {
                this.elements.$nav.addClass('scrolled').css({
                    'background': 'rgba(255, 255, 255, 0.98)',
                    'backdrop-filter': 'blur(20px)',
                    'box-shadow': '0 4px 20px rgba(0, 0, 0, 0.1)'
                });
            } else {
                this.elements.$nav.removeClass('scrolled').css({
                    'background': 'rgba(255, 255, 255, 0.95)',
                    'box-shadow': 'none'
                });
            }
        },

        /**
         * Handle parallax scroll effects
         */
        handleParallaxScroll() {
            const scrollY = this.elements.$window.scrollTop();
            
            this.elements.$parallaxElements.each((index, element) => {
                const $element = $(element);
                const rect = element.getBoundingClientRect();
                const speed = $element.data('speed') || 0.5;
                
                if (rect.bottom >= 0 && rect.top <= this.state.windowHeight) {
                    const yPos = -(scrollY * speed);
                    $element.css('transform', `translateY(${yPos}px)`);
                }
            });
        },

        /**
         * Handle card hover effects
         */
        handleCardHover(e) {
            const $card = $(e.currentTarget);
            const $icon = $card.find('.yatra-feature-icon');
            
            $icon.css({
                'transform': 'rotate(0deg) scale(1.1)',
                'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            });
            
            $card.on('mouseleave', () => {
                $icon.css('transform', 'rotate(-5deg) scale(1)');
            });
        },

        /**
         * Handle showcase card hover
         */
        handleShowcaseHover(e) {
            const $card = $(e.currentTarget);
            
            if (!$card.hasClass('featured')) {
                $card.css({
                    'transform': 'translateY(-12px) scale(1.02)',
                    'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                });
                
                $card.on('mouseleave', () => {
                    $card.css({
                        'transform': 'translateY(0) scale(1)',
                        'box-shadow': 'none'
                    });
                });
            }
        },

        /**
         * Handle button hover effects
         */
        handleButtonHover(e) {
            const $button = $(e.currentTarget);
            
            // Create ripple effect
            this.createRippleEffect($button, e);
        },

        /**
         * Create ripple effect on buttons
         */
        createRippleEffect($element, event) {
            const rect = $element[0].getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const $ripple = $('<span class="ripple"></span>');
            $ripple.css({
                'position': 'absolute',
                'border-radius': '50%',
                'background': 'rgba(255, 255, 255, 0.3)',
                'transform': 'scale(0)',
                'animation': 'ripple 0.6s linear',
                'left': x - 25,
                'top': y - 25,
                'width': 50,
                'height': 50,
                'pointer-events': 'none'
            });
            
            if (!$element.find('.ripple').length) {
                $element.css('position', 'relative').append($ripple);
                
                setTimeout(() => $ripple.remove(), 600);
            }
        },

        /**
         * Handle metabox feature clicks
         */
        handleMetaboxFeatureClick(e) {
            e.preventDefault();
            const $card = $(e.currentTarget);
            const feature = $card.data('feature');
            
            // Add click animation
            $card.css('transform', 'scale(0.98)');
            setTimeout(() => {
                $card.css('transform', 'scale(1)');
            }, 150);
            
            // Show upgrade modal or redirect
            this.showUpgradeNotification(feature);
        },

        /**
         * Show upgrade notification
         */
        showUpgradeNotification(feature) {
            const message = yatraPremium?.strings?.upgrading || 'Redirecting to upgrade...';
            
            // Create toast notification
            const $toast = $(`
                <div class="yatra-toast">
                    <div class="yatra-toast-content">
                        <div class="yatra-toast-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </div>
                        <span>${message}</span>
                    </div>
                </div>
            `);
            
            $toast.css({
                'position': 'fixed',
                'top': '20px',
                'right': '20px',
                'background': 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                'color': 'white',
                'padding': '16px 24px',
                'border-radius': '12px',
                'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
                'z-index': '10000',
                'transform': 'translateX(100%)',
                'transition': 'transform 0.3s ease'
            });
            
            this.elements.$body.append($toast);
            
            // Animate in
            setTimeout(() => {
                $toast.css('transform', 'translateX(0)');
            }, 10);
            
            // Auto remove
            setTimeout(() => {
                $toast.css('transform', 'translateX(100%)');
                setTimeout(() => $toast.remove(), 300);
            }, 3000);
        },

        /**
         * Initialize parallax effects
         */
        initParallaxEffects() {
            // Add CSS animations for keyframes
            if (!$('#yatra-saas-animations').length) {
                const animations = `
                    <style id="yatra-saas-animations">
                        @keyframes ripple {
                            to { transform: scale(4); opacity: 0; }
                        }
                        
                        @keyframes bounceIn {
                            0% { transform: scale(0.3) rotate(-5deg); opacity: 0; }
                            50% { transform: scale(1.05) rotate(0deg); }
                            70% { transform: scale(0.9) rotate(0deg); }
                            100% { transform: scale(1) rotate(-5deg); opacity: 1; }
                        }
                        
                        .yatra-toast {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-weight: 500;
                        }
                        
                        .yatra-toast-content {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        }
                    </style>
                `;
                
                this.elements.$document.find('head').append(animations);
            }
        },

        /**
         * Initialize counter animations
         */
        initCounterAnimations() {
            // Auto-trigger when stats come into view
            this.elements.$stats.each((index, element) => {
                this.state.observer?.observe(element);
            });
        },

        /**
         * Initialize card interactions
         */
        initCardInteractions() {
            // Add magnetic effect to showcase cards
            this.elements.$showcaseCards.on('mousemove', (e) => {
                const $card = $(e.currentTarget);
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const rotateX = (y / rect.height) * 5;
                const rotateY = -(x / rect.width) * 5;
                
                if (!$card.hasClass('featured')) {
                    $card.css({
                        'transform': `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
                    });
                }
            });
            
            this.elements.$showcaseCards.on('mouseleave', (e) => {
                const $card = $(e.currentTarget);
                if (!$card.hasClass('featured')) {
                    $card.css('transform', '');
                }
            });
        },

        /**
         * Initialize button effects
         */
        initButtonEffects() {
            // Add loading state simulation
            this.elements.$ctaButtons.on('click', function(e) {
                const $btn = $(this);
                const originalText = $btn.find('span').first().text();
                
                // Don't add loading if it's an external link
                if ($btn.attr('target') === '_blank') return;
                
                e.preventDefault();
                
                $btn.addClass('loading').find('span').first().text('Loading...');
                
                setTimeout(() => {
                    $btn.removeClass('loading').find('span').first().text(originalText);
                    window.open($btn.attr('href'), '_blank');
                }, 1500);
            });
        },

        /**
         * Initialize keyboard accessibility
         */
        initKeyboardAccessibility() {
            // Focus management for cards
            this.elements.$featureCards.add(this.elements.$showcaseCards).attr('tabindex', '0');
            
            // Keyboard navigation
            this.elements.$document.on('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const $focused = $(document.activeElement);
                    if ($focused.hasClass('yatra-feature-card') || $focused.hasClass('yatra-showcase-card')) {
                        e.preventDefault();
                        $focused.click();
                    }
                }
            });
        },

        /**
         * Handle window resize
         */
        handleResize() {
            this.state.windowHeight = this.elements.$window.height();
        },

        /**
         * Utility functions
         */
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        log(message) {
            if (console && console.log) {
                console.log(`%c${message}`, 'color: #4f46e5; font-weight: bold;');
            }
        },

        /**
         * Initialize premium settings redirect
         */
        initPremiumSettingsRedirect() {
            // Handle clicks on premium settings tabs
            $('.yatra-settings-nav-item.premium-tab').on('click', function(e) {
                e.preventDefault();
                
                // Show loading state
                const $item = $(this);
                const originalText = $item.find('.yatra-settings-nav-title').text();
                $item.find('.yatra-settings-nav-title').text('Redirecting...');
                
                // Add premium styling
                $item.addClass('premium-redirecting');
                
                // Redirect to pricing page
                setTimeout(() => {
                    window.open('https://wpyatra.com/pricing/', '_blank');
                    $item.find('.yatra-settings-nav-title').text(originalText);
                    $item.removeClass('premium-redirecting');
                }, 500);
            });
        }
    };

    /**
     * Initialize when DOM is ready
     */
    $(document).ready(() => {
        // Only initialize on premium pages
        if ($('.yatra-saas-page, .yatra-premium-features-metabox').length) {
            YatraSaaS.init();
        }
        
        // Handle premium settings tabs redirect
        YatraSaaS.initPremiumSettingsRedirect();
    });

    // Expose to global scope for external access
    window.YatraSaaS = YatraSaaS;

})(jQuery);

/**
 * Additional utility for smooth scrolling (easing function)
 */
jQuery.easing.easeInOutCubic = function(x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
};