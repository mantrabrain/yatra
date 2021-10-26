<?php
if (!defined('ABSPATH')) {
    exit;
}
include_once "dates/class-yatra-tour-dates-interface.php";
include_once "dates/class-yatra-tour-dates-abstract.php";
include_once "dates/class-yatra-tour-dates.php";

class Yatra_Dates
{
    private $all_date_wise_data = array();

    private $start_date;

    private $end_date;

    private $tour_id;

    public function __construct($tourID, $start_date = null, $end_date = null)
    {
        $this->start_date = trim($start_date . ' 00:00:00');

        $this->end_date = trim($end_date . ' 23:59:59');

        $this->tour_id = $tourID;

        $where = array(
            'start_date |>=' => $this->start_date,
            'end_date |<=' => $this->end_date,
            'tour_id' => $tourID
        );

        if (!is_null($start_date) && !is_null($end_date)) {

            $this->all_date_wise_data = Yatra_Core_DB::get_data('tour_dates', '', $where);
        }


    }

    public function getAllTourData()
    {
        $all_processed_data = array();

        if (count($this->all_date_wise_data) < 1) {

            return $this->getSingleTourData($this->tour_id);
        }


        foreach ($this->all_date_wise_data as $single_data_row) {

            $tour_dates = new Yatra_Tour_Dates();

            $single_date_wise_index = str_replace(' ', '', trim($single_data_row->start_date . '_' . $single_data_row->end_date));

            $all_processed_data[$single_date_wise_index] = $tour_dates->map($single_data_row);

        }

        $date_wise_index = str_replace(' ', '', trim($this->start_date . '_' . $this->end_date));

        if (isset($all_processed_data[$date_wise_index])) {
            
            return $all_processed_data[$date_wise_index];

        }
        return $all_processed_data;
    }

    public static function getSingleTourData($tourID)
    {
        $yatra_pricing = new Yatra_Pricing();
        $all_date_wise_data = new stdClass();
        $all_date_wise_data->tour_id = $tourID;
        $all_date_wise_data->pricing = $yatra_pricing->getPricing($tourID);
        $all_date_wise_data->pricing_type = yatra_get_pricing_type($tourID);
        $all_date_wise_data->max_travellers = get_post_meta($tourID, 'yatra_tour_maximum_number_of_traveller', true);
        $all_date_wise_data->booked_travellers = 0;
        $all_date_wise_data->availability = 'booking';
        $tour_dates = new Yatra_Tour_Dates();
        return $tour_dates->map($all_date_wise_data);

    }

}