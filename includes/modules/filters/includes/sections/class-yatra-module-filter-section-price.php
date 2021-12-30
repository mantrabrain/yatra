<?php

class Yatra_Module_Filter_Section_Price extends Yatra_Module_Filter_Sections
{
    function get_label()
    {
        return __('Price Range', 'yatra');
    }

    function is_visible()
    {
        return true;
    }

    private function get_minimum_price()
    {
        $price = yatra_get_price_ranges_for_filter();

        return $price->min_price ?? 0;

    }

    private function get_maximum_price()
    {
        $price = yatra_get_price_ranges_for_filter();

        return $price->max_price ?? 0;
    }

    public function render()
    {
        ?>
        <div class="yatra-sidebar-filter-field price">
            <h3 class="yatra-sidebar-filter-section-title"><?php echo esc_html($this->get_label()); ?></h3>
            <div class="yatra-sidebar-filter-section-content">
                <div class="yatra-slider-wrap">
                    <input type="hidden" id="yatra-price-slider-min" name="min_price"/>
                    <input type="hidden" id="yatra-price-slider-max" name="max_price"/>
                    <div id="yatra-price-slider"></div>
                </div>
                <div class="slider-content">
                    <span class="min-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $this->get_minimum_price()) ?></span>
                    <span class="max-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $this->get_maximum_price()) ?></span>
                </div>
            </div>
        </div>
        <?php
    }
}