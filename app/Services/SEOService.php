<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Services\SettingsService;

/**
 * SEO Service
 * 
 * Production-ready centralized SEO management for all Yatra pages
 * Handles meta tags, Open Graph, Twitter Cards, and Schema markup
 * Follows SOLID principles for extensibility and maintainability
 * 
 * @package Yatra\Services
 */
class SEOService
{
    /**
     * Page types supported by SEO service
     */
    public const PAGE_TYPE_TRIP = 'trip';
    public const PAGE_TYPE_TRIP_ARCHIVE = 'trip_archive';
    public const PAGE_TYPE_DESTINATION = 'destination';
    public const PAGE_TYPE_ACTIVITY = 'activity';
    public const PAGE_TYPE_CATEGORY = 'category';

    /**
     * Valid page types for validation
     */
    private const VALID_PAGE_TYPES = [
        self::PAGE_TYPE_TRIP,
        self::PAGE_TYPE_TRIP_ARCHIVE,
        self::PAGE_TYPE_DESTINATION,
        self::PAGE_TYPE_ACTIVITY,
        self::PAGE_TYPE_CATEGORY,
    ];

    /**
     * Cache key prefix
     */
    private const CACHE_KEY_PREFIX = 'yatra_seo_';

    /**
     * Cache expiration time (1 hour)
     */
    private const CACHE_EXPIRATION = 3600;

    /**
     * SEO data structure
     */
    private array $seoData = [
        'title' => '',
        'description' => '',
        'keywords' => '',
        'image' => '',
        'url' => '',
        'type' => '',
        'published_time' => '',
        'modified_time' => '',
        'author' => '',
        'publisher' => '',
    ];

    /**
     * Current page context
     */
    private string $pageType = '';
    private $pageObject = null;

    /**
     * Instance cache for performance
     */
    private static array $instanceCache = [];

    /**
     * Get SEO instance for specific page type with caching and validation
     * 
     * @param string $pageType The page type
     * @param mixed $pageObject The page object (trip, destination, etc.)
     * @return self SEO service instance
     * @throws \InvalidArgumentException If page type is invalid
     */
    public static function forPage(string $pageType, $pageObject = null): self
    {
        // Validate page type
        if (!in_array($pageType, self::VALID_PAGE_TYPES, true)) {
            throw new \InvalidArgumentException(
                sprintf('Invalid page type "%s". Valid types: %s', 
                    $pageType, 
                    implode(', ', self::VALID_PAGE_TYPES)
                )
            );
        }

        // Generate cache key
        $cacheKey = self::CACHE_KEY_PREFIX . md5($pageType . serialize($pageObject));
        
        // Check cache first
        if (isset(self::$instanceCache[$cacheKey])) {
            return self::$instanceCache[$cacheKey];
        }

        // Create new instance
        $instance = new self();
        $instance->pageType = $pageType;
        $instance->pageObject = $pageObject;
        
        // Cache the instance
        self::$instanceCache[$cacheKey] = $instance;
        
        return $instance;
    }

    /**
     * Generate and output all SEO meta tags with error handling
     */
    public function generateMetaTags(): void
    {
        try {
            $this->collectSEOData();
            
            if (empty($this->seoData['url'])) {
                $this->seoData['url'] = $this->getCurrentUrl();
            }
            
            $this->outputBasicMetaTags();
            $this->outputOpenGraphTags();
            $this->outputTwitterCardTags();
            $this->outputAdvancedMetaTags();
            $this->outputSchemaMarkup();
            
        } catch (\Exception $e) {
            // Log error and fail gracefully
            error_log('Yatra SEO Service Error: ' . $e->getMessage());
            
            // Output basic fallback meta tags
            $this->outputFallbackMetaTags();
        }
    }

