<?php
/**
 * Checkout Shortcode
 *
 * Used on the checkout page, the checkout shortcode displays the checkout process.
 *
 * @package Yatra/Shortcodes/Checkout
 * @version 2.0.0
 */

defined('ABSPATH') || exit;

/**
 * Shortcode checkout class.
 */
class Yatra_Shortcode_Checkout
{

    /**
     * Get the shortcode content.
     *
     * @param array $atts Shortcode attributes.
     * @return string
     */
    public static function get($atts)
    {
        return Yatra_Shortcodes::shortcode_wrapper(array(__CLASS__, 'output'), $atts);
    }

    /**
     * Output the shortcode.
     *
     * @param array $atts Shortcode attributes.
     */
    public static function output($atts)
    {

        self::checkout();

    }


    /**
     * Show the checkout.
     */
    private static function checkout()
    {
        // Show non-cart errors.
        do_action('yatra_before_checkout_template');

        $booking_id = yatra_get_var($_GET['booking_id'], 0);

        $booking_id = absint($booking_id);

        if (yatra_user_can_modify_booking($booking_id)) {

            $booking = new Yatra_Tour_Booking($booking_id);

            $all_booking_details = $booking->get_all_booking_details($booking_id);

            $net_booking_price = (floatval($booking->get_total(true)));

            $payment = new Yatra_Payment();

            $paid = floatval($payment->get_total_paid_amount($booking_id));

            if ($net_booking_price <= $paid) {

                echo '<p>' . esc_html__('Your cart is empty. Please add any of the tour on the cart first.', 'yatra') . '</p>';

                return;
            }

            $yatra_booking_meta_params = $all_booking_details->yatra_booking_meta_params ?? array();

            $coupon = $yatra_booking_meta_params['coupon'] ?? array();

            $remaining_amount = $net_booking_price - $paid;

            echo '<div class="yatra-checkout-page-wrap">';

            yatra_get_template('myaccount/tmpl-user-checkout.php', array(

                    'remaining_amount' => $remaining_amount,
                    'currency' => $booking->get_currency_code(),
                    'booking_details' => $all_booking_details->yatra_booking_meta,
                    'booking_params' => $all_booking_details->yatra_booking_meta_params,
                    'payment' => $payment->get_all_info($booking_id, 'publish'),
                    'booking_id' => $booking_id,
                    'coupon' => $coupon

                )
            );

            echo '</div>';

        } else {

            $checkout = yatra_get_session('yatra_tour_cart');

            echo '<div class="yatra-checkout-page-wrap">';

            yatra_get_template('tmpl-checkout.php', array('checkout' => $checkout));

            echo '</div>';
        }

    }
}
