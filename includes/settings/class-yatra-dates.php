<?php
include_once "dates/class-yatra-tour-dates-interface.php";
include_once "dates/class-yatra-tour-dates-abstract.php";
include_once "dates/class-yatra-tour-dates.php";

class Yatra_Dates
{
    private $all_date_wise_data = array();

    private $multiple_pricing;

    private $pricing_label;

    private $pricing_description;

    public function __construct($tourID, $start_date, $end_date)
    {
        $start_date = trim($start_date . ' 00:00:00');

        $end_date = trim($end_date . ' 23:59:59');

        $where = array(
            'start_date |>=' => $start_date,
            'end_date |<=' => $end_date,
            'tour_id' => $tourID
        );

        $this->multiple_pricing = yatra_get_tour_base_multiple_pricing($tourID);

        $this->pricing_label = yatra_get_tour_base_single_pricing($tourID, 'pricing_label');

        $this->pricing_description = yatra_get_tour_base_single_pricing($tourID, 'pricing_description');

        $this->all_date_wise_data = Yatra_Core_DB::get_data('tour_dates', '', $where);


        if (count($this->all_date_wise_data) < 1) {

        }

    }

    public function getAllDateWiseData()
    {

        $all_processed_data = array();


        $tour_dates = new Yatra_Tour_Dates();

        foreach ($this->all_date_wise_data as $single_data_row) {

            $all_processed_data[] = $tour_dates->map($single_data_row, $this->multiple_pricing, $this->pricing_label, $this->pricing_description);

        }
        return $all_processed_data;
    }

}