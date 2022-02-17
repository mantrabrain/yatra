<?php

class Yatra_Payment_Gateway_PayPal extends Yatra_Payment_Gateways
{
    protected $id = 'paypal';

    public function __construct()
    {

        include_once 'paypal-functions.php';

        $configuration = array(

            'settings' => array(
                'title' => __('PayPal Standard', 'yatra'),
                'default' => 'no',
                'id' => $this->id,
                'frontend_title' => get_option('yatra_payment_gateway_paypal_label_on_checkout', __('PayPal Standard', 'yatra')),

            ),
        );

        add_action('init', array($this, 'yatra_listen_paypal_ipn'));
        add_action('yatra_payment_checkout_payment_gateway_paypal', array($this, 'process_payment'));
        add_action('yatra_verify_paypal_ipn', array($this, 'yatra_paypal_ipn_process'));


        parent::__construct($configuration);

    }

    public function admin_setting_tab()
    {
        $settings =

            array(
                array(
                    'title' => __('PayPal Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_payment_gateways_paypal_options',
                ),
                array(
                    'title' => __('PayPal Email Address', 'yatra'),
                    'desc' => __(' Enter your PayPal account\'s email', 'yatra'),
                    'id' => 'yatra_payment_gateway_paypal_email',
                    'type' => 'text',
                ),
                array(
                    'title' => __('Label on checkout', 'yatra'),
                    'desc' => __('Label on checkout', 'yatra'),
                    'id' => 'yatra_payment_gateway_paypal_label_on_checkout',
                    'type' => 'text',
                    'default' => __('Paypal Standard', 'yatra')
                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_payment_gateways_paypal_options',
                ),

            );


        return $settings;
    }

    public function process_payment($booking_id, $payment_id)
    {

        $txn_id = get_post_meta($payment_id, 'txn_id', true);

        $booking = get_post($booking_id);

        $booking_status = $booking->post_status ?? '';

        if (($booking_status !== 'yatra-pending' && $booking_status !== 'yatra-processing') || $txn_id) {

            return;
        }

        include_once dirname(__FILE__) . '/class-yatra-gateway-paypal-request.php';


        do_action('yatra_before_payment_process', $booking_id);

        $paypal_request = new Yatra_Gateway_Paypal_Request();

        $redirect_url = $paypal_request->get_request_url($booking_id, $payment_id);

        wp_redirect($redirect_url);

        exit;
    }


    /**
     * Listen for a $_GET request from our PayPal IPN.
     * This would also do the "set-up" for an "alternate purchase verification"
     */
    public function yatra_listen_paypal_ipn()
    {

        if (isset($_GET['yatra_listener']) && $_GET['yatra_listener'] == 'IPN' && isset($_POST['custom'])) {

            do_action('yatra_verify_paypal_ipn');
        }
        // echo WP_CONTENT_DIR;die;
    }


    /**
     * When a payment is made PayPal will send us a response and this function is
     * called. From here we will confirm arguments that we sent to PayPal which
     * the ones PayPal is sending back to us.
     * This is the Pink Lilly of the whole operation.
     */
    public function yatra_paypal_ipn_process()
    {


        /*1. Check that $_POST['payment_status'] is "Completed"
        2. Check that $_POST['txn_id'] has not been previously processed
        3. Check that $_POST['receiver_email'] is your Primary PayPal email
        4. Check that $_POST['payment_amount'] and $_POST['payment_currency'] are correct
        /**
         * Instantiate the IPNListener class
         */
        include dirname(__FILE__) . '/php-paypal-ipn/IPNListener.php';

        $listener = new IPNListener();

        $custom = isset($_POST['custom']) ? stripslashes($_POST['custom']) : "{}";

        $custom_array = json_decode($custom, true);

        $booking_id = isset($custom_array['booking_id']) ? absint($custom_array['booking_id']) : 0;

        $payment_id = isset($custom_array['payment_id']) ? absint($custom_array['payment_id']) : 0;

        if ($booking_id < 1 || $payment_id < 1) {

            return;
        }

        $message = '';

        /**
         * Set to PayPal sandbox or live mode
         */
        $listener->use_sandbox = yatra_payment_gateway_test_mode();

        /**
         * Check if IPN was successfully processed
         */
        if ($verified = $listener->processIpn()) {

            /**
             * Log successful purchases
             */
            $transactionData = $listener->getPostData(); // POST data array


            $message = json_encode($transactionData);
            /**
             * Verify seller PayPal email with PayPal email in settings
             *
             * Check if the seller email that was processed by the IPN matches what is saved as
             * the seller email in our DB
             */
            if ($_POST['receiver_email'] != get_option('yatra_payment_gateway_paypal_email')) {
                $message .= "\nEmail seller email does not match email in settings\n";
            }

            /**
             * Verify currency
             *
             * Check if the currency that was processed by the IPN matches what is saved as
             * the currency setting
             */
            if (trim($_POST['mc_currency']) != trim(yatra_get_current_currency())) {
                $message .= "\nCurrency does not match those assigned in settings\n";
            }

            /**
             * Check if this payment was already processed
             *
             * PayPal transaction id (txn_id) is stored in the database, we check
             * that against the txn_id returned.
             */
            $txn_id = get_post_meta($payment_id, 'txn_id', true);
            if (empty($txn_id)) {
                update_post_meta($payment_id, 'txn_id', $_POST['txn_id']);
            } else {
                $message .= "\nThis payment was already processed\n";
            }

            /**
             * Verify the payment is set to "Completed".
             *
             * Create a new payment, send customer an email and empty the cart
             */

            if (!empty($_POST['payment_status']) && $_POST['payment_status'] == 'Completed') {
                // Update booking status and Payment args.

                yatra_update_payment_status($payment_id, 'publish', $_POST['mc_gross'], $txn_id);

                update_post_meta($payment_id, '_paypal_args', $_POST);

                do_action('yatra_after_successful_payment', $booking_id, $payment_id, $_POST['mc_gross'], $_POST['mc_currency'], $this->id, $message);


            } else {

                $message .= "\nPayment status not set to Completed\n";

            }

        } else {

            $message = $listener->getErrors();
            
            do_action('yatra_after_failed_payment', $booking_id, $payment_id, $this->id, $message);


        }

        yatra_save_payment_gateway_log('paypal_response', $message);

        update_post_meta($payment_id, 'yatra_payment_message', $message);
    }

}