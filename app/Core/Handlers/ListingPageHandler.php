<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Core\Assets\ListingAssetManager;
use Yatra\Core\Template\TemplateRenderer;

/**
 * Listing Page Handler
 *
 * Handles listing page requests (destinations, activities, categories)
 */
class ListingPageHandler extends BasePageHandler
{
    /**
     * Handle listing page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    public function handle(array $route_data): bool
    {
    
        $listing_type = $route_data['listing_type'];
        $base = $route_data['base'];

        // Determine template based on listing type
        $template_map = [
            'trip' => 'listing-trip',
        ];

        if (!isset($template_map[$listing_type])) {
            $this->logError("Unknown listing type: {$listing_type}");
            return false;
        }

        $template = $template_map[$listing_type];
        $template_path = TemplateRenderer::getTemplatePath($template);

        if (!TemplateRenderer::templateExists($template)) {
            $this->logError("Listing template not found: {$template}");
            return false;
        }

        // Prevent 404 handling
        $this->prevent404();

        // Set up query vars for backward compatibility
        $this->setQueryVars([
            'yatra_listing_page' => $listing_type,
        ]);

        // Load trip data for trip listing pages
        if ($listing_type === 'trip') {
            $tripListingService = new \Yatra\Services\TripListingService();
            
            // Pagination: route (pretty /trip/page/N/), query var, then ?paged= / ?page=
            $page = max(1, (int) ($route_data['paged'] ?? (get_query_var('paged') ?: ($_GET['paged'] ?? $_GET['page'] ?? 1))));

            $requestParams = [
                'page' => $page,
                'per_page' => 12,
                's' => isset($_GET['s']) ? (string) wp_unslash($_GET['s']) : '',
                'destination' => $_GET['destination'] ?? '',
                'activity' => $_GET['activity'] ?? '',
                'trip_category' => $_GET['trip_category'] ?? ($_GET['category'] ?? ''),
                'price_min' => $_GET['price_min'] ?? '',
                'price_max' => $_GET['price_max'] ?? '',
                'budget' => $_GET['budget'] ?? '',
                'duration_min' => $_GET['duration_min'] ?? '',
                'duration_max' => $_GET['duration_max'] ?? '',
                'duration' => $_GET['duration'] ?? '',
                'rating_min' => $_GET['rating_min'] ?? '',
                'rating' => $_GET['rating'] ?? [],
                'difficulty' => $_GET['difficulty'] ?? [],
                'categories' => $_GET['categories'] ?? [],
                'destinations' => $_GET['destinations'] ?? [],
                'activities' => $_GET['activities'] ?? [],
                'trip_type' => $_GET['trip_type'] ?? '',
                'special_offers' => $_GET['offers'] ?? ($_GET['special_offers'] ?? []),
                'booking_options' => $_GET['booking'] ?? ($_GET['booking_options'] ?? []),
                'age_suitability' => $_GET['age'] ?? ($_GET['age_suitability'] ?? []),
                'accommodation' => $_GET['accommodation'] ?? [],
                'included_services' => $_GET['services'] ?? ($_GET['included_services'] ?? []),
                'sort' => $_GET['sort'] ?? '',
                'attributes' => (isset($_GET['attributes']) && is_array($_GET['attributes'])) ? wp_unslash($_GET['attributes']) : [],
            ];
            
            // Get filtered trips
            $tripData = $tripListingService->getFilteredTrips($requestParams);

            $GLOBALS['yatra_trip_list'] = $tripData;
            $GLOBALS['yatra_trip_listing_context'] = (new \Yatra\Services\TripListingPageContextFactory())->buildForTripArchive(
                $tripData,
                (string) ($_SERVER['REQUEST_URI'] ?? ''),
                $GLOBALS['yatra_taxonomy_context'] ?? null,
                $tripListingService->getFilterData()
            );
        }

        // Add SEO meta tags for archive pages
        if ($listing_type === 'trip') {
            $this->addTripArchiveSEOMetaTags();
        } elseif (in_array($listing_type, ['destination', 'activity', 'category'])) {
            $this->addTaxonomyArchiveSEOMetaTags($listing_type);
        }

        // Create asset manager and render template
        $asset_manager = new ListingAssetManager($listing_type);

        if (!TemplateRenderer::render($template_path, [], $asset_manager)) {
            $this->logError("Failed to render listing template for type: {$listing_type}");
            return false;
        }

        $this->exit();

        return true;
    }

    /**
     * Add SEO meta tags for taxonomy archive pages to WordPress head
     *
     * @param string $taxonomy_type Type of taxonomy (destination, activity, category)
     * @return void
     */
    private function addTaxonomyArchiveSEOMetaTags(string $taxonomy_type): void
    {
        // Get current taxonomy slug from URL
        $taxonomy_slug = '';
        $url_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($url_path, '/'));
        
