<?php
if ( ! defined( 'ABSPATH' ) ) {
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

    public function getBookedTravellers()
    {
        return $this->booked_travellers;
    }

    public function isActive()
    {
        return $this->active;
    }

    public function availabilityFor()
    {
        return $this->availability;
    }

    public function noteToCustomer()
    {
        return $this->note_to_customer;
    }

    public function noteToAdmin()
    {
        return $this->note_to_admin;
    }

    public function createdBy()
    {
        return $this->created_by;
    }

    public function updatedBy()
    {
        return $this->updated_by;
    }

    public function createdAt()
    {
        return $this->created_at;
    }

    public function updatedAt()
    {
        return $this->updated_at;
    }
}