<?php

class Yatra_Compatibility_Themes_Kadence
{

    public function __construct()
    {
        add_action('kadence_before_content', array($this, 'before_content'));
        add_action('kadence_after_content', array($this, 'after_content'));
        add_filter('yatra_page_wrapper_class', array($this, 'yatra_wrapper_class'));
    }

    public function before_content()
    {
        if (yatra_is_archive_page() || yatra_is_tour_page()) {

            ?>
            <div id="primary" class="content-area">
            <div class="content-container site-container">
            <?php
        }

    }

    public function after_content()
    {
        if (yatra_is_archive_page() || yatra_is_tour_page()) {
            ?>
            </div>
            </div>
            <?php
        }
    }

    public function yatra_wrapper_class($class)
    {
        $class = "yatra-page-wrapper ";

        return $class . 'kadence-theme';
    }
}

new Yatra_Compatibility_Themes_Kadence();