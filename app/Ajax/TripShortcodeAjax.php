<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX handlers for Trip Shortcode
 */
class TripShortcodeAjax
{
    public function __construct()
    {
        add_action('wp_ajax_yatra_trip_shortcode_load', [$this, 'loadTrips']);
        add_action('wp_ajax_nopriv_yatra_trip_shortcode_load', [$this, 'loadTrips']);
    }

    /**
     * Load trips via AJAX for pagination
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
            $tripShortcode = new \Yatra\Shortcodes\TripShortcode();
            $trips_data = $tripShortcode->getTrips($atts);
            
            // Prepare data for template - extract variables for template scope
            $trips = [
                'trips' => $trips_data['trips'] ?? [],
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'current_page' => $trips_data['current_page'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0,
                'debug_info' => [
                    'args_used' => [],
                    'raw_count' => count($trips_data['trips'] ?? [])
                ]
            ];
            
            // Extract variables to make them available in template
            $atts = $atts;
            $max_pages = $trips_data['max_pages'] ?? 1;
            $current_page = $trips_data['current_page'] ?? 1;
            $total_found = $trips_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-tour-grid-' . min(max($columns, 1), 6);
            


            // Load the template content with variables in scope
            ob_start();
            // Extract variables to make them available in template (matching other shortcode pattern)
            $trips = [
                'trips' => $trips_data['trips'] ?? [],
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'current_page' => $trips_data['current_page'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0
            ];
            $max_pages = $trips_data['max_pages'] ?? 1;
            $current_page = $trips_data['current_page'] ?? 1;
            $total_found = $trips_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-tour-grid-' . min(max($columns, 1), 6);
            
            // Ensure atts includes the current_page for data-atts
            $atts['current_page'] = $current_page;
            

            include YATRA_PLUGIN_PATH . 'templates/shortcodes/trip.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $trips_data['current_page'] ?? 1,
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0
            ]);

        } catch (\Exception $e) {

            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG)
                    ? 'Error loading trips: ' . $e->getMessage()
                    : __('Unable to load trips. Please try again.', 'yatra'),
            ]);
        }
    }
}
