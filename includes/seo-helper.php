<?php
/**
 * Yatra SEO Helper Functions
 * 
 * This file contains all SEO-related functionality for Yatra
 * including meta tags, structured data, and optimization features.
 * 
 * @package Yatra
 * @subpackage SEO
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add comprehensive SEO meta tags and structured data for single trip pages
 */
if (!function_exists('yatra_single_trip_seo_meta_tags')) {
    function yatra_single_trip_seo_meta_tags() {
        global $trip;
        
        // Only run on single trip pages
        if (!isset($trip) || empty($trip)) {
            return;
        }
        
        // Basic SEO meta tags
        $title = !empty($trip->meta_title) 
            ? esc_html($trip->meta_title)
            : esc_html($trip->title);
        
        $description = !empty($trip->meta_description)
            ? wp_strip_all_tags(strip_tags($trip->meta_description))
            : (!empty($trip->short_description) 
                ? wp_strip_all_tags(strip_tags($trip->short_description))
                : wp_strip_all_tags(strip_tags($trip->description ?? '')));
        
        // Limit description to 160 characters for SEO
        if (strlen($description) > 160) {
            $description = substr($description, 0, 157) . '...';
        }
        
        // Get primary image for SEO
        $image = !empty($trip->featured_image_url) 
            ? $trip->featured_image_url 
            : (!empty($trip->gallery_images[0]) ? $trip->gallery_images[0] : '');
        
        // Get location for SEO
        $location = !empty($trip->starting_location) ? $trip->starting_location : 
                     (!empty($trip->location) ? $trip->location : '');
        
        // Get duration for SEO
        $duration = '';
        if (!empty($trip->duration_days)) {
            if (!empty($trip->duration_nights) && $trip->duration_nights > 0) {
                $duration = sprintf(_n('%d day %d night', '%d days %d nights', $trip->duration_days, 'yatra'), $trip->duration_days, $trip->duration_nights);
            } else {
                $duration = sprintf(_n('%d day', '%d days', $trip->duration_days, 'yatra'), $trip->duration_days);
            }
        }
        
        // Get proper trip URL
        $trip_url = function_exists('yatra_get_trip_permalink') ? yatra_get_trip_permalink($trip) : home_url('/' . \Yatra\Services\SettingsService::getTripBase() . '/' . ($trip->slug ?? ''));
        
        // Output basic meta tags
        echo '<title>' . esc_html($title) . ' - ' . get_bloginfo('name') . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="keywords" content="' . esc_attr(implode(', ', [
            $title,
            $location,
            $duration,
            'trip',
            'tour',
            'travel',
            'adventure',
            !empty($trip->difficulty_level) ? $trip->difficulty_level : '',
            !empty($trip->trip_type) ? $trip->trip_type : '',
            !empty($trip->meta_keywords) ? $trip->meta_keywords : ''
        ])) . '">' . "\n";
        
        // Open Graph meta tags
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:type" content="article">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($trip_url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
            echo '<meta property="og:image:width" content="1200">' . "\n";
            echo '<meta property="og:image:height" content="630">' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($title) . '">' . "\n";
        }
        
        // Twitter Card meta tags
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        
        if ($image) {
            echo '<meta name="twitter:image" content="' . esc_url($image) . '">' . "\n";
        }
        
        // Additional SEO meta tags
        echo '<meta name="author" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($trip_url) . '">' . "\n";
        echo '<meta name="lastmod" content="' . date('c', strtotime($trip->updated_at ?? 'now')) . '">' . "\n";
        echo '<link rel="alternate" hreflang="' . get_bloginfo('language') . '" href="' . esc_url($trip_url) . '">' . "\n";
        echo '<meta name="revisit-after" content="7 days">' . "\n";
        echo '<meta name="distribution" content="global">' . "\n";
        echo '<meta name="rating" content="general">' . "\n";
        
        // Enhanced Structured Data - Comprehensive Schema Markup
        $structured_data = [
            '@context' => 'https://schema.org',
            '@type' => 'TouristTrip',
            'name' => $title,
            'description' => $description,
            'url' => $trip_url,
            'image' => $image,
            'author' => [
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => get_home_url()
            ],
            'provider' => [
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => get_home_url()
            ],
            'offers' => [
                '@type' => 'Offer',
                'price' => !empty($trip->sale_price) ? $trip->sale_price : $trip->original_price,
                'priceCurrency' => $trip->currency ?? 'USD',
                'availability' => !empty($trip->availability_dates) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'validFrom' => !empty($trip->available_from) ? date('c', strtotime($trip->available_from)) : null,
                'validThrough' => !empty($trip->available_to) ? date('c', strtotime($trip->available_to)) : null
            ],
            'inLanguage' => get_bloginfo('language'),
            'dateModified' => date('c', strtotime($trip->updated_at ?? 'now')),
            'datePublished' => date('c', strtotime($trip->created_at ?? 'now'))
        ];
        
        
        // Add comprehensive location data
        if ($location || (!empty($trip->latitude) && !empty($trip->longitude))) {
            $location_data = [
                '@type' => 'Place',
                'name' => $location ?: $trip->title
            ];
            
            if (!empty($trip->latitude) && !empty($trip->longitude)) {
                $location_data['geo'] = [
                    '@type' => 'GeoCoordinates',
                    'latitude' => (float) $trip->latitude,
                    'longitude' => (float) $trip->longitude
                ];
            }
            
            if (!empty($trip->starting_location)) {
                $location_data['address'] = [
                    '@type' => 'PostalAddress',
                    'addressLocality' => $trip->starting_location
                ];
            }
            
            $structured_data['location'] = $location_data;
        }
        
        // Add duration with proper ISO format
        if ($duration) {
            $structured_data['duration'] = $duration;
            
            // Add duration in ISO 8601 format if possible
            if (!empty($trip->duration_days) && !empty($trip->duration_nights)) {
                $structured_data['timeRequired'] = 'P' . $trip->duration_days . 'D';
            }
        }
        
        // Add comprehensive rating data
        if (!empty($trip->average_rating) && $trip->average_rating > 0) {
            $structured_data['aggregateRating'] = [
                '@type' => 'AggregateRating',
                'ratingValue' => round($trip->average_rating, 1),
                'reviewCount' => !empty($trip->review_count) ? (int)$trip->review_count : 0,
                'bestRating' => 5,
                'worstRating' => 1,
                'ratingExplanation' => __('Based on customer reviews', 'yatra')
            ];
        }
        
        // Add trip type and difficulty
        if (!empty($trip->trip_type)) {
            $structured_data['tourType'] = $trip->trip_type === 'single_day' ? 'Day Tour' : 'Multi-day Tour';
        }
        
        if (!empty($trip->difficulty_level)) {
            $structured_data['physicalRequirement'] = [
                '@type' => 'Text',
                'value' => $trip->difficulty_level
            ];
        }
        
        // Add group size information
        if (!empty($trip->min_travelers) || !empty($trip->max_travelers)) {
            $structured_data['groupSize'] = [
                '@type' => 'QuantitativeValue',
                'minValue' => !empty($trip->min_travelers) ? (int)$trip->min_travelers : 1,
                'maxValue' => !empty($trip->max_travelers) ? (int)$trip->max_travelers : 999
            ];
        }
        
        // Add price range if both prices available
        if (!empty($trip->original_price) && !empty($trip->sale_price) && $trip->sale_price < $trip->original_price) {
            $structured_data['offers']['priceSpecification'] = [
                '@type' => 'PriceSpecification',
                'price' => $trip->original_price,
                'priceCurrency' => $trip->currency ?? 'USD',
                'eligibleQuantity' => [
                    '@type' => 'QuantitativeValue',
                    'value' => 1
                ]
            ];
        }
        
        echo '<script type="application/ld+json">' . "\n";
        echo json_encode($structured_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
        echo '</script>' . "\n";
        
        // Additional SEO tags
        echo '<meta name="geo.region" content="' . esc_attr(get_option('yatra_geo_region', 'US')) . '">' . "\n";
        echo '<meta name="geo.placename" content="' . esc_attr($location) . '">' . "\n";
        echo '<meta name="geo.position" content="' . esc_attr(!empty($trip->latitude) && !empty($trip->longitude) ? $trip->latitude . ',' . $trip->longitude : '') . '">' . "\n";
        echo '<meta name="ICBM" content="' . esc_attr(!empty($trip->latitude) && !empty($trip->longitude) ? $trip->latitude . ',' . $trip->longitude : '') . '">' . "\n";
    }
}

