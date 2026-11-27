<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TripBookingBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/trip-booking block.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripBookingWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        return new TripBookingBlock();
    }
}
