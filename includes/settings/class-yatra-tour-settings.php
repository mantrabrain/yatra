<?php
if (!defined('ABSPATH')) {
    exit;
}
include_once "class-yatra-tour-interface.php";
include_once "class-yatra-tour-attributes.php";
include_once "class-yatra-dates.php";
include_once "class-yatra-pricing.php";

abstract class Yatra_Tour_Settings implements Yatra_Tour_Interface
{
    protected $tourData;

    protected $isFixedDeparture;

    protected $availabilityDateRanges;

    protected $allDynamicDataByDateRange = array();

    protected $countries = array();

    protected $isFeatured;

    protected $maximumNumberOfTravellers;

    protected $bookedTravellers;

    protected $availabilityFor;

    protected $pricing;

    protected $pricingType;

    protected $attributes;

    public function __construct($ID = null, $start_date = null, $end_date = null, $number_of_people = null)
    {
        $ID = $ID == null ? get_the_ID() : $ID;

        $this->isFixedDeparture = yatra_is_tour_fixed_departure($ID);

        $availabilityDateRanges = yatra_tour_meta_availability_date_ranges($ID);

        $this->availabilityDateRanges = $availabilityDateRanges;

        $countries = get_post_meta($ID, 'yatra_tour_meta_tour_country', true);

        $all_countries = is_array($countries) ? yatra_get_countries($countries) : array();

        $this->countries = $all_countries;

        $this->isFeatured = (boolean)get_post_meta($ID, 'yatra_tour_meta_tour_featured', true);

        $this->maximumNumberOfTravellers = yatra_maybeintempty(get_post_meta($ID, 'yatra_tour_maximum_number_of_traveller', true));

        $attributes = new Yatra_Tour_Attributes($ID);

        $this->attributes = $attributes->getAllAtributes();

        $dates_data = new Yatra_Dates($ID, $start_date, $end_date, $number_of_people);

        $all_date_data = $dates_data->getAllTourData();

        if ($all_date_data instanceof Yatra_Tour_Dates) {

            $this->pricing = $all_date_data->getPricing();

            $this->pricingType = $all_date_data->getPricingType();

            $this->maximumNumberOfTravellers = $all_date_data->getMaxTravellers();

            $this->availabilityFor = $all_date_data->getAvailabilityFor();

        }

        $this->allDynamicDataByDateRange = $all_date_data;

        $this->tourData = Yatra_Dates::getSingleTourData($ID, $number_of_people, $start_date, $end_date);
    }
}

class Yatra_Tour_Options extends Yatra_Tour_Settings
{

    public function __construct($tourID = null, $start_date = null, $end_date = null, $number_of_people = null)
    {
        parent::__construct($tourID, $start_date, $end_date, $number_of_people);
    }

    public function getTodayData($today)
    {
        $date_index = str_replace(' ', '', trim($today . '00:00:00_' . $today . '23:59:59'));

        $todayDataSettings = null;

        $settings = $this->getAllDynamicDataByDateRange();

        if ($settings instanceof Yatra_Tour_Dates) {

            $todayDataSettings = $settings;

        } else if (is_array($settings) && isset($settings[$date_index])) {

            $todayDataSettings = $settings[$date_index];

        }
        return $todayDataSettings;
    }

    public function getAllDynamicDataByDateRange($start_date = null, $end_date = null)
    {
        if (is_null($start_date) || is_null($end_date)) {

            return $this->allDynamicDataByDateRange;
        }
        $date_index = str_replace(' ', '', trim($start_date . '00:00:00_' . $end_date . '23:59:59'));

        if (isset($this->allDynamicDataByDateRange[$date_index])) {

            if ($this->allDynamicDataByDateRange[$date_index] instanceof Yatra_Tour_Dates) {

                return $this->allDynamicDataByDateRange[$date_index];
            }
        }
        return $this->allDynamicDataByDateRange;
    }


    public function isFixedDeparture()
    {
        return $this->isFixedDeparture;
    }

    public function getTourData()
    {
        return $this->tourData;
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
        return $this->bookedTravellers;
    }

    public function getAvailabilityFor()
    {
        return $this->availabilityFor;
    }

    public function getPricing()
    {
        return $this->pricing;
    }

    public function getPricingType()
    {

        return $this->pricingType;
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

