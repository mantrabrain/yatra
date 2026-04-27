<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX handlers for Discount Shortcode
 */
class DiscountShortcodeAjax
{
    public function __construct()
    {
        // Use the same AJAX handler as regular trips
        add_action('wp_ajax_yatra_discount_trip_shortcode_load', [$this, 'loadTrips']);
        add_action('wp_ajax_nopriv_yatra_discount_trip_shortcode_load', [$this, 'loadTrips']);
    }

    /**
     * Load trips via AJAX for pagination (same as regular trips)
     */
    public function loadTrips(): void
    {

        
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_trip_shortcode_nonce')) {

            wp_die(esc_html__('Security check failed', 'yatra'), '', ['response' => 403]);
        }

        // Parse shortcode attributes
        $atts = $_POST['atts'] ?? [];
        $page = (int) ($_POST['page'] ?? 1);
        
        // Add page to attributes for AJAX pagination
        $atts['current_page'] = $page;

        try {
            $discountShortcode = new \Yatra\Shortcodes\DiscountAndDealsShortcode();
            $trips_data = $discountShortcode->getTrips($atts);
            
            // Prepare data for template - extract variables for template scope
            $trips = [
                'trips' => $trips_data['trips'] ?? [],
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'current_page' => $trips_data['current_page'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0,
            ];

            // Additional template variables
            $max_pages = $trips_data['max_pages'] ?? 1;
            $current_page = $trips_data['current_page'] ?? 1;
            $total_found = $trips_data['total_found'] ?? 0;

            // Start output buffering
            ob_start();
            
            // Load the trip template (same as regular trips)
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/trip.php';
            
            $html = ob_get_clean();

            // Send success response
            wp_send_json_success([
                'html' => $html,
                'trips' => $trips_data['trips'] ?? [],
                'max_pages' => $max_pages,
                'current_page' => $current_page,
                'total_found' => $total_found,
            ]);

        } catch (\Exception $e) {

            
            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG)
                    ? 'Error loading discount trips: ' . $e->getMessage()
                    : __('Unable to load trips. Please try again.', 'yatra'),
            ]);
        }
    }
}
