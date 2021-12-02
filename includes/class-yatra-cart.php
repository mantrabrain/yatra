<?php
if (!class_exists('Yatra_Cart')) {

    class Yatra_Cart
    {

        function __construct()
        {

            add_action('init', array($this, 'remove_cart'));
            add_action('init', array($this, 'remove_coupon'));
            add_filter('yatra_booking_final_price', array($this, 'final_price'), 10, 3);
            add_filter('yatra_after_update_tour_cart', array($this, 'refresh_cart_coupon'));

        }

        public function remove_cart()
        {
            if (isset($_GET['yatra_cart_remove_item']) && !empty($_GET['yatra_cart_remove_item']) && isset($_GET['yatra_cart_remove_nonce'])) {

                $this->remove_cart_item();
            }
        }

        public function remove_coupon()
        {
            if (isset($_GET['yatra_coupon_remove_nonce']) && !empty($_GET['yatra_coupon_remove_nonce'])) {

                $nonce = sanitize_text_field($_GET['yatra_coupon_remove_nonce']);

                $status = wp_verify_nonce($nonce, 'yatra_coupon_remove');

                if ($status) {

                    $cart = $this->get_cart();

                    $cart['coupon'] = array();

                    $this->set_cart($cart);

                    wp_redirect(yatra_get_cart_page(true));

                }
            }
        }

        public function get_cart()
        {
            return yatra_get_session('yatra_tour_cart');

        }

        public function set_cart($cart_details)
        {
            return yatra_set_session('yatra_tour_cart', $cart_details);

        }

        public function final_price($final_price, $booking_params, $net_price)
        {
            if ($net_price) {

                $coupon = $this->get_coupon();

                $coupon_value = isset($coupon['calculated_value']) ? floatval($coupon['calculated_value']) : 0;

                return floatval($final_price) > $coupon_value ? floatval($final_price) - $coupon_value : 0;

            }
            return $final_price;
        }

        public function get_cart_total($net_total = false)
        {
            $cart = $this->get_cart();

            $cart_items = isset($cart['items']) ? $cart['items'] : array();

            $cart_parameters = array();

            foreach ($cart_items as $tour_id => $item) {
                array_push($cart_parameters, array(
                    'tour_id' => $tour_id,
                    'selected_date' => $cart_items[$tour_id]['selected_date'],
                    'number_of_person' => $cart_items[$tour_id]['number_of_person']
                ));
            }

            return yatra_get_booking_final_price($cart_parameters, $net_total);
        }

        public function get_items()
        {
            $cart = $this->get_cart();

            return isset($cart['items']) ? $cart['items'] : array();
        }

        public function update_items($items = array())
        {
            $cart = $this->get_cart();

            if (count($items) < 1) {

                yatra_clear_session('yatra_tour_cart');

            } else {
                $cart['items'] = $items;

                $this->set_cart($cart);
            }
        }

        public function apply_coupon($coupon_details, $validation_status)
        {
            $yatra_tour_cart = $this->get_cart();

            $value = isset($coupon_details['value']) ? $coupon_details['value'] : '';

            $type = isset($coupon_details['type']) ? $coupon_details['type'] : '';

            $coupon = isset($coupon_details['code']) ? $coupon_details['code'] : '';

            if ($value === '' || $type === '' || $value === 0 || $coupon === '' || !$validation_status) {

                $yatra_tour_cart['coupon'] = array();

                $this->set_cart($yatra_tour_cart);

                return false;
            }

            $calculated_value = 0;

            $total = $this->get_cart_total();
            
            if ($type === "percentage") {

                $calculated_value = floatval($total) > 0 ? ($total * $value) / 100 : 0;

            } elseif ($type === "fixed") {

                $calculated_value = $value;

            }

            $coupon_details['calculated_value'] = floatval($calculated_value) <= floatval($total) ? floatval($calculated_value) : floatval($total);

            $yatra_tour_cart['coupon'] = $coupon_details;

            return $this->set_cart($yatra_tour_cart);

        }

        public function get_coupon()
        {
            $this->refresh_cart_coupon(true);

            $yatra_tour_cart = $this->get_cart();

            return isset($yatra_tour_cart['coupon']) ? $yatra_tour_cart['coupon'] : array();
        }

        public function refresh_cart_coupon($status)
        {
            $yatra_tour_cart = $this->get_cart();

            if (isset($yatra_tour_cart['coupon'])) {

                $coupon = $yatra_tour_cart['coupon'];

                $coupon_code = isset($coupon['code']) ? $coupon['code'] : '';

                if ('' != $coupon_code) {

                    $yatra_coupon = new Yatra_Core_Coupon($coupon_code);

                    $yatra_coupon->apply();
                }

            }

            return $status;
        }

        public function update_cart($tour_id, $number_of_persons, $type, $selected_date)
        {
            $yatra_tour_cart = $this->get_cart();

            $tour = get_post($tour_id);

            $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);

            $yatra_multiple_pricing = is_array($yatra_multiple_pricing) ? $yatra_multiple_pricing : array();

            $single_cart_item = array(

                'tour' => $tour,

                'number_of_person' => $number_of_persons,

                'tour_final_price' => yatra_get_final_tour_price($tour_id, $number_of_persons, $selected_date),

                'pricing_type' => $type,

                'multiple_pricing' => $yatra_multiple_pricing,

                'selected_date' => $selected_date,

            );
            $yatra_tour_cart['items'][$tour_id] = $single_cart_item;

            $unset_this = false;

            if ($type == "single") {

                if ($number_of_persons < 1) {

                    $unset_this = true;
                }
            } else if ($type == "multi") {

                $sum = 0;

                if (is_array($number_of_persons)) {

                    $sum = array_sum(array_values($number_of_persons));
                }
                if ($sum < 1) {

                    $unset_this = true;
                }
            }

            if ($unset_this) {

                unset($yatra_tour_cart['items'][$tour_id]);

            }

            $yatra_tour_cart = apply_filters('yatra_update_tour_cart', $yatra_tour_cart, $tour_id, $number_of_persons);

            $status = $this->set_cart($yatra_tour_cart);

            $status = apply_filters('yatra_after_update_tour_cart', $status);


            return $status;
        }

        public function is_valid_tour_id_on_cart($tour_id)
        {
            $cart_items = $this->get_items();

            if (isset($cart_items[$tour_id])) {

                return true;
            }
            return false;
        }

        public function is_valid_id_hash($hash)
        {
            $yatra_tour_cart = $this->get_items();

            if (count($yatra_tour_cart) < 1) {
                return false;
            }

            $array_keys = array_keys($yatra_tour_cart);

            $tour_id = false;

            foreach ($array_keys as $key) {

                if ($hash == md5($key)) {
                    $tour_id = $key;
                    break;
                }
            }

            return $tour_id;
        }

        public function get_cart_table($return = false, $cart_data = array())
        {

            if (count($cart_data) < 1) {

                $cart_data = $this->get_cart();
            }
            $cart_items = isset($cart_data['items']) ? $cart_data['items'] : array();
            $coupon = isset($cart_data['coupon']) ? $cart_data['coupon'] : array();

            ob_start();

            yatra_get_template('tmpl-cart-table.php', array(
                    'cart_items' => $cart_items,
                    'coupon' => $coupon
                )
            );

            $content = ob_get_clean();

            if ($return) {

                return $content;
            }
            echo $content;

        }

        public function remove_cart_item($cart_item_hash = '')
        {
            $remove_item = isset($_GET['yatra_cart_remove_item']) ? $_GET['yatra_cart_remove_item'] : '';

            $nonce = isset($_GET['yatra_cart_remove_nonce']) ? $_GET['yatra_cart_remove_nonce'] : '';

            if (!empty($remove_item) && !empty($nonce)) {


                $status = wp_verify_nonce($nonce, 'yatra_cart_remove_tour_item');

                $tour_id = $this->is_valid_id_hash($remove_item);

                if ($status && absint($tour_id) > 0) {

                    $cart_items = $this->get_items();

                    if (isset($cart_items[$tour_id])) {

                        unset($cart_items[$tour_id]);

                        $this->update_items($cart_items);
                    }

                    $this->refresh_cart_coupon(true);

                    wp_redirect(yatra_get_cart_page(true));
                    exit;
                }

            }


        }

        public function get_cart_order_table($return = false, $cart = array())
        {
            if (count($cart) < 1) {
                $cart = $this->get_cart();
            }
            $cart_items = isset($cart['items']) ? $cart['items'] : array();

            $coupon = isset($cart['coupon']) ? $cart['coupon'] : array();

            ob_start();

            yatra_get_template('tmpl-order-table.php', array(
                    'cart_items' => $cart_items,
                    'coupon' => $coupon
                )
            );

            $content = ob_get_clean();

            if ($return) {

                return $content;
            }
            echo $content;


        }

    }

}