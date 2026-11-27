<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TripItineraryBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/trip-itinerary block.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripItineraryWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        return new TripItineraryBlock();
    }
}
