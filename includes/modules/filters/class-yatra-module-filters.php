<?php

class Yatra_Module_Filters
{
    public function __construct()
    {
        $this->includes();
        $this->hooks();
    }

    public function includes()
    {
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/yatra-filter-functions.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/abstract-class-yatra-module-filter-sections.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/includes/class-yatra-module-filter-sidebar.php';
        include_once YATRA_ABSPATH . "includes/modules/filters/includes/sections/class-yatra-module-filter-section-destinations.php";
    }

    public function hooks()
    {

        add_action('yatra_before_main_content_loop', array($this, 'filter_sidebar'), 10);
        add_action('yatra_before_main_content_loop', array($this, 'wrapper_start'), 11);
        add_action('yatra_after_main_content_loop', array($this, 'wrapper_end'), 20);
    }


    public function filter_sidebar()
    {

        if (!yatra_is_archive_page()) {
            return;
        }


        echo '<div class="yatra-tour-filter-sidebar">';

        echo '<h1>Hello World</h1>';
        $sidebar_filter_sections = yatra_get_filters_sections();

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

        echo '</div>';

    }

    public function wrapper_start()
    {
        if (!yatra_is_archive_page()) {
            return;
        }
        echo '<div class="yatra-archive-main-content-area">';

    }

    public function wrapper_end()
    {
        if (!yatra_is_archive_page()) {
            return;
        }
        echo '</div>';
    }

}

new Yatra_Module_Filters();

