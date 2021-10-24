<?php

interface Yatra_Tour_Interface
{
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