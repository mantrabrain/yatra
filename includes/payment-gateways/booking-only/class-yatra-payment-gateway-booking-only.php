<?php

class Yatra_Payment_Gateway_Booking_Only extends Yatra_Payment_Gateways
{
    protected $id = 'booking_only';

    public function __construct()
    {

        $configuration = array(

            'settings' => array(
                'title' => __('Book Now Pay Later', 'yatra'),
                'default' => 'yes',
                'id' => $this->id,
                'frontend_title' => get_option('yatra_payment_gateway_booking_only_label_on_checkout', __('Book Now Pay Later', 'yatra')),

            ),
        );


        add_action('yatra_payment_checkout_payment_gateway_booking_only', array($this, 'process_payment'));


        parent::__construct($configuration);


    }

    public function admin_setting_tab()
    {
        $settings =

            array(
                array(
                    'title' => __('Book Now Pay Later Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_payment_gateways_booking_only_options',
                ),
                array(
                    'title' => __('Label on checkout', 'yatra'),
                    'desc' => __('Label on checkout', 'yatra'),
                    'id' => 'yatra_payment_gateway_booking_only_label_on_checkout',
                    'type' => 'text',
                    'default' => __('Book Now Pay Later', 'yatra')
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_payment_gateways_booking_only_options',
                ),

            );


        return $settings;
    }

    public function process_payment($booking_id, $payment_id)
    {

        $payment_id = get_post_meta($booking_id, 'yatra_payment_id', true);

        $booking = get_post($booking_id);

        $booking_status = isset($booking->post_status) ? $booking->post_status : '';

        if ($booking_status == 'yatra-completed' || empty($booking_status) || !empty($txn_id) || !empty($payment_id)) {

            return;
        }
        yatra_update_booking_status($booking_id, 'yatra-processing');

        do_action('yatra_before_payment_process', $booking_id);


        do_action('yatra_after_payment_process', $booking_id);


    }


}