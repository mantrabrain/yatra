<?php

class Yatra_Module_Filter_Section_Activities extends Yatra_Module_Filter_Sections
{
    function get_label()
    {
        return __('Activities', 'yatra');
    }

    function is_visible()
    {
        return true;
    }

    public function render()
    {

        $terms = yatra_get_terms_by_id('activity');

        ?>
        <div class="yatra-sidebar-filter-field activities">
            <h3 class="yatra-sidebar-filter-section-title">
                <span class="yatra-icon fa fa-universal-access"></span>
                <?php echo esc_html($this->get_label()); ?></h3>
            <div class="yatra-sidebar-filter-section-content">
                <?php $this->taxonomy_filter_html($terms); ?>
            </div>
        </div>
        <?php
    }
}