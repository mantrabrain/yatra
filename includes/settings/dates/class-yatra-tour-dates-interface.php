<?php
if ( ! defined( 'ABSPATH' ) ) {
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

    public function availabilityFor();

    public function noteToCustomer();

    public function noteToAdmin();

    public function createdBy();

    public function updatedBy();

    public function createdAt();

    public function updatedAt();

}