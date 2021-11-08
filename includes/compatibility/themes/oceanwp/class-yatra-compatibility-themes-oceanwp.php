<?php

class Yatra_Compatibility_Themes_OceanWP
{

    public function __construct()
    {
        add_filter('yatra_page_wrapper_class', array($this, 'yatra_wrapper_class'));
    }

    public function yatra_wrapper_class($class)
    {
        $class = "yatra-page-wrapper container ";

        if (yatra_is_archive_page()) {

            $class .= 'template-default ';
        }
        return $class . 'oceanwp-theme';
    }
}

new Yatra_Compatibility_Themes_OceanWP();