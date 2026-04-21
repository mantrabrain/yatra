/**
 * Stripe Payment Integration for Yatra
 * Supports Stripe Elements (card) and Payment Request (Google Pay / Apple Pay)
 */

const __ = (window.wp && window.wp.i18n && window.wp.i18n.__) ? window.wp.i18n.__ : (text => text);

class YatraStripe {
    constructor(apiUrl, nonce) {
        this.apiUrl = apiUrl;
        this.nonce = nonce;
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.paymentRequest = null;
        this.paymentRequestButton = null;
        this.paymentRequestMounted = false;
        this.paymentForm = document.getElementById('yatra-booking-form');
        this.submitButton = document.getElementById('yatra-submit-booking');
        this.originalButtonHtml = this.submitButton ? this.submitButton.innerHTML : '';
        this.methodButtons = {};
        this.activeMethod = null;
        this.cardWrapper = null;
        this.walletWrapper = null;
        this.walletCapabilities = {
            google_pay: false,
            apple_pay: false,
        };
        this.walletMethodHints = {
            google_pay: '',
            apple_pay: '',
        };
        this.walletAvailabilityKnown = false;
        /** Short labels for each method switcher option (tooltip base copy). */
        this.methodHelpText = {};

        this.stripeSettings = window.yatraBookingData?.stripe || {};
        let enabledMethods = this.stripeSettings.enabledMethods || ['card'];
        if (typeof enabledMethods === 'string') {
            enabledMethods = enabledMethods.split(',');
        }
        if (!Array.isArray(enabledMethods) || enabledMethods.length === 0) {
            enabledMethods = ['card'];
        }
        this.enabledMethods = enabledMethods.map((method) => method.trim().toLowerCase()).filter(Boolean);
        if (this.enabledMethods.length === 0) {
            this.enabledMethods = ['card'];
        }

        this.supportsCard = this.enabledMethods.includes('card');
        this.supportsPaymentRequest = this.enabledMethods.some((method) => method === 'google_pay' || method === 'apple_pay');

        this.companyCountry = window.yatraBookingData?.companyCountry || 'US';
        this.tripTitle = window.yatraBookingData?.tripTitle || 'Trip Booking';

        window.yatraStripeInstance = this;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (!document.querySelector('input[name="payment_gateway"][value="stripe"]')) {
            return;
        }

        this.addStripeElementsContainer();

        document.querySelectorAll('input[name="payment_gateway"]').forEach((radio) => {
            radio.addEventListener('change', (e) => this.handlePaymentMethodChange(e));
        });

        if (typeof Stripe !== 'undefined') {
            this.initializeStripe();
        }

        // Listen for unified booking submit event (new system)
        document.addEventListener('yatra_booking_submit', (event) => this.handleBookingSubmit(event));
        
        // Listen for payment response for client-side Stripe payments
        document.addEventListener('yatra_payment_response', (event) => this.handlePaymentResponse(event));
        
        // Legacy event support
        document.addEventListener('yatraBeforeBookingSubmit', (event) => this.handleGatewayIntercept(event));
    }
    
    /**
     * Handle unified booking submit event
     */
    handleBookingSubmit(event) {
        if (event.detail?.gateway !== 'stripe') {
            return; // Let other gateways handle
        }
        
        // Stripe intercepts the form submission to handle card payment
        event.preventDefault();
        
        // Use the existing handleGatewayIntercept logic
        this.handleGatewayIntercept({
            preventDefault: () => {},
            detail: event.detail
        });
    }
    
    /**
     * Handle payment response for Stripe (when server returns requires_action)
     */
    handlePaymentResponse(event) {
        if (event.detail?.requires_action !== 'stripe_payment') {
            return;
        }
        
        
        this.handleStripePaymentAction(event.detail);
    }
    
