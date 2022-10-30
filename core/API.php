<?php

namespace Yatra\Core;

use Yatra\Core\API\TrackerAPI;

class API
{
    public static function init()
    {
        $self = new self;

        $self->register();
    }

    public function register()
    {
        TrackerAPI::init();
    }
}

