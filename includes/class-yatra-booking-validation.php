<?php

class Yatra_Booking_Validation
{
    private $ID;
    private $start_date;
    private $end_date;

    public function __construct($tourID, $selected_date)
    {
        $this->id = $tourID;
        $this->start_date = $selected_date;
        $this->end_date = $selected_date;
    }

    public function validate()
    {
        $tour_options = new Yatra_Tour_Options($this->id, $this->start_date, $this->end_date);

        $pricing = $tour_options->getPricing();
    }

    private function pricing_validate(Yatra_Tour_Pricing $pricing, $person, $max_traveler = '')
    {
        $min_pax = $pricing->getMinimumPax();

        $max_pax = $pricing->getMaximumPax();

        
    }

}