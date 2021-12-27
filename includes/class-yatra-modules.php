<?php

class Yatra_Modules
{

    public static function render()
    {

        include_once YATRA_ABSPATH . 'includes/modules/blocks/class-yatra-blocks.php';
        include_once YATRA_ABSPATH . 'includes/modules/dashboard/class-yatra-module-dashboard.php';
        include_once YATRA_ABSPATH . 'includes/modules/status/class-yatra-module-status.php';
        include_once YATRA_ABSPATH . 'includes/modules/filters/class-yatra-module-filters.php';


    }
}

Yatra_Modules::render();