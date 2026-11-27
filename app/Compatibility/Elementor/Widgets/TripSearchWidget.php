<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TripSearchBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/trip-search block.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripSearchWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        return new TripSearchBlock();
    }
}
