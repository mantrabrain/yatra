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

        $this->multiple_pricing = get_post_meta($tourID, 'yatra_multiple_pricing', true);

        $this->multiple_pricing = !is_array($this->multiple_pricing) ? array() : $this->multiple_pricing;

        $this->pricing_label = get_post_meta($tourID, 'yatra_tour_meta_pricing_label', true);

        $this->pricing_description = get_post_meta($tourID, 'yatra_tour_meta_pricing_description', true);

        $this->all_date_wise_data = Yatra_Core_DB::get_data('tour_dates', '', $where);


    }

    public function getAllDateWiseData()
    {

        $all_processed_data = array();

        foreach ($this->all_date_wise_data as $single_data_row) {

            $tour_dates = new Yatra_Tour_Dates();

            $all_processed_data[] = $tour_dates->map($single_data_row, $this->multiple_pricing, $this->pricing_label, $this->pricing_description);

        }
        return $all_processed_data;
    }

}