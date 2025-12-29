<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Booking Form Shortcode
 *
 * Displays the booking form
 */
class BookingFormShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_booking_form');
    }

    /**
     * Render the booking form shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $template = $this->getTemplatePath('booking-form.php');

        if (!file_exists($template)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return '<div class="yatra-error">Booking form template not found at: ' . esc_html($template) . '</div>';
            }
            return '';
        }

        ob_start();
        include $template;
        return ob_get_clean();
    }
}
