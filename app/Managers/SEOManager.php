<?php

declare(strict_types=1);

namespace Yatra\Managers;

use Yatra\Services\SEOService;
use Yatra\Services\SettingsService;

/**
 * SEO Manager
 * 
 * Production-ready main entry point for SEO functionality
 * Routes SEO requests to appropriate services
 * Handles WordPress hooks and filters with error handling
 * 
 * @package Yatra\Managers
 */
class SEOManager
{
    /**
     * Initialize SEO functionality with error handling
     */
    public static function init(): void
    {
        try {
            // Only initialize on front-end
            if (!is_admin()) {
                add_action('wp_head', [self::class, 'outputSEOMetaTags'], 1);
                add_filter('document_title', [self::class, 'filterDocumentTitle'], 10);
            }
        } catch (\Exception $e) {
        }
    }

    /**
     * Output SEO meta tags based on current page with error handling
     */
    public static function outputSEOMetaTags(): void
    {
        try {
            $pageType = self::getCurrentPageType();
            $pageObject = self::getCurrentPageObject();

            // For archive pages, we don't need a page object
            if ($pageType) {
                $seoService = SEOService::forPage($pageType, $pageObject);
                $seoService->generateMetaTags();
            }
        } catch (\Exception $e) {

            // Fail silently to avoid breaking page rendering
        }
    }

    /**
     * Filter document title with error handling and validation
     * 
     * @param string $title The original title
     * @return string The filtered title
     */
    public static function filterDocumentTitle(string $title): string
    {
        try {
            $pageType = self::getCurrentPageType();
            $pageObject = self::getCurrentPageObject();

            if ($pageType === '') {
                return $title;
            }

            $allowsNullObject = \in_array(
                $pageType,
                [
                    SEOService::PAGE_TYPE_TRIP_ARCHIVE,
                    SEOService::PAGE_TYPE_DESTINATION_LISTING,
                    SEOService::PAGE_TYPE_ACTIVITY_LISTING,
                    SEOService::PAGE_TYPE_CATEGORY_LISTING,
                ],
                true
            );
            if (!$allowsNullObject && !$pageObject) {
                return $title;
            }

            $seoService = SEOService::forPage($pageType, $pageObject);
            $seoTitle = $seoService->getTitle();

            if (!empty($seoTitle) && is_string($seoTitle)) {
                return wp_strip_all_tags($seoTitle);
            }

            return $title;
        } catch (\Exception $e) {

            // Return original title on error
            return $title;
        }
    }

    /**
     * Get current page type with validation
     * 
     * @return string The current page type
     */
    private static function getCurrentPageType(): string
    {
        try {
            global $yatra_taxonomy_data;

            // Check if we're on trip archive page
            if (self::isTripArchivePage()) {
                return SEOService::PAGE_TYPE_TRIP_ARCHIVE;
            }

            $listingType = self::getTaxonomyListingPageType();
            if ($listingType !== '') {
                return $listingType;
            }

            // Check taxonomy pages with validation
            if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && is_object($yatra_taxonomy_data)) {
                $type = $yatra_taxonomy_data->type ?? '';
                
                switch ($type) {
                    case 'destination':
                        return SEOService::PAGE_TYPE_DESTINATION;
                    case 'activity':
                        return SEOService::PAGE_TYPE_ACTIVITY;
                    case 'category':
                        return SEOService::PAGE_TYPE_CATEGORY;
                }
            }

            // Check single trip page
            if (self::isSingleTripPage()) {
                return SEOService::PAGE_TYPE_TRIP;
            }

            return '';
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * Get current page object with validation
     * 
     * @return mixed The current page object or null
     */
    private static function getCurrentPageObject()
    {
        try {
            global $yatra_taxonomy_data, $trip;

            // Return taxonomy data for taxonomy pages with validation
            if (isset($yatra_taxonomy_data) && !empty($yatra_taxonomy_data) && is_object($yatra_taxonomy_data)) {
                return $yatra_taxonomy_data;
            }

            // Return trip object for single trip pages with validation
            if (isset($trip) && !empty($trip) && is_object($trip)) {
                return $trip;
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if current page is trip archive with validation
     * 
     * @return bool True if trip archive page
     */
    private static function isTripArchivePage(): bool
    {
        try {
            $current_url = $_SERVER['REQUEST_URI'] ?? '';
            $current_path = parse_url($current_url, PHP_URL_PATH) ?? '';
            $trip_base = SettingsService::getTripBase();
            
            // Validate inputs
            if (empty($current_path) || empty($trip_base)) {
                return false;
            }
            
            // Check for both /trip/ and /trip patterns
            $pattern1 = '/' . trim($trip_base, '/') . '/';
            $pattern2 = '/' . trim($trip_base, '/');
            
            $isArchivePage = (strpos($current_path, $pattern1) !== false || $current_path === $pattern2);
            
            return $isArchivePage && !self::isSingleTripPage();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if current page is single trip
     */
    private static function isSingleTripPage(): bool
    {
        global $trip;
        return !empty($trip) && !empty($trip->id);
    }

    /**
     * Browse-all taxonomy listing (/destination/, /activity/, …) including paged and plain ?yatra_page=.
     */
    private static function getTaxonomyListingPageType(): string
    {
        try {
            if (self::matchesTaxonomyListingRoot('destination')) {
                return SEOService::PAGE_TYPE_DESTINATION_LISTING;
            }
            if (self::matchesTaxonomyListingRoot('activity')) {
                return SEOService::PAGE_TYPE_ACTIVITY_LISTING;
            }
            if (self::matchesTaxonomyListingRoot('category')) {
                return SEOService::PAGE_TYPE_CATEGORY_LISTING;
            }
        } catch (\Exception $e) {
        }

        return '';
    }

    /**
     * True when the request is the index listing for a taxonomy (not a single term).
     */
    private static function matchesTaxonomyListingRoot(string $type): bool
    {
        $bases = [
            'destination' => SettingsService::getDestinationBase(),
            'activity' => SettingsService::getActivityBase(),
            'category' => SettingsService::getTripCategoryBase(),
        ];
        $legacyKeys = [
            'destination' => 'yatra_destination_slug',
            'activity' => 'yatra_activity_slug',
            'category' => 'yatra_category_slug',
        ];
        if (!isset($bases[$type], $legacyKeys[$type])) {
            return false;
        }

        $base = trim((string) $bases[$type], '/');
        if ($base === '') {
            return false;
        }

        $path = (string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?? '');
        $path = trim($path, '/');
        if ($path === $base) {
            return true;
        }
        if (preg_match('/^' . preg_quote($base, '/') . '\/page\/[0-9]+\/?$/', $path)) {
            return true;
        }

        $yp = isset($_GET['yatra_page']) ? sanitize_text_field(wp_unslash((string) $_GET['yatra_page'])) : '';
        if ($yp !== '' && $yp === $base) {
            $baseKey = preg_replace('/[^a-z0-9_-]/i', '', $base) ?: '';
            $slug = '';
            if ($baseKey !== '') {
                $fromBase = $_GET[$baseKey] ?? null;
                if (is_string($fromBase)) {
                    $slug = sanitize_title(wp_unslash($fromBase));
                }
            }
            if ($slug === '') {
                $legacy = $_GET[$legacyKeys[$type]] ?? '';
                $slug = is_string($legacy) ? sanitize_title(wp_unslash($legacy)) : '';
            }

            return $slug === '';
        }

        return false;
    }
}
