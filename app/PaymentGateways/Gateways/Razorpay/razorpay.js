/**
 * Razorpay Payment Integration for Yatra
 * Handles client-side Razorpay checkout
 * 
 * Uses the centralized payment gateway hook system:
 * - Listens for yatra_payment_response event
 * - Handles requires_action: 'razorpay_checkout'
 */

(function() {
    'use strict';
    
    

    const __ = (window.wp && window.wp.i18n && window.wp.i18n.__) ? window.wp.i18n.__ : (text => text);

    class YatraRazorpay {
        constructor() {
            
            this.razorpayLoaded = false;
            this.init();
        }

        init() {
            
            
            // Listen for payment response from server (new unified event)
            document.addEventListener('yatra_payment_response', (event) => {
                
                if (event.detail && event.detail.requires_action === 'razorpay_checkout') {
                    
                    this.openCheckout(event.detail);
                }
            });
            
            // Also listen for legacy event for backward compatibility
            document.addEventListener('yatra_payment_action', (event) => {
                
                if (event.detail && event.detail.requires_action === 'razorpay_checkout') {
                    
                    this.openCheckout(event.detail);
                }
            });
            
            // Register with gateway system if available
            if (typeof window.yatraRegisterPaymentGateway === 'function') {
                window.yatraRegisterPaymentGateway('razorpay', {
                    canHandle: (action) => action === 'razorpay_checkout',
                    handlePayment: (data) => this.openCheckout(data)
                });
            }
        }

        loadRazorpayScript() {
            return new Promise((resolve, reject) => {
                if (this.razorpayLoaded || window.Razorpay) {
                    this.razorpayLoaded = true;
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => {
                    this.razorpayLoaded = true;
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                document.head.appendChild(script);
            });
        }

        async openCheckout(paymentData) {
            try {
                await this.loadRazorpayScript();

                const options = {
                    key: paymentData.key_id,
                    amount: paymentData.amount,
                    currency: paymentData.currency || 'INR',
                    name: window.yatraBookingData?.siteName || document.title,
                    description: __('Booking #') + paymentData.booking_ref,
                    order_id: paymentData.order_id,
                    prefill: {
                        name: paymentData.customer_name || '',
                        email: paymentData.customer_email || ''
                    },
                    handler: (response) => {
                        this.handlePaymentSuccess(response, paymentData);
                    },
                    modal: {
                        ondismiss: () => {
                            this.handlePaymentCancelled(paymentData);
                        }
                    },
                    theme: {
                        color: '#3b82f6'
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', (response) => {
                    this.handlePaymentFailed(response, paymentData);
                });
                rzp.open();

            } catch (error) {
                console.error('Razorpay error:', error);
                this.showError(__('Failed to initialize payment. Please try again.'));
            }
        }

        handlePaymentSuccess(response, paymentData) {
            // Build confirmation URL with payment details
            let confirmUrl = paymentData.confirmation_url || window.location.origin + '/booking-confirmation/' + paymentData.booking_ref + '/';
            
            // Add query params for verification
            const params = new URLSearchParams({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
            });
            
            confirmUrl += (confirmUrl.includes('?') ? '&' : '?') + params.toString();
            
            // Redirect to confirmation page
            window.location.href = confirmUrl;
        }

        handlePaymentFailed(response, paymentData) {
            const error = response.error || {};
            const message = error.description || __('Payment failed. Please try again.');
            this.showError(message);
            
            // Dispatch event for booking form to handle
            document.dispatchEvent(new CustomEvent('yatra_payment_failed', {
                detail: {
                    gateway: 'razorpay',
                    error: message,
                    code: error.code
                }
            }));
        }

        handlePaymentCancelled(paymentData) {
            this.showError(__('Payment was cancelled. Please try again.'));
            
            // Dispatch event for booking form to handle
            document.dispatchEvent(new CustomEvent('yatra_payment_cancelled', {
                detail: {
                    gateway: 'razorpay'
                }
            }));
        }

        showError(message) {
            // Try to show error in booking form's error container
            const errorContainer = document.querySelector('.yatra-booking-error, #yatra-payment-error, .payment-error');
            if (errorContainer) {
                errorContainer.innerHTML = '<div class="error-message">' + message + '</div>';
                errorContainer.style.display = 'block';
            } else {
                alert(message);
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new YatraRazorpay());
    } else {
        new YatraRazorpay();
    }

    // Export for external use
    window.YatraRazorpay = YatraRazorpay;
})();
