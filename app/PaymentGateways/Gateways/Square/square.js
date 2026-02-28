/**
 * Square Payment Integration for Yatra
 * Handles client-side Square Web Payments SDK
 * 
 * Works like Stripe - shows inline card form on booking page
 * and intercepts form submission to process payment
 */

(function() {
    'use strict';
    
    

    const __ = (window.wp && window.wp.i18n && window.wp.i18n.__) ? window.wp.i18n.__ : (text => text);

    class YatraSquare {
        constructor() {
            
            this.payments = null;
            this.card = null;
            this.cardMounted = false;
            this.config = window.yatraBookingData?.gateways?.square || {};
            this.init();
        }

        init() {
            
            
            // Check if Square gateway option exists
            if (!document.querySelector('input[name="payment_gateway"][value="square"]')) {
                return;
            }
            
            // Add Square card container to the gateway extra area
            this.addSquareContainer();
            
            // Listen for gateway selection changes
            document.querySelectorAll('input[name="payment_gateway"]').forEach((radio) => {
                radio.addEventListener('change', (e) => this.handleGatewayChange(e));
            });
            
            // Initialize Square if already selected
            const selectedGateway = document.querySelector('input[name="payment_gateway"]:checked');
            if (selectedGateway?.value === 'square') {
                this.initializeSquare();
            }
            
            // Listen for unified booking submit event
            document.addEventListener('yatra_booking_submit', (event) => this.handleBookingSubmit(event));
            
            // Register with gateway system if available
            if (typeof window.yatraRegisterPaymentGateway === 'function') {
                window.yatraRegisterPaymentGateway('square', {
                    canHandle: (action) => action === 'square_payment',
                    handlePayment: (data) => this.processPayment(data)
                });
            }
        }

        addSquareContainer() {
            const squareOption = document.querySelector('input[name="payment_gateway"][value="square"]');
            if (!squareOption) {
                return;
            }
            
            // Check if container already exists
            if (document.getElementById('square-card-container')) {
                
                return;
            }
            
            // Find the gateway extra container
            let extraContainer = document.getElementById('yatra-gateway-extra-square');
            if (!extraContainer) {
                // Create container in the payment gateway section
                const gatewayItem = squareOption.closest('.yatra-gateway-item, .payment-method-item, label');
                if (gatewayItem) {
                    extraContainer = document.createElement('div');
                    extraContainer.id = 'yatra-gateway-extra-square';
                    extraContainer.className = 'yatra-gateway-extra';
                    gatewayItem.parentNode.insertBefore(extraContainer, gatewayItem.nextSibling);
                }
            }
            
            if (!extraContainer) return;
            
            // Clear any existing content
            extraContainer.innerHTML = '';
            
            const container = document.createElement('div');
            container.className = 'yatra-square-container';
            container.style.display = squareOption.checked ? 'block' : 'none';
            container.innerHTML = `
                <div class="yatra-square-card-wrapper" style="margin-top: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        ${__('Card Details', 'yatra')}
                    </label>
                    <div id="square-card-container" style="min-height: 50px; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff;"></div>
                    <div id="square-card-errors" style="color: #ef4444; font-size: 14px; margin-top: 8px; display: none;"></div>
                </div>
            `;
            
            extraContainer.appendChild(container);
        }

        handleGatewayChange(event) {
            const container = document.querySelector('.yatra-square-container');
            if (!container) return;
            
            if (event.target.value === 'square') {
                container.style.display = 'block';
                this.initializeSquare();
            } else {
                container.style.display = 'none';
            }
        }

        async initializeSquare() {
            if (this.cardMounted) return;
            
            try {
                // Check if Square SDK is loaded
                if (typeof Square === 'undefined') {
                    
                    // SDK should be loaded by WordPress enqueue
                    return;
                }
                
                const applicationId = this.config.application_id;
                const locationId = this.config.location_id;
                
                if (!applicationId || !locationId) {
                    console.error('[Yatra Square] Missing application_id or location_id');
                    this.showError('Square is not configured properly.');
                    return;
                }
                
                
                this.payments = Square.payments(applicationId, locationId);
                
                // Create card payment method
                this.card = await this.payments.card();
                await this.card.attach('#square-card-container');
                this.cardMounted = true;
                
                
                
            } catch (error) {
                console.error('[Yatra Square] Initialization error:', error);
                this.showError(error.message || 'Failed to load Square payment form.');
            }
        }

        async handleBookingSubmit(event) {
            if (event.detail?.gateway !== 'square') {
                return; // Let other gateways handle
            }
            
            
            
            // Prevent default submission - we'll handle it
            event.preventDefault();
            
            const { bookingData, submitButton, originalBtnHtml, proceedWithSubmission } = event.detail;
            
            if (!this.card || !this.cardMounted) {
                this.showError('Please wait for the payment form to load.');
                return;
            }
            
            try {
                // Show loading state
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span>Processing payment...</span>';
                }
                
                this.hideError();
                
                // Tokenize the card
                
                const tokenResult = await this.card.tokenize();
                
                if (tokenResult.status !== 'OK') {
                    let errorMessage = 'Payment failed. Please check your card details.';
                    if (tokenResult.errors && tokenResult.errors.length > 0) {
                        errorMessage = tokenResult.errors.map(e => e.message).join('. ');
                    }
                    throw new Error(errorMessage);
                }
                
                
                
                // Add the token to booking data
                bookingData.square_source_id = tokenResult.token;
                
                // Now proceed with the booking submission
                // The server will use the token to complete the payment
                this.submitBookingWithToken(bookingData, submitButton, originalBtnHtml);
                
            } catch (error) {
                console.error('[Yatra Square] Payment error:', error);
                this.showError(error.message);
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalBtnHtml;
                }
            }
        }

        async submitBookingWithToken(bookingData, submitButton, originalBtnHtml) {
            const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
            const nonce = window.yatraBookingData?.nonce || '';
            
            try {
                const response = await fetch(apiUrl + '/booking/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(bookingData)
                });
                
                const result = await response.json();
                
                
                if (result.success) {
                    // Check if we need to complete payment with the token
                    if (result.data?.requires_action === 'square_payment') {
                        await this.completePayment(bookingData.square_source_id, result.data);
                    } else if (result.data?.redirect_url) {
                        window.location.href = result.data.redirect_url;
                    } else if (result.data?.payment_url) {
                        window.location.href = result.data.payment_url;
                    }
                } else {
                    throw new Error(result.message || 'Booking failed');
                }
                
            } catch (error) {
                console.error('[Yatra Square] Submission error:', error);
                this.showError(error.message);
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalBtnHtml;
                }
            }
        }

        async completePayment(sourceId, data) {
            const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
            const nonce = window.yatraBookingData?.nonce || '';
            
            
            
            const response = await fetch(apiUrl + '/payment/square/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    source_id: sourceId,
                    booking_id: data.booking_id,
                    amount: data.amount,
                    currency: data.currency
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                
                document.dispatchEvent(new CustomEvent('yatra_payment_success', {
                    detail: { gateway: 'square', ...result }
                }));
                
                // Redirect to confirmation page
                window.location.href = data.confirmation_url;
            } else {
                throw new Error(result.message || 'Payment failed');
            }
        }

        async processPayment(data) {
            // This is called when server returns requires_action
            // But with inline form, we should already have the token
            if (data.square_source_id) {
                await this.completePayment(data.square_source_id, data);
            }
        }

        showError(message) {
            const errorDiv = document.getElementById('square-card-errors');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
        }

        hideError() {
            const errorDiv = document.getElementById('square-card-errors');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    }

    // Initialize when DOM is ready - singleton pattern
    if (!window.yatraSquareInstance) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (!window.yatraSquareInstance) {
                    window.yatraSquareInstance = new YatraSquare();
                }
            });
        } else {
            window.yatraSquareInstance = new YatraSquare();
        }
    }
})();
