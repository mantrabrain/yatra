<?php

class Yatra_Module_Filter_Section_Duration extends Yatra_Module_Filter_Sections
{
    function get_label()
    {
        return __('Duration', 'yatra');
    }

    function is_visible()
    {
        return true;
    }

    private function get_minimum_days()
    {
        $duration = $this->get_duration_ranges();

        return $duration->min_days ?? 0;
    }

    private function get_maximum_days()
    {
        $duration = $this->get_duration_ranges();

        return $duration->max_days ?? 0;
    }

    public function render()
    {

        ?>
        <div class="yatra-sidebar-search-field days">
            <h3 class="yatra-sidebar-filter-section-title"><?php echo esc_html($this->get_label()); ?></h3>
            <div class="yatra-sidebar-filter-section-content">
                <div class="yatra-slider-wrap">
                    <input type="hidden" id="yatra-days-slider-min" name="yatra_min_days"/>
                    <input type="hidden" id="yatra-days-slider-max" name="yatra_max_days"/>
                    <div id="yatra-days-slider"></div>
                </div>
                <div class="slider-content">
                    <span class="min-days"><?php echo absint($this->get_minimum_days()) . ' ' . __('Days', 'yatra') ?></span>
                    <span class="max-days"><?php echo absint($this->get_maximum_days()) . ' ' . __('Days', 'yatra') ?></span>
                </div>
            </div>
        </div>
        <?php
    }
}