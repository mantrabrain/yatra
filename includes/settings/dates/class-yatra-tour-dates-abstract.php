<?php
if (!defined('ABSPATH')) {
    exit;
}

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


    public function map($date_wise_data = array(), $number_of_people = null)
    {

        foreach ($date_wise_data as $index => $value) {

            $pricing_instance = new Yatra_Pricing();

            if (property_exists($this, $index)) {

                if ($index === "pricing") {

                    $pricing_value_array = yatra_maybe_json_decode($value);

                    $tour_id = isset($date_wise_data->tour_id) ? $date_wise_data->tour_id : '';

                    $pricing_type = isset($date_wise_data->pricing_type) ? $date_wise_data->pricing_type : '';

                    $value = $pricing_instance->getDateWisePricing($tour_id, $pricing_type, $number_of_people, $pricing_value_array);
                }
                $this->$index = $value;
            }
        }

        return $this;

    }

}