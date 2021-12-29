<?php
if (!function_exists('yatra_get_minimum_tour_pricing')) {

    function yatra_get_minimum_tour_pricing($tour_id = null)
    {
        $tour_id = is_null($tour_id) ? get_the_ID() : $tour_id;

        $yatra_tour_options = new Yatra_Tour_Options($tour_id, null, null);

        $tourData = $yatra_tour_options->getTourData();

        $pricing = $tourData->getPricing();

        $min_regular_price = 0;

        $min_sales_price = 0;

        if ($pricing instanceof Yatra_Tour_Pricing) {

            $min_regular_price = $pricing->getFinalRegularPrice();

            $min_sales_price = $pricing->getFinalPrice();

        } else {

            /* @var $single Yatra_Tour_Pricing */
            foreach ($pricing as $single) {

                $regular_price = $single->getFinalRegularPrice();

                $sales_price = $single->getFinalPrice();

                $min_pax = $single->getMinimumPax();

                if (absint($min_pax) > 0) {

                    $min_sales_price += (floatval($sales_price));

                    $min_regular_price += ($regular_price);


                }
            }

            if ($min_sales_price == 0) {

                $single_pricing_item = yatra_get_minimum_tour_pricing_instance($pricing);

                $min_regular_price = $single_pricing_item->getFinalRegularPrice();

                $min_sales_price = $single_pricing_item->getFinalPrice();

            }
        }

        return ['sales_price' => $min_sales_price, 'regular_price' => $min_regular_price];
    }

}

if (!function_exists('yatra_get_minimum_tour_pricing_instance')) {

    function yatra_get_minimum_tour_pricing_instance($pricing_array)
    {

        $min_price = 0;

        $min_pricing = null;
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

                    $min_pricing = $price;
                }
            }
        }
        return $min_pricing;

    }
}
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

if (!function_exists('yatra_update_filter_meta_minimum_tour_price')) {

    function yatra_update_filter_meta_minimum_tour_price($tour_id)
    {
        $tour_id = absint($tour_id);

        if ($tour_id < 1 || 'tour' !== get_post_type($tour_id)) {
            return;
        }
        $tour_pricing = yatra_get_minimum_tour_pricing($tour_id);

        $minimum_price = 0;

        if (floatval($tour_pricing['sales_price']) < 1) {

            $minimum_price = 0;

        } else {

            $minimum_price = $tour_pricing['sales_price'];
        }

        update_post_meta($tour_id, 'yatra_filter_meta_minimum_tour_price', $minimum_price);

    }
}
