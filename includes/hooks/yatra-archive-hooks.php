<?php

class Yatra_Archive_Hooks
{
    public function __construct()
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

        echo '<h1>Filter Sidebar</h1>';

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

new Yatra_Archive_Hooks();
