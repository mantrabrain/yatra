<?php

class Yatra_Compatibility_Themes_MagazineNP
{

    public function __construct()
    {

        add_filter('yatra_page_wrapper_class', array($this, 'yatra_wrapper_class'));
    }

    public function yatra_wrapper_class($class)
    {
        $class = "yatra-page-wrapper container ";

        return $class . 'magazinenp-theme';
    }
}

new Yatra_Compatibility_Themes_MagazineNP();