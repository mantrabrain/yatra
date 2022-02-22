<?php
/**
 * Class Yatra_Gateway_Paypal_Request file.
 *
 * @package Yatra\Gateways
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Generates requests to send to PayPal.
 */
class Yatra_Gateway_Paypal_Request
{

    public function get_request_url($booking_id, $payment_id)
    {

        $args = $this->get_paypal_args($booking_id, $payment_id);

        $redirect_uri = esc_url(home_url('/'));

        if ($args) {

            $paypal_args = http_build_query($args, '', '&');

            $redirect_uri = esc_url(yatra_get_paypal_api_endpoint()) . '?' . $paypal_args;
        }


        return $redirect_uri;
    }

    protected function limit_length($string, $limit = 127)
    {
        $str_limit = $limit - 3;
        if (function_exists('mb_strimwidth')) {
            if (mb_strlen($string) > $limit) {
                $string = mb_strimwidth($string, 0, $str_limit) . '...';
            }
        } else {
            if (strlen($string) > $limit) {
                $string = substr($string, 0, $str_limit) . '...';
            }
        }
        return $string;
    }

    private function get_paypal_args($booking_id, $payment_id)
    {
        $paypal_email = get_option('yatra_payment_gateway_paypal_email');

        if ('' == $paypal_email || empty($paypal_email)) {
            wp_die(
                new WP_Error(
                    'yatra_payment_gateway_error',
                    __('Empty paypal email address.', 'yatra')
                )
            );
        }

        $booking = new Yatra_Tour_Booking($booking_id);

        $payment = new Yatra_Payment();

        $booking_details = $booking->get_all_booking_details($booking_id);

        $yatra_booking_metas = isset($booking_details->yatra_booking_meta) ? $booking_details->yatra_booking_meta : array();

        $yatra_booking_meta_params = isset($booking_details->yatra_booking_meta_params) ? $booking_details->yatra_booking_meta_params : array();

        $coupon = isset($yatra_booking_meta_params['coupon']) ? $yatra_booking_meta_params['coupon'] : array();

        $currency_code = $booking->get_currency_code();

        $amount = $payment->get_payable_amount($payment_id);

        $thank_you_page_id = get_option('yatra_thankyou_page');

        $cancel_page_id = get_option('yatra_failed_transaction_page');

        $thank_you_page = 'publish' == get_post_status($thank_you_page_id) ? get_permalink($thank_you_page_id) : home_url();

        $cancel_page_url = 'publish' == get_post_status($cancel_page_id) ? get_permalink($cancel_page_id) : home_url();

        $discount_amount = isset($coupon['calculated_value']) ? floatval($coupon['calculated_value']) : 0;

        $payment_type = $payment->get_payment_type($payment_id);

        if (count($yatra_booking_metas) > 0) {  // Normal Payment.

            $args['cmd'] = '_cart';
            $args['upload'] = '1';
            $args['currency_code'] = $currency_code;
            $args['business'] = $paypal_email;
            $args['bn'] = '';
            $args['rm'] = '2';
            $args['discount_amount_cart'] = 0;
            $args['tax_cart'] = 0;
            $args['charset'] = get_bloginfo('charset');
            $args['cbt'] = get_bloginfo('name');
            $args['return'] = add_query_arg(
                array(
                    'booking_id' => $booking_id,
                    'payment_id' => $payment_id,
                    'booked' => true,
                    'status' => 'success',
                ),
                $thank_you_page
            );
            $args['cancel'] = add_query_arg(
                array(
                    'booking_id' => $booking_id,
                    'payment_id' => $payment_id,
                    'booked' => true,
                    'status' => 'cancel',
                ),
                $cancel_page_url
            );
            $args['handling'] = 0;
            $args['handling_cart'] = 0;
            $args['no_shipping'] = 0;
            $args['notify_url'] = esc_url(add_query_arg(
                    array(
                        'yatra_listener' => 'IPN'
                    ), home_url('index.php')
                )
            );

            if ($payment_type === 'partial') {

                // Cart Item.
                $args_index = 1;

                $args['item_name_' . $args_index] = 'Partial Payment for Booking #' . $booking_id;

                $args['quantity_' . $args_index] = 1;

                $args['amount_' . $args_index] = sanitize_text_field(wp_unslash($amount));

                $args['item_number_' . $args_index] = $booking_id;

            } else {
                $args['amount'] = $amount;
                $args['discount_amount_cart'] = $discount_amount;

                $args_index = 1;
                // Add cart items to paypal args.
                foreach ($yatra_booking_metas as $tour_id => $item) {

                    $tour_id = $item['yatra_tour_id'];

                    $item_name = isset($item['yatra_tour_name']) ? $item['yatra_tour_name'] : '';

                    $payment_amount = isset($item['total_tour_final_price']) ? $item['total_tour_final_price'] : 0;

                    $args['item_name_' . $args_index] = $this->limit_length($item_name, 127);

                    $args['quantity_' . $args_index] = 1;

                    $args['amount_' . $args_index] = $payment_amount;

                    $args['item_number_' . $args_index] = $tour_id;

                    $args['on2_' . $args_index] = __('Total Price', 'yatra');

                    $args['os2_' . $args_index] = $amount;

                    $args_index++;
                }
            }
        } else {
            wp_die(
                new WP_Error(
                    'yatra_payment_gateway_error',
                    __('Cart is empty.', 'yatra')
                )
            );
        }

        $args['option_index_0'] = $args_index;

        $args['custom'] = json_encode(array('booking_id' => $booking_id, 'payment_id' => $payment_id));

        $message = json_encode($args);

        yatra_save_payment_gateway_log('paypal_request', $message);

        return apply_filters('yatra_paypal_args', $args);
    }
}
