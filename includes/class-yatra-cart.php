<?php
if (!class_exists('Yatra_Cart')) {

    class Yatra_Cart
    {


        function __construct()
        {

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

                'number_of_person' => $number_of_person
            );
            $yatra_tour_cart[$tour_id] = $single_cart_item;

            $status = yatra_set_session('yatra_tour_cart', $yatra_tour_cart);

            return $status;
        }
    }

}