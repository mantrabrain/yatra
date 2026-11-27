<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TripReviewsBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/trip-reviews block.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripReviewsWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        return new TripReviewsBlock();
    }
}
