<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Trip List Shortcode
 *
 * Displays a list of trips
 */
class TripListShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_trip_list');
    }

    /**
     * Render the trip list shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $template = $this->getTemplatePath('trip-list.php');

        if (!file_exists($template)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return '<div class="yatra-error">Trip list template not found at: ' . esc_html($template) . '</div>';
            }
            return '';
        }

        ob_start();
        include $template;
        return ob_get_clean();
    }
}
