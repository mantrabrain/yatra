<?php

class Yatra_Compatibility_Themes_Astra
{
    public function __construct()
    {
        add_filter('yatra_page_wrapper_class', array($this, 'yatra_wrapper_class'));
    }

    public function yatra_wrapper_class($class)
    {
        $class = "yatra-page-wrapper ";

        if (yatra_is_archive_page()) {
            $class .= 'template-default ';
        }
        return $class . 'astra-theme';
    }
}

new Yatra_Compatibility_Themes_Astra();