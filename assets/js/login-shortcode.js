/**
 * Login Shortcode JavaScript
 * 
 * Production-optimized login form interactions and functionality
 * 
 * @package Yatra
 * @version 1.0.0
 */

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
                    $toggle.attr('aria-label', 'Hide password');
                } else {
                    $input.attr('type', 'password');
                    $eyeIcon.show();
                    $eyeOffIcon.hide();
                    $toggle.attr('aria-label', 'Show password');
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
                message: yatra_ajax?.strings?.validation_error || 'Please enter your email or username.'
            };
        }
        
        if (!password) {
            return {
                valid: false,
                message: yatra_ajax?.strings?.validation_error || 'Please enter your password.'
            };
        }
        
        if (username.length > 60) {
            return {
                valid: false,
                message: 'Username is too long.'
            };
        }
        
        if (password.length > 72) {
            return {
                valid: false,
                message: 'Password is too long.'
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
                const $submitBtn = $form.find('button[type="submit"]');
                const $btnText = $submitBtn.find('.yatra-btn-text');
                const $btnLoading = $submitBtn.find('.yatra-btn-loading');
                
                // Performance: Cache form elements
                const formId = $form.data('form-id') || $form.attr('id');
                const $username = $form.find('[name="log"], [name="username"]');
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
                
                // Validate username
                if (!$username.val().trim()) {
                    showFieldError($username, 'Please enter your email or username.');
                    isValid = false;
                }
                
                // Validate password
                if (!$password.val().trim()) {
                    showFieldError($password, 'Please enter your password.');
                    isValid = false;
                }
                
                if (!isValid) {
                    return false;
                }
                
                // Show loading state immediately to prevent flicker
                $submitBtn.prop('disabled', true).text('Logging in...');
                
                // AJAX login request
                $.ajax({
                    url: yatra_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'yatra_ajax_login',
                        username: $form.find('#yatra-login-username').val(),
                        password: $form.find('#yatra-login-password').val(),
                        rememberme: $form.find('#yatra-remember-me').is(':checked') ? 'forever' : '',
                        redirect_to: $form.find('input[name="redirect_to"]').val(),
                        nonce: yatra_ajax.nonce
                    },
                    success: function(response, textStatus, jqXHR) {
                        // Debug: Log response details
                        if (window.console && console.log) {
                            console.log('Login response:', response);
                            console.log('Response type:', typeof response);
                            console.log('Response success:', response.success);
                            console.log('Response data:', response.data);
                        }
                        
                        // Reset button state immediately
                        $submitBtn.prop('disabled', false).text(originalText);
                        
                        // Handle different response formats
                        let isSuccess = false;
                        let errorMessage = 'Login failed. Please try again.';
                        let redirectUrl = null;
                        
                        // Check if response is properly formatted
                        if (response && typeof response === 'object') {
                            isSuccess = response.success === true;
                            
                            if (!isSuccess) {
                                // Try different error message locations
                                errorMessage = (response.data && response.data.message) || 
                                              (response.message) || 
                                              'Login failed. Please try again.';
                            } else {
                                // Get redirect URL
                                redirectUrl = (response.data && response.data.redirect_url) || 
                                           (response.redirect_url) || 
                                           null;
                            }
                        } else {
                            // Response is not properly formatted
                            console.error('Invalid response format:', response);
                            errorMessage = 'Invalid response from server. Please try again.';
                        }
                        
                        if (isSuccess) {
                            // Redirect to the specified URL
                            if (redirectUrl) {
                                window.location.href = redirectUrl;
                            } else {
                                window.location.reload();
                            }
                        } else {
                            // Show error message
                            showFormError($form, errorMessage);
                        }
                    },
                    error: function(xhr, status, error) {
                        // Debug: Log error details
                        if (window.console && console.log) {
                            console.log('AJAX error:', {xhr: xhr, status: status, error: error});
                        }
                        
                        // Reset button state immediately
                        $submitBtn.prop('disabled', false).text(originalText);
                        
                        let errorMessage = 'An error occurred. Please try again.';
                        
                        // Try to get error message from response
                        if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                            errorMessage = xhr.responseJSON.data.message;
                        } else if (xhr.responseText) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                if (response.data && response.data.message) {
                                    errorMessage = response.data.message;
                                }
                            } catch (e) {
                                // Keep default error message
                            }
                        }
                        
                        showFormError($form, errorMessage);
                    },
                    complete: function() {
                        // This is now just a safety net - button should already be reset
                        // Only reset if button is still disabled after 1 second (in case of unexpected issues)
                        setTimeout(function() {
                            if ($submitBtn.prop('disabled')) {
                                if (window.console && console.log) {
                                    console.log('Safety net: Resetting button state');
                                }
                                $submitBtn.prop('disabled', false).text(originalText);
                            }
                        }, 1000);
                    }
                });
            });
        }
    }

    /**
     * Show field error message
     */
    function showFieldError($field, message) {
        // Remove existing error
        $field.siblings('.yatra-form-error').remove();
        
        // Add error styling
        $field.addClass('error');
        
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
});

/**
 * Show field error message
 */
function showFieldError($field, message) {
    // Remove existing error
    $field.siblings('.yatra-form-error').remove();

    // Add error styling
    $field.addClass('error');

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

})(jQuery);