/**
 * Add SEO meta tags for single destination pages
 */
if (!function_exists('yatra_single_destination_seo_meta_tags')) {
    function yatra_single_destination_seo_meta_tags() {
        global $destination, $yatra_taxonomy_data;
        
        // Get destination from taxonomy data if available
        if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && $yatra_taxonomy_data->type === 'destination') {
            $destination = $yatra_taxonomy_data;
        }
        
        // Only run on single destination pages
        if (!isset($destination) || empty($destination)) {
            return;
        }
        
        // Basic SEO meta tags
        $title = !empty($destination->meta_title) 
            ? esc_html($destination->meta_title)
            : esc_html($destination->name);
        
        $description = !empty($destination->meta_description)
            ? wp_strip_all_tags(strip_tags($destination->meta_description))
            : wp_strip_all_tags(strip_tags($destination->description ?? ''));
        
        // Limit description to 160 characters for SEO
        if (strlen($description) > 160) {
            $description = substr($description, 0, 157) . '...';
        }
        
        // Get primary image for SEO
        $image = !empty($destination->featured_image_url) 
            ? $destination->featured_image_url 
            : (!empty($destination->gallery_images[0]) ? $destination->gallery_images[0] : '');
        
        // Get proper destination URL
        $destination_base = \Yatra\Services\SettingsService::getString('destination_base', 'destination');
        $destination_url = function_exists('yatra_get_destination_permalink') ? yatra_get_destination_permalink($destination) : home_url('/' . $destination_base . '/' . ($destination->slug ?? ''));
        
        // Output basic meta tags
        echo '<title>' . esc_html($title) . ' - ' . get_bloginfo('name') . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="keywords" content="' . esc_attr(implode(', ', [
            $title,
            'destination',
            'travel',
            'tourism',
            'vacation',
            !empty($destination->country) ? $destination->country : '',
            !empty($destination->meta_keywords) ? $destination->meta_keywords : ''
        ])) . '">' . "\n";
        
        // Open Graph meta tags
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:type" content="place">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($destination_url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
            echo '<meta property="og:image:width" content="1200">' . "\n";
            echo '<meta property="og:image:height" content="630">' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($title) . '">' . "\n";
        }
        
        // Twitter Card meta tags
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        
        if ($image) {
            echo '<meta name="twitter:image" content="' . esc_url($image) . '">' . "\n";
        }
        
        // Additional SEO meta tags
        echo '<meta name="author" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($destination_url) . '">' . "\n";
        
        // Enhanced Structured Data - Place Schema
        $structured_data = [
            '@context' => 'https://schema.org',
            '@type' => 'Place',
            'name' => $title,
            'description' => $description,
            'url' => $destination_url,
            'image' => $image
        ];
        
        // Add location data
        if (!empty($destination->latitude) && !empty($destination->longitude)) {
            $structured_data['geo'] = [
                '@type' => 'GeoCoordinates',
                'latitude' => (float) $destination->latitude,
                'longitude' => (float) $destination->longitude
            ];
        }
        
        // Add address data
        if (!empty($destination->country) || !empty($destination->city)) {
            $structured_data['address'] = [
                '@type' => 'PostalAddress'
            ];
            
            if (!empty($destination->country)) {
                $structured_data['address']['addressCountry'] = $destination->country;
            }
            
            if (!empty($destination->city)) {
                $structured_data['address']['addressLocality'] = $destination->city;
            }
        }
        
        echo '<script type="application/ld+json">' . "\n";
        echo json_encode($structured_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
        echo '</script>' . "\n";
    }
}

