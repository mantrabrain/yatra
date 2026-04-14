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
        
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_destination_shortcode_nonce')) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra Destination AJAX - Security check failed');
            }
            wp_die(esc_html__('Security check failed', 'yatra'), '', ['response' => 403]);
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
                'message' => (defined('WP_DEBUG') && WP_DEBUG)
                    ? 'Error loading destinations: ' . $e->getMessage()
                    : __('Unable to load destinations. Please try again.', 'yatra'),
            ]);
        }
    }
}
