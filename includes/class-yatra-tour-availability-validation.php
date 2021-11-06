<?php

class Yatra_Tour_Availability_Validation
{

    private $id;

    private $start_date;

    private $end_date;

    private $number_of_person;

    public function __construct($tourID, $selected_date, $number_of_person)
    {
        $this->id = $tourID;

        $this->start_date = $selected_date;

        $this->end_date = $selected_date;

        $this->number_of_person = $number_of_person;
    }


    public function validate()
    {
        $date_now = date("Y-m-d"); // this format is string comparable

        if ($date_now > $this->start_date) {

            yatra()->yatra_error->add('yatra_booking_invalid_date', __('Invalid date, please choose valid date.', 'yatra'));

            return false;

        }
        $total_person_count = is_array($this->number_of_person) ? array_sum($this->number_of_person) : absint($this->number_of_person);

        if ($total_person_count < 1) {
            yatra()->yatra_error->add('yatra_booking_invalid_number_of_person', __('At least one traveller need to add on cart.', 'yatra'));

            return false;
        }

        $tour_options = new Yatra_Tour_Options($this->id, $this->start_date, $this->end_date);

        $todayDataSettings = $tour_options->getTodayData($this->start_date);

        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $tour_options->getTourData();

        } else {

            $todayData = $tour_options->getTourData();
        }
        $pricing = $todayData->getPricing();

        $booked_travellers = $todayData->getBookedTravellers($this->start_date);

        $max_travellers = $todayData->getMaxTravellers();

        $availability = $todayData->getAvailabilityFor($this->id, $this->start_date);

        if (absint($booked_travellers) >= absint($max_travellers) && $max_travellers !== '' && !is_null($max_travellers)) {

            yatra()->yatra_error->add('yatra_booking_full', __('Booking already full, please try another available date.', 'yatra'));

            return false;

        } elseif (absint($booked_travellers + $total_person_count) > absint($max_travellers) && $max_travellers !== '' && !is_null($max_travellers)) {

            yatra()->yatra_error->add('yatra_booking_full', __('Total number of persons exceeds with available travellers for this date.', 'yatra'));

            return false;

        } else if ($availability !== "booking") {

            yatra()->yatra_error->add('yatra_booking_invalid_availability', __('You cant book on this date', 'yatra'));

            return false;
        }

        $pricing_status = false;


        if ($pricing instanceof Yatra_Tour_Pricing) {

            $person = !is_array($this->number_of_person) ? absint($this->number_of_person) : 0;

            $pricing_status = $this->pricing_validate($pricing, $person, $max_travellers);


        } else {
            /* @var $single_pricing Yatra_Tour_Pricing */

            foreach ($pricing as $single_pricing) {

                $person = is_array($this->number_of_person) && isset($this->number_of_person[$single_pricing->getID()]) ? absint($this->number_of_person[$single_pricing->getID()]) : 0;

                $pricing_status = $this->pricing_validate($single_pricing, $person, $max_travellers);

                if (!$pricing_status) {
                    break;
                }
            }
        }


        $validation_status = apply_filters('yatra_tour_availability_validation', $pricing_status, $this->id, $todayData, $this->number_of_person);

        if (!$validation_status) {
            return false;
        }

        return $pricing_status;

    }

    private function pricing_validate(Yatra_Tour_Pricing $pricing, $person, $max_traveller = '')
    {


        $min_pax = $pricing->getMinimumPax();

        $min_pax = $min_pax === '' ? 0 : absint($min_pax);

        $max_pax = $pricing->getMaximumPax();

        $max_pax = $max_pax === '' ? 9999999 : absint($max_pax);

        if ($person < $min_pax) {
            yatra()->yatra_error->add('yatra_min_pax_error', "You cant add less than {$min_pax} travellers for {$pricing->getLabel()}");
            return false;
        }
        if ($person > $max_pax) {
            yatra()->yatra_error->add('yatra_max_pax_error', "You cant add more than {$max_pax} travellers for {$pricing->getLabel()}");
            return false;
        }

        return true;
    }

}