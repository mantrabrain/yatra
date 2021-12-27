<?php
if (!defined('ABSPATH')) {
    exit;
}

abstract class Yatra_Tour_Pricing_Abstract implements Yatra_Tour_Pricing_Interface
{
    protected $id;

    protected $pricing_label;

    protected $pricing_description;

    protected $pricing_per;

    protected $group_size;

    protected $regular_price;

    protected $sales_price;

    protected $final_regular_price;

    protected $final_price;

    protected $minimum_pax;

    protected $maximum_pax;

    protected $person_count;

    public function map($pricing, $pricing_id = 0)
    {
        foreach ($pricing as $index => $value) {

            if (property_exists($this, $index)) {

                $this->$index = $value;
            }
        }
        $this->id = $pricing_id;

        return $this;
    }


}