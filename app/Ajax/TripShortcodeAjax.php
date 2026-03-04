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
        // Debug: Log AJAX request
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra AJAX - Request received: ' . print_r($_POST, true));
        }
        
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_trip_shortcode_nonce')) {
            error_log('Yatra AJAX - Security check failed');
            wp_die('Security check failed');
        }

        // Parse shortcode attributes
        $atts = $_POST['atts'] ?? [];
        $page = (int) ($_POST['page'] ?? 1);
        
        // Add page to attributes for AJAX pagination
        $atts['current_page'] = $page;
        
        // Debug: Log the page being set
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Trip AJAX - Setting current_page in atts to: ' . $page);
        }

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
            $column_class = 'yatra-tour-grid-' . min(max($columns, 1), 4);
            
            // Debug: Log AJAX data with comprehensive pagination info
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('=== YATRA TRIP AJAX DEBUG ===');
                error_log('Yatra AJAX - Requested page: ' . $page);
                error_log('Yatra AJAX - Trips count: ' . count($trips_data['trips'] ?? []));
                error_log('Yatra AJAX - Total found: ' . $total_found);
                error_log('Yatra AJAX - Max pages: ' . $max_pages);
                error_log('Yatra AJAX - Current page: ' . $current_page);
                error_log('Yatra AJAX - Attributes received: ' . print_r($atts, true));
                error_log('Yatra AJAX - Is last page: ' . ($current_page === $max_pages ? 'YES' : 'NO'));
                error_log('Yatra AJAX - Current page type: ' . gettype($current_page));
                error_log('Yatra AJAX - Max pages type: ' . gettype($max_pages));
                error_log('=== END TRIP AJAX DEBUG ===');
            }

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
            $column_class = 'yatra-tour-grid-' . min(max($columns, 1), 4);
            
            // Ensure atts includes the current_page for data-atts
            $atts['current_page'] = $current_page;
            
            // Debug: Log final atts being passed to template
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra Trip AJAX - Final atts for template: ' . print_r($atts, true));
                error_log('Yatra Trip AJAX - current_page in atts: ' . ($atts['current_page'] ?? 'NOT SET'));
            }
            
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/trip.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $trips_data['current_page'] ?? 1,
                'max_pages' => $trips_data['max_pages'] ?? 1,
                'total_found' => $trips_data['total_found'] ?? 0
            ]);

        } catch (\Exception $e) {
            // Log error for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra TripShortcode AJAX Error: ' . $e->getMessage());
                error_log('Yatra TripShortcode AJAX Trace: ' . $e->getTraceAsString());
            }
            
            wp_send_json_error([
                'message' => 'Error loading trips: ' . $e->getMessage()
            ]);
        }
    }
}
