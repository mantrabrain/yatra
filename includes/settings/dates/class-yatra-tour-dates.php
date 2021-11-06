<?php
if (!defined('ABSPATH')) {
    exit;
}

class Yatra_Tour_Dates extends Yatra_Tour_Dates_Abstract
{

    public function getID()
    {
        return $this->id;
    }

    public function getTourID()
    {
        return $this->tour_id;
    }

    public function getSlotGroupID()
    {
        return $this->slot_group_id;
    }

    public function getStartDate()
    {
        return $this->start_date;
    }

    public function getEndDate()
    {
        return $this->end_date;
    }

    public function getPricing()
    {
        return $this->pricing;
    }

    public function getPricingType()
    {
        return $this->pricing_type;
    }

    public function getMaxTravellers()
    {
        return $this->max_travellers;
    }

    public function getBookedTravellers($start_date)
    {
        $date = new DateTime($start_date);

        $start_date = $date->format('Y-m-d');

        if (is_array($this->booked_travellers)) {

            if (isset($this->booked_travellers[$start_date])) {

                return $this->booked_travellers[$start_date];
            }

            return null;
        }

        return $this->booked_travellers;
    }

    public function isActive()
    {
        return $this->active;
    }

    public function getAvailabilityFor($tour_id = null, $date = null)
    {

        return apply_filters('yatra_tour_dates_availability_status', $this->availability, $tour_id, $date);

    }

    public function getNoteToCustomer()
    {
        return $this->note_to_customer;
    }

    public function getNoteToAdmin()
    {
        return $this->note_to_admin;
    }

    public function getCreatedBy()
    {
        return $this->created_by;
    }

    public function getUpdatedBy()
    {
        return $this->updated_by;
    }

    public function getCreatedAt()
    {
        return $this->created_at;
    }

    public function getUpdatedAt()
    {
        return $this->updated_at;
    }
}