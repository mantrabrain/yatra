<?php
if (!defined('ABSPATH')) {
    exit;
}

interface Yatra_Tour_Dates_Interface
{
    public function getID();

    public function getTourID();

    public function getSlotGroupID();

    public function getStartDate();

    public function getEndDate();

    public function getPricing();

    public function getPricingType();

    public function getMaxTravellers();

    public function getBookedTravellers();

    public function isActive();

    public function getAvailabilityFor();

    public function getNoteToCustomer();

    public function getNoteToAdmin();

    public function getCreatedBy();

    public function getUpdatedBy();

    public function getCreatedAt();

    public function getUpdatedAt();

}