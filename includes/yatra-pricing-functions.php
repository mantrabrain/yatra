<?php
if (!function_exists('yatra_get_minimum_tour_price')) {
    function yatra_get_minimum_tour_price($pricing_array = array())
    {
        $min_price = 0;
        /**
         * @var $price Yatra_Tour_Pricing
         */
        foreach ($pricing_array as $price) {

            if ($price instanceof Yatra_Tour_Pricing) {

                $regular_price = $price->getRegularPrice();

                $sales_price = $price->getSalesPrice();

                $final_price = $sales_price === '' ? $regular_price : $sales_price;

                if ($min_price > $final_price || $min_price == 0) {

                    $min_price = $final_price;
                }
            }
        }
        return $min_price;


    }
}
if (!function_exists('yatra_get_maximum_tour_price')) {
    function yatra_get_maximum_tour_price($pricing_array = array())
    {

        $max_price = 0;
        /**
         * @var $price Yatra_Tour_Pricing
         */
        foreach ($pricing_array as $price) {

            if ($price instanceof Yatra_Tour_Pricing) {
                $regular_price = $price->getRegularPrice();

                $sales_price = $price->getSalesPrice();

                $final_price = $sales_price === '' ? $regular_price : $sales_price;

                if ($max_price < $final_price) {
                    $max_price = $final_price;
                }
            }
        }
        return $max_price;
    }
}