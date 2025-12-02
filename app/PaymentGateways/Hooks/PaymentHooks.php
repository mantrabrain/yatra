<?php
/**
 * Payment Hooks
 * 
 * @package Yatra\PaymentGateways\Hooks
 * @since 2.0.0
 */

namespace Yatra\PaymentGateways\Hooks;

defined('ABSPATH') || exit;

/**
 * Payment Hooks class.
 */
class PaymentHooks {

    /**
     * Initialize hooks
     */
    public static function init() {
        // Action hooks
        add_action('yatra_before_payment_processing', [__CLASS__, 'before_payment_processing'], 10, 3);
        add_action('yatra_after_payment_processing', [__CLASS__, 'after_payment_processing'], 10, 3);
        add_action('yatra_payment_success', [__CLASS__, 'payment_success'], 10, 3);
        add_action('yatra_payment_failed', [__CLASS__, 'payment_failed'], 10, 3);
        add_action('yatra_payment_processing', [__CLASS__, 'payment_processing'], 10, 3);

        // Filter hooks
        add_filter('yatra_payment_gateways', [__CLASS__, 'register_gateways'], 10, 1);
        add_filter('yatra_payment_parameters', [__CLASS__, 'filter_payment_parameters'], 10, 3);
        add_filter('yatra_payment_redirect_url', [__CLASS__, 'filter_redirect_url'], 10, 3);
        add_filter('yatra_payment_confirmation_message', [__CLASS__, 'filter_confirmation_message'], 10, 3);
    }

    /**
     * Before payment processing hook
     */
    public static function before_payment_processing($gateway_id, $payment_data, $booking_id) {
        do_action('yatra_before_payment_processing', $gateway_id, $payment_data, $booking_id);
    }

    /**
     * After payment processing hook
     */
    public static function after_payment_processing($gateway_id, $result, $booking_id) {
        do_action('yatra_after_payment_processing', $gateway_id, $result, $booking_id);
    }

    /**
     * Payment success hook
     */
    public static function payment_success($gateway_id, $payment_data, $booking_id) {
        do_action('yatra_payment_success', $gateway_id, $payment_data, $booking_id);
    }

    /**
     * Payment failed hook
     */
    public static function payment_failed($gateway_id, $payment_data, $booking_id) {
        do_action('yatra_payment_failed', $gateway_id, $payment_data, $booking_id);
    }

    /**
     * Payment processing hook
     */
    public static function payment_processing($gateway_id, $payment_data, $booking_id) {
        do_action('yatra_payment_processing', $gateway_id, $payment_data, $booking_id);
    }

    /**
     * Register payment gateways
     */
    public static function register_gateways($gateways) {
        return apply_filters('yatra_payment_gateways', $gateways);
    }

    /**
     * Filter payment parameters
     */
    public static function filter_payment_parameters($params, $gateway_id, $booking_id) {
        return apply_filters('yatra_payment_parameters', $params, $gateway_id, $booking_id);
    }

    /**
     * Filter redirect URL
     */
    public static function filter_redirect_url($url, $gateway_id, $booking_id) {
        return apply_filters('yatra_payment_redirect_url', $url, $gateway_id, $booking_id);
    }

    /**
     * Filter confirmation message
     */
    public static function filter_confirmation_message($message, $gateway_id, $booking_id) {
        return apply_filters('yatra_payment_confirmation_message', $message, $gateway_id, $booking_id);
    }
}

// Initialize payment hooks
PaymentHooks::init();