    /**
     * Get page title (for document_title filter) with error handling
     * 
     * @return string The formatted page title
     */
    public function getTitle(): string
    {
        try {
            $this->collectSEOData();
            $title = $this->sanitizeText($this->seoData['title'] ?? '');
            
            if (!empty($title)) {
                return $title . ' - ' . $this->sanitizeText(get_bloginfo('name'));
            }
            
            return '';
        } catch (\Exception $e) {
            error_log('Yatra SEO Service getTitle Error: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Get current page URL
     * 
     * @return string Current page URL
     */
    private function getCurrentUrl(): string
    {
        if (function_exists('wp_get_referer')) {
            return wp_get_referer() ?: home_url('/');
        }
        
        return home_url('/');
    }

    /**
     * Output fallback meta tags in case of errors
     */
    private function outputFallbackMetaTags(): void
    {
        $title = $this->sanitizeText(get_bloginfo('name'));
        $description = $this->sanitizeText(get_bloginfo('description'));
        
        if (!empty($description)) {
            echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        }
        
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(home_url()) . '">' . "\n";
        echo '<meta name="twitter:card" content="summary">' . "\n";
        echo '<link rel="canonical" href="' . esc_url(home_url()) . '">' . "\n";
    }

    /**
     * Sanitize text for SEO output
     * 
     * @param string $text Text to sanitize
     * @return string Sanitized text
     */
    private function sanitizeText(string $text): string
    {
        return wp_strip_all_tags(strip_tags($text));
    }

    /**
     * Validate and sanitize URL
     * 
     * @param string $url URL to validate
     * @return string Validated URL
     */
    private function validateUrl(string $url): string
    {
        return esc_url(filter_var($url, FILTER_VALIDATE_URL) ?: '');
    }

    /**
     * Collect SEO data based on page type with error handling
     */
    private function collectSEOData(): void
    {
        try {
            switch ($this->pageType) {
                case self::PAGE_TYPE_TRIP_ARCHIVE:
                    $this->collectTripArchiveData();
                    break;
                case self::PAGE_TYPE_DESTINATION:
                    $this->collectDestinationData();
                    break;
                case self::PAGE_TYPE_ACTIVITY:
                    $this->collectActivityData();
                    break;
                case self::PAGE_TYPE_CATEGORY:
                    $this->collectCategoryData();
                    break;
                case self::PAGE_TYPE_TRIP:
                    $this->collectTripData();
                    break;
                default:
                    throw new \InvalidArgumentException("Unsupported page type: {$this->pageType}");
            }
        } catch (\Exception $e) {
            error_log('Yatra SEO Service collectSEOData Error: ' . $e->getMessage());
            
            // Set default values on error
            $this->setDefaultSEOData();
        }
    }

    /**
     * Set default SEO data as fallback
     */
    private function setDefaultSEOData(): void
    {
        $this->seoData = array_merge($this->seoData, [
            'title' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'author' => get_bloginfo('name'),
            'publisher' => get_bloginfo('name'),
            'type' => 'website',
            'url' => $this->getCurrentUrl(),
            'published_time' => date('c'),
            'modified_time' => date('c'),
        ]);
    }

    /**
     * Collect SEO data for trip archive page with validation
     */
    private function collectTripArchiveData(): void
    {
        try {
            $this->seoData['title'] = $this->sanitizeText(SettingsService::getString('seo_trip_meta_title', ''));
            $this->seoData['description'] = $this->sanitizeText(SettingsService::getString('seo_trip_meta_description', ''));
            $this->seoData['keywords'] = $this->sanitizeText(SettingsService::getString('seo_trip_meta_keywords', ''));
            
            // Get image from settings (attachment ID) with validation
            $imageId = SettingsService::getInt('seo_trip_meta_image', 0);
            
            if ($imageId > 0) {
                $imageUrl = wp_get_attachment_url($imageId);
                
                if ($imageUrl && filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                    $this->seoData['image'] = $this->validateUrl($imageUrl);
                }
            }
            
            $tripBase = SettingsService::getTripBase();
            $this->seoData['url'] = $this->validateUrl(home_url('/' . $tripBase . '/'));
            $this->seoData['type'] = 'website';
            $this->seoData['published_time'] = date('c');
            $this->seoData['modified_time'] = date('c');
            $this->seoData['author'] = $this->sanitizeText(get_bloginfo('name'));
            $this->seoData['publisher'] = $this->sanitizeText(get_bloginfo('name'));
            
        } catch (\Exception $e) {
            error_log('Yatra SEO Service collectTripArchiveData Error: ' . $e->getMessage());
            $this->setDefaultSEOData();
        }
    }

    /**
     * Collect SEO data for destination page
     */
    private function collectDestinationData(): void
    {
        if (!$this->pageObject) {
            return;
        }

        $destination = $this->pageObject;
        $metadata = $destination->metadata ?? [];

        $this->seoData['title'] = $metadata['seo_title'] ?? $destination->name ?? '';
        $this->seoData['description'] = $metadata['seo_description'] ?? $destination->description ?? '';
        $this->seoData['keywords'] = $metadata['seo_keywords'] ?? '';
        
        // Get featured image or gallery image
        $this->seoData['image'] = $destination->featured_image_url ?? 
                               ($destination->gallery_images[0] ?? '');
        
        $destinationBase = SettingsService::getString('destination_base', 'destination');
        $this->seoData['url'] = function_exists('yatra_get_destination_permalink') 
            ? yatra_get_destination_permalink($destination) 
            : home_url('/' . $destinationBase . '/' . ($destination->slug ?? ''));
        
        $this->seoData['type'] = 'place';
        $this->seoData['published_time'] = date('c', strtotime($destination->created_at ?? 'now'));
        $this->seoData['modified_time'] = date('c', strtotime($destination->updated_at ?? 'now'));
        $this->seoData['author'] = get_bloginfo('name');
        $this->seoData['publisher'] = get_bloginfo('name');
    }

    /**
     * Collect SEO data for activity page
     */
    private function collectActivityData(): void
    {
        if (!$this->pageObject) {
            return;
        }

        $activity = $this->pageObject;
        $metadata = $activity->metadata ?? [];

        $this->seoData['title'] = $metadata['seo_title'] ?? $activity->name ?? '';
        $this->seoData['description'] = $metadata['seo_description'] ?? $activity->description ?? '';
        $this->seoData['keywords'] = $metadata['seo_keywords'] ?? '';
        
        // Get featured image or gallery image
        $this->seoData['image'] = $activity->featured_image_url ?? 
                               ($activity->gallery_images[0] ?? '');
        
        $activityBase = SettingsService::getString('activity_base', 'activity');
        $this->seoData['url'] = function_exists('yatra_get_activity_permalink') 
            ? yatra_get_activity_permalink($activity) 
            : home_url('/' . $activityBase . '/' . ($activity->slug ?? ''));
        
        $this->seoData['type'] = 'article';
        $this->seoData['published_time'] = date('c', strtotime($activity->created_at ?? 'now'));
        $this->seoData['modified_time'] = date('c', strtotime($activity->updated_at ?? 'now'));
        $this->seoData['author'] = get_bloginfo('name');
        $this->seoData['publisher'] = get_bloginfo('name');
    }

    /**
     * Collect SEO data for category page
     */
    private function collectCategoryData(): void
    {
        if (!$this->pageObject) {
            return;
        }

        $category = $this->pageObject;
        $metadata = $category->metadata ?? [];

        $this->seoData['title'] = $metadata['seo_title'] ?? $category->name ?? '';
        $this->seoData['description'] = $metadata['seo_description'] ?? $category->description ?? '';
        $this->seoData['keywords'] = $metadata['seo_keywords'] ?? '';
        
        // Get featured image or gallery image
        $this->seoData['image'] = $category->featured_image_url ?? 
                               ($category->gallery_images[0] ?? '');
        
        $categoryBase = SettingsService::getString('trip_category_base', 'trip-categories');
        $this->seoData['url'] = function_exists('yatra_get_category_permalink') 
            ? yatra_get_category_permalink($category) 
            : home_url('/' . $categoryBase . '/' . ($category->slug ?? ''));
        
        $this->seoData['type'] = 'article';
        $this->seoData['published_time'] = date('c', strtotime($category->created_at ?? 'now'));
        $this->seoData['modified_time'] = date('c', strtotime($category->updated_at ?? 'now'));
        $this->seoData['author'] = get_bloginfo('name');
        $this->seoData['publisher'] = get_bloginfo('name');
    }

    /**
     * Collect SEO data for single trip page
     */
    private function collectTripData(): void
    {
        if (!$this->pageObject) {
            return;
        }

        $trip = $this->pageObject;

        $customTitle = trim((string) ($trip->meta_title ?? ''));
        $displayTitle = '';
        if (\is_object($trip) && \method_exists($trip, 'getTitle')) {
            $displayTitle = $this->sanitizeText($trip->getTitle());
        } else {
            $displayTitle = $this->sanitizeText((string) ($trip->title ?? $trip->name ?? ''));
        }

        $this->seoData['title'] = $customTitle !== ''
            ? $this->sanitizeText($customTitle)
            : $displayTitle;

        $customDesc = trim((string) ($trip->meta_description ?? ''));
        $fallbackDesc = '';
        if (\is_object($trip) && \method_exists($trip, 'getShortDescription')) {
            $short = $trip->getShortDescription();
            if (!empty($short)) {
                $fallbackDesc = $this->sanitizeText(\wp_strip_all_tags((string) $short));
            }
        }
        if ($fallbackDesc === '' && !empty($trip->description)) {
            $fallbackDesc = $this->sanitizeText(
                \wp_trim_words(\wp_strip_all_tags((string) $trip->description), 40, '…')
            );
        }
        if ($fallbackDesc === '') {
            $fallbackDesc = $this->sanitizeText(SettingsService::getString('seo_trip_meta_description', ''));
        }
        $this->seoData['description'] = $customDesc !== ''
            ? $this->sanitizeText($customDesc)
            : $fallbackDesc;

        $customKeywords = trim((string) ($trip->meta_keywords ?? ''));
        $this->seoData['keywords'] = $customKeywords !== ''
            ? $this->sanitizeText($customKeywords)
            : $this->sanitizeText(SettingsService::getString('seo_trip_meta_keywords', ''));

        $this->seoData['image'] = $this->resolveTripSeoImageUrl($trip);

        $this->seoData['url'] = function_exists('yatra_get_trip_permalink')
            ? yatra_get_trip_permalink($trip)
            : home_url('/' . SettingsService::getTripBase() . '/' . ($trip->slug ?? ''));

        $this->seoData['type'] = 'article';
        $this->seoData['published_time'] = date('c', strtotime($trip->created_at ?? 'now'));
        $this->seoData['modified_time'] = date('c', strtotime($trip->updated_at ?? 'now'));
        $this->seoData['author'] = get_bloginfo('name');
        $this->seoData['publisher'] = get_bloginfo('name');
    }

    /**
     * Resolve share/SEO image URL for a trip (featured, gallery, then global trip SEO image setting).
     *
     * @param object $trip
     */
    private function resolveTripSeoImageUrl(object $trip): string
    {
        $raw = '';
        if (!empty($trip->featured_image_url)) {
            $raw = (string) $trip->featured_image_url;
        } elseif (!empty($trip->gallery_images) && \is_array($trip->gallery_images)) {
            $first = $trip->gallery_images[0] ?? null;
            if (\is_string($first)) {
                $raw = $first;
            } elseif (\is_array($first)) {
                $raw = (string) ($first['url'] ?? $first['src'] ?? '');
            }
        }

        if ($raw === '') {
            $imageId = SettingsService::getInt('seo_trip_meta_image', 0);
            if ($imageId > 0) {
                $url = \wp_get_attachment_url($imageId);
                if ($url && \filter_var($url, FILTER_VALIDATE_URL)) {
                    $raw = $url;
                }
            }
        }

        return $raw !== '' ? $this->validateUrl($raw) : '';
    }

    /**
     * Output basic meta tags
     */
    private function outputBasicMetaTags(): void
    {
        if (!empty($this->seoData['description'])) {
            echo '<meta name="description" content="' . esc_attr($this->truncateText($this->seoData['description'], 160)) . '">' . "\n";
        }

        if (!empty($this->seoData['keywords'])) {
            echo '<meta name="keywords" content="' . esc_attr($this->seoData['keywords']) . '">' . "\n";
        }
    }

    /**
     * Output Open Graph meta tags
     */
    private function outputOpenGraphTags(): void
    {
        echo '<meta property="og:locale" content="en_US">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($this->seoData['title']) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($this->truncateText($this->seoData['description'], 160)) . '">' . "\n";
        echo '<meta property="og:type" content="' . esc_attr($this->seoData['type']) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($this->seoData['url']) . '">' . "\n";

        if (!empty($this->seoData['image'])) {
            echo '<meta property="og:image" content="' . esc_url($this->seoData['image']) . '">' . "\n";
            echo '<meta property="og:image:width" content="1200">' . "\n";
            echo '<meta property="og:image:height" content="630">' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($this->seoData['title']) . '">' . "\n";
        }

        if (!empty($this->seoData['published_time'])) {
            echo '<meta property="article:published_time" content="' . esc_attr($this->seoData['published_time']) . '">' . "\n";
        }

        if (!empty($this->seoData['modified_time'])) {
            echo '<meta property="article:modified_time" content="' . esc_attr($this->seoData['modified_time']) . '">' . "\n";
        }
    }

    /**
     * Output Twitter Card meta tags
     */
    private function outputTwitterCardTags(): void
    {
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($this->seoData['title']) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($this->truncateText($this->seoData['description'], 160)) . '">' . "\n";

        if (!empty($this->seoData['image'])) {
            echo '<meta name="twitter:image" content="' . esc_url($this->seoData['image']) . '">' . "\n";
        }
    }

    /**
     * Output advanced meta tags
     */
    private function outputAdvancedMetaTags(): void
    {
        echo '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' . "\n";
        echo '<link rel="canonical" href="' . esc_url($this->seoData['url']) . '">' . "\n";
        echo '<meta name="author" content="' . esc_attr($this->seoData['author']) . '">' . "\n";
        echo '<meta name="publisher" content="' . esc_attr($this->seoData['publisher']) . '">' . "\n";
        echo '<meta name="lastmod" content="' . esc_attr($this->seoData['modified_time']) . '">' . "\n";
        echo '<link rel="alternate" hreflang="en-US" href="' . esc_url($this->seoData['url']) . '">' . "\n";
        echo '<meta name="revisit-after" content="7 days">' . "\n";
        echo '<meta name="distribution" content="global">' . "\n";
        echo '<meta name="rating" content="general">' . "\n";
    }

    /**
     * Output Schema markup
     */
    private function outputSchemaMarkup(): void
    {
        $schema = $this->generateSchemaMarkup();
        if (!empty($schema)) {
            echo '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
        }
    }

    /**
     * Generate schema markup based on page type
     */
    private function generateSchemaMarkup(): array
    {
        $baseSchema = [
            '@context' => 'https://schema.org',
            'name' => $this->seoData['title'],
            'description' => $this->seoData['description'],
            'url' => $this->seoData['url'],
            'publisher' => [
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => home_url()
            ],
            'dateModified' => $this->seoData['modified_time'],
            'datePublished' => $this->seoData['published_time'],
            'inLanguage' => 'en-US',
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => get_bloginfo('name'),
                'url' => home_url()
            ]
        ];

        // Add image if available
        if (!empty($this->seoData['image'])) {
            $baseSchema['image'] = $this->seoData['image'];
        }

        switch ($this->pageType) {
            case self::PAGE_TYPE_TRIP_ARCHIVE:
                return $this->generateCollectionPageSchema($baseSchema);
            case self::PAGE_TYPE_DESTINATION:
                return $this->generatePlaceSchema($baseSchema);
            case self::PAGE_TYPE_ACTIVITY:
            case self::PAGE_TYPE_CATEGORY:
            case self::PAGE_TYPE_TRIP:
                return $this->generateArticleSchema($baseSchema);
            default:
                return $baseSchema;
        }
    }

    /**
     * Generate CollectionPage schema for archive pages
     */
    private function generateCollectionPageSchema(array $baseSchema): array
    {
        return array_merge($baseSchema, [
            '@type' => 'CollectionPage',
            'mainEntity' => [
                '@type' => 'ItemList',
                'numberOfItems' => 0, // This should be dynamically populated
                'itemListElement' => []
            ]
        ]);
    }

    /**
     * Generate Place schema for destination pages
     */
    private function generatePlaceSchema(array $baseSchema): array
    {
        return array_merge($baseSchema, [
            '@type' => 'Place',
            'address' => $this->pageObject->address ?? '',
            'geo' => [
                '@type' => 'GeoCoordinates',
                'latitude' => $this->pageObject->latitude ?? '',
                'longitude' => $this->pageObject->longitude ?? ''
            ]
        ]);
    }

    /**
     * Generate Article schema for content pages
     */
    private function generateArticleSchema(array $baseSchema): array
    {
        return array_merge($baseSchema, [
            '@type' => 'Article',
            'headline' => $this->seoData['title'],
            'author' => [
                '@type' => 'Organization',
                'name' => get_bloginfo('name')
            ]
        ]);
    }

    /**
     * Truncate text to specified length
     */
    private function truncateText(string $text, int $length): string
    {
        if (strlen($text) <= $length) {
            return $text;
        }

        return substr($text, 0, $length - 3) . '...';
    }
}
