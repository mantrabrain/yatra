<?php
if (!class_exists('Yatra_Payment_Gateways_Core')) {

    final class Yatra_Payment_Gateways_Core
    {
        private static $instance;

        public static function instance()
        {
            if (empty(self::$instance)) {

                self::$instance = new self;
            }
            return self::$instance;
        }

        public function init()
        {
            $this->includes();

            $this->register();
        }

        public function includes()
        {
            include_once YATRA_ABSPATH . 'includes/payment-gateways/function-yatra-payments.php';

            // Include PayPal Payment gateways
            include_once YATRA_ABSPATH . 'includes/payment-gateways/paypal/class-yatra-payment-gateway-paypal.php';
            include_once YATRA_ABSPATH . 'includes/payment-gateways/booking-only/class-yatra-payment-gateway-booking-only.php';

        }

        public function register()
        {
            $payment_gateways = apply_filters('yatra_registered_payment_gateways', array(

                'Yatra_Payment_Gateway_Booking_Only',
                'Yatra_Payment_Gateway_PayPal'
            ));

            foreach ($payment_gateways as $gateway) {

                if (class_exists($gateway)) {

                    new $gateway;
                }
            }

        }


    }

}
Yatra_Payment_Gateways_Core::instance()->init();