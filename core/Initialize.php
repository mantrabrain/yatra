<?php

namespace Yatra\Core;

use Yatra\Core\API\TrackerAPI;
use Yatra\Core\Compatibility\Astra;
use Yatra\Core\Hooks\BookingHooks;
use Yatra\Core\Hooks\EmailHooks;
use Yatra\Core\Hooks\EnquiryHooks;
use Yatra\Core\Hooks\NoticeHooks;
use Yatra\Core\Hooks\ReCaptchaHooks;
use Yatra\Core\Hooks\TourHooks;

class Initialize
{
    public static function run()
    {
        require_once YATRA_ABSPATH . 'core/globals.php';
        require_once YATRA_ABSPATH . 'core/functions/pages.php';
        require_once YATRA_ABSPATH . 'core/functions/tour.php';

        $self = new self;

        $self->api_init();
        $self->cron_init();
        $self->hooks_init();
        $self->compatibility_init();
    }

    public function api_init()
    {
        TrackerAPI::init();
    }

    public function cron_init()
    {
        Cron::init();
    }

    public function hooks_init()
    {
        TourHooks::init();
        NoticeHooks::init();
        EmailHooks::init();
        BookingHooks::init();
        ReCaptchaHooks::init();
    }

    public function compatibility_init()
    {
        Astra::init();
    }
}

