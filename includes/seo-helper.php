<?php
/**
 * Yatra SEO Helper Functions
 * 
 * Production-ready clean SEO implementation using the new SEOService architecture.
 * All new SEO functionality should use SEOService and SEOManager directly.
 * 
 * @package Yatra
 */

/**
 * Helper function to get SEO title for current page
 * Useful for manual calls or custom implementations
 * 
 * @return string The SEO title for current page
 * @throws \InvalidArgumentException If SEO manager is not available
 */
function yatra_get_seo_title(): string {
    try {
        if (!class_exists('\Yatra\Managers\SEOManager')) {
            throw new \InvalidArgumentException('SEO Manager not available');
        }
        
        return \Yatra\Managers\SEOManager::filterDocumentTitle('');
    } catch (\Exception $e) {
        error_log('Yatra SEO Helper get_seo_title Error: ' . $e->getMessage());
        return '';
    }
}

/**
 * Helper function to output SEO meta tags for current page
 * Useful for manual calls or custom implementations
 * 
 * @return void
 * @throws \InvalidArgumentException If SEO manager is not available
 */
function yatra_output_seo_meta_tags(): void {
    try {
        if (!class_exists('\Yatra\Managers\SEOManager')) {
            throw new \InvalidArgumentException('SEO Manager not available');
        }
        
        \Yatra\Managers\SEOManager::outputSEOMetaTags();
    } catch (\Exception $e) {
        error_log('Yatra SEO Helper output_seo_meta_tags Error: ' . $e->getMessage());
        // Fail silently to avoid breaking page rendering
    }
}

/**
 * Helper function to get SEO service for specific page type and object
 * Useful for custom SEO implementations
 * 
 * @param string $pageType The page type
 * @param mixed $pageObject The page object
 * @return \Yatra\Services\SEOService The SEO service instance
 * @throws \InvalidArgumentException If SEO service is not available or page type is invalid
 */
function yatra_get_seo_service(string $pageType, $pageObject = null): \Yatra\Services\SEOService {
    try {
        if (!class_exists('\Yatra\Services\SEOService')) {
            throw new \InvalidArgumentException('SEO Service not available');
        }
        
        // Validate page type
        $validTypes = [
            \Yatra\Services\SEOService::PAGE_TYPE_TRIP,
            \Yatra\Services\SEOService::PAGE_TYPE_TRIP_ARCHIVE,
            \Yatra\Services\SEOService::PAGE_TYPE_DESTINATION,
            \Yatra\Services\SEOService::PAGE_TYPE_ACTIVITY,
            \Yatra\Services\SEOService::PAGE_TYPE_CATEGORY,
            \Yatra\Services\SEOService::PAGE_TYPE_DESTINATION_LISTING,
            \Yatra\Services\SEOService::PAGE_TYPE_ACTIVITY_LISTING,
            \Yatra\Services\SEOService::PAGE_TYPE_CATEGORY_LISTING,
        ];
        
        if (!in_array($pageType, $validTypes, true)) {
            throw new \InvalidArgumentException('Invalid page type: ' . $pageType);
        }
        
        return \Yatra\Services\SEOService::forPage($pageType, $pageObject);
    } catch (\Exception $e) {
        error_log('Yatra SEO Helper get_seo_service Error: ' . $e->getMessage());
        throw $e;
    }
}
