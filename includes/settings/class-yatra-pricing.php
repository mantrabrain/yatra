<?php
if (!defined('ABSPATH')) {
    exit;
}
include_once "pricing/class-yatra-tour-pricing-interface.php";
include_once "pricing/class-yatra-tour-pricing-abstract.php";
include_once "pricing/class-yatra-tour-pricing.php";


class Yatra_Pricing
{
    public function getDateWisePricing($tour_id, $pricing_type, $number_of_people = null, $datewise_pricing_array = array())
    {

        $base_pricing_type = yatra_get_pricing_type($tour_id);

        $datewise_pricing_array = $base_pricing_type !== $pricing_type ? $this->getPricing($tour_id, $number_of_people) : $datewise_pricing_array;

        $datewise_pricing_array = $base_pricing_type === "multi" ? $this->getMultiplePricing($tour_id, $number_of_people, $datewise_pricing_array) : $this->getSinglePricing($datewise_pricing_array, $number_of_people);

        if ($base_pricing_type === "single") {

            $yatra_tour_pricing = new Yatra_Tour_Pricing();

            return $yatra_tour_pricing->map($datewise_pricing_array);

        } else {


            $pricing_instance = array();

            foreach ($datewise_pricing_array as $pricing_id => $pricing) {

                $yatra_tour_pricing = new Yatra_Tour_Pricing();

                $pricing_instance[] = $yatra_tour_pricing->map($pricing, $pricing_id);
            }

            return $pricing_instance;
        }

    }

    public function getPricing($tourID, $number_of_people = null)
    {

        if (yatra_get_pricing_type($tourID) === "multi") {

            return $this->getMultiplePricing($tourID, $number_of_people);

        }

        $base_pricing = yatra_get_tour_base_single_pricing($tourID);


        return $this->getSinglePricing($base_pricing, $number_of_people);
    }

    private function getMultiplePricing($tourID, $number_of_people = null, $date_wise_pricing = array())
    {
        $base_multiple_pricing = yatra_get_tour_base_multiple_pricing($tourID, true);

        $final_pricing_details = array();

        foreach ($base_multiple_pricing as $pricing_id => $pricing) {

            if (is_array($date_wise_pricing) && count($date_wise_pricing) > 0) {

                $pricing = isset($date_wise_pricing[$pricing_id]) ? $date_wise_pricing[$pricing_id] : $pricing;

                $pricing['pricing_label'] = $base_multiple_pricing[$pricing_id]['pricing_label'];

                $pricing['pricing_description'] = $base_multiple_pricing[$pricing_id]['pricing_description'];
            }


            $people_count = is_array($number_of_people) && isset($number_of_people[$pricing_id]) ? absint($number_of_people[$pricing_id]) : null;

            $final_pricing_details[$pricing_id] = $this->getSinglePricing($pricing, $people_count);
        }

        return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);

    }

    private function getSinglePricing($base_pricing, $number_of_people = null)
    {

        $base_pricing['group_size'] = absint($base_pricing['group_size']) == 0 ? 1 : $base_pricing['group_size'];
        $regular_price = absint($base_pricing['regular_price']);
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
            'regular_price' => $regular_price,
            'person_count' => $person_count,
            'sales_price' => $sales_price,
            'final_regular_price' => $regular_price * $person_count,
            'final_price' => $final_price * $person_count
        );

        return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);
    }

}