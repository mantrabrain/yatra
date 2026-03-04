<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX handlers for Destination Shortcode
 */
class DestinationShortcodeAjax
{
    public function __construct()
    {
        add_action('wp_ajax_yatra_destination_shortcode_load', [$this, 'loadDestinations']);
        add_action('wp_ajax_nopriv_yatra_destination_shortcode_load', [$this, 'loadDestinations']);
    }

    /**
     * Load destinations via AJAX for pagination
     */
    public function loadDestinations(): void
    {
        // Debug: Log AJAX request
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Destination AJAX - Request received: ' . print_r($_POST, true));
            $atts = $_POST['atts'] ?? [];
            error_log('Yatra Destination AJAX - per_page parameter: ' . ($atts['per_page'] ?? 'NOT SET'));
            error_log('Yatra Destination AJAX - page parameter: ' . ($_POST['page'] ?? 'NOT SET'));
        }
        
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_destination_shortcode_nonce')) {
            error_log('Yatra Destination AJAX - Security check failed');
            wp_die('Security check failed');
        }

        // Parse shortcode attributes
        $atts = $_POST['atts'] ?? [];
        $page = (int) ($_POST['page'] ?? 1);
        
        // Add page to attributes for AJAX pagination
        $atts['current_page'] = $page;

        try {
            $destinationShortcode = new \Yatra\Shortcodes\DestinationShortcode();
            $destinations_data = $destinationShortcode->getDestinations($atts);
            
            // Prepare data for template - extract variables for template scope
            $destinations = [
                'destinations' => $destinations_data['destinations'] ?? [],
                'max_pages' => $destinations_data['max_pages'] ?? 1,
                'current_page' => $destinations_data['current_page'] ?? 1,
                'total_found' => $destinations_data['total_found'] ?? 0
            ];
            
            // Extract variables to make them available in template
            $atts = $atts;
            $max_pages = $destinations_data['max_pages'] ?? 1;
            $current_page = $destinations_data['current_page'] ?? 1;
            $total_found = $destinations_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-destination-grid-' . min(max($columns, 1), 4);
            
            // Debug: Log AJAX data with comprehensive pagination info
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('=== YATRA DESTINATION AJAX DEBUG ===');
                error_log('Yatra Destination AJAX - Requested page: ' . $page);
                error_log('Yatra Destination AJAX - Destinations count: ' . count($destinations_data['destinations'] ?? []));
                error_log('Yatra Destination AJAX - Total found: ' . $total_found);
                error_log('Yatra Destination AJAX - Max pages: ' . $max_pages);
                error_log('Yatra Destination AJAX - Current page: ' . $current_page);
                error_log('Yatra Destination AJAX - Attributes received: ' . print_r($atts, true));
                
                // Log each destination being returned
                $destinations_list = $destinations_data['destinations'] ?? [];
                if (!empty($destinations_list)) {
                    error_log('Destinations being returned for page ' . $current_page . ':');
                    foreach ($destinations_list as $index => $destination) {
                        error_log('  ' . ($index + 1) . '. ' . ($destination['term']->name ?? 'NO NAME') . ' (ID: ' . ($destination['term']->id ?? 'NO ID') . ')');
                    }
                }
                error_log('=== END DESTINATION AJAX DEBUG ===');
            }

            // Load the template content with variables in scope
            ob_start();
            // Extract variables to make them available in template (matching trip shortcode pattern)
            $destinations = $destinations_data['destinations'] ?? [];
            $max_pages = $destinations_data['max_pages'] ?? 1;
            $current_page = $destinations_data['current_page'] ?? 1;
            $total_found = $destinations_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-destination-grid-' . min(max($columns, 1), 4);
            
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/destination.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $destinations_data['current_page'] ?? 1,
                'max_pages' => $destinations_data['max_pages'] ?? 1,
                'total_found' => $destinations_data['total_found'] ?? 0
            ]);

        } catch (\Exception $e) {
            // Log error for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra DestinationShortcode AJAX Error: ' . $e->getMessage());
                error_log('Yatra DestinationShortcode AJAX Trace: ' . $e->getTraceAsString());
            }
            
            wp_send_json_error([
                'message' => 'Error loading destinations: ' . $e->getMessage()
            ]);
        }
    }
}
