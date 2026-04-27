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

        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_activity_shortcode_nonce')) {
                      wp_die(esc_html__('Security check failed', 'yatra'), '', ['response' => 403]);
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


            // Load the template content with variables in scope
            ob_start();
            // Extract variables to make them available in template (matching trip shortcode pattern)
            $activities = $activities_data['activities'] ?? [];
            $max_pages = $activities_data['max_pages'] ?? 1;
            $current_page = $activities_data['current_page'] ?? 1;
            $total_found = $activities_data['total_found'] ?? 0;
            $columns = (int) $atts['columns'];
            $column_class = 'yatra-activity-grid-' . min(max($columns, 1), 4);
            
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/activity.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $activities_data['current_page'] ?? 1,
                'max_pages' => $activities_data['max_pages'] ?? 1,
                'total_found' => $activities_data['total_found'] ?? 0
            ]);

        } catch (\Exception $e) {

            
            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG)
                    ? 'Error loading activities: ' . $e->getMessage()
                    : __('Unable to load activities. Please try again.', 'yatra'),
            ]);
        }
    }
}
