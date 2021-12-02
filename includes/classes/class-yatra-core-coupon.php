<?php

class Yatra_Core_Coupon
{
    private $coupon_id = null;

    public function __construct($coupon_code = null)
    {
        $args = array(
            'numberposts' => 1,
            'post_type' => 'yatra-coupons',
            'meta_query' => array(
                array(
                    'key' => 'yatra_coupon_code',
                    'value' => sanitize_text_field($coupon_code),
                    'compare' => '=',
                )
            )
        );
        $coupons = get_posts($args);

        $coupon_id = isset($coupons[0]) ? @absint($coupons[0]->ID) : null;


        if (absint($coupon_id) > 0) {

            $coupon_code_meta = get_post_meta($coupon_id, 'yatra_coupon_code', true);

            if ($coupon_code_meta === $coupon_code) {

                $this->coupon_id = $coupon_id;
            }
        }

    }

    public function is_valid_coupon()
    {
        $response = array(
            'status' => false,
            'message' => __('Invalid coupon code', 'yatra')
        );

        if (absint($this->coupon_id) > 0) {

            if ($this->is_coupon_expired($this->coupon_id)) {

                return array(
                    'status' => false,
                    'message' => __('Coupon already expired', 'yatra')
                );
            }
            if ($this->is_usage_limit_crossed($this->coupon_id)) {

                return array(
                    'status' => false,
                    'message' => __('Maximum usage limit crossed for this coupon.', 'yatra')
                );
            }
            return array(
                'status' => true,
                'message' => __('Valid Coupon', 'yatra')
            );

        }
        return $response;
    }

    private function is_usage_limit_crossed($coupon_id)
    {
        $usage_limit = get_post_meta($coupon_id, 'yatra_coupon_using_limit', true);

        if ($usage_limit === '') {

            return false;
        }
        $usage_limit = absint($usage_limit);

        $booking_ids = get_post_meta($coupon_id, 'yatra_coupon_usages_bookings', true);

        $booking_ids = is_array($booking_ids) ? $booking_ids : array();

        $total_coupon_usages = count($booking_ids);

        if ($usage_limit > $total_coupon_usages) {

            return false;
        }

        return true;

    }

    private function is_coupon_expired($coupon_id)
    {
        $expire_date = get_post_meta($coupon_id, 'yatra_coupon_expiry_date', true);

        if ($expire_date != '') {

            if (strtotime(date('Y-m-d H:i:s')) > strtotime($expire_date)) {

                return true;
            }
        }
        return false;
    }

    public function get_coupon_details()
    {
        $coupon_details = array(

            'id' => $this->coupon_id,

            'code' => get_post_meta($this->coupon_id, 'yatra_coupon_code', true),

            'is_expired' => $this->is_coupon_expired($this->coupon_id),

            'is_usage_limit_crossed' => $this->is_usage_limit_crossed($this->coupon_id),

            'type' => get_post_meta($this->coupon_id, 'yatra_coupon_type', true),

            'value' => get_post_meta($this->coupon_id, 'yatra_coupon_value', true)
        );
        return $coupon_details;
    }

    public function apply()
    {
        $coupon_validation = $this->is_valid_coupon();

        $status = yatra()->cart->apply_coupon($this->get_coupon_details(), $coupon_validation['status']);

        if ($status) {

            return array('status' => true, 'message' => __('Coupon applied successfully', 'yatra'));
        }
        return $coupon_validation;
    }
}