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


    /**
     * Endpoint for requests to PayPal.
     *
     * @var string
     */
    protected $endpoint;


    public function __construct()
    {

    }


    /**
     * Get the PayPal request URL for an order.
     *
     * @param bool $sandbox Whether to use sandbox mode or not.
     * @return string
     */
    public function get_request_url($booking_id)
    {

        $args = $this->get_paypal_args($booking_id);


        $redirect_uri = esc_url(home_url('/'));

        if ($args) {

            $paypal_args = http_build_query($args, '', '&');

            $redirect_uri = esc_url(yatra_get_paypal_api_endpoint()) . '?' . $paypal_args;
        }


        return $redirect_uri;
    }

    private function get_paypal_args($booking_id)
    {
        $paypal_email = get_option('yatra_payment_gateway_paypal_email');

        $booking = new Yatra_Tour_Booking($booking_id);

        $booking_details = $booking->get_all_booking_details($booking_id);

        $yatra_booking_meta_params = isset($booking_details->yatra_booking_meta_params) ? $booking_details->yatra_booking_meta_params : array();

        $yatra_booking_metas = isset($booking_details->yatra_booking_meta) ? $booking_details->yatra_booking_meta : array();

        $currency_code = isset($yatra_booking_meta_params['currency']) ? $yatra_booking_meta_params['currency'] : yatra_get_current_currency_symbol();

        $coupon = isset($yatra_booking_meta_params['coupon']) ? $yatra_booking_meta_params['coupon'] : array();

        $cart_discount = isset($coupon['calculated_value']) ? floatval($coupon['calculated_value']) : 0;

        if (count($yatra_booking_metas) > 0) {  // Normal Payment.


            $thank_you_page_id = get_option('yatra_thankyou_page');


            $cancel_page_id = get_option('yatra_failed_transaction_page');

            $thank_you_page = 'publish' == get_post_status($thank_you_page_id) ? get_permalink($thank_you_page_id) : home_url();

            $cancel_page_url = 'publish' == get_post_status($cancel_page_id) ? get_permalink($cancel_page_id) : home_url();

            $args['cmd'] = '_cart';

            $args['upload'] = '1';

            $args['currency_code'] = sanitize_text_field($currency_code);

            $args['business'] = sanitize_email($paypal_email);
            //$args['bn'] = '';
            $args['rm'] = '2';
            $args['discount_amount_cart'] = $cart_discount;
            $args['tax_cart'] = 0;
            $args['charset'] = get_bloginfo('charset');
            $args['cbt'] = get_bloginfo('name');
            $args['return'] = add_query_arg(
                array(
                    'booking_id' => $booking_id,
                    'booked' => true,
                    'status' => 'success',
                ),
                $thank_you_page
            );
            $args['cancel'] = add_query_arg(
                array(
                    'booking_id' => $booking_id,
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

            // Cart Item.
            $agrs_index = 1;

            foreach ($yatra_booking_metas as $tour_id => $item) {

                $tour_id = $item['yatra_tour_id'];

                $item_name = isset($item['yatra_tour_name']) ? $item['yatra_tour_name'] : '';

                $trip_code = isset($yatra_booking_meta_params['booking_code']) ? $yatra_booking_meta_params['booking_code'] : '';

                $payment_amount = isset($item['total_tour_price']) ? $item['total_tour_price'] : 0;

                $args['item_name_' . $agrs_index] = $item_name;

                $args['quantity_' . $agrs_index] = 1;

                $args['amount_' . $agrs_index] = $payment_amount;

                $args['item_number_' . $agrs_index] = $tour_id;

                $args['on0_' . $agrs_index] = __('Trip Code', 'yatra');
                // $args['on1_' . $agrs_index ] = __( 'Payment Mode', 'yatra' );
                $args['on2_' . $agrs_index] = __('Trip Price', 'yatra');

                $args['os0_' . $agrs_index] = $trip_code;
                // $args['os1_' . $agrs_index ] = $payment_mode;
                $args['os2_' . $agrs_index] = $item['total_tour_price'];

                $args = apply_filters('yatra_extra_paypal_args', $args, $item, $tour_id, $agrs_index);

                $agrs_index++;
            }
        } else {
            return;
        }

        $args['option_index_0'] = $agrs_index;

        $args['custom'] = $booking_id;

        return apply_filters('yatra_paypal_args', $args);
    }

}
