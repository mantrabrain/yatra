<?php
/**
 * Payment Processing Page
 * Handles frontend payment processing for gateways that require client-side integration
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$gateway = $_GET['gateway'] ?? '';
$client_secret = $_GET['client_secret'] ?? '';
$publishable_key = $_GET['publishable_key'] ?? '';
$booking_ref = $_GET['booking_ref'] ?? '';
$amount = $_GET['amount'] ?? 0;

if (empty($gateway) || empty($booking_ref)) {
    wp_redirect(home_url('/book/?error=invalid_payment_data'));
    exit;
}

get_header();
?>

<div class="yatra-payment-process">
    <div class="yatra-payment-container" style="max-width: 600px; margin: 80px auto; padding: 40px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <?php if ($gateway === 'stripe' && $client_secret && $publishable_key): ?>
            <!-- Stripe Payment Form -->
            <div id="stripe-payment-form">
                <h2 style="text-align: center; margin-bottom: 24px;"><?php esc_html_e('Complete Your Payment', 'yatra'); ?></h2>
                
                <div id="payment-element">
                    <!-- Stripe Elements will create form elements here -->
                </div>
                
                <button id="submit-payment" style="width: 100%; padding: 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-top: 24px; cursor: pointer;">
                    <?php printf(esc_html__('Pay %s', 'yatra'), esc_html(number_format($amount, 2))); ?>
                </button>
                
                <div id="payment-messages" role="alert" style="margin-top: 16px;"></div>
            </div>

            <script src="https://js.stripe.com/v3/"></script>
            <script>
                const stripe = Stripe('<?php echo esc_js($publishable_key); ?>');
                const elements = stripe.elements({
                    clientSecret: '<?php echo esc_js($client_secret); ?>'
                });

                const paymentElement = elements.create('payment');
                paymentElement.mount('#payment-element');

                const form = document.getElementById('stripe-payment-form');
                const submitButton = document.getElementById('submit-payment');
                const messagesDiv = document.getElementById('payment-messages');

                form.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    
                    submitButton.disabled = true;
                    submitButton.textContent = '<?php esc_html_e('Processing...', 'yatra'); ?>';

                    const {error} = await stripe.confirmPayment({
                        elements,
                        confirmParams: {
                            return_url: '<?php echo esc_url(home_url('/book/confirmation/?ref=' . urlencode($booking_ref) . '&payment=success')); ?>',
                        },
                    });

                    if (error) {
                        messagesDiv.innerHTML = '<div style="color: #ef4444; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">' + error.message + '</div>';
                        submitButton.disabled = false;
                        submitButton.textContent = '<?php printf(esc_html__('Pay %s', 'yatra'), esc_html(number_format($amount, 2))); ?>';
                    }
                });

                submitButton.addEventListener('click', (event) => {
                    form.dispatchEvent(new Event('submit'));
                });
            </script>

        <?php else: ?>
            <!-- Generic Payment Processing -->
            <div style="text-align: center;">
                <h2><?php esc_html_e('Processing Payment', 'yatra'); ?></h2>
                <p><?php esc_html_e('Please wait while we redirect you to complete your payment...', 'yatra'); ?></p>
                <div style="margin: 24px 0;">
                    <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        <?php endif; ?>
        
    </div>
</div>

<?php get_footer(); ?>
