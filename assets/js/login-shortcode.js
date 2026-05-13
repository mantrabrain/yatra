/**
 * Login Shortcode JavaScript
 *
 * Production-optimized login form interactions and functionality
 *
 * @package Yatra
 * @version 1.0.0
 */

// Translation helpers — idempotent shim matching the other frontend bundles.
(function () {
    if (typeof window.__ === 'function') return;
    if (window.wp && window.wp.i18n && typeof window.wp.i18n.__ === 'function') {
        window.__ = function (text, domain) { return window.wp.i18n.__(text, domain || 'yatra'); };
        window._n = function (s, p, n, domain) { return window.wp.i18n._n(s, p, n, domain || 'yatra'); };
        window._x = function (text, ctx, domain) { return window.wp.i18n._x(text, ctx, domain || 'yatra'); };
        window.sprintf = window.sprintf || (window.wp.i18n.sprintf || function (fmt) { return fmt; });
    } else {
        window.__ = function (text) { return text; };
        window._n = function (s, p, n) { return n === 1 ? s : p; };
        window._x = function (text) { return text; };
        window.sprintf = window.sprintf || function (fmt) { return fmt; };
    }
})();

(function($) {
    'use strict';

    // Performance: Cache DOM elements
    let $document = $(document);
    let $window = $(window);
    
    // Performance: Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Performance: Throttle function for scroll events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Initialize when DOM is ready
    $document.ready(function() {
        // Performance: Check if login form exists before initializing
        if ($('.yatra-login-form').length === 0) {
            return;
        }

        // Initialize components
        initPasswordToggles();
        initAjaxLogin();
        initAccessibility();
        initPerformanceOptimizations();
    });

    /**
     * Initialize password toggle functionality with performance optimizations
     */
    function initPasswordToggles() {
        const passwordToggles = $('.yatra-password-toggle');
        
        // Performance: Use event delegation for better performance
        $document.on('click', '.yatra-password-toggle', function(e) {
            e.preventDefault();
            
            const $toggle = $(this);
            const targetId = $toggle.data('target');
            const $input = targetId ? $('#' + targetId) : $toggle.siblings('.yatra-form-input');
            
            if (!$input.length) {
                console.warn('Password input not found for toggle');
                return;
            }
            
            const $eyeIcon = $toggle.find('.yatra-eye-icon');
            const $eyeOffIcon = $toggle.find('.yatra-eye-off-icon');
            
            try {
                const isPassword = $input.attr('type') === 'password';
                
                if (isPassword) {
                    $input.attr('type', 'text');
                    $eyeIcon.hide();
                    $eyeOffIcon.show();
                    $toggle.attr('aria-label', __('Hide password', 'yatra'));
                } else {
                    $input.attr('type', 'password');
                    $eyeIcon.show();
                    $eyeOffIcon.hide();
                    $toggle.attr('aria-label', __('Show password', 'yatra'));
                }
            } catch (error) {
                console.error('Error toggling password visibility:', error);
            }
        });
    }

    /**
     * Enhanced form validation function
     */
    function validateLoginForm($username, $password) {
        const username = $username.val().trim();
        const password = $password.val().trim();
        
        if (!username) {
            return {
                valid: false,
                message: yatra_ajax?.strings?.validation_error || __('Please enter your email or username.', 'yatra')
            };
        }
        
        if (!password) {
            return {
                valid: false,
                message: yatra_ajax?.strings?.validation_error || __('Please enter your password.', 'yatra')
            };
        }
        
        if (username.length > 60) {
            return {
                valid: false,
                message: __('Username is too long.', 'yatra')
            };
        }
        
        if (password.length > 72) {
            return {
                valid: false,
                message: __('Password is too long.', 'yatra')
            };
        }
        
        return { valid: true };
    }

    /**
     * Initialize accessibility features
     */
    function initAccessibility() {
        // Add ARIA labels and improve keyboard navigation
        $document.on('keydown', '.yatra-form-input', function(e) {
            if (e.key === 'Enter') {
                const $form = $(this).closest('form');
                if ($form.length) {
                    $form.trigger('submit');
                }
            }
        });
        
        // Focus management for error messages
        $document.on('click', '.yatra-form-error', function() {
            $(this).fadeOut(200, function() {
                $(this).remove();
            });
        });
    }

    /**
     * Initialize performance optimizations
     */
    function initPerformanceOptimizations() {
        // Lazy load error styles
        if (!$('#yatra-login-error-styles').length) {
            $('<style id="yatra-login-error-styles">')
                .text('.yatra-form-error { transition: opacity 0.2s ease; }')
                .appendTo('head');
        }
        
        // Preload critical resources
        if (window.performance && window.performance.getEntriesByType) {
            // Monitor performance in development
            if (yatra_ajax?.debug) {
                setTimeout(() => {
                    const entries = performance.getEntriesByType('navigation');
                    if (entries.length > 0) {
                        console.log('Login form load time:', entries[0].loadEventEnd - entries[0].loadEventStart, 'ms');
                    }
                }, 1000);
            }
        }
    }

    /**
     * Initialize AJAX login with production optimizations
     */
    function initAjaxLogin() {
        const $loginForm = $('.yatra-login-form');
        
        // Only use AJAX if the form has data-ajax="true" attribute
        if ($loginForm.data('ajax') === true) {
            // Performance: Use event delegation for better performance
            $document.on('submit', '.yatra-login-form[data-ajax="true"]', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $form = $(this);
                const $submitBtn = $form.find('button[type="submit"], input[type="submit"]');
                const $username = $form.find('[name="log"], [name="username"], [name="email"]');
                const $password = $form.find('[name="pwd"], [name="password"]');
                
                // Prevent multiple submissions
                if ($submitBtn.prop('disabled')) {
                    return false;
                }
                
                // Enhanced form validation
                const validation = validateLoginForm($username, $password);
                if (!validation.valid) {
                    showFormError($form, validation.message);
                    return false;
                }
                
                // Reset previous errors
                $('.yatra-form-error').remove();
                // Field-level validation is already handled by validateLoginForm()
                
                // Show loading state immediately to prevent flicker
                $submitBtn.prop('disabled', true);
                // Preserve the original markup once, then toggle the built-in loading spans.
                if (!$submitBtn.data('yatraOriginalHtml')) {
                    $submitBtn.data('yatraOriginalHtml', $submitBtn.html());
                }
                $submitBtn.addClass('yatra-is-loading');
                $submitBtn.find('.yatra-btn-text').hide();
                $submitBtn.find('.yatra-btn-loading').show();
                
                // Prepare AJAX request data
                const formData = {
                    action: 'yatra_ajax_login',
                    username: $username.val().trim(),
                    password: $password.val().trim(),
                    rememberme: $form.find('[name="rememberme"]').is(':checked') ? 'forever' : '',
                    yatra_login_nonce: $form.find('[name="yatra_login_nonce"]').val(),
                    redirect_to: $form.find('[name="redirect_to"]').val() || '',
                    ajax: true
                };
                
                // Perform AJAX request with timeout
                const ajaxRequest = $.ajax({
                    url: yatra_ajax?.ajax_url || '/wp-admin/admin-ajax.php',
                    type: 'POST',
                    data: formData,
                    timeout: 15000, // 15 second timeout
                    dataType: 'json'
                });
                
                // Handle success
                ajaxRequest.done(function(response) {
                    if (response.success) {
                        // Success: Redirect or show success message
                        if (response.data && (response.data.redirect_url || response.data.redirect)) {
                            window.location.href = response.data.redirect_url || response.data.redirect;
                        } else {
                            showFormSuccess($form, response.data.message || __('Login successful!', 'yatra'));
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }
                    } else {
                        // Error: Show error message
                        showFormError($form, response.data.message || 'Login failed. Please try again.');
                    }
                });
                
                // Handle error
                ajaxRequest.fail(function(xhr, status, error) {
                    let errorMessage = 'Network error. Please check your connection and try again.';
                    
                    if (status === 'timeout') {
                        errorMessage = 'Request timed out. Please try again.';
                    } else if (xhr.responseJSON && xhr.responseJSON.data) {
                        errorMessage = xhr.responseJSON.data.message || errorMessage;
                    }
                    
                    showFormError($form, errorMessage);
                });
                
                // Always restore button state
                ajaxRequest.always(function() {
                    $submitBtn.prop('disabled', false);
                    $submitBtn.removeClass('yatra-is-loading');
                    $submitBtn.find('.yatra-btn-loading').hide();
                    $submitBtn.find('.yatra-btn-text').show();

                    // If some other code replaced the markup, restore it.
                    const originalHtml = $submitBtn.data('yatraOriginalHtml');
                    if (originalHtml && $submitBtn.find('.yatra-btn-text').length === 0) {
                        $submitBtn.html(originalHtml);
                    }
                });
                
                return false;
            });
        }
    }

    /**
     * Show field-specific error message
     */
    function showFieldError($field, message) {
        // Remove existing field error
        $field.siblings('.yatra-form-error').fadeOut(200, function() {
            $(this).remove();
        });

        // Create and insert error message with fade-in to prevent flicker
        const $error = $('<div class="yatra-form-error" style="display: none;">' + message + '</div>');
        $error.css({
            color: '#dc2626',
            fontSize: '0.875rem',
            marginTop: '4px',
            fontWeight: '500',
            opacity: 0,
            transition: 'opacity 0.2s ease'
        });

        $field.after($error);

        // Fade in error message
        setTimeout(function() {
            $error.css({
                display: 'block',
                opacity: 1
            });
        }, 10);

        // Remove error on focus
        $field.on('focus', function() {
            $(this).removeClass('error');
            $(this).siblings('.yatra-form-error').fadeOut(200, function() {
                $(this).remove();
            });
        });
    }

    /**
     * Show form error message
     */
    function showFormError($form, message) {
        // Remove existing error with fade out
        $form.find('.yatra-form-error').fadeOut(200, function() {
            $(this).remove();
        });

        // Create and insert error message at the top of the form with fade-in
        const $error = $('<div class="yatra-form-error" style="display: none;">' + message + '</div>');
        $error.css({
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontWeight: '500',
            opacity: 0,
            transition: 'opacity 0.2s ease'
        });

        $form.prepend($error);

        // Fade in error message
        setTimeout(function() {
            $error.css({
                display: 'block',
                opacity: 1
            });
        }, 10);

        // Scroll to error smoothly
        setTimeout(function() {
            $('html, body').animate({
                scrollTop: $form.offset().top - 100
            }, 300);
        }, 50);
    }

    /**
     * Show form success message
     */
    function showFormSuccess($form, message) {
        // Remove existing messages
        $form.find('.yatra-form-error, .yatra-form-success').fadeOut(200, function() {
            $(this).remove();
        });

        // Create and insert success message
        const $success = $('<div class="yatra-form-success" style="display: none;">' + message + '</div>');
        $success.css({
            color: '#059669',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontWeight: '500',
            opacity: 0,
            transition: 'opacity 0.2s ease'
        });

        $form.prepend($success);

        // Fade in success message
        setTimeout(function() {
            $success.css({
                display: 'block',
                opacity: 1
            });
        }, 10);
    }

})(jQuery);
