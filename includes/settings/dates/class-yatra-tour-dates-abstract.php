<?php

abstract class Yatra_Tour_Dates_Abstract implements Yatra_Tour_Dates_Interface
{
    protected $id;

    protected $tour_id;

    protected $slot_group_id;

    protected $start_date;

    protected $end_date;

    protected $pricing;

    protected $pricing_type;

    protected $max_travellers;

    protected $booked_travellers;

    protected $active;

    protected $availability;

    protected $note_to_customer;

    protected $note_to_admin;

    protected $created_by;

    protected $updated_by;

    protected $created_at;

    protected $updated_at;


    public function map($date_wise_data = array(), $multiple_pricing = array(), $pricing_label = '', $pricing_description = '')
    {
        $pricing_instance = new Yatra_Pricing();

        foreach ($date_wise_data as $index => $value) {

            if (property_exists($this, $index)) {

                if ($index === "pricing") {

                    $pricing_value_array = $this->map_pricing($value, $multiple_pricing, $pricing_label, $pricing_description);

                    $tour_id = isset($date_wise_data->tour_id) ? $date_wise_data->tour_id : '';

                    $pricing_type = isset($date_wise_data->pricing_type) ? $date_wise_data->pricing_type : '';

                    $value = $pricing_instance->getDateWisePricing($pricing_value_array, $tour_id, $pricing_type);
                }
                $this->$index = $value;
            }
        }

        return $this;

    }

    private function map_pricing($value, $multiple_pricing, $pricing_label, $pricing_description)
    {
        $pricing_value_array = yatra_maybe_json_decode($value);

        if (count($multiple_pricing) < 1) {


            $pricing_value_array['pricing_label'] = $pricing_label;

            $pricing_value_array['pricing_description'] = $pricing_description;

            return $pricing_value_array;

        } else {

            $pricing_value_array_multiple = array();

            foreach ($multiple_pricing as $pricing_id => $pricing) {

                if (isset($pricing_value_array[$pricing_id])) {

                    $pricing = $pricing_value_array[$pricing_id];

                    $pricing['pricing_label'] = $multiple_pricing[$pricing_id]['pricing_label'];

                    $pricing['pricing_description'] = $multiple_pricing[$pricing_id]['pricing_description'];


                }

                $pricing_value_array_multiple[$pricing_id] = $pricing;
            }
            return $pricing_value_array_multiple;
        }


    }
}