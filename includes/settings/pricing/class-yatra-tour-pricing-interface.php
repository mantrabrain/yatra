<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
interface Yatra_Tour_Pricing_Interface
{
    public function getID();

    public function getLabel();

    public function getDescription();

    public function getPricingPer();

    public function getGroupSize();

    public function getRegularPrice($calculate_total_regular_price = false);

    public function getSalesPrice();

    public function getFinalPrice();

    public function getMinimumPax();

    public function getMaximumPax();
}