<?php

declare(strict_types=1);

namespace Yatra\Ajax;

/**
 * AJAX for {@see \Yatra\Shortcodes\TripCategoryShortcode} pagination.
 */
class TripCategoryShortcodeAjax
{
    public function __construct()
    {
        add_action('wp_ajax_yatra_trip_category_shortcode_load', [$this, 'loadCategories']);
        add_action('wp_ajax_nopriv_yatra_trip_category_shortcode_load', [$this, 'loadCategories']);
    }

    public function loadCategories(): void
    {
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'yatra_trip_category_shortcode_nonce')) {
            wp_die(esc_html__('Security check failed', 'yatra'), '', ['response' => 403]);
        }

        $atts = $_POST['atts'] ?? [];
        if (!is_array($atts)) {
            $atts = [];
        }

        $page = (int) ($_POST['page'] ?? 1);
        $atts['current_page'] = $page;

        try {
            $shortcode = new \Yatra\Shortcodes\TripCategoryShortcode();
            $data = $shortcode->getCategories($atts);

            $categories = $data['categories'] ?? [];
            $max_pages = $data['max_pages'] ?? 1;
            $current_page = $data['current_page'] ?? 1;
            $total_found = $data['total_found'] ?? 0;
            $columns = (int) ($atts['columns'] ?? 3);
            $column_class = 'yatra-destination-grid-' . min(max($columns, 1), 6);

            ob_start();
            include YATRA_PLUGIN_PATH . 'templates/shortcodes/trip-category.php';
            $html = ob_get_clean();

            wp_send_json_success([
                'html' => $html,
                'current_page' => $current_page,
                'max_pages' => $max_pages,
                'total_found' => $total_found,
            ]);
        } catch (\Exception $e) {
            wp_send_json_error([
                'message' => (defined('WP_DEBUG') && WP_DEBUG)
                    ? 'Error loading categories: ' . $e->getMessage()
                    : __('Unable to load categories. Please try again.', 'yatra'),
            ]);
        }
    }
}