/**
 * Add SEO meta tags for single activity pages
 */
if (!function_exists('yatra_single_activity_seo_meta_tags')) {
    function yatra_single_activity_seo_meta_tags() {
        global $activity, $yatra_taxonomy_data;
        
        // Get activity from taxonomy data if available
        if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && $yatra_taxonomy_data->type === 'activity') {
            $activity = $yatra_taxonomy_data;
        }
        
        // Only run on single activity pages
        if (!isset($activity) || empty($activity)) {
            return;
        }
        
        // Basic SEO meta tags
        $title = !empty($activity->meta_title) 
            ? esc_html($activity->meta_title)
            : esc_html($activity->name);
        
        $description = !empty($activity->meta_description)
            ? wp_strip_all_tags(strip_tags($activity->meta_description))
            : wp_strip_all_tags(strip_tags($activity->description ?? ''));
        
        // Limit description to 160 characters for SEO
        if (strlen($description) > 160) {
            $description = substr($description, 0, 157) . '...';
        }
        
        // Get primary image for SEO
        $image = !empty($activity->featured_image_url) 
            ? $activity->featured_image_url 
            : (!empty($activity->gallery_images[0]) ? $activity->gallery_images[0] : '');
        
        // Get proper activity URL
        $activity_base = \Yatra\Services\SettingsService::getString('activity_base', 'activity');
        $activity_url = function_exists('yatra_get_activity_permalink') ? yatra_get_activity_permalink($activity) : home_url('/' . $activity_base . '/' . ($activity->slug ?? ''));
        
        // Output basic meta tags
        echo '<title>' . esc_html($title) . ' - ' . get_bloginfo('name') . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="keywords" content="' . esc_attr(implode(', ', [
            $title,
            'activity',
            'adventure',
            'experience',
            'tour',
            !empty($activity->meta_keywords) ? $activity->meta_keywords : ''
        ])) . '">' . "\n";
        
        // Open Graph meta tags
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:type" content="article">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($activity_url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        
        if ($image) {
            echo '<meta property="og:image" content="' . esc_url($image) . '">' . "\n";
            echo '<meta property="og:image:width" content="1200">' . "\n";
            echo '<meta property="og:image:height" content="630">' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($title) . '">' . "\n";
        }
        
        // Twitter Card meta tags
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        
        if ($image) {
            echo '<meta name="twitter:image" content="' . esc_url($image) . '">' . "\n";
        }
        
        // Additional SEO meta tags
        echo '<meta name="author" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($activity_url) . '">' . "\n";
        
        // Enhanced Structured Data - Activity Schema
        $structured_data = [
            '@context' => 'https://schema.org',
            '@type' => 'TouristDestination',
            'name' => $title,
            'description' => $description,
            'url' => $activity_url,
            'image' => $image,
            'tourType' => 'Activity'
        ];
        
        echo '<script type="application/ld+json">' . "\n";
        echo json_encode($structured_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
        echo '</script>' . "\n";
    }
}