    /**
     * Handle Stripe payment action from server response
     */
    async handleStripePaymentAction(data) {
        try {
            // Load Stripe if not already loaded
            if (!this.stripe && data.publishable_key) {
                await this.loadStripeScript();
                this.stripe = Stripe(data.publishable_key);
            }
            
            if (!this.stripe) {
                throw new Error('Stripe not initialized');
            }
            
            const elements = this.stripe.elements({
                clientSecret: data.client_secret
            });
            
            // Create payment element in a modal
            const modal = document.createElement('div');
            modal.id = 'yatra-stripe-modal';
            modal.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 32px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                        <h2 style="margin: 0 0 24px; text-align: center;">${__('Complete Your Payment', 'yatra')}</h2>
                        <div id="stripe-payment-element"></div>
                        <button id="stripe-submit-btn" style="width: 100%; padding: 16px; background: #635bff; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-top: 24px; cursor: pointer;">
                            ${__('Pay', 'yatra')} ${data.currency} ${parseFloat(data.amount).toFixed(2)}
                        </button>
                        <button id="stripe-cancel-btn" style="width: 100%; padding: 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-top: 12px; cursor: pointer;">
                            ${__('Cancel', 'yatra')}
                        </button>
                        <div id="stripe-error-message" style="margin-top: 16px; color: #ef4444; display: none;"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            const paymentElement = elements.create('payment');
            paymentElement.mount('#stripe-payment-element');
            
            document.getElementById('stripe-submit-btn').addEventListener('click', async () => {
                const btn = document.getElementById('stripe-submit-btn');
                btn.disabled = true;
                btn.textContent = __('Processing...', 'yatra');
                
                const { error } = await this.stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: data.confirmation_url + '?stripe=success',
                    },
                });
                
                if (error) {
                    document.getElementById('stripe-error-message').textContent = error.message;
                    document.getElementById('stripe-error-message').style.display = 'block';
                    btn.disabled = false;
                    btn.textContent = `${__('Pay', 'yatra')} ${data.currency} ${parseFloat(data.amount).toFixed(2)}`;
                }
            });
            
            document.getElementById('stripe-cancel-btn').addEventListener('click', () => {
                modal.remove();
                document.dispatchEvent(new CustomEvent('yatra_payment_cancelled', {
                    detail: { gateway: 'stripe' }
                }));
            });
            
        } catch (error) {
            console.error('Stripe payment error:', error);
            document.dispatchEvent(new CustomEvent('yatra_payment_failed', {
                detail: { gateway: 'stripe', error: error.message }
            }));
        }
    }
    
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (typeof Stripe !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    addStripeElementsContainer() {
        const stripeOption = document.querySelector('input[name="payment_gateway"][value="stripe"]');
        if (!stripeOption || document.querySelector('.yatra-stripe-container')) {
            return;
        }

        const container = document.createElement('div');
        container.className = 'yatra-stripe-container';
        const stripePreselected = !!stripeOption.checked;
        container.style.display = stripePreselected ? 'block' : 'none';

        this.methodSwitcher = this.createMethodSwitcher();
        container.appendChild(this.methodSwitcher);

        if (this.supportsPaymentRequest) {
            const requestWrapper = document.createElement('div');
            requestWrapper.className = 'yatra-stripe-payment-request-wrapper';
            const walletNote = window.yatraTranslations?.stripeWalletNote || 'Pay instantly with Apple Pay or Google Pay.';
            requestWrapper.innerHTML = `
                <div class="yatra-wallet-header">
                    <div>
                        <p class="yatra-wallet-eyebrow">${__('One-tap checkout', 'yatra')}</p>
                        <h4 class="yatra-wallet-title">Apple Pay & Google Pay</h4>
                    </div>
                    <div class="yatra-wallet-badges">
                        <span class="wallet-badge wallet-badge--apple"> Pay</span>
                        <span class="wallet-badge wallet-badge--google">G Pay</span>
                    </div>
                </div>
                <p class="yatra-wallet-desc">${walletNote}</p>
                <div id="yatra-stripe-payment-request" class="yatra-stripe-payment-request placeholder"></div>
                <div id="yatra-stripe-wallet-status" class="yatra-wallet-status">
                    ${__('Checking your device for wallet support…', 'yatra')}
                </div>
            `;
            container.appendChild(requestWrapper);
            this.walletWrapper = requestWrapper;
            this.walletWrapper.style.display = 'none';
        }

        if (this.supportsCard) {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'yatra-stripe-card-wrapper';
            cardWrapper.innerHTML = `
                <div id="yatra-stripe-card-element" class="yatra-stripe-card-element"></div>
                <div id="yatra-stripe-card-errors" class="yatra-stripe-errors" role="alert"></div>
            `;
            container.appendChild(cardWrapper);
            this.cardWrapper = cardWrapper;
            this.cardWrapper.style.display = 'none';
        }

        const gatewayExtra = document.getElementById('yatra-gateway-extra-stripe');
        if (gatewayExtra) {
            gatewayExtra.appendChild(container);
        } else {
            let parentElement = stripeOption.closest('.yatra-payment-option')
                || stripeOption.closest('.payment_method_stripe')
                || stripeOption.closest('.payment-method')
                || stripeOption.parentElement;

            if (parentElement) {
                parentElement.appendChild(container);
            } else {
                const paymentOptions = document.querySelector('.yatra-payment-options, .payment-methods');
                if (paymentOptions && paymentOptions.parentNode) {
                    paymentOptions.parentNode.insertBefore(container, paymentOptions.nextSibling);
                }
            }
        }

        this.setActiveMethod(this.getDefaultMethod());
        this.syncMethodButtonsState();

        if (stripePreselected && !this.stripe) {
            this.initializeStripe();
        }
    }

    handlePaymentMethodChange(event) {
        const selectedMethod = event.target.value;
        const stripeContainer = document.querySelector('.yatra-stripe-container');

        if (selectedMethod === 'stripe') {
            if (!this.stripe) {
                this.initializeStripe();
            } else if (stripeContainer) {
                stripeContainer.style.display = 'block';
            }
        } else if (stripeContainer) {
            stripeContainer.style.display = 'none';
        }
    }

    initializeStripe() {
        const publishableKey = window.yatraBookingData?.stripe?.publishableKey
            || window.yatraBookingData?.stripe?.publishable_key;
        if (!publishableKey) {
            this.displayError('Stripe publishable key is missing. Please contact support.');
            return;
        }

        if (typeof Stripe === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => this.setupStripeElements(publishableKey);
            script.onerror = () => {
                this.displayError('Failed to load Stripe.js. Please try again or choose another payment method.');
            };
            document.head.appendChild(script);
        } else {
            this.setupStripeElements(publishableKey);
        }
    }

    setupStripeElements(publishableKey) {
        try {
            this.stripe = Stripe(publishableKey, { apiVersion: '2023-10-16' });
            this.elements = this.stripe.elements({
                fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }],
                locale: 'auto'
            });

            if (this.supportsCard) {
                const style = {
                    base: {
                        color: '#32325d',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': { color: '#aab7c4' }
                    },
                    invalid: {
                        color: '#e53935',
                        iconColor: '#e53935'
                    }
                };

                this.cardElement = this.elements.create('card', {
                    style,
                    hidePostalCode: true
                });

                const cardElement = document.getElementById('yatra-stripe-card-element');
                if (cardElement) {
                    this.cardElement.mount(cardElement);
                    this.cardElement.on('change', (event) => this.displayError(event.error?.message || ''));
                }
            }

            this.initializePaymentRequestButton();

            const stripeContainer = document.querySelector('.yatra-stripe-container');
            if (stripeContainer && document.querySelector('input[name="payment_gateway"]:checked')?.value === 'stripe') {
                stripeContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error initializing Stripe:', error);
            this.displayError('Failed to initialize payment processor. Please try again or use another payment method.');
        }
    }

    async handleGatewayIntercept(event) {
        const selectedMethod = document.querySelector('input[name="payment_gateway"]:checked')?.value;
        if (selectedMethod !== 'stripe') {
            return true;
        }

        event.preventDefault();

        if (this.activeMethod && this.activeMethod !== 'card') {
            this.displayError(__('Please pay using the Apple Pay or Google Pay button above.', 'yatra'));
            return false;
        }

        if (!this.supportsCard) {
            this.displayError('Please use Apple Pay or Google Pay above to complete your payment.');
            return false;
        }

        const bookingData = event?.detail?.bookingData || this.collectBookingData();
        if (!bookingData) {
            this.displayError('Please complete the booking form before continuing.');
            return false;
        }

        if (!this.stripe || !this.cardElement) {
            this.initializeStripe();
            this.displayError('Stripe is still loading. Please wait a moment and try again.');
            return false;
        }

        if (!this.originalButtonHtml && event?.detail?.originalBtnHtml) {
            this.originalButtonHtml = event.detail.originalBtnHtml;
        } else if (!this.originalButtonHtml && this.submitButton) {
            this.originalButtonHtml = this.submitButton.innerHTML;
        }

        this.displayError('');
        this.setLoadingState(true);

        try {
            const paymentContext = await this.prepareStripePayment(bookingData, event?.detail?.form || this.paymentForm);
            const { bookingInfo, clientSecret, billingDetails, effectiveAmount } = paymentContext;

            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: billingDetails
                },
                return_url: this.buildReturnUrl(bookingInfo)
            });

            if (error) {
                throw error;
            }

            if (paymentIntent.status === 'succeeded') {
                await this.notifyPaymentSuccess({
                    bookingId: bookingInfo.booking_id,
                    transactionId: paymentIntent.id,
                    saveCard: !!bookingData.save_card,
                    amount: effectiveAmount,
                    currency: bookingInfo.currency || bookingData.currency || 'USD'
                });
                window.location.href = this.buildConfirmationUrlFromBookingInfo(bookingInfo);
            } else {
                throw new Error('Payment processing was not completed. Please check your payment details and try again.');
            }
        } catch (error) {
            console.error('Stripe payment error:', error);
            this.displayError(error.message || 'Payment failed. Please try again or use another payment method.');
            this.setLoadingState(false);
        }

        return false;
    }

    async initializePaymentRequestButton() {
        if (!this.supportsPaymentRequest || !this.stripe || this.paymentRequestMounted) {
            return;
        }

        try {
            this.paymentRequest = this.stripe.paymentRequest({
                country: (this.companyCountry || 'US').toUpperCase(),
                currency: (window.yatraBookingData?.currency || 'USD').toLowerCase(),
                total: this.getPaymentRequestTotal(),
                requestPayerName: true,
                requestPayerEmail: true,
            });

            const result = await this.paymentRequest.canMakePayment();
            if (!result) {
                this.setWalletStatus(
                    __('Apple Pay and Google Pay are not available on this browser/device.', 'yatra'),
                    'warning'
                );
                this.updateWalletCapabilities(null);
                this.showWalletPlaceholder(__('Use card payment instead or switch to a supported device.', 'yatra'));
                this.syncMethodButtonsState();
                return;
            }

            this.updateWalletCapabilities(result === true ? { applePay: true, googlePay: true } : result);
            this.setWalletStatus(
                __('Great! Apple Pay or Google Pay is available on this device.', 'yatra'),
                'success'
            );
            this.syncMethodButtonsState();

            this.paymentRequest.on('paymentmethod', (event) => this.handlePaymentRequestPayment(event));

            this.paymentRequestButton = this.elements.create('paymentRequestButton', {
                paymentRequest: this.paymentRequest,
                style: {
                    paymentRequestButton: {
                        type: 'default',
                        theme: 'dark',
                        height: '48px'
                    }
                }
            });

            const prContainer = document.getElementById('yatra-stripe-payment-request');
            if (prContainer) {
                this.paymentRequestButton.mount(prContainer);
                this.paymentRequestMounted = true;
                prContainer.classList.remove('placeholder');
                const stripeContainer = document.querySelector('.yatra-stripe-container');
                if (stripeContainer && document.querySelector('input[name="payment_gateway"]:checked')?.value === 'stripe') {
                    stripeContainer.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Failed to initialize Stripe Payment Request button:', error);
            this.setWalletStatus(
                __('Unable to load Apple Pay / Google Pay. Please try again later or use card payment.', 'yatra'),
                'error'
            );
            this.showWalletPlaceholder(__('Wallet payment failed to load.', 'yatra'));
            this.updateWalletCapabilities(null);
            const errHint = __('Wallet payments could not be initialized. Use your card below, or try again after refreshing the page.', 'yatra');
            this.walletMethodHints.google_pay = errHint;
            this.walletMethodHints.apple_pay = errHint;
            this.syncMethodButtonsState();
        }
    }

    setWalletStatus(message, variant = 'info') {
        const statusEl = document.getElementById('yatra-stripe-wallet-status');
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.classList.remove('is-success', 'is-warning', 'is-error');
        if (variant === 'success') {
            statusEl.classList.add('is-success');
        } else if (variant === 'warning') {
            statusEl.classList.add('is-warning');
        } else if (variant === 'error') {
            statusEl.classList.add('is-error');
        }
    }

    showWalletPlaceholder(message) {
        const container = document.getElementById('yatra-stripe-payment-request');
        if (!container) {
            return;
        }
        container.classList.add('wallet-placeholder');
        container.innerHTML = `<span>${message}</span>`;
    }

    updateWalletCapabilities(result) {
        const availability = { apple_pay: false, google_pay: false };

        if (result && typeof result === 'object') {
            availability.apple_pay = !!(result.applePay || result.apple_pay);
            availability.google_pay = !!(result.googlePay || result.google_pay);
        } else if (result === true) {
            availability.apple_pay = true;
            availability.google_pay = true;
        }

        this.walletCapabilities = availability;

        const hintGoogle = !availability.google_pay && this.enabledMethods.includes('google_pay')
            ? __('Google Pay is not available in this browser. Try Chrome or Edge on desktop or Android, use HTTPS, and ensure you have a card in your Google account.', 'yatra')
            : '';
        const hintApple = !availability.apple_pay && this.enabledMethods.includes('apple_pay')
            ? __('Apple Pay is not available here. Use Safari on iPhone, iPad, or Mac, serve this page over HTTPS, and add your domain in Stripe for Apple Pay.', 'yatra')
            : '';

        this.walletMethodHints = {
            google_pay: hintGoogle,
            apple_pay: hintApple,
        };
        this.walletAvailabilityKnown = true;
    }

    createMethodSwitcher() {
        const wrapper = document.createElement('div');
        wrapper.className = 'yatra-method-switcher';

        const availableButtons = [];

        const header = document.createElement('div');
        header.className = 'yatra-method-switcher__header';

        const eyebrow = document.createElement('p');
        eyebrow.className = 'yatra-label-eyebrow';
        eyebrow.textContent = __('Choose a payment option', 'yatra');

        const title = document.createElement('div');
        title.className = 'yatra-method-switcher__title';
        title.textContent = __('Payment methods', 'yatra');

        const helper = document.createElement('p');
        helper.className = 'yatra-method-switcher__helper';
        helper.textContent = __('Pick the option that works best for you.', 'yatra');

        header.appendChild(eyebrow);
        header.appendChild(title);
        header.appendChild(helper);

        if (this.supportsCard) {
            availableButtons.push({
                id: 'card',
                label: __('Card', 'yatra'),
                description: __('Use any major debit or credit card via Stripe Elements.', 'yatra'),
                icon: this.getMethodIconMarkup('card')
            });
        }

        if (this.enabledMethods.includes('google_pay')) {
            availableButtons.push({
                id: 'google_pay',
                label: __('Google Pay', 'yatra'),
                description: __('Pay instantly with the cards saved to your Google account.', 'yatra'),
                icon: this.getMethodIconMarkup('google_pay')
            });
        }

        if (this.enabledMethods.includes('apple_pay')) {
            availableButtons.push({
                id: 'apple_pay',
                label: __('Apple Pay', 'yatra'),
                description: __('Use Apple Wallet on iPhone, iPad, or Mac to pay securely.', 'yatra'),
                icon: this.getMethodIconMarkup('apple_pay')
            });
        }

        const buttons = document.createElement('div');
        buttons.className = 'yatra-method-switcher__buttons';

        availableButtons.forEach((method) => {
            this.methodHelpText[method.id] = method.description;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'yatra-method-button';
            btn.dataset.method = method.id;
            btn.innerHTML = `
                ${method.icon}
                <div class="method-content">
                    <span class="method-label">${method.label}</span>
                </div>
                <span class="method-tooltip">
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.3" fill="none"></circle>
                        <circle cx="10" cy="6" r="1.2" fill="currentColor"></circle>
                        <path d="M10 9v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path>
                    </svg>
                </span>
            `;
            this.applyMethodTooltipText(btn.querySelector('.method-tooltip'), method.description);
            btn.addEventListener('click', () => {
                if (btn.getAttribute('aria-disabled') === 'true') {
                    return;
                }
                this.setActiveMethod(method.id);
            });
            this.methodButtons[method.id] = btn;
            buttons.appendChild(btn);
        });

        wrapper.appendChild(header);
        wrapper.appendChild(buttons);
        return wrapper;
    }

    getMethodIconMarkup(type) {
        const base = '<span class="method-icon method-icon--' + type + '" aria-hidden="true">';
        const close = '</span>';

        const icons = {
            card: `${base}
                <svg viewBox="0 0 40 24" role="presentation" focusable="false">
                    <rect x="1" y="1" width="38" height="22" rx="6" fill="#111827" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                    <rect x="4" y="8" width="32" height="3" fill="#4b5563"></rect>
                    <rect x="4" y="14" width="15" height="4" fill="#f3f4f6"></rect>
                    <circle cx="28" cy="16" r="3.5" fill="#f97316"></circle>
                    <circle cx="33" cy="16" r="3.5" fill="#facc15"></circle>
                </svg>
            ${close}`,
            google_pay: `${base}
                <svg viewBox="0 0 40 24" role="presentation" focusable="false">
                    <g transform="translate(8 4)">
                        <path fill="#ea4335" d="M6.4 7.6a3.6 3.6 0 0 1 3.4-3.6c1 0 1.7.4 2.2.8L14 3.8A6 6 0 0 0 9.8 2C6.5 2 3.7 4.7 3.7 8s2.8 6 6.1 6c1.8 0 3.3-.6 4.3-1.8 1.1-1.3 1.4-3.1 1.2-4.6H9.8v2.5h3.6c-.2.9-.7 1.7-1.5 2.3-.7.6-1.7.9-2.8.9-2.3 0-4.2-1.9-4.2-4.2z"></path>
                        <path fill="#4285f4" d="M20.5 4.8a2.8 2.8 0 0 1 2.6 1.6V5H25v9.2h-1.9V9.6a1.6 1.6 0 0 0-1.7-1.7c-1.1 0-1.7.7-1.7 1.9v4.4h-1.9V5h1.9v1.3c.4-.8 1.3-1.5 2.8-1.5z"></path>
                        <path fill="#34a853" d="M16.7 9.2c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm3.9 0c0 3-2.3 5.2-5.9 5.2a5.9 5.9 0 1 1 0-11.8 5.8 5.8 0 0 1 4.1 1.7l-1.6 1.6A3.5 3.5 0 0 0 14.7 4C12.3 4 10.4 6 10.4 8.4s1.9 4.4 4.3 4.4c2 0 3.2-1.1 3.6-2.6h-3.6V8.7h5.8c.1.2.1.4.1.5z"></path>
                    </g>
                </svg>
            ${close}`,
            apple_pay: `${base}
                <svg viewBox="0 0 40 24" role="presentation" focusable="false">
                    <g transform="translate(7 3)" fill="currentColor">
                        <path d="M15.1 4.8c-.7.9-1.8 1.4-2.8 1.3-.1-1 .3-2 1-2.7.7-.8 2.1-1.5 3.2-1.5.1 1.1-.3 2.2-1.4 2.9z"></path>
                        <path d="M18.3 12.7c-.5 1.1-1.2 2.2-2.1 3.2-.9 1-1.8 1.9-3 1.9s-1.5-.6-2.9-.6-1.9.6-3 .6c-1.3 0-2.3-1.1-3.2-2.1C2.3 13.7 1 10 2.7 7.5c.8-1.2 2.2-2 3.6-2 1.4 0 2.4.9 3 .9.7 0 2-.9 3.6-.9.6 0 2.5.2 3.6 1.9.1.1 2 .7 1.8 5.3z"></path>
                        <rect x="20.5" y="4.3" width="1.9" height="9.4" rx="0.5"></rect>
                        <path d="M26.8 4.1c2.2 0 3.8 1.4 3.8 3.4 0 2.1-1.6 3.4-3.9 3.4h-2V14h-2V4.1zm-2 5.4h1.7c1.2 0 2-.7 2-1.9s-.8-1.9-2-1.9h-1.7z"></path>
                    </g>
                </svg>
            ${close}`
        };

        return icons[type] || `${base}</span>`;
    }

    getDefaultMethod() {
        if (this.supportsCard) {
            return 'card';
        }

        if (this.enabledMethods.includes('google_pay')) {
            return 'google_pay';
        }

        if (this.enabledMethods.includes('apple_pay')) {
            return 'apple_pay';
        }

        return 'card';
    }

    setActiveMethod(method) {
        if (!method) {
            return;
        }

        // Guard against selecting unsupported methods
        if (!this.isMethodSelectable(method)) {
            method = this.getDefaultMethod();
        }

        if (this.activeMethod === method) {
            return;
        }

        this.activeMethod = method;

        if (this.cardWrapper) {
            this.cardWrapper.style.display = method === 'card' ? 'block' : 'none';
        }

        if (this.walletWrapper) {
            const shouldShowWallet = method === 'google_pay' || method === 'apple_pay';
            this.walletWrapper.style.display = shouldShowWallet ? 'block' : 'none';
        }

        this.syncMethodButtonsState();
    }

    syncMethodButtonsState() {
        Object.entries(this.methodButtons).forEach(([method, button]) => {
            if (!button) {
                return;
            }

            const isActive = method === this.activeMethod;
            button.classList.toggle('is-active', isActive);
            button.classList.remove('is-disabled', 'is-pending');
            button.removeAttribute('aria-disabled');

            const tooltipEl = button.querySelector('.method-tooltip');
            const baseHelp = this.methodHelpText[method] || '';

            if (this.isWalletMethod(method)) {
                if (!this.walletAvailabilityKnown) {
                    button.classList.add('is-pending');
                    button.setAttribute('aria-disabled', 'true');
                    this.applyMethodTooltipText(
                        tooltipEl,
                        __('Checking if Google Pay or Apple Pay is available on this device…', 'yatra')
                    );
                } else {
                    const isSupported = !!this.walletCapabilities[method];
                    if (!isSupported) {
                        button.classList.add('is-disabled');
                        button.setAttribute('aria-disabled', 'true');
                        const why = this.walletMethodHints[method] || __('This wallet is not available on this device or browser. Use card payment instead.', 'yatra');
                        this.applyMethodTooltipText(tooltipEl, why);
                        if (isActive) {
                            this.setActiveMethod('card');
                        }
                    } else {
                        this.applyMethodTooltipText(tooltipEl, baseHelp);
                    }
                }
            } else {
                this.applyMethodTooltipText(tooltipEl, baseHelp);
            }
        });

        // Ensure at least one method is visible if everything else disabled
        const activeBtn = this.activeMethod ? this.methodButtons[this.activeMethod] : null;
        const activeBlocked = activeBtn && activeBtn.getAttribute('aria-disabled') === 'true';
        if (!this.activeMethod || activeBlocked) {
            const fallback = this.supportsCard ? 'card'
                : (this.walletCapabilities.google_pay ? 'google_pay'
                    : (this.walletCapabilities.apple_pay ? 'apple_pay' : null));
            if (fallback) {
                this.setActiveMethod(fallback);
            }
        }
    }

    /**
     * @param {HTMLElement | null} el
     * @param {string} text
     */
    applyMethodTooltipText(el, text) {
        if (!el) {
            return;
        }
        const t = String(text);
        el.setAttribute('data-tooltip', t);
        el.setAttribute('aria-label', t);
        el.setAttribute('title', t);
    }

    isWalletMethod(method) {
        return method === 'google_pay' || method === 'apple_pay';
    }

    isMethodSelectable(method) {
        if (method === 'card') {
            return !!this.supportsCard;
        }

        if (this.isWalletMethod(method)) {
            if (!this.walletAvailabilityKnown) {
                return false;
            }
            return !!this.walletCapabilities[method];
        }

        return false;
    }

    async handlePaymentRequestPayment(event) {
        try {
            const bookingData = this.collectBookingData();
            if (!bookingData) {
                throw new Error('Please complete the booking form before using Apple Pay or Google Pay.');
            }

            this.setLoadingState(true);
            const paymentContext = await this.prepareStripePayment(bookingData, this.paymentForm);
            const { bookingInfo, clientSecret, effectiveAmount } = paymentContext;

            const confirmation = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: event.paymentMethod.id,
                return_url: this.buildReturnUrl(bookingInfo)
            });

            if (confirmation.error) {
                event.complete('fail');
                throw confirmation.error;
            }

            event.complete('success');

            if (confirmation.paymentIntent?.status === 'requires_action') {
                return;
            }

            if (confirmation.paymentIntent?.status === 'succeeded') {
                await this.notifyPaymentSuccess({
                    bookingId: bookingInfo.booking_id,
                    transactionId: confirmation.paymentIntent.id,
                    saveCard: !!bookingData.save_card,
                    amount: effectiveAmount,
                    currency: bookingInfo.currency || bookingData.currency || 'USD'
                });
            }

            window.location.href = this.buildConfirmationUrlFromBookingInfo(bookingInfo);
        } catch (error) {
            console.error('Stripe payment request error:', error);
            if (event && typeof event.complete === 'function') {
                event.complete('fail');
            }
            this.displayError(error.message || 'Payment failed. Please try again or use another payment method.');
            this.setLoadingState(false);
        }
    }

    async prepareStripePayment(bookingData, formElement) {
        // Always call the same endpoint - server decides based on session type
        const bookingResponse = await fetch(`${this.apiUrl}/booking/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.nonce
            },
            body: JSON.stringify(bookingData)
        });

        const bookingResult = await bookingResponse.json();

        if (!bookingResult.success) {
            throw new Error(bookingResult.message || 'Failed to process request. Please try again.');
        }

        const bookingInfo = bookingResult.data;
        const effectiveAmount = this.getEffectiveAmount(bookingData, bookingInfo);

        if (bookingInfo.client_secret) {
            const customerEmail = bookingInfo.customer_email || bookingData.contact_email || bookingData.email;
            const customerName = bookingInfo.customer_name ||
                [bookingData.contact_first_name, bookingData.contact_last_name]
                    .filter(Boolean)
                    .join(' ') || bookingData.full_name;

            if (!customerEmail) {
                throw new Error('Email address is required.');
            }

            const billingDetails = this.getBillingDetails(bookingData, formElement);

            return {
                bookingInfo,
                clientSecret: bookingInfo.client_secret,
                billingDetails,
                effectiveAmount,
            };
        }

        const customerEmail = bookingInfo.customer_email || bookingData.contact_email || bookingData.email;
        const customerName = bookingInfo.customer_name ||
            [bookingData.contact_first_name, bookingData.contact_last_name]
                .filter(Boolean)
                .join(' ') || bookingData.full_name;

        if (!customerEmail) {
            throw new Error('Email address is required.');
        }

        const paymentIntentResponse = await fetch(`${this.apiUrl}/payment/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.nonce
            },
            body: JSON.stringify({
                gateway: 'stripe',
                booking_id: bookingInfo.booking_id,
                amount: effectiveAmount,
                currency: bookingInfo.currency,
                trip_id: bookingInfo.trip_id || bookingData.trip_id || null,
                trip_date: bookingInfo.trip_date || bookingData.travel_date || '',
                customer_email: customerEmail,
                customer_name: customerName,
                return_url: this.buildReturnUrl(bookingInfo)
            })
        });

        const intentPayload = await paymentIntentResponse.json();
        if (!paymentIntentResponse.ok) {
            throw new Error(intentPayload?.message || 'Unable to process payment. Please try again.');
        }
        const clientSecret = intentPayload.client_secret;

        if (!clientSecret) {
            throw new Error(intentPayload?.error?.message || 'Unable to process payment. Please try again.');
        }

        const billingDetails = this.getBillingDetails(bookingData, formElement);

        return {
            bookingInfo,
            clientSecret,
            billingDetails,
            effectiveAmount,
        };
    }

    getBillingDetails(bookingData, formElement) {
        const getField = (keys) => {
            const candidates = Array.isArray(keys) ? keys : [keys];
            for (const key of candidates) {
                if (bookingData && bookingData[key]) {
                    return bookingData[key];
                }
                if (formElement) {
                    const input = formElement.querySelector(`[name="${key}"]`);
                    if (input && input.value) {
                        return input.value;
                    }
                }
            }
            return '';
        };

        const firstName = getField(['billing_first_name', 'contact_first_name', 'first_name']);
        const lastName = getField(['billing_last_name', 'contact_last_name', 'last_name']);
        const email = getField(['billing_email', 'contact_email', 'email']);
        const phone = getField(['billing_phone', 'contact_phone', 'phone']);
        const line1 = getField(['billing_address_1', 'contact_address']);
        const city = getField(['billing_city', 'contact_city']);
        const country = getField(['billing_country', 'contact_country']);
        const postalCode = getField(['billing_postcode', 'contact_postcode', 'contact_zip']);

        const billingDetails = {};
        const name = `${firstName} ${lastName}`.trim();
        if (name) {
            billingDetails.name = name;
        }
        if (email) {
            billingDetails.email = email;
        }
        if (phone) {
            billingDetails.phone = phone;
        }

        const address = {};
        if (line1) {
            address.line1 = line1;
        }
        if (city) {
            address.city = city;
        }
        if (country) {
            const normalizedCountry = country.trim().toUpperCase();
            if (normalizedCountry.length === 2) {
                address.country = normalizedCountry;
            }
        }
        if (postalCode) {
            address.postal_code = postalCode;
        }

        if (Object.keys(address).length > 0) {
            billingDetails.address = address;
        }

        return billingDetails;
    }

    collectBookingData() {
        if (!this.paymentForm) {
            return null;
        }

        const formData = new FormData(this.paymentForm);
        const bookingData = {};

        for (const [key, value] of formData.entries()) {
            const matches = key.match(/^([^\[]+)(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?$/);

            if (matches) {
                const [, base, index, field] = matches;

                if (index !== undefined && field !== undefined) {
                    bookingData[base] = bookingData[base] || {};
                    bookingData[base][index] = bookingData[base][index] || {};
                    bookingData[base][index][field] = value;
                } else if (index !== undefined) {
                    bookingData[base] = bookingData[base] || [];
                    bookingData[base][index] = value;
                } else {
                    bookingData[key] = value;
                }
            } else {
                bookingData[key] = value;
            }
        }

        bookingData.accept_terms = this.paymentForm.querySelector('input[name="accept_terms"]')?.checked || false;
        bookingData.accept_privacy = this.paymentForm.querySelector('input[name="accept_privacy"]')?.checked || false;
        bookingData.subscribe_newsletter = this.paymentForm.querySelector('input[name="subscribe_newsletter"]')?.checked || false;
        bookingData.payment_due = parseFloat(this.paymentForm.getAttribute('data-payment-due'))
            || window.yatraBookingData?.paymentDue
            || null;
        bookingData.currency = window.yatraBookingData?.currency
            || bookingData.currency
            || this.paymentForm.querySelector('input[name="currency"]')?.value
            || 'USD';
        bookingData.payment_gateway = 'stripe';

        return bookingData;
    }

    displayError(message) {
        const errorElement = document.getElementById('yatra-stripe-card-errors');
        if (errorElement) {
            errorElement.textContent = message || '';
            errorElement.style.display = message ? 'block' : 'none';
            if (message) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else if (message) {
            console.error(message);
        }
    }

    setLoadingState(isLoading) {
        if (!this.submitButton) {
            return;
        }

        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<span class="yatra-spinner"></span> Processing Payment...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = this.originalButtonHtml;
        }
    }

    getEffectiveAmount(bookingData, bookingInfo) {
        // After /booking/create, server-calculated charge (deposit / partial / full) is authoritative.
        // `amount` = charge for this checkout (matches gateway). Never fall back to `total_amount` (full order).
        const serverFirst = [
            parseFloat(bookingInfo?.amount),
            parseFloat(bookingInfo?.amount_due)
        ];
        for (let i = 0; i < serverFirst.length; i++) {
            const v = serverFirst[i];
            if (!isNaN(v) && v > 0) {
                return v;
            }
        }

        const summaryDue = parseFloat(window.yatraBookingSummary?.amountDue);
        if (!isNaN(summaryDue) && summaryDue > 0) {
            return summaryDue;
        }

        const candidates = [
            parseFloat(bookingData?.amount_due),
            parseFloat(bookingData?.payment_due),
            parseFloat(this.paymentForm?.dataset.paymentDue),
            parseFloat(window.yatraBookingData?.paymentDue)
        ].map((val) => (isNaN(val) ? 0 : val));

        const picked = candidates.find((val) => val > 0) ?? 0;
        return picked > 0 ? picked : 0;
    }

    getCurrentPaymentDue() {
        const summaryDue = parseFloat(window.yatraBookingSummary?.amountDue);
        if (!isNaN(summaryDue) && summaryDue > 0) {
            return summaryDue;
        }

        const candidates = [
            parseFloat(this.paymentForm?.dataset.paymentDue),
            parseFloat(window.yatraBookingData?.paymentDue)
        ].map((val) => (isNaN(val) ? 0 : val));

        return candidates.find((val) => val > 0) ?? 0;
    }

    getPaymentRequestTotal() {
        return {
            label: this.tripTitle,
            amount: this.getAmountInCents(this.getCurrentPaymentDue())
        };
    }

    getAmountInCents(amount) {
        const value = isNaN(amount) ? 0 : amount;
        return Math.max(50, Math.round(value * 100));
    }

    /**
     * Pageless confirmation URLs use the same base as Settings → Default Booking URL Base
     * (e.g. book → /book/confirmation/{reference}/). Never hard-code /booking-confirmation/.
     */
    buildConfirmationUrlFromBookingInfo(bookingInfo) {
        if (bookingInfo.redirect_url) {
            return bookingInfo.redirect_url;
        }
        const d = window.yatraBookingData || {};
        const site = (d.siteUrl || window.location.origin || '').replace(/\/$/, '');
        const ref = String(bookingInfo.reference || '').trim();
        const id = bookingInfo.booking_id;
        const segment = ref || (id != null && id !== '' ? String(id) : '');

        if (!segment) {
            return `${site}/`;
        }

        if (d.permalinkStructure === 'plain') {
            return `${site}/?yatra_booking_confirmation=${encodeURIComponent(segment)}`;
        }

        const bb = String(d.bookingBase || 'book').replace(/^\/|\/$/g, '');
        return `${site}/${bb}/confirmation/${encodeURIComponent(segment)}/`;
    }

    buildReturnUrl(bookingInfo) {
        const base = this.buildConfirmationUrlFromBookingInfo(bookingInfo);
        try {
            const url = new URL(base, window.location.origin);
            url.searchParams.set('stripe_return', '1');
            return url.toString();
        } catch (e) {
            const join = base.includes('?') ? '&' : '?';
            return `${base}${join}stripe_return=1`;
        }
    }

    async notifyPaymentSuccess({ bookingId, transactionId, saveCard, amount, currency }) {
        try {
            const response = await fetch(`${this.apiUrl}/payment/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': this.nonce,
                },
                body: JSON.stringify({
                    gateway: 'stripe',
                    booking_id: bookingId,
                    transaction_id: transactionId,
                    save_card: !!saveCard,
                    amount,
                    currency,
                }),
            });

            const payload = await response.json();
            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.message || 'Failed to record payment.');
            }

            return payload;
        } catch (error) {
            console.error('Failed to notify backend about payment success:', error);
            throw error;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('yatra-booking-form')) {
        const apiUrl = window.yatraBookingData?.apiUrl || '/wp-json/yatra/v1';
        const nonce = window.yatraBookingData?.nonce || '';
        new YatraStripe(apiUrl, nonce);
    }
});
