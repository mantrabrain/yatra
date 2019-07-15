<?php
if (!class_exists('Yatra_Cart')) {

    class Yatra_Cart
    {


        function __construct()
        {

            add_action('init', array($this, 'remove_cart'));

        }

        public function remove_cart()
        {
            if (isset($_GET['yatra_cart_remove_item']) && !empty($_GET['yatra_cart_remove_item']) && isset($_GET['yatra_cart_remove_nonce'])) {

                $this->remove_cart_item();
            }
        }

        public function get_cart()
        {
            $yatra_tour_cart = yatra_get_session('yatra_tour_cart');


            return $yatra_tour_cart;
        }

        public function update_cart($tour_id, $number_of_person)
        {
            $yatra_tour_cart = yatra_get_session('yatra_tour_cart');

            $tour = get_post($tour_id);

            $single_cart_item = array(

                'tour' => $tour,

                'number_of_person' => $number_of_person,

                'tour_final_price' => yatra_get_final_tour_price($tour_id, $number_of_person)
            );
            $yatra_tour_cart[$tour_id] = $single_cart_item;

            if ($number_of_person < 1) {

                unset($yatra_tour_cart[$tour_id]);

            }

            $status = yatra_set_session('yatra_tour_cart', $yatra_tour_cart);

            return $status;
        }

        public function is_valid_tour_id_on_cart($tour_id)
        {
            $yatra_tour_cart = yatra_get_session('yatra_tour_cart');

            if (isset($yatra_tour_cart[$tour_id])) {

                return true;
            }
            return false;
        }

        public function is_valid_id_hash($hash)
        {
            $yatra_tour_cart = yatra_get_session('yatra_tour_cart');

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

        public function get_cart_table($return = false, $cart_items = array())
        {

            if (count($cart_items) < 1) {

                $cart_items = $this->get_cart();
            }

            ob_start();

            yatra_get_template('tmpl-cart-table.php', array('cart_items' => $cart_items));

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


                    $yatra_tour_cart = yatra_get_session('yatra_tour_cart');

                    if (isset($yatra_tour_cart[$tour_id])) {

                        unset($yatra_tour_cart[$tour_id]);

                        if (count($yatra_tour_cart) > 0) {

                            yatra_set_session('yatra_tour_cart', $yatra_tour_cart);

                        } else {


                            yatra_clear_session('yatra_tour_cart');
                        }
                    }


                    wp_redirect(yatra_get_cart_page(true));
                    exit;
                }

            }


        }

        public function get_cart_order_table($return = false, $cart_items = array())
        {
            if (count($cart_items) < 1) {
                $cart_items = $this->get_cart();
            }
            ob_start();
            yatra_get_template('tmpl-order-table.php', array('cart_items' => $cart_items));

            $content = ob_get_clean();

            if ($return) {

                return $content;
            }
            echo $content;


        }

    }

}