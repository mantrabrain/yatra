<?php
if (!function_exists('yatra_get_payment_gateways')) {
    function yatra_get_payment_gateways()
    {
        return apply_filters('yatra_payment_gateways', array());
    }
}

if (!function_exists('yatra_get_active_payment_gateways')) {

    function yatra_get_active_payment_gateways()
    {
        $yatra_payment_gateways = get_option('yatra_payment_gateways', array());

        return array_keys($yatra_payment_gateways);
    }
}

function yatra_payment_gateway_test_mode()
{

    $is_test_mode = get_option('yatra_payment_gateway_test_mode');

    if ($is_test_mode == 'yes') {
        return true;
    }
    return false;
}

function yatra_update_payment_status($payment_id, $status, $paid_amount)
{
    if (!$payment_id || $payment_id < 1) {
        return;
    }

    do_action('yatra_before_update_payment_status', $payment_id, $status, $paid_amount);

    $payment = new Yatra_Payment();

    $payment->update_paid_amount($payment_id, $paid_amount);

    $payment->update_status($payment_id, $status);

    $net_due_amount = $payment->get_net_due_amount($payment_id);

    $booking_id = $payment->get_booking_id($payment_id);

    if ($net_due_amount > 0) {

        yatra_update_booking_status($booking_id, 'yatra-processing');

    } else {

        yatra_update_booking_status($booking_id, 'yatra-completed');
    }

    do_action('yatra_after_update_payment_status', $payment_id, $status, $paid_amount);

}


