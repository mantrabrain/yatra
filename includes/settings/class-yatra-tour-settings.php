<?php

include_once "class-yatra-tour-interface.php";
include_once "class-yatra-tour-attributes.php";
include_once "class-yatra-dates.php";
include_once "class-yatra-pricing.php";

abstract class Yatra_Tour_Settings implements Yatra_Tour_Interface
{
    protected $isFixedDeparture;

    protected $availabilityDateRanges = array();

    protected $countries = array();

    protected $isFeatured;

    protected $maximumNumberOfTravellers;

    protected $pricing;

    protected $attributes;

    public function __construct($ID = null, $start_date = null, $end_date = null)
    {
        $ID = $ID == null ? get_the_ID() : $ID;

        $this->isFixedDeparture = (boolean)get_post_meta($ID, 'yatra_tour_meta_tour_fixed_departure', true);

        $availabilityDateRanges = yatra_maybe_json_decode(get_post_meta($ID, 'yatra_tour_meta_availability_date_ranges', true));

        $this->availabilityDateRanges = $availabilityDateRanges;

        $countries = get_post_meta($ID, 'yatra_tour_meta_tour_country', true);

        $all_countries = is_array($countries) ? yatra_get_countries($countries) : array();

        $this->countries = $all_countries;

        $this->isFeatured = (boolean)get_post_meta($ID, 'yatra_tour_meta_tour_featured', true);

        $this->maximumNumberOfTravellers = yatra_maybeintempty(get_post_meta($ID, 'yatra_tour_maximum_number_of_traveller', true));

        $attributes = new Yatra_Tour_Attributes($ID);

        $this->attributes = $attributes->getAllAtributes();

        $start_date = '2021-10-24';

        $end_date = '2021-10-24';

        $dates_data = new Yatra_Dates($ID, $start_date, $end_date);

        // If Date rage is one day ( 24 to 24 example ) then only get the date data else go for only  details only

        $all_date_data = $dates_data->getAllDateWiseData();


        if (count($all_date_data) < 1) {

            $pricing = new Yatra_Pricing($ID);

        }


        echo '<pre>';
        print_r($all_date_data);
        echo '</pre>';
    }
}

class Yatra_Tour_Options extends Yatra_Tour_Settings
{

    public function __construct($tourID = null, $start_date = null, $end_date = null)
    {
        parent::__construct($tourID, $start_date, $end_date);
    }

    public function isFixedDeparture()
    {
        return $this->isFixedDeparture;
    }

    public function getAvailabilityDateRanges()
    {
        return $this->availabilityDateRanges;
    }

    public function getCountries()
    {
        return $this->countries;
    }

    public function isFeatured()
    {
        return $this->isFeatured;
    }

    public function getMaximumNumberOfTravellers()
    {
        return $this->maximumNumberOfTravellers;
    }

    public function getBookedTravellers()
    {
        // TODO: Implement getBookedTravellers() method.
    }

    public function getAvailabilityFor()
    {
        // TODO: Implement getAvailabilityFor() method.
    }

    public function getPricing()
    {
        return $this->pricing;
    }

    public function getPricingType()
    {
        // TODO: Implement getPricingType() method.
    }

    public function getAttributes()
    {
        return $this->attributes;
    }

    public function getTabs()
    {
        // TODO: Implement getTabs() method.
    }
}

