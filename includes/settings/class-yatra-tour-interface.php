<?php
if (!defined('ABSPATH')) {
    exit;
}

interface Yatra_Tour_Interface
{
    public function getTourData();

    public function getTodayData($today);

    public function getAllDynamicDataByDateRange($start_date = null, $end_date = null);

    public function isFixedDeparture();

    public function getAvailabilityDateRanges();

    public function getCountries();

    public function isFeatured();

    public function getMaximumNumberOfTravellers();

    public function getPricing();

    public function getBookedTravellers();

    public function getAvailabilityFor();

    public function getPricingType();

    public function getAttributes();

    public function getTabs();

}