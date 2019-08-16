<?php

if (!function_exists('yatra_get_paypal_api_endpoint')) {

    function yatra_get_paypal_api_endpoint($ssl_check = false)
    {
        if (is_ssl() || !$ssl_check) {

            $protocol = 'https://';
        } else {
            $protocol = 'http://';
        }

        if (yatra_payment_gateway_test_mode()) {

            $paypal_uri = $protocol . 'sandbox.paypal.com/cgi-bin/webscr';
        } else {
            $paypal_uri = $protocol . 'paypal.com/cgi-bin/webscr';
        }

        return $paypal_uri;
    }
}