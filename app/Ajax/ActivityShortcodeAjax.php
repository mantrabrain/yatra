<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX handlers for Activity Shortcode
 */
class ActivityShortcodeAjax
{
    public function __construct()
    {
        add_action('wp_ajax_yatra_activity_shortcode_load', [$this, 'loadActivities']);
        add_action('wp_ajax_nopriv_yatra_activity_shortcode_load', [$this, 'loadActivities']);
    }

    /**
     * Load activities via AJAX for pagination
     */
    public function loadActivities(): void
    {
        // Debug: Log AJAX request
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Activity AJAX - Request received: ' . print_r($_POST, true));
        }
        
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_activity_shortcode_nonce')) {
            error_log('Yatra Activity AJAX - Security check failed');
            wp_die('Security check failed');
        }

        // Parse shortcode attributes
        $atts = $_POST['atts'] ?? [];
        $page = (int) ($_POST['page'] ?? 1);
        
        // Add page to attributes for AJAX pagination
        $atts['current_page'] = $page;

        try {
            $activityShortcode = new \Yatra\Shortcodes\ActivityShortcode();
            $activities_data = $activityShortcode->getActivities($atts);
            
            // Prepare data for template - extract variables for template scope
            $activities = [
                'activities' => $activities_data['activities'] ?? [],
                'max_pages' => $activities_data['max_pages'] ?? 1,
                'current_page' => $activities_data['current_page'] ?? 1,
                'total_found' => $activities_data['total_found'] ?? 0
            ];
            
            // Extract variables to make them available in template
            $atts = $atts;
            $max_pages = $activities_data['max_pages'] ?? 1;
            $current_page = $activities_data['current_page'] ?? 1;
            $total_found = $activities_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-activity-grid-' . min(max($columns, 1), 4);
            
            // Debug: Log AJAX data
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra Activity AJAX - Activities count: ' . count($activities_data['activities'] ?? []));
                error_log('Yatra Activity AJAX - Total found: ' . $total_found);
                error_log('Yatra Activity AJAX - Max pages: ' . $max_pages);
                error_log('Yatra Activity AJAX - Current page: ' . $current_page);
            }

            // Load the template content with variables in scope
            ob_start();
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/activity.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $activities_data['current_page'] ?? 1,
                'max_pages' => $activities_data['max_pages'] ?? 1,
                'total_found' => $activities_data['total_found'] ?? 0
            ]);

        } catch (\Exception $e) {
            // Log error for debugging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Yatra ActivityShortcode AJAX Error: ' . $e->getMessage());
                error_log('Yatra ActivityShortcode AJAX Trace: ' . $e->getTraceAsString());
            }
            
            wp_send_json_error([
                'message' => 'Error loading activities: ' . $e->getMessage()
            ]);
        }
    }
}
