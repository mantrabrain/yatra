<?php

class Yatra_Module_Filter_Sidebar
{

    public function __construct()
    {
        $this->includes();
        $this->hooks();
    }

    public function includes()
    {
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/abstract-class-yatra-module-filter-sections.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/class-yatra-module-filter-sidebar.php';
        include_once YATRA_ABSPATH . "includes/modules/filters/includes/sections/class-yatra-module-filter-section-destinations.php";
        include_once YATRA_ABSPATH . "includes/modules/filters/includes/sections/class-yatra-module-filter-section-activities.php";
        include_once YATRA_ABSPATH . "includes/modules/filters/includes/sections/class-yatra-module-filter-section-price.php";
        include_once YATRA_ABSPATH . "includes/modules/filters/includes/sections/class-yatra-module-filter-section-duration.php";
    }

    public function hooks()
    {
        add_action('yatra_before_main_content_loop', array($this, 'filter_sidebar'), 10);

    }

    public function filter_sidebar()
    {

        if (!yatra_is_archive_page()) {
            return;
        }

        $action = get_post_type_archive_link('tour');

        $filter = yatra_get_filter_params();

        echo '<div class="yatra-tour-filter-sidebar yatra-col-sm-3 yatra-col-xs-12">';

        echo '<div class="yatra-tour-filter-sidebar-inner">';

        echo '<form class="yatra-tour-filter-sidebar-form" method="get" action="' . esc_attr($action) . '">';

        echo '<div class="yatra-filter-sidebar-header">';

        echo '<h2>' . __('Filter Criteria', 'yatra') . '</h2>';


        $clear_class = count((array)$filter) < 1 ? 'yatra-hide' : '';

        echo '<a href="' . esc_attr($action) . '"  class="yatra-clear-filter ' . esc_attr($clear_class) . '">' . __('Clear filter', 'yatra') . '</a>';

        echo '</div>';

        $search_text = get_query_var('s');
        if ('' != $search_text) {
            ?>
            <div class="yatra-sidebar-filter-field">
                <h3 class="yatra-sidebar-filter-section-title"><?php echo __('Search', 'yatra') ?></h3>
                <div class="yatra-sidebar-filter-section-content">
                    <input type="text" name="s" value="<?php echo esc_attr($search_text) ?>"
                           placeholder="<?php echo esc_attr__('Search …', 'yatra') ?>"/>
                </div>
            </div>
            <?php
        }
        $sidebar_filter_sections = yatra_get_sidebar_filter_sections();

        foreach ($sidebar_filter_sections as $section_id) {

            $section_class = sanitize_text_field($section_id);

            if (class_exists($section_class)) {

                /**
                 * @var $section_instance Yatra_Module_Filter_Section_Destinations
                 */
                $section_instance = new $section_class();

                if ($section_instance->is_visible()) {

                    $section_instance->render();
                }
            }
        }

        if (isset($filter->orderby)) {
            echo '<input type="hidden" name="orderby" value="' . esc_attr($filter->orderby) . '"/>';
        }

        if (isset($filter->display_mode)) {
            echo '<input type="hidden" name="display_mode" value="' . esc_attr($filter->display_mode) . '"/>';
        }

        echo '<button type="submit" class="yatra-button button yatra-filter-sidebar-submit">' . __('Filter', 'yatra') . '</button>';
        echo '</form>';
        echo '</div>';
        echo '</div>';

    }
}

new Yatra_Module_Filter_Sidebar();


