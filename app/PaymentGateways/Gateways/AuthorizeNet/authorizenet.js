/**
 * Authorize.net Payment Integration for Yatra
 * Uses Accept.js for secure client-side card tokenization
 */

(function() {
    'use strict';
    
    

    const __ = (window.wp && window.wp.i18n && window.wp.i18n.__) ? window.wp.i18n.__ : (text => text);

    class YatraAuthorizeNet {
        constructor() {
            
            this.config = window.yatraBookingData?.gateways?.authorize_net || {};
            
            this.acceptJsLoaded = false;
            this.init();
        }

        init() {
            
            
            // Check if Authorize.net gateway option exists
            if (!document.querySelector('input[name="payment_gateway"][value="authorize_net"]')) {
                return;
            }
            
            // Add card container
            this.addCardContainer();
            
            // Listen for gateway selection changes
            document.querySelectorAll('input[name="payment_gateway"]').forEach((radio) => {
                radio.addEventListener('change', (e) => this.handleGatewayChange(e));
            });
            
            // Initialize if already selected
            const selectedGateway = document.querySelector('input[name="payment_gateway"]:checked');
            if (selectedGateway?.value === 'authorize_net') {
                this.loadAcceptJs();
            }
            
            // Listen for unified booking submit event
            document.addEventListener('yatra_booking_submit', (event) => this.handleBookingSubmit(event));
            
            // Register with gateway system
            if (typeof window.yatraRegisterPaymentGateway === 'function') {
                window.yatraRegisterPaymentGateway('authorize_net', {
                    canHandle: (action) => action === 'authorize_net_payment',
                    handlePayment: (data) => this.processPayment(data)
                });
            }
        }

        addCardContainer() {
            const authnetOption = document.querySelector('input[name="payment_gateway"][value="authorize_net"]');
            if (!authnetOption || document.getElementById('authnet-card-container')) {
                return;
            }
            
            let extraContainer = document.getElementById('yatra-gateway-extra-authorize_net');
            if (!extraContainer) {
                const gatewayItem = authnetOption.closest('.yatra-gateway-item, .payment-method-item, label');
                if (gatewayItem) {
                    extraContainer = document.createElement('div');
                    extraContainer.id = 'yatra-gateway-extra-authorize_net';
                    extraContainer.className = 'yatra-gateway-extra';
                    gatewayItem.parentNode.insertBefore(extraContainer, gatewayItem.nextSibling);
                }
            }
            
            if (!extraContainer) return;
            
            extraContainer.innerHTML = '';
            
            const container = document.createElement('div');
            container.className = 'yatra-authnet-container';
            container.style.display = authnetOption.checked ? 'block' : 'none';
            container.innerHTML = `
                <div class="yatra-authnet-card-wrapper" style="margin-top: 16px;">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            ${__('Card Number', 'yatra')}
                        </label>
                        <input type="text" id="authnet-card-number" placeholder="4111 1111 1111 1111" 
                            style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                            maxlength="19" autocomplete="cc-number">
                    </div>
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                                ${__('Expiry (MM/YY)', 'yatra')}
                            </label>
                            <input type="text" id="authnet-card-expiry" placeholder="MM/YY" 
                                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                maxlength="5" autocomplete="cc-exp">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                                ${__('CVV', 'yatra')}
                            </label>
                            <input type="text" id="authnet-card-cvv" placeholder="123" 
                                style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                maxlength="4" autocomplete="cc-csc">
                        </div>
                    </div>
                    <div id="authnet-card-errors" style="color: #ef4444; font-size: 14px; margin-top: 8px; display: none;"></div>
                </div>
            `;
            
            extraContainer.appendChild(container);
            
            // Add input formatting
            this.setupInputFormatting();
        }

        setupInputFormatting() {
            const cardNumber = document.getElementById('authnet-card-number');
            const expiry = document.getElementById('authnet-card-expiry');
            
            if (cardNumber) {
                cardNumber.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                    e.target.value = value.substring(0, 19);
                });
            }
            
            if (expiry) {
                expiry.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    e.target.value = value;
                });
            }
        }

        handleGatewayChange(event) {
            const container = document.querySelector('.yatra-authnet-container');
            if (!container) return;
            
            if (event.target.value === 'authorize_net') {
                container.style.display = 'block';
                this.loadAcceptJs();
            } else {
                container.style.display = 'none';
            }
        }

        loadAcceptJs() {
            if (this.acceptJsLoaded || typeof Accept !== 'undefined') {
                this.acceptJsLoaded = true;
                return Promise.resolve();
            }
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const testMode = this.config.test_mode;
                script.src = testMode 
                    ? 'https://jstest.authorize.net/v1/Accept.js'
                    : 'https://js.authorize.net/v1/Accept.js';
                script.onload = () => {
                    this.acceptJsLoaded = true;
                    
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load Accept.js'));
                document.head.appendChild(script);
            });
        }

        async handleBookingSubmit(event) {
            if (event.detail?.gateway !== 'authorize_net') {
                return;
            }
            
            
            event.preventDefault();
            event.stopImmediatePropagation(); // Prevent booking.js from also submitting
            
            const { bookingData, submitButton, originalBtnHtml } = event.detail;
            
            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span>Processing payment...</span>';
                }
                
                this.hideError();
                
                // Load Accept.js if not loaded
                await this.loadAcceptJs();
                
                // Get card data
                const cardNumber = document.getElementById('authnet-card-number')?.value.replace(/\s/g, '') || '';
                const expiry = document.getElementById('authnet-card-expiry')?.value || '';
                const cvv = document.getElementById('authnet-card-cvv')?.value || '';
                
                if (!cardNumber || !expiry || !cvv) {
                    throw new Error('Please fill in all card details');
                }
                
                const [expMonth, expYear] = expiry.split('/');
                if (!expMonth || !expYear) {
                    throw new Error('Invalid expiry date format');
                }
                
                // Tokenize card with Accept.js
                
                const tokenResult = await this.tokenizeCard(cardNumber, expMonth, '20' + expYear, cvv);
                
                
                
                // Add token to booking data
                bookingData.authnet_data_descriptor = tokenResult.dataDescriptor;
                bookingData.authnet_data_value = tokenResult.dataValue;
                
                // Submit booking with token
                this.submitBookingWithToken(bookingData, submitButton, originalBtnHtml);
                
            } catch (error) {
                console.error('[Yatra AuthorizeNet] Payment error:', error);
                this.showError(error.message);
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalBtnHtml;
                }
            }
        }

        tokenizeCard(cardNumber, expMonth, expYear, cvv) {
            return new Promise((resolve, reject) => {
                
                
                const authData = {
                    clientKey: this.config.public_client_key,
                    apiLoginID: this.config.api_login_id
                };
                
                const cardData = {
                    cardNumber: cardNumber,
                    month: expMonth,
                    year: expYear,
                    cardCode: cvv
                };
                
                const secureData = {
                    authData: authData,
                    cardData: cardData
                };
                
                Accept.dispatchData(secureData, (response) => {
                    if (response.messages.resultCode === 'Error') {
                        const errors = response.messages.message.map(m => m.text).join('. ');
                        reject(new Error(errors));
                    } else {
                        resolve({
                            dataDescriptor: response.opaqueData.dataDescriptor,
                            dataValue: response.opaqueData.dataValue
                        });
                    }
                });
            });
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
                    if (result.data?.redirect_url) {
                        window.location.href = result.data.redirect_url;
                    } else if (result.data?.payment_url) {
                        window.location.href = result.data.payment_url;
                    }
                } else {
                    throw new Error(result.message || 'Booking failed');
                }
                
            } catch (error) {
                console.error('[Yatra AuthorizeNet] Submission error:', error);
                this.showError(error.message);
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalBtnHtml;
                }
            }
        }

        showError(message) {
            const errorDiv = document.getElementById('authnet-card-errors');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
        }

        hideError() {
            const errorDiv = document.getElementById('authnet-card-errors');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    }

    // Initialize - singleton pattern
    if (!window.yatraAuthorizeNetInstance) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (!window.yatraAuthorizeNetInstance) {
                    window.yatraAuthorizeNetInstance = new YatraAuthorizeNet();
                }
            });
        } else {
            window.yatraAuthorizeNetInstance = new YatraAuthorizeNet();
        }
    }
})();
