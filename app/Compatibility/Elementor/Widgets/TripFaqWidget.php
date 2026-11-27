<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Blocks\TripFaqBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Elementor widget for the yatra/trip-faq block.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
class TripFaqWidget extends AbstractBlockWidget
{
    protected function block(): AbstractServerBlock
    {
        return new TripFaqBlock();
    }
}