/**
 * Add SEO meta tags for category/archive pages
 */
if (!function_exists('yatra_category_seo_meta_tags')) {
    function yatra_category_seo_meta_tags() {
        global $wp_query;
        
        // Only run on category/archive pages
        if (!is_tax() && !is_archive()) {
            return;
        }
        
        $term = get_queried_object();
        if (!$term) {
            return;
        }
        
        // Basic SEO meta tags
        $title = !empty($term->meta_title) 
            ? esc_html($term->meta_title)
            : esc_html($term->name);
        
        $description = !empty($term->meta_description)
            ? wp_strip_all_tags(strip_tags($term->meta_description))
            : wp_strip_all_tags(strip_tags($term->description ?? ''));
        
        // Limit description to 160 characters for SEO
        if (strlen($description) > 160) {
            $description = substr($description, 0, 157) . '...';
        }
        
        // Get category URL
        $category_url = get_term_link($term);
        
        // Output basic meta tags
        echo '<title>' . esc_html($title) . ' - ' . get_bloginfo('name') . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="keywords" content="' . esc_attr(implode(', ', [
            $title,
            'category',
            'trips',
            'tours',
            'travel',
            !empty($term->meta_keywords) ? $term->meta_keywords : ''
        ])) . '">' . "\n";
        
        // Open Graph meta tags
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($category_url) . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        
        // Twitter Card meta tags
        echo '<meta name="twitter:card" content="summary">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        
        // Additional SEO meta tags
        echo '<meta name="author" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($category_url) . '">' . "\n";
        
        // Enhanced Structured Data - CollectionPage Schema
        $structured_data = [
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => $title,
            'description' => $description,
            'url' => $category_url
        ];
        
        echo '<script type="application/ld+json">' . "\n";
        echo json_encode($structured_data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
        echo '</script>' . "\n";
    }
}

/**
 * Add SEO functionality based on current page type
 * Hooked into wp_head action for better WordPress integration
 */
function yatra_add_seo_based_on_page_type() {
    
    // Check if we're on a single trip page
    if (yatra_is_trip_page()) {
        yatra_single_trip_seo_meta_tags();
    }
    
    // Check if we're on single destination page
    if (yatra_is_destination_page()) {
        yatra_single_destination_seo_meta_tags();
    }
    
    // Check if we're on a single activity page
    if (yatra_is_activity_page()) {
        yatra_single_activity_seo_meta_tags();
    }
    
    // Check if we're on archive/listing pages
    if (yatra_is_trip_archive_page() || yatra_is_destination_archive_page() || yatra_is_activity_archive_page() || yatra_is_listing_page()) {
        yatra_category_seo_meta_tags();
    }
}

// Hook directly into wp_head and check page type there
add_action('wp_head', 'yatra_add_seo_based_on_page_type', 1);
