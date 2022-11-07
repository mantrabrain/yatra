<?php

namespace Yatra\Core;

use Yatra\Core\API\TrackerAPI;

class Initialize
{
    public static function run()
    {
        require_once YATRA_ABSPATH . 'core/globals.php';
        require_once YATRA_ABSPATH . 'core/functions/pages.php';

        $self = new self;

        $self->api_init();
        $self->cron_init();
    }

    public function api_init()
    {
        TrackerAPI::init();
    }

    public function cron_init()
    {
        Cron::init();
    }
}

