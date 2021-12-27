<?php

if (!defined('ABSPATH')) {
    exit;
}

class Yatra_Tour_Pricing extends Yatra_Tour_Pricing_Abstract
{

    public function getID()
    {
        return $this->id;
    }

    public function getLabel()
    {
        return $this->pricing_label;
    }

    public function getDescription()
    {
        return $this->pricing_description;
    }

    public function getPricingPer()
    {
        return $this->pricing_per;
    }

    public function getGroupSize()
    {
        return $this->group_size;
    }

    public function getRegularPrice()
    {
        return $this->regular_price;

    }

    public function getSalesPrice()
    {
        return $this->sales_price;
    }

    public function getFinalRegularPrice()
    {
        return $this->final_regular_price;
    }

    public function getFinalPrice()
    {
        return $this->final_price;
    }

    public function getMinimumPax()
    {
        return $this->minimum_pax;
    }

    public function getMaximumPax()
    {
        return $this->maximum_pax;
    }
}