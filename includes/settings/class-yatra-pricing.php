<?php

include_once "pricing/class-yatra-tour-pricing-interface.php";
include_once "pricing/class-yatra-tour-pricing-abstract.php";
include_once "pricing/class-yatra-tour-pricing.php";


class Yatra_Pricing
{
    private $tourID;

    private $pricing_array = array();

    public function __construct($tourID = null)
    {
        $this->tourID = $tourID;

        if (absint($this->tourID) > 0) {

            $this->pricing_array = $this->getPricing($tourID);

            $yatra_tour_pricing = new Yatra_Tour_Pricing();

            $base_pricing_type = yatra_get_pricing_type($tourID);
            
            if ($base_pricing_type === "single") {

                return $yatra_tour_pricing->map($this->pricing_array, $base_pricing_type);
            } else {

                $pricing_instance = array();

                foreach ($this->pricing_array as $pricing_id => $pricing) {

                    $pricing_instance[] = $yatra_tour_pricing->map($pricing, $base_pricing_type, $pricing_id);
                }
                return $pricing_instance;
            }
        }
    }


    public function getDateWisePricing($pricing_array = array(), $tour_id, $pricing_type)
    {
        $base_pricing_type = yatra_get_pricing_type($tour_id);

        if ($base_pricing_type !== $pricing_type) {

            $this->pricing_array = $this->getPricing($tour_id);
        } else {
            if (count($pricing_array) > 0) {

                if ($pricing_type === "multi") {

                    $this->pricing_array = $this->getMultiplePricing($pricing_array, null, true);
                } else {

                    $this->pricing_array = $this->getSinglePricing($pricing_array, null);
                }
            }
        }
        $yatra_tour_pricing = new Yatra_Tour_Pricing();

        if ($base_pricing_type === "single") {

            return $yatra_tour_pricing->map($this->pricing_array, $base_pricing_type);
        } else {

            $pricing_instance = array();

            foreach ($this->pricing_array as $pricing_id => $pricing) {

                $pricing_instance[] = $yatra_tour_pricing->map($pricing, $base_pricing_type, $pricing_id);
            }
            return $pricing_instance;
        }

    }

    private function getPricing($tourID)
    {
        $base_pricing = $this->getBasePricing();

        $multiple_pricing_array = $this->getMultiplePricing($base_pricing, null);

        if (yatra_get_pricing_type($tourID) === "multi") {

            return $multiple_pricing_array;

        }


        return $this->getSinglePricing($base_pricing);
    }

    private function getBasePricing()
    {
        $pricing = array();
        $pricing['regular_price'] = get_post_meta($this->tourID, 'yatra_tour_meta_regular_price', true);
        $pricing['sales_price'] = get_post_meta($this->tourID, 'yatra_tour_meta_sales_price', true);
        $pricing['pricing_label'] = sanitize_text_field(get_post_meta($this->tourID, 'yatra_tour_meta_pricing_label', true));
        $pricing['pricing_description'] = sanitize_text_field(get_post_meta($this->tourID, 'yatra_tour_meta_pricing_description', true));
        $pricing['pricing_per'] = get_post_meta($this->tourID, 'yatra_tour_meta_price_per', true);
        $pricing['group_size'] = get_post_meta($this->tourID, 'yatra_tour_meta_group_size', true);
        $pricing['minimum_pax'] = get_post_meta($this->tourID, 'yatra_tour_minimum_pax', true);
        $pricing['maximum_pax'] = get_post_meta($this->tourID, 'yatra_tour_maximum_pax', true);

        return $pricing;
    }

    private function getMultiplePricing($base_pricing, $number_of_people = null, $is_pricing_from_date = false)
    {
        $multiple_pricing = $is_pricing_from_date ? $base_pricing : get_post_meta($this->tourID, 'yatra_multiple_pricing', true);

        $final_pricing_details = array();
        if (is_array($multiple_pricing)) {
            if (count($multiple_pricing) > 0) {
                foreach ($multiple_pricing as $pricing_id => $pricing) {
                    $variable_group_size = $pricing['pricing_per'] === '' && !$is_pricing_from_date ? $base_pricing['group_size'] : $pricing['group_size'];
                    $variable_pricing_per = $pricing['pricing_per'] === '' && !$is_pricing_from_date ? $base_pricing['pricing_per'] : $pricing['pricing_per'];
                    $variable_minimum_pax = $pricing['minimum_pax'] === '' && !$is_pricing_from_date ? $base_pricing['minimum_pax'] : $pricing['minimum_pax'];
                    $variable_maximum_pax = $pricing['maximum_pax'] === '' && !$is_pricing_from_date ? $base_pricing['maximum_pax'] : $pricing['maximum_pax'];
                    $regular_price = $pricing['regular_price'];
                    $sales_price = $pricing['sales_price'];
                    $final_price = '' != $sales_price ? $sales_price : $regular_price;
                    $person_count = '' != $variable_minimum_pax ? absint($variable_minimum_pax) : 1;
                    $person_count = is_array($number_of_people) && isset($number_of_people[$pricing_id]) ? absint($number_of_people[$pricing_id]) : $person_count;
                    $number_of_person = $person_count;
                    $person_count = $variable_pricing_per == 'person' ? $person_count : ceil($person_count / $variable_group_size);
                    $final_pricing_details[$pricing_id] = array(
                        'pricing_label' => $pricing['pricing_label'],
                        'pricing_description' => $pricing['pricing_description'],
                        'minimum_pax' => $variable_minimum_pax,
                        'maximum_pax' => $variable_maximum_pax,
                        'pricing_per' => $variable_pricing_per,
                        'group_size' => $variable_group_size,
                        'number_of_person' => $number_of_person,
                        'regular_price' => $regular_price * $person_count,
                        'sales_price' => $sales_price,
                        'final_price' => $final_price * $person_count

                    );
                }
            }
        }
        return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);

    }

    private function getSinglePricing($base_pricing, $number_of_people = null)
    {
        $regular_price = $base_pricing['regular_price'];
        $sales_price = $base_pricing['sales_price'];
        $final_price = '' != $sales_price ? $sales_price : $regular_price;
        $person_count = '' != $base_pricing['minimum_pax'] ? absint($base_pricing['minimum_pax']) : 1;
        $person_count = !is_array($number_of_people) && !is_null($number_of_people) ? absint($number_of_people) : $person_count;
        $number_of_person = $person_count;
        $person_count = $base_pricing['pricing_per'] == 'person' ? $person_count : ceil($person_count / $base_pricing['group_size']);
        $final_pricing_details = array(
            'pricing_label' => $base_pricing['pricing_label'],
            'pricing_description' => $base_pricing['pricing_description'],
            'minimum_pax' => $base_pricing['minimum_pax'],
            'maximum_pax' => $base_pricing['maximum_pax'],
            'pricing_per' => $base_pricing['pricing_per'],
            'group_size' => $base_pricing['group_size'],
            'number_of_person' => $number_of_person,
            'regular_price' => $regular_price * $person_count,
            'sales_price' => $sales_price,
            'final_price' => $final_price * $person_count
        );
        return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);
    }

}