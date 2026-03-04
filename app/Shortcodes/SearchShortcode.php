<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Search Shortcode
 *
 * Displays advanced tour search functionality
 */
class SearchShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_search', [
            'show_filters' => 'yes',
            'show_categories' => 'yes',
            'show_destinations' => 'yes',
            'show_activities' => 'yes',
            'show_price_range' => 'yes',
            'show_duration' => 'yes',
            'show_difficulty' => 'yes',
            'placeholder' => 'Search for tours...',
            'button_text' => 'Search Tours'
        ]);
    }

    /**
     * Render the search shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // Enqueue search-specific CSS
        wp_enqueue_style(
            'yatra-trip-search-shortcode',
            YATRA_PLUGIN_URL . 'assets/css/shortcodes/trip-search-shortcode.css',
            [],
            YATRA_VERSION
        );
        
        // Enqueue JavaScript for dropdown interactions
        wp_enqueue_script(
            'yatra-trip-search-shortcode',
            YATRA_PLUGIN_URL . 'assets/js/trip-search-shortcode.js',
            ['jquery'],
            YATRA_VERSION,
            true
        );
        
        // Load the trip-search template (exact copy from /trip page)
        return $this->loadTemplate('shortcodes/trip-search.php', [
            'atts' => $atts
        ]);
    }
}