        // Find the taxonomy slug in the URL
        $base_slugs = [
            'destination' => get_option('yatra_destination_base', 'destination'),
            'activity' => get_option('yatra_activity_base', 'activity'), 
            'category' => get_option('yatra_trip_category_base', 'trip-category')
        ];
        
        $base_slug = $base_slugs[$taxonomy_type] ?? $taxonomy_type;
        $base_index = array_search($base_slug, $path_parts);
        
        if ($base_index !== false && isset($path_parts[$base_index + 1])) {
            $taxonomy_slug = sanitize_text_field($path_parts[$base_index + 1]);
        }
        
        if (empty($taxonomy_slug)) {
            return; // No specific taxonomy found
        }
        
        // Get taxonomy data from database
        global $wpdb;
        $table_name = $wpdb->prefix . 'yatra_new_classifications';
        
        $taxonomy = $wpdb->get_row($wpdb->prepare("
            SELECT * FROM {$table_name} 
            WHERE type = %s AND slug = %s AND status = 'publish'
            LIMIT 1
        ", $taxonomy_type, $taxonomy_slug));
        
        if (!$taxonomy) {
            return; // Taxonomy not found or not published
        }
        
        // Get SEO metadata
        $metadata = [];
        if (!empty($taxonomy->metadata)) {
            $metadata = maybe_unserialize($taxonomy->metadata);
        }
        
        $seo_title = $metadata['seo_title'] ?? '';
        $seo_description = $metadata['seo_description'] ?? '';
        $seo_keywords = $metadata['seo_keywords'] ?? '';
        
        // If no SEO settings are configured, don't add custom meta tags
        if (empty($seo_title) && empty($seo_description) && empty($seo_keywords)) {
            return;
        }
        
        // Prepare variables for replacement
        $site_name = get_bloginfo('name');
        $site_description = get_bloginfo('description');
        $taxonomy_name = $taxonomy->name ?? '';
        $taxonomy_description = $taxonomy->description ?? '';
        
        // Variable replacements
        $replacements = [
            '{site_name}' => $site_name,
            '{site_description}' => $site_description,
            '{taxonomy_name}' => $taxonomy_name,
            '{taxonomy_description}' => wp_strip_all_tags($taxonomy_description),
            '{name}' => $taxonomy_name,
            '{description}' => wp_strip_all_tags($taxonomy_description),
        ];
        
        // Process meta title
        if (!empty($seo_title)) {
            $processed_title = str_replace(array_keys($replacements), array_values($replacements), $seo_title);
            add_action('wp_head', function() use ($processed_title) {
                echo '<meta name="title" content="' . esc_attr($processed_title) . '">' . "\n";
                echo '<meta property="og:title" content="' . esc_attr($processed_title) . '">' . "\n";
                echo '<meta property="twitter:title" content="' . esc_attr($processed_title) . '">' . "\n";
            }, 1);
            
            // Also modify the document title
            add_filter('wp_title', function($title) use ($processed_title) {
                return $processed_title;
            }, 99);
            
            // For WordPress 4.4+ (document_title_parts filter)
            add_filter('document_title_parts', function($parts) use ($processed_title) {
                $parts['title'] = $processed_title;
                unset($parts['tagline']); // Remove default tagline if present
                return $parts;
            }, 99);
        }
        
        // Process meta description
        if (!empty($seo_description)) {
            $processed_description = str_replace(array_keys($replacements), array_values($replacements), $seo_description);
            // Limit to 160 characters for SEO
            if (strlen($processed_description) > 160) {
                $processed_description = substr($processed_description, 0, 157) . '...';
            }
            add_action('wp_head', function() use ($processed_description) {
                echo '<meta name="description" content="' . esc_attr($processed_description) . '">' . "\n";
                echo '<meta property="og:description" content="' . esc_attr($processed_description) . '">' . "\n";
                echo '<meta property="twitter:description" content="' . esc_attr($processed_description) . '">' . "\n";
            }, 1);
        }
        
        // Process meta keywords
        if (!empty($seo_keywords)) {
            $processed_keywords = str_replace(array_keys($replacements), array_values($replacements), $seo_keywords);
            add_action('wp_head', function() use ($processed_keywords) {
                echo '<meta name="keywords" content="' . esc_attr($processed_keywords) . '">' . "\n";
            }, 1);
        }
        
        // Add Open Graph type for taxonomy archive page
        add_action('wp_head', function() {
            echo '<meta property="og:type" content="website">' . "\n";
            echo '<meta property="twitter:card" content="summary_large_image">' . "\n";
            echo '<meta property="og:url" content="' . esc_url(home_url($_SERVER['REQUEST_URI'])) . '">' . "\n";
        }, 1);
    }

    /**
     * Add SEO meta tags for trip archive page to WordPress head
     *
     * @return void
     */
    private function addTripArchiveSEOMetaTags(): void
    {
        // Get SEO settings from WordPress options
        $meta_title = get_option('yatra_seo_trip_meta_title', '');
        $meta_description = get_option('yatra_seo_trip_meta_description', '');
        $meta_keywords = get_option('yatra_seo_trip_meta_keywords', '');

        // If no SEO settings are configured, don't add custom meta tags
        if (empty($meta_title) && empty($meta_description) && empty($meta_keywords)) {
            return;
        }

        // Prepare variables for replacement
        $site_name = get_bloginfo('name');
        $site_description = get_bloginfo('description');
        $current_destination = sanitize_text_field($_GET['destination'] ?? '');
        $current_activity = sanitize_text_field($_GET['activity'] ?? '');
        $current_category = sanitize_text_field($_GET['trip_category'] ?? '');
        
        // Variable replacements
        $replacements = [
            '{site_name}' => $site_name,
            '{site_description}' => $site_description,
            '{destination}' => $current_destination,
            '{activity}' => $current_activity,
            '{category}' => $current_category,
        ];

        // Process meta title
        if (!empty($meta_title)) {
            $processed_title = str_replace(array_keys($replacements), array_values($replacements), $meta_title);
            add_action('wp_head', function() use ($processed_title) {
                echo '<meta name="title" content="' . esc_attr($processed_title) . '">' . "\n";
                echo '<meta property="og:title" content="' . esc_attr($processed_title) . '">' . "\n";
                echo '<meta property="twitter:title" content="' . esc_attr($processed_title) . '">' . "\n";
            }, 1);
            
            // Also modify the document title
            add_filter('wp_title', function($title) use ($processed_title) {
                return $processed_title;
            }, 99);
            
            // For WordPress 4.4+ (document_title_parts filter)
            add_filter('document_title_parts', function($parts) use ($processed_title) {
                $parts['title'] = $processed_title;
                unset($parts['tagline']); // Remove default tagline if present
                return $parts;
            }, 99);
        }

        // Process meta description
        if (!empty($meta_description)) {
            $processed_description = str_replace(array_keys($replacements), array_values($replacements), $meta_description);
            // Limit to 160 characters for SEO
            if (strlen($processed_description) > 160) {
                $processed_description = substr($processed_description, 0, 157) . '...';
            }
            add_action('wp_head', function() use ($processed_description) {
                echo '<meta name="description" content="' . esc_attr($processed_description) . '">' . "\n";
                echo '<meta property="og:description" content="' . esc_attr($processed_description) . '">' . "\n";
                echo '<meta property="twitter:description" content="' . esc_attr($processed_description) . '">' . "\n";
            }, 1);
        }

        // Process meta keywords
        if (!empty($meta_keywords)) {
            $processed_keywords = str_replace(array_keys($replacements), array_values($replacements), $meta_keywords);
            add_action('wp_head', function() use ($processed_keywords) {
                echo '<meta name="keywords" content="' . esc_attr($processed_keywords) . '">' . "\n";
            }, 1);
        }

        // Add Open Graph type for archive page
        add_action('wp_head', function() {
            echo '<meta property="og:type" content="website">' . "\n";
            echo '<meta property="twitter:card" content="summary_large_image">' . "\n";
            echo '<meta property="og:url" content="' . esc_url(home_url($_SERVER['REQUEST_URI'])) . '">' . "\n";
        }, 1);
    }
}
