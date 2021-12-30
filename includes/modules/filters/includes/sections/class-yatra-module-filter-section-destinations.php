<?php

class Yatra_Module_Filter_Section_Destinations extends Yatra_Module_Filter_Sections
{
    function get_label()
    {
        return __('Destinations', 'yatra');
    }

    function is_visible()
    {
        return true;
    }

    public function render()
    {

        $terms = yatra_get_terms_by_id('destination');

        ?>
        <div class="yatra-sidebar-filter-field">
            <h3 class="yatra-sidebar-filter-section-title"><?php echo esc_html($this->get_label()); ?></h3>
            <div class="yatra-sidebar-filter-section-content">
                <?php $this->taxonomy_filter_html($terms); ?>
            </div>
        </div>
        <?php
    }
}