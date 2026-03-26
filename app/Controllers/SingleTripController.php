<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\ReviewsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\TripContentTable;
use Yatra\Database\Tables\TripItineraryTable;
use Yatra\Services\SettingsService;

/**
 * Single Trip Frontend Controller
 * 
 * Prepares all data for the single trip template following Laravel patterns.
 * This controller handles data transformation and preparation only.
 * 
 * @package Yatra
 */
class SingleTripController
{
    /**
     * @var \wpdb WordPress database instance
     */
    private $wpdb;

    /**
     * @var string Trips table name
     */
    private string $table_trips;

    /**
     * @var string Destinations table name
     */
    private string $table_destinations;

    /**
     * @var string Activities table name
     */
    private string $table_activities;

    /**
     * @var string Reviews table name
     */
    private string $table_reviews;

    /**
     * @var string Trip-category relationship table name
     */
    private string $table_trip_cat_rel;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_trips = TripsTable::getTableName();
        $this->table_destinations = ClassificationsTable::getTableName();
        $this->table_activities = ClassificationsTable::getTableName();
        $this->table_reviews = ReviewsTable::getTableName();
        $this->table_trip_cat_rel = TripClassificationsTable::getTableName();
    }

    /**
     * Get trip by slug with all related data
     *
     * @param string $slug Trip slug
     * @return object|null Prepared trip data or null
     */
    public function getBySlug(string $slug): ?object
    {
        $trip = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_trips} 
                 WHERE slug = %s 
                 AND status IN ('publish', 'published', 'draft') 
                 LIMIT 1",
                $slug
            )
        );



        // Check if trip exists but has other status - return null to show "not found"
        if (!$trip) {
            // Try to find trip regardless of status to check if it exists
            $existingTrip = $this->wpdb->get_row(
                $this->wpdb->prepare(
                    "SELECT status FROM {$this->table_trips} 
                     WHERE slug = %s 
                     LIMIT 1",
                    $slug
                )
            );
            
            // If trip exists but admin is not logged in, return null to show "not found"
            if ($existingTrip && !current_user_can('yatra_edit_trips')) {
                return null;
            }
        }

        // Return null if no trip found or if trip has other status
        if (!$trip) {
            return null;
        }

        return $this->prepareTrip($trip);
    }

    /**
     * Get trip by ID with all related data
     *
     * @param int $id Trip ID
     * @return object|null Prepared trip data or null
     */
    public function getById(int $id): ?object
    {
        $trip = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_trips} 
                 WHERE id = %d 
                 LIMIT 1",
                $id
            )
        );

        if (!$trip) {
            return null;
        }

        return $this->prepareTrip($trip);
    }

    /**
     * Prepare trip data with all relationships and transformations
     *
     * @param object $trip Raw trip data from database
     * @return \Yatra\Models\Trip Prepared trip data as Trip model
     */
    private function prepareTrip(object $trip): object
    {
        // Decode JSON fields
        $trip->highlights = $this->decodeJson($trip->highlights ?? '');
        $trip->testimonials = $this->decodeJson($trip->testimonials ?? '');
        $trip->countries = $this->decodeJson($trip->countries ?? '');
        $trip->regions = $this->decodeJson($trip->regions ?? '');
        $trip->landmarks = $this->decodeJson($trip->landmarks ?? '');
        $trip->tags = $this->decodeJson($trip->tags ?? '');
        $trip->included_items = $this->decodeJson($trip->included_items ?? '');
        $trip->excluded_items = $this->decodeJson($trip->excluded_items ?? '');
        $trip->testimonial_review_ids = $this->decodeJson($trip->testimonial_review_ids ?? '');

    
        // Gallery images from separate table (with attachment IDs)
        $trip->gallery_images = $this->getGalleryImages((int) $trip->id);
        
        // Get highlights from TripContentTable
        $trip->highlights = $this->getHighlights((int) $trip->id);
        
        // Get landmarks from TripContentTable
        $trip->landmarks = $this->getLandmarks((int) $trip->id);
        
        // Get FAQs from TripContentTable
        $trip->faqs = $this->getFaqs((int) $trip->id);
        
        // Get downloadable items from TripContentTable
        $trip->downloadable_items = $this->getDownloadableItems((int) $trip->id);
        
        // Get videos, YouTube videos, virtual tours, and documents from TripContentTable
        $trip->videos = $this->getVideos((int) $trip->id);
        $trip->youtube_videos = $this->getYoutubeVideos((int) $trip->id);
        $trip->virtual_tours = $this->getVirtualTours((int) $trip->id);
        $trip->documents = $this->getDocuments((int) $trip->id);
        
        // Also check main trip table fields for YouTube videos and virtual tours
        $youtube_from_table = [];
        if (!empty($trip->video_url)) {
            $video_id = $this->extractYoutubeVideoId($trip->video_url);
            $youtube_from_table[] = [
                'id' => 'main_' . $trip->id,
                'title' => $trip->title ?? '',
                'description' => '',
                'url' => $trip->video_url,
                'thumbnail' => $video_id ? "https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg" : '',
                'video_id' => $video_id,
                'duration' => '',
                'embed_url' => $video_id ? "https://www.youtube.com/embed/{$video_id}" : ''
            ];
        }
        
        $tours_from_table = [];
        if (!empty($trip->virtual_tour_url)) {
            $tours_from_table[] = [
                'id' => 'main_' . $trip->id,
                'title' => $trip->title ?? '360° Virtual Tour',
                'description' => '',
                'url' => $trip->virtual_tour_url,
                'thumbnail' => '',
                'tour_type' => '360',
                'is_embeddable' => false
            ];
        }
        
        // Merge TripContentTable results with main table results
        $trip->youtube_videos = array_merge($trip->youtube_videos, $youtube_from_table);
        $trip->virtual_tours = array_merge($trip->virtual_tours, $tours_from_table);
        
        
        // Get price types from database table (for traveler-based pricing)
        $trip->price_types = $this->getPriceTypes((int) $trip->id);
        
        // Determine pricing type - use database value, fallback to 'regular'
        // If pricing_type is set to 'traveler_based' in DB, use that
        // If pricing_type is empty but price_types exist, infer 'traveler_based'
        if (empty($trip->pricing_type)) {
            $trip->pricing_type = !empty($trip->price_types) ? 'traveler_based' : 'regular';
        }
        
        // Load itinerary from new database tables (preferred) or fallback to JSON field
        $itinerary_from_db = $this->getItineraryDays((int) $trip->id);
        if (!empty($itinerary_from_db)) {
            $trip->itinerary_days = $itinerary_from_db;
        } else {
            // Fallback to old JSON field if new tables are empty
            $trip->itinerary_days = $this->decodeJson($trip->itinerary_days ?? '');
        }
        
        // FAQs are now loaded from TripContentTable in getFaqs() method
        $db_frontend_tabs = $this->decodeJson($trip->frontend_tabs ?? '');
        
        // Merge database data with complete default array to ensure all sections are available
        $trip->frontend_tabs = $this->mergeFrontendTabsWithDefaults($db_frontend_tabs);
        
        // Fetch availability dates from database table
        $trip->availability_dates = $this->getAvailabilityDates((int) $trip->id);
        
        // Get booking mode information (date-specific vs flexible)
        $resolutionService = new \Yatra\Services\AvailabilityResolutionService();
        $bookingModeInfo = $resolutionService->getBookingMode((int) $trip->id);
        $trip->booking_mode = $bookingModeInfo['mode'];
        $trip->has_specific_availability = $bookingModeInfo['has_availability'];
        
        $trip->blackout_dates = $this->decodeJson($trip->blackout_dates ?? '');
        
        // Get trip attributes with their values
        $trip->attributes = $this->getTripAttributes((int) $trip->id);

        
         
        // Set default values for numeric fields
        $trip->duration_days = (int) ($trip->duration_days ?? 1);
        $trip->duration_nights = (int) ($trip->duration_nights ?? 0);
        $trip->min_travelers = (int) ($trip->min_travelers ?? 1);
        $trip->max_travelers = (int) ($trip->max_travelers ?? 10);
        $trip->age_min = (int) ($trip->age_min ?? 0);
        $trip->age_max = (int) ($trip->age_max ?? 99);

        // Set default values for price fields
        $trip->original_price = (float) ($trip->original_price ?? 0);
        $trip->sale_price = !empty($trip->sale_price) ? (float) $trip->sale_price : 0;
        $trip->discounted_price = !empty($trip->discounted_price) ? (float) $trip->discounted_price : 0;
        $trip->deposit_amount = (float) ($trip->deposit_amount ?? 0);

        // Get currency
        $trip->currency = SettingsService::getCurrency();

        // Compute effective pricing via centralized TripPricingService (single source of truth)
        $displayPricing = \Yatra\Services\TripPricingService::resolveDisplayPricing($trip);
        $trip->effective_price_min = $displayPricing['effective_price_min'];
        $trip->min_category_original_price = $displayPricing['min_category_original_price'];
        $trip->max_discount_percentage = $displayPricing['max_discount_percentage'];
        $trip->discount_percentage = $displayPricing['discount_percentage'];

        // Ensure ID is integer
        $trip_id = (int) $trip->id;

        // Fetch related data
        $trip->destinations = $this->getDestinations($trip_id);
        $trip->activities = $this->getActivities($trip_id);
        $trip->trip_categories = $this->getTripCategories($trip_id);
        $trip->reviews = $this->getReviews($trip_id);
        $trip->testimonials = $this->getTestimonials($trip_id);
        $trip->similar_trips = $this->getSimilarTrips($trip);

        // Calculate rating
        $trip->average_rating = $this->calculateAverageRating($trip->reviews);
        $trip->review_count = count($trip->reviews);

        // Calculate base price for template display
        $trip->base_price = $this->calculateBasePrice($trip);
        
        // Availability flags for backward compatibility and template logic
        // has_availability: true if specific dates/rules exist
        $trip->has_availability = !empty($trip->availability_dates) && is_array($trip->availability_dates) && count($trip->availability_dates) > 0;
        
        // has_booking_capability: true if trip can be booked (either specific dates OR flexible mode)
        // This ensures booking interface always shows (industry best practice)
        $trip->has_booking_capability = $trip->has_availability || ($trip->booking_mode === 'flexible');
        
        $trip->has_traveler_pricing = ($trip->pricing_type === 'traveler_based' && !empty($trip->price_types));
        
        // Format featured image
        $trip->featured_image_url = $this->getFeaturedImageUrl($trip->featured_image ?? '');

        // Convert stdClass to Trip model instance
        return \Yatra\Models\Trip::fromStdClass($trip);
    }

    /**
     * Calculate base price for template display
     * 
     * Delegates to centralized TripPricingService (single source of truth).
     * 
     * @param object $trip Trip object
     * @return float Base price
     */
    private function calculateBasePrice(object $trip): float
    {
        $availDates = !empty($trip->availability_dates) && is_array($trip->availability_dates)
            ? $trip->availability_dates : null;

        $pricing = \Yatra\Services\TripPricingService::resolveDisplayPricing($trip, $availDates);
        return (float) $pricing['effective_price_min'];
    }

    /**
     * Decode JSON safely
     *
     * @param string|null $json JSON string
     * @return array Decoded array or empty array
     */
    private function decodeJson(?string $json): array
    {
        if (empty($json)) {
            return [];
        }

        $decoded = json_decode($json, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Get availability dates for a trip using centralized resolution service
     *
     * @param int $trip_id Trip ID
     * @return array Array of availability date objects
     */
    private function getAvailabilityDates(int $trip_id): array
    {
        // Use centralized AvailabilityResolutionService
        $resolutionService = new \Yatra\Services\AvailabilityResolutionService();
        
        // Get dates for next 12 months
        $fromDate = date('Y-m-d');
        $toDate = date('Y-m-d', strtotime('+12 months'));
        
        $availability = $resolutionService->getAllAvailabilityDates($trip_id, $fromDate, $toDate);
        
        // Add calculated fields
        foreach ($availability as $avail) {
            // Calculate if limited availability
            $avail->is_limited = ($avail->seats_available <= 5 && $avail->seats_available > 0);
            $avail->is_sold_out = ($avail->seats_available <= 0 || $avail->status === 'sold_out');
            
            // Debug logging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log(sprintf(
                    'Yatra Availability [%s]: Date=%s, PricingType=%s, HasPriceTypes=%s, EffectivePrice=%s, Seats=%d',
                    $avail->source,
                    $avail->departure_date,
                    $avail->pricing_type,
                    !empty($avail->price_types) ? 'YES(' . count($avail->price_types) . ')' : 'NO',
                    $avail->effective_price ?? 'null',
                    $avail->seats_available
                ));
            }
        }
        
        return $availability;
    }

    /**
     * Get price types for trip (traveler-based pricing)
     *
     * @param int $trip_id Trip ID
     * @return array Price types with category info
     */
    private function getPriceTypes(int $trip_id): array
    {
        // Read price_types JSON from trips table
        $table = esc_sql(TripsTable::getTableName());
        $json = $this->wpdb->get_var(
            $this->wpdb->prepare("SELECT price_types FROM `{$table}` WHERE id = %d", $trip_id)
        );

        if (empty($json)) {
            return [];
        }

        $decoded = is_string($json) ? json_decode($json, true) : $json;
        if (!is_array($decoded) || empty($decoded)) {
            return [];
        }

        // Collect category IDs for enrichment
        $category_ids = [];
        foreach ($decoded as $pt) {
            if (!is_array($pt)) continue;
            $cat_id = $pt['category_id'] ?? null;
            if ($cat_id !== null && $cat_id !== '') {
                $category_ids[] = (int) $cat_id;
            }
        }

        // Fetch category metadata (label, slug, pricing_mode, age_min, age_max, min_pax, max_pax)
        $categories = [];
        if (!empty($category_ids)) {
            $classifications_table = esc_sql(ClassificationsTable::getTableName());
            $placeholders = implode(',', array_fill(0, count($category_ids), '%d'));
            $rows = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT id, name, slug, metadata FROM `{$classifications_table}` WHERE id IN ({$placeholders})",
                    ...$category_ids
                )
            );
            foreach ($rows as $row) {
                $meta = !empty($row->metadata) ? json_decode($row->metadata, true) : [];
                $categories[(int) $row->id] = (object) [
                    'label'        => $row->name,
                    'slug'         => $row->slug,
                    'pricing_mode' => $meta['pricing_mode'] ?? 'per_person',
                    'age_min'      => isset($meta['age_min']) ? (int) $meta['age_min'] : null,
                    'age_max'      => isset($meta['age_max']) ? (int) $meta['age_max'] : null,
                    'min_pax'      => isset($meta['min_pax']) ? (int) $meta['min_pax'] : null,
                    'max_pax'      => isset($meta['max_pax']) ? (int) $meta['max_pax'] : null,
                    'max_quantity'  => isset($meta['max_quantity']) ? (int) $meta['max_quantity'] : null,
                    'description'  => $meta['description'] ?? '',
                ];
            }
        }

        // Build enriched price_types as objects
        $result = [];
        foreach ($decoded as $pt) {
            if (!is_array($pt)) continue;

            $cat_id = isset($pt['category_id']) ? (int) $pt['category_id'] : null;
            $cat = ($cat_id !== null && isset($categories[$cat_id])) ? $categories[$cat_id] : null;

            $original   = isset($pt['original_price']) ? (float) $pt['original_price'] : 0;
            $discounted = isset($pt['discounted_price']) ? (float) $pt['discounted_price'] : 0;
            $effective  = ($discounted > 0 && $discounted < $original) ? $discounted : $original;

            $result[] = (object) [
                'category_id'      => $cat_id,
                'category_label'   => $cat ? $cat->label : ($pt['label'] ?? __('Traveler', 'yatra')),
                'category_slug'    => $cat ? $cat->slug : '',
                'original_price'   => $original,
                'discounted_price' => $discounted,
                'effective_price'  => $effective,
                'pricing_mode'     => $cat ? $cat->pricing_mode : ($pt['pricing_mode'] ?? 'per_person'),
                'age_min'          => $cat ? $cat->age_min : null,
                'age_max'          => $cat ? $cat->age_max : null,
                'min_pax'          => $cat ? $cat->min_pax : null,
                'max_pax'          => $cat ? $cat->max_pax : null,
                'max_quantity'     => $cat ? $cat->max_quantity : null,
                'description'      => $cat ? $cat->description : ($pt['description'] ?? ''),
            ];
        }

        return $result;
    }

    /**
     * Get destinations for trip
     *
     * @param int $trip_id Trip ID
     * @return array Destinations
     */
    private function getDestinations(int $trip_id): array
    {
        // Use TripClassificationsTable for trip-destination relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $destination_ids = $this->wpdb->get_col(
            $this->wpdb->prepare(
                "SELECT classification_id FROM {$tripClassificationsTable} 
                 WHERE trip_id = %d AND classification_id IN (
                     SELECT id FROM {$classificationsTable} WHERE type = 'destination'
                 )",
                $trip_id
            )
        );

        if (empty($destination_ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($destination_ids), '%d'));
        $destinations = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$classificationsTable} 
                 WHERE id IN ({$placeholders})",
                ...$destination_ids
            )
        );
        
        return $destinations ?: [];
    }

    /**
     * Get activities for trip
     *
     * @param int $trip_id Trip ID
     * @return array Activities
     */
    private function getActivities(int $trip_id): array
    {
        // Use TripClassificationsTable for trip-activity relationships
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        $activity_ids = $this->wpdb->get_col(
            $this->wpdb->prepare(
                "SELECT classification_id FROM {$tripClassificationsTable} 
                 WHERE trip_id = %d AND classification_id IN (
                     SELECT id FROM {$classificationsTable} WHERE type = 'activity'
                 )",
                $trip_id
            )
        );

        if (empty($activity_ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($activity_ids), '%d'));
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$classificationsTable} 
                 WHERE id IN ({$placeholders})",
                ...$activity_ids
            )
        ) ?: [];
    }

    /**
     * Get gallery images for trip
     *
     * @param int $trip_id Trip ID
     * @return array Gallery images with URLs
     */
    private function getGalleryImages(int $trip_id): array
    {
        // Use TripContentTable for gallery images
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $images = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'image'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        // Convert to array of URLs
        $gallery = [];
        foreach ($images as $img) {
            $url = '';
            
            // Check metadata for attachment_id (stored as JSON)
            if (!empty($img->metadata)) {
                $metadata = json_decode($img->metadata, true);
                if (is_array($metadata) && !empty($metadata['attachment_id'])) {
                    $url = wp_get_attachment_image_url((int) $metadata['attachment_id'], 'large');
                }
            }
            
            // Fallback to content_url field (direct URL)
            if (empty($url) && !empty($img->content_url)) {
                $url = $img->content_url;
            }
            
            if (!empty($url)) {
                $gallery[] = $url;
            }
        }
        
        return $gallery;
    }

    /**
     * Get videos for trip
     *
     * @param int $trip_id Trip ID
     * @return array Videos with URLs and metadata
     */
    private function getVideos(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $videos = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'video'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        $video_list = [];
        foreach ($videos as $video) {
            $video_data = [
                'id' => $video->id,
                'title' => $video->title ?? '',
                'description' => $video->description ?? '',
                'url' => $video->content_url ?? '',
                'thumbnail' => $video->thumbnail_url ?? '',
                'duration' => '',
                'file_size' => $video->file_size ?? 0
            ];
            
            // Parse metadata for additional info
            if (!empty($video->metadata)) {
                $metadata = json_decode($video->metadata, true);
                if (is_array($metadata)) {
                    $video_data['duration'] = $metadata['duration'] ?? '';
                    $video_data['file_size'] = $metadata['file_size'] ?? $video_data['file_size'];
                }
            }
            
            if (!empty($video_data['url'])) {
                $video_list[] = $video_data;
            }
        }
        
        return $video_list;
    }

    /**
     * Get documents for trip
     *
     * @param int $trip_id Trip ID
     * @return array Documents with URLs and metadata
     */
    private function getDocuments(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $documents = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'document'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        $document_list = [];
        foreach ($documents as $doc) {
            $doc_data = [
                'id' => $doc->id,
                'title' => $doc->title ?? '',
                'description' => $doc->description ?? '',
                'url' => $doc->content_url ?? '',
                'file_path' => $doc->file_path ?? '',
                'file_size' => $doc->file_size ?? 0,
                'file_type' => $doc->file_type ?? '',
                'is_downloadable' => (bool) ($doc->is_downloadable ?? true)
            ];
            
            if (!empty($doc_data['url']) || !empty($doc_data['file_path'])) {
                $document_list[] = $doc_data;
            }
        }
        
        return $document_list;
    }

    /**
     * Get YouTube videos for trip
     *
     * @param int $trip_id Trip ID
     * @return array YouTube videos with URLs and metadata
     */
    private function getYoutubeVideos(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        // Debug: Check what content types exist for this trip
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $all_content = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT content_type, COUNT(*) as count FROM {$tripContentTable} 
                     WHERE trip_id = %d 
                     GROUP BY content_type",
                    $trip_id
                )
            );
            foreach ($all_content as $content) {
                }
        }
        
        $youtube_videos = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'youtube'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        $video_list = [];
        foreach ($youtube_videos as $video) {
            $video_data = [
                'id' => $video->id,
                'title' => $video->title ?? '',
                'description' => $video->description ?? '',
                'url' => $video->content_url ?? '',
                'thumbnail' => $video->thumbnail_url ?? '',
                'video_id' => '',
                'duration' => ''
            ];
            
            // Extract YouTube video ID from URL
            if (!empty($video_data['url'])) {
                $video_id = $this->extractYoutubeVideoId($video_data['url']);
                if ($video_id) {
                    $video_data['video_id'] = $video_id;
                    $video_data['thumbnail'] = $video_data['thumbnail'] ?: "https://img.youtube.com/vi/{$video_id}/maxresdefault.jpg";
                    $video_data['embed_url'] = "https://www.youtube.com/embed/{$video_id}";
                }
            }
            
            // Parse metadata for additional info
            if (!empty($video->metadata)) {
                $metadata = json_decode($video->metadata, true);
                if (is_array($metadata)) {
                    $video_data['duration'] = $metadata['duration'] ?? $video_data['duration'];
                }
            }
            
            if (!empty($video_data['url'])) {
                $video_list[] = $video_data;
            }
        }
        
        return $video_list;
    }

    /**
     * Get virtual tours (360°) for trip
     *
     * @param int $trip_id Trip ID
     * @return array Virtual tours with URLs and metadata
     */
    private function getVirtualTours(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $virtual_tours = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'virtual_tour'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        ) ?: [];
        
        $tour_list = [];
        foreach ($virtual_tours as $tour) {
            $tour_data = [
                'id' => $tour->id,
                'title' => $tour->title ?? '',
                'description' => $tour->description ?? '',
                'url' => $tour->content_url ?? '',
                'thumbnail' => $tour->thumbnail_url ?? '',
                'tour_type' => '360',
                'is_embeddable' => false
            ];
            
            // Parse metadata for additional info
            if (!empty($tour->metadata)) {
                $metadata = json_decode($tour->metadata, true);
                if (is_array($metadata)) {
                    $tour_data['tour_type'] = $metadata['tour_type'] ?? '360';
                    $tour_data['is_embeddable'] = $metadata['is_embeddable'] ?? false;
                }
            }
            
            if (!empty($tour_data['url'])) {
                $tour_list[] = $tour_data;
            }
        }
        
        return $tour_list;
    }

    /**
     * Get highlights for a trip from TripContentTable
     *
     * @param int $trip_id Trip ID
     * @return array Array of highlights
     */
    private function getHighlights(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $highlights = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'highlight'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        );
        
        // Convert to simple array of highlight titles
        $highlight_texts = [];
        foreach ($highlights as $highlight) {
            if (!empty($highlight->title)) {
                $highlight_texts[] = $highlight->title;
            } elseif (!empty($highlight->description)) {
                $highlight_texts[] = $highlight->description;
            }
        }
        
        return $highlight_texts;
    }

    /**
     * Get landmarks for a trip
     *
     * @param int $trip_id Trip ID
     * @return array Array of landmark texts
     */
    private function getLandmarks(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $landmarks = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'landmark'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        );
        
        // Convert to simple array of landmark texts
        $landmark_texts = [];
        foreach ($landmarks as $landmark) {
            if (!empty($landmark->title)) {
                $landmark_texts[] = $landmark->title;
            } elseif (!empty($landmark->description)) {
                $landmark_texts[] = $landmark->description;
            }
        }
        
        return $landmark_texts;
    }

    /**
     * Get FAQs for a trip
     *
     * @param int $trip_id Trip ID
     * @return array Array of FAQ objects
     */
    private function getFaqs(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $faqs = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'faq'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        );
        
        return $faqs ?: [];
    }

    /**
     * Get downloadable items for a trip
     *
     * @param int $trip_id Trip ID
     * @return array Array of downloadable item objects
     */
    private function getDownloadableItems(int $trip_id): array
    {
        $tripContentTable = \Yatra\Database\Tables\TripContentTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripContentTable
            )
        ) === $tripContentTable;
        
        if (!$table_exists) {
            return [];
        }
        
        $downloads = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$tripContentTable} 
                 WHERE trip_id = %d AND content_type = 'download'
                 ORDER BY sort_order ASC, id ASC",
                $trip_id
            )
        );
        
        if (!$downloads) {
            return [];
        }
        
        // Normalize downloads to match expected format
        $normalized = [];
        foreach ($downloads as $download) {
            $metadata = [];
            if (!empty($download->metadata)) {
                $decoded = json_decode($download->metadata, true);
                if (is_array($decoded)) {
                    $metadata = $decoded;
                }
            }
            
            $attachmentId = $metadata['attachment_id'] ?? null;
            $protectedPath = $metadata['protected_path'] ?? null;
            $visibility = $metadata['visibility'] ?? 'booked_only';
            
            $normalized[] = (object) [
                'id' => isset($download->id) ? (int) $download->id : 0,
                'title' => $download->title ?? '',
                'description' => $download->description ?? '',
                'attachment_id' => $attachmentId ? (int) $attachmentId : null,
                'protected_path' => $protectedPath,
                'content_url' => $download->content_url ?? '',
                'file_path' => $download->file_path ?? null,
                'file_size' => isset($download->file_size) ? (int) $download->file_size : null,
                'file_type' => $download->file_type ?? null,
                'thumbnail_url' => $download->thumbnail_url ?? null,
                'visibility' => $visibility,
                'is_downloadable' => isset($download->is_downloadable) ? (bool) $download->is_downloadable : true,
                'sort_order' => isset($download->sort_order) ? (int) $download->sort_order : 0,
            ];
        }
        
        return $normalized;
    }

    /**
     * Extract YouTube video ID from URL
     *
     * @param string $url YouTube URL
     * @return string|null Video ID or null if not found
     */
    private function extractYoutubeVideoId(string $url): ?string
    {
        $patterns = [
            '/youtube\.com\/watch\?v=([^&]+)/',
            '/youtube\.com\/embed\/([^?]+)/',
            '/youtu\.be\/([^?]+)/',
            '/youtube\.com\/v\/([^?]+)/'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    /**
     * Get trip categories for trip
     *
     * @param int $trip_id Trip ID
     * @return array Trip categories
     */
    private function getTripCategories(int $trip_id): array
    {
        // Use new Classification tables
        $tripClassificationsTable = \Yatra\Database\Tables\TripClassificationsTable::getTableName();
        $classificationsTable = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        
        // Check if relation table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $tripClassificationsTable
            )
        ) === $tripClassificationsTable;
        
        if (!$table_exists) {
            return [];
        }
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT c.id, c.name, c.slug 
                 FROM {$tripClassificationsTable} tc
                 LEFT JOIN {$classificationsTable} c ON tc.classification_id = c.id
                 WHERE tc.trip_id = %d AND c.type = 'category'
                 ORDER BY tc.sort_order ASC, tc.id ASC",
                $trip_id
            )
        ) ?: [];
    }

    /**
     * Get reviews for trip
     *
     * @param int $trip_id Trip ID
     * @return array Reviews
     */
    private function getReviews(int $trip_id): array
    {
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $this->table_reviews
            )
        );

        if (!$table_exists) {
            return [];
        }

        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table_reviews} 
                 WHERE trip_id = %d 
                 AND status = 'approved' 
                 ORDER BY created_at DESC 
                 LIMIT 10",
                $trip_id
            )
        ) ?: [];
    }

    /**
     * Get testimonials (selected reviews for this trip)
     *
     * @param int $trip_id Trip ID
     * @return array Testimonial reviews
     */
    private function getTestimonials(int $trip_id): array
    {
        // Get testimonial_review_ids from trip data
        $testimonial_ids = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT testimonial_review_ids FROM {$this->table_trips} 
                 WHERE id = %d 
                 LIMIT 1",
                $trip_id
            )
        );

        if (empty($testimonial_ids)) {
            return [];
        }

        // Decode JSON array of IDs
        $review_ids = json_decode($testimonial_ids, true);
        if (!is_array($review_ids) || empty($review_ids)) {
            return [];
        }

        // Filter out invalid IDs
        $review_ids = array_filter($review_ids, 'is_numeric');
        if (empty($review_ids)) {
            return [];
        }

        // Get the actual review data
        $placeholders = implode(',', array_fill(0, count($review_ids), '%d'));
        
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT r.*, u.display_name as author_display_name
                 FROM {$this->table_reviews} r
                 LEFT JOIN {$this->wpdb->users} u ON r.user_id = u.ID
                 WHERE r.id IN ($placeholders)
                 AND r.status = 'approved'
                 ORDER BY r.created_at DESC",
                ...$review_ids
            )
        ) ?: [];
    }

    /**
     * Get similar trips
     *
     * @param object $trip Current trip
     * @return array Similar trips
     */
    private function getSimilarTrips(object $trip): array
    {
        $trip_id = (int) $trip->id;
        
        // Get similar trips based on category or difficulty
        $similar = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id, title, slug, featured_image AS featured_image_id, '' AS featured_image_url, duration_days, duration_nights, 
                        original_price, sale_price, difficulty_level, 
                        short_description
                 FROM {$this->table_trips} t
                 WHERE t.id != %d 
                 AND t.status IN ('publish', 'published') 
                 AND (t.deleted_at IS NULL OR t.deleted_at = '0000-00-00 00:00:00')
                 AND (
                    EXISTS (
                        SELECT 1 FROM {$this->table_trip_cat_rel} tc 
                        WHERE tc.trip_id = t.id 
                          AND tc.classification_type = 'category'
                          AND tc.classification_id IN (
                            SELECT tc2.classification_id 
                            FROM {$this->table_trip_cat_rel} tc2 
                            WHERE tc2.trip_id = %d
                              AND tc2.classification_type = 'category'
                          )
                    )
                    OR t.difficulty_level = %s
                 )
                 ORDER BY RAND() 
                 LIMIT 4",
                $trip_id,
                $trip_id,
                $trip->difficulty_level ?? ''
            )
        );

        // Fallback: Get any published trips if no similar found
        if (empty($similar)) {
            $similar = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT id, title, slug, featured_image AS featured_image_id, '' AS featured_image_url, duration_days, duration_nights, 
                            original_price, sale_price, difficulty_level, 
                            short_description
                     FROM {$this->table_trips} 
                     WHERE id != %d 
                     AND status IN ('publish', 'published') 
                     AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
                     ORDER BY RAND() 
                     LIMIT 4",
                    $trip_id
                )
            );
        }

        // Prepare each similar trip
        foreach ($similar as &$s) {
            $s->highlights = []; // Empty array as default
            $s->duration_days = (int) ($s->duration_days ?? 1);
            $s->duration_nights = (int) ($s->duration_nights ?? 0);
            $s->original_price = (float) ($s->original_price ?? 0);
            $s->sale_price = (float) ($s->sale_price ?? $s->original_price);
            $s->currency = $s->currency ?? get_option('yatra_currency', 'USD');
            // Handle featured image - use URL if available, otherwise get from ID
            if (!empty($s->featured_image_url)) {
                // URL is already set, keep it as is
            } elseif (!empty($s->featured_image_id)) {
                $s->featured_image_url = $this->getFeaturedImageUrl($s->featured_image_id);
            } else {
                $s->featured_image_url = $this->getFeaturedImageUrl('');
            }
            
            // Calculate discount
            $s->discount_percentage = 0;
            if ($s->original_price > 0 && $s->sale_price < $s->original_price) {
                $s->discount_percentage = round((($s->original_price - $s->sale_price) / $s->original_price) * 100);
            }
        }

        return $similar ?: [];
    }

    /**
     * Get trip attributes with their values
     *
     * @param int $trip_id Trip ID
     * @return array Trip attributes with values
     */
    private function getTripAttributes(int $trip_id): array
    {
        $table_classifications = ClassificationsTable::getTableName();
        
        // Check if table exists
        $table_exists = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table_classifications
            )
        ) === $table_classifications;
        
        if (!$table_exists) {
            return [];
        }
        
        $attributes = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT c.id, c.name, c.slug, c.description, c.icon, c.metadata,
                        JSON_EXTRACT(c.metadata, '$.field_type') as field_type,
                        JSON_EXTRACT(c.metadata, '$.field_options') as field_options,
                        JSON_EXTRACT(c.metadata, '$.value') as value,
                        JSON_EXTRACT(c.metadata, '$.value_serialized') as value_serialized
                 FROM {$table_classifications} c
                 WHERE c.type = 'attribute'
                 AND JSON_EXTRACT(c.metadata, '$.trip_id') = %d
                 AND c.status = 'publish'
                 ORDER BY c.sorting ASC, c.name ASC",
                $trip_id
            )
        );
        
        $formatted_attributes = [];
        foreach ($attributes as $attr) {
            $value = $attr->value;
            if ($attr->value_serialized) {
                $value = unserialize($value);
            }
            
            // Resolve image URLs for image type icons
            $icon_data = null;
            if (!empty($attr->icon)) {
                $icon_data = maybe_unserialize($attr->icon);
                if (is_array($icon_data) && $icon_data['type'] === 'image' && !empty($icon_data['value'])) {
                    $icon_value = $icon_data['value'];
                    $image_url = '';
                    
                    if (is_numeric($icon_value)) {
                        $maybe_url = wp_get_attachment_image_url((int) $icon_value, 'large');
                        if (!empty($maybe_url)) {
                            $image_url = $maybe_url;
                        }
                    } elseif (is_string($icon_value) && filter_var($icon_value, FILTER_VALIDATE_URL)) {
                        $image_url = $icon_value;
                    }
                    
                    $icon_data['value'] = $image_url;
                }
            }
            
            $formatted_attributes[] = [
                'id' => $attr->id,
                'name' => $attr->name,
                'field_type' => $attr->field_type,
                'field_options' => $attr->field_options,
                'value' => $value,
                'icon' => $icon_data,
                'description' => $attr->description
            ];
        }
        
        return $formatted_attributes;
    }

    /**
     * Calculate average rating from reviews
     *
     * @param array $reviews Reviews array
     * @return float Average rating
     */
    private function calculateAverageRating(array $reviews): float
    {
        if (empty($reviews)) {
            return 0.0;
        }

        $total = 0;
        foreach ($reviews as $review) {
            $total += (float) ($review->rating ?? 0);
        }

        return round($total / count($reviews), 1);
    }

    /**
     * Get featured image URL
     *
     * @param string|int $image Image ID or URL
     * @return string Image URL
     */
    private function getFeaturedImageUrl($image): string
    {
        if (empty($image)) {
            return '';
        }

        // If it's a numeric ID, get the attachment URL
        if (is_numeric($image)) {
            $url = wp_get_attachment_url((int) $image);
            return $url ?: '';
        }

        // If it's already a URL, return it
        if (filter_var($image, FILTER_VALIDATE_URL)) {
            return $image;
        }

        return '';
    }

    /**
     * Get itinerary days from database tables
     *
     * @param int $trip_id Trip ID
     * @return array Itinerary days with entries
     */
    private function getItineraryDays(int $trip_id): array
    {
        // Using proper table classes for itinerary system with classification integration
        // Note: Items and Item Types now use ClassificationsTable with unified approach
        $table_days = \Yatra\Database\Tables\TripItineraryDaysTable::getTableName();
        $table_entries = \Yatra\Database\Tables\TripItineraryDayEntryTable::getTableName();
        $table_classifications = ClassificationsTable::getTableName();

        // Get all days for this trip
        $days = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$table_days}
                 WHERE trip_id = %d
                 ORDER BY day_number ASC",
                $trip_id
            )
        );

        if (empty($days)) {
            return [];
        }

        $itinerary = [];
        foreach ($days as $day) {
            // Get entries for this day
            $entries = $this->wpdb->get_results(
                $this->wpdb->prepare(
                    "SELECT e.*, 
                            i.name as item_name,
                            it.name as item_type_name,
                            it.icon as item_type_icon
                     FROM {$table_entries} e
                     LEFT JOIN {$table_classifications} i ON e.item_id = i.id AND i.type = 'item'
                     LEFT JOIN {$table_classifications} it ON e.item_type_id = it.id AND it.type = 'item_type'
                     WHERE e.day_id = %d
                     ORDER BY e.order ASC, e.id ASC",
                    $day->id
                )
            );

            $formatted_entries = [];
            foreach ($entries as $entry) {
                $formatted_entries[] = [
                    'title' => $entry->title ?: $entry->item_name,
                    'description' => $entry->description ?: '',
                    'item_type' => $entry->item_type_name ?: 'Activity',
                    'icon' => $entry->item_type_icon ?: 'hiking',
                    'start_time' => $entry->start_time ?: '',
                    'end_time' => $entry->end_time ?: '',
                    'location' => $entry->location ?: '',
                    'duration' => $entry->duration ?: '',
                    'cost' => !empty($entry->cost) ? (float) $entry->cost : null,
                    'cost_per_person' => !empty($entry->cost_per_person) ? true : false,
                    'included' => !empty($entry->included_items) ? json_decode($entry->included_items, true) : [],
                    'gallery' => !empty($entry->gallery) ? $this->decodeGallery($entry->gallery) : [],
                    'video_url' => $entry->video_url ?: '',
                ];
            }

            $itinerary[] = [
                'day' => (int) $day->day_number,
                'day_title' => $day->title ?: sprintf(__('Day %d', 'yatra'), $day->day_number),
                'entries' => $formatted_entries,
            ];
        }

        return $itinerary;
    }

    /**
     * Format time from 24h to 12h format
     *
     * @param string $time Time in 24h format (e.g., "14:00")
     * @return string Time in 12h format (e.g., "2:00 PM")
     */
    public static function formatTime(string $time): string
    {
        if (empty($time) || $time === 'Flexible') {
            return $time;
        }

        // Try to parse and format the time
        $timestamp = strtotime($time);
        if ($timestamp !== false) {
            return date('g:i A', $timestamp);
        }

        return $time;
    }

    /**
     * Decode gallery JSON data and convert attachment IDs to URLs
     *
     * @param string|null $galleryJson JSON string from database
     * @return array Gallery items with URLs
     */
    private function decodeGallery(?string $galleryJson): array
    {
        if (empty($galleryJson)) {
            return [];
        }

        $gallery = json_decode($galleryJson, true);
        if (!is_array($gallery)) {
            return [];
        }

        // Convert attachment IDs to URLs for frontend compatibility
        foreach ($gallery as &$item) {
            if (isset($item['attachment_id']) && $item['attachment_id'] > 0) {
                // Get attachment URL from WordPress
                $attachment_url = wp_get_attachment_url($item['attachment_id']);
                if ($attachment_url) {
                    $item['url'] = $attachment_url;
                }
                
                // Get thumbnail URL for images
                if (isset($item['type']) && $item['type'] === 'image') {
                    $thumbnail_url = wp_get_attachment_image_src($item['attachment_id'], 'medium');
                    if ($thumbnail_url) {
                        $item['thumbnail_url'] = $thumbnail_url[0];
                    }
                }
            }
        }

        return $gallery;
    }

    /**
     * Get booking URL for a trip
     *
     * @param string $slug Trip slug
     * @return string Booking URL
     */
    public static function getBookingUrl(string $slug): string
    {
        if (function_exists('yatra_get_booking_url')) {
            return yatra_get_booking_url($slug);
        }

        $booking_base = get_option('yatra_booking_base', 'book');
        return home_url("/{$booking_base}/{$slug}/");
    }

    /**
     * Render tabs based on frontend_tabs configuration
     *
     * @param object $trip Trip object with frontend_tabs data
     * @return void
     */
    public static function renderFrontendTabs($trip)
    {
        $frontend_tabs = isset($trip->frontend_tabs) ? $trip->frontend_tabs : [];
        
        // Use the same merge logic as getStickyNavigationItems to ensure consistency
        if (!empty($frontend_tabs)) {
            $frontend_tabs = self::mergeFrontendTabsWithDefaults($frontend_tabs);
        } else {
            // Use default tabs if no database data exists
            $frontend_tabs = [
                // Core sections (always present)
                (object) ['id' => 'overview', 'label' => 'Overview', 'enabled' => true, 'order' => 1, 'content_type' => 'overview', 'icon' => 'book'],
                (object) ['id' => 'itinerary', 'label' => 'Itinerary', 'enabled' => true, 'order' => 2, 'content_type' => 'itinerary', 'icon' => 'calendar'],
                (object) ['id' => 'included', 'label' => 'Included', 'enabled' => true, 'order' => 3, 'content_type' => 'included_excluded', 'icon' => 'check'],
                (object) ['id' => 'location', 'label' => 'Location', 'enabled' => true, 'order' => 4, 'content_type' => 'location', 'icon' => 'map-pin'],
                (object) ['id' => 'important_info', 'label' => 'Important Info', 'enabled' => true, 'order' => 5, 'content_type' => 'important_info', 'icon' => 'info'],
                
                // Conditional sections (enabled by default, shown conditionally on frontend)
                (object) ['id' => 'downloads', 'label' => 'Downloads', 'enabled' => true, 'order' => 6, 'content_type' => 'downloads', 'icon' => 'download'],
                (object) ['id' => 'faq', 'label' => 'FAQ', 'enabled' => true, 'order' => 7, 'content_type' => 'faq', 'icon' => 'help-circle'],
                (object) ['id' => 'trip_story', 'label' => 'Story', 'enabled' => true, 'order' => 8, 'content_type' => 'trip_story', 'custom_content' => '', 'icon' => 'book'],
                (object) ['id' => 'what_makes_special', 'label' => 'Special', 'enabled' => true, 'order' => 9, 'content_type' => 'what_makes_special', 'custom_content' => '', 'icon' => 'star'],
                (object) ['id' => 'testimonials', 'label' => 'Testimonials', 'enabled' => true, 'order' => 10, 'content_type' => 'testimonials', 'icon' => 'message-circle'],
            ];
        }
        
        // Sort tabs by order and filter enabled tabs
        $enabled_tabs = array_filter($frontend_tabs, function($tab) {
            return isset($tab->enabled) && filter_var($tab->enabled, FILTER_VALIDATE_BOOLEAN);
        });
        
        usort($enabled_tabs, function($a, $b) {
            return ($a->order ?? 999) - ($b->order ?? 999);
        });

        // Render each enabled tab
        foreach ($enabled_tabs as $tab) {
            self::renderTabContent($tab, $trip);
        }
    }

    /**
     * Render individual tab content based on content type
     *
     * @param object $tab Tab configuration
     * @param object $trip Trip object
     * @return void
     */
    private static function renderTabContent($tab, $trip)
    {
        switch ($tab->content_type) {
            case 'overview':
                yatra_get_template('partials/single-trip/content-overview', ['trip' => $trip, 'tab' => $tab, 'has_traveler_pricing' => true, 'has_availability' => true, 'base_price' => $trip->original_price]);
                break;

            case 'itinerary':
                yatra_get_template('partials/single-trip/content-itinerary', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'included_excluded':
                yatra_get_template('partials/single-trip/content-included-excluded', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'location':
                // Get itinerary entries with coordinates for map display
                $itinerary_repository = new \Yatra\Repositories\ItineraryRepository();
                $itinerary_entries = $itinerary_repository->getEntriesWithCoordinatesForMap((int) $trip->id);
                
                yatra_get_template('partials/single-trip/content-location', [
                    'trip' => $trip, 
                    'tab' => $tab,
                    'itinerary_entries' => $itinerary_entries
                ]);
                break;

            case 'important_info':
                yatra_get_template('partials/single-trip/content-important-info', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'downloads':
                yatra_get_template('partials/single-trip/content-downloads', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'faq':
                yatra_get_template('partials/single-trip/content-faq', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'trip_story':
                yatra_get_template('partials/single-trip/content-trip-story', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'what_makes_special':
                yatra_get_template('partials/single-trip/content-whats-make-special', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'testimonials':
                yatra_get_template('partials/single-trip/content-testimonials', ['trip' => $trip, 'tab' => $tab]);
                break;

            case 'custom':
                // Always show custom tab if enabled, even if content is empty
                echo '<section class="yatra-trip-section" id="' . esc_attr($tab->id) . '">';
                echo '<h2 class="yatra-trip-section-title">';
                echo yatra_svg_icon('book', 'yatra-trip-section-title-icon');
                echo esc_html($tab->label);
                echo '</h2>';
                echo '<div class="yatra-custom-content">';
                
                // Display custom content if it exists, otherwise show empty message
                $custom_content = $tab->custom_content ?? '';
                if (!empty($custom_content)) {
                    echo wp_kses_post($custom_content);
                } else {
                    echo '<p class="text-gray-500 text-center py-8">' . esc_html__('No custom content available for this section.', 'yatra') . '</p>';
                }
                
                echo '</div>';
                echo '</section>';
                break;
        }
    }

    /**
     * Get sticky navigation items based on frontend_tabs configuration
     *
     * @param object $trip Trip object with frontend_tabs data
     * @return array Navigation items
     */
    public static function getStickyNavigationItems($trip)
    {
        $frontend_tabs = isset($trip->frontend_tabs) ? $trip->frontend_tabs : [];
        
        // Use the same merge logic as renderFrontendTabs to ensure consistency
        if (!empty($frontend_tabs)) {
            $frontend_tabs = self::mergeFrontendTabsWithDefaults($frontend_tabs);
        } else {
            // Use default tabs if no database data exists
            $frontend_tabs = [
                // Core sections (always present)
                (object) ['id' => 'overview', 'label' => 'Overview', 'enabled' => true, 'order' => 1, 'content_type' => 'overview', 'icon' => 'book'],
                (object) ['id' => 'itinerary', 'label' => 'Itinerary', 'enabled' => true, 'order' => 2, 'content_type' => 'itinerary', 'icon' => 'calendar'],
                (object) ['id' => 'included', 'label' => 'Included', 'enabled' => true, 'order' => 3, 'content_type' => 'included_excluded', 'icon' => 'check'],
                (object) ['id' => 'location', 'label' => 'Location', 'enabled' => true, 'order' => 4, 'content_type' => 'location', 'icon' => 'map-pin'],
                (object) ['id' => 'important_info', 'label' => 'Important Info', 'enabled' => true, 'order' => 5, 'content_type' => 'important_info', 'icon' => 'info'],
                
                // Conditional sections (enabled by default, shown conditionally on frontend)
                (object) ['id' => 'downloads', 'label' => 'Downloads', 'enabled' => true, 'order' => 6, 'content_type' => 'downloads', 'icon' => 'download'],
                (object) ['id' => 'faq', 'label' => 'FAQ', 'enabled' => true, 'order' => 7, 'content_type' => 'faq', 'icon' => 'help-circle'],
                (object) ['id' => 'trip_story', 'label' => 'Story', 'enabled' => true, 'order' => 8, 'content_type' => 'trip_story', 'custom_content' => '', 'icon' => 'book'],
                (object) ['id' => 'what_makes_special', 'label' => 'Special', 'enabled' => true, 'order' => 9, 'content_type' => 'what_makes_special', 'custom_content' => '', 'icon' => 'star'],
                (object) ['id' => 'testimonials', 'label' => 'Testimonials', 'enabled' => true, 'order' => 10, 'content_type' => 'testimonials', 'icon' => 'message-circle'],
            ];
        }

        // Sort tabs by order and filter enabled tabs
        $enabled_tabs = array_filter($frontend_tabs, function($tab) {
            return isset($tab->enabled) && $tab->enabled;
        });
        
        usort($enabled_tabs, function($a, $b) {
            return ($a->order ?? 999) - ($b->order ?? 999);
        });

        $navigation_items = [];
        
        foreach ($enabled_tabs as $tab) {
            $nav_item = self::getNavigationItemForTab($tab, $trip);
            if ($nav_item) {
                $navigation_items[] = $nav_item;
            }
        }

        return $navigation_items;
    }

    /**
     * Prepare traveler selector data for common component
     *
     * @param object $trip Trip object
     * @param string $context Context for IDs (sidebar, availability, enquiry)
     * @return array Traveler selector data
     */
    public static function prepareTravelerSelectorData($trip, string $context = 'sidebar'): array
    {
        $trip_pricing_type = $trip->pricing_type ?? '';
        $has_traveler_pricing = ($trip_pricing_type === 'traveler_based' && !empty($trip->price_types));
        $traveler_rows = [];
        
        if ($has_traveler_pricing) {
            // Traveler-Based Pricing: Show dynamic categories
            foreach ($trip->price_types as $index => $price_type) {
                // Normalize to object if array
                $price_type = is_array($price_type) ? (object) $price_type : $price_type;
                
                $pricing_mode = $price_type->pricing_mode ?? 'per_person';
                $is_per_group = ($pricing_mode === 'per_group');
                $pricing_label = '';
                if ($is_per_group) {
                    if (!empty($price_type->min_pax) && !empty($price_type->max_pax)) {
                        $pricing_label = sprintf(__('per group (%d-%d pax)', 'yatra'), $price_type->min_pax, $price_type->max_pax);
                    } elseif (!empty($price_type->max_pax)) {
                        $pricing_label = sprintf(__('per group (up to %d pax)', 'yatra'), $price_type->max_pax);
                    } elseif (!empty($price_type->min_pax)) {
                        $pricing_label = sprintf(__('per group (%d+ pax)', 'yatra'), $price_type->min_pax);
                    } else {
                        $pricing_label = __('per group', 'yatra');
                    }
                }

                $display_price_type = $price_type->effective_price ?? \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice((array) $price_type);
                if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                    $trip_id = is_object($trip) && method_exists($trip, 'getId') ? $trip->getId() : ($trip->id ?? 0);
                    $display_price_type = apply_filters('yatra_trip_display_price', $display_price_type, $trip_id, [
                        'departure_date' => null,
                        'spots_remaining' => null,
                        'price_type_id' => $price_type->id ?? null,
                    ]);
                }

                $age_info = '';
                $age_min = $price_type->age_min ?? null;
                $age_max = $price_type->age_max ?? null;
                if ($age_min !== null || $age_max !== null) {
                    if ($age_min !== null && $age_max !== null) {
                        $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $age_min, $age_max);
                    } elseif ($age_min !== null) {
                        $age_info = sprintf(__('(Age %d+)', 'yatra'), $age_min);
                    } else {
                        $age_info = sprintf(__('(Up to age %d)', 'yatra'), $age_max);
                    }
                }

                $price_html = '<div class="yatra-quantity-price-wrapper">';
                $price_html .= '<span class="yatra-quantity-price">' . yatra_format_price((float) $display_price_type) . '</span>';
                if ($is_per_group) {
                    $price_html .= '<span class="yatra-pricing-mode-label yatra-pricing-mode-group">' . esc_html($pricing_label) . '</span>';
                }
                $price_html .= '</div>';

                $input_id = 'traveler_' . $price_type->category_id;
                $max_travelers = is_object($trip) && method_exists($trip, 'getMaxTravelers') ? $trip->getMaxTravelers() : ($trip->max_travelers ?? 20);
                $pt_max_qty = (int) ($price_type->max_quantity ?: $max_travelers);
                $pt_value = ($index === 0) ? 1 : 0;

                $traveler_rows[] = [
                    'label' => $price_type->category_label ?: __('Traveler', 'yatra'),
                    'subtitle' => $age_info,
                    'price_html' => $price_html,
                    'row_attrs' => [
                        'data-category-id' => $price_type->category_id,
                        'data-price' => $price_type->effective_price,
                        'data-pricing-mode' => $pricing_mode,
                    ],
                    'minus_disabled' => ($index !== 0),
                    'plus_disabled' => false,
                    'minus_attrs' => [
                        'data-target' => $input_id,
                        'aria-label' => sprintf(__('Decrease %s', 'yatra'), $price_type->category_label),
                    ],
                    'plus_attrs' => [
                        'data-target' => $input_id,
                        'aria-label' => sprintf(__('Increase %s', 'yatra'), $price_type->category_label),
                    ],
                    'input_attrs' => [
                        'id' => $input_id,
                        'name' => 'travelers[' . $price_type->category_id . ']',
                        'value' => $pt_value,
                        'min' => 0,
                        'max' => $pt_max_qty,
                        'data-category' => $price_type->category_id,
                        'data-category-label' => $price_type->category_label,
                        'data-price' => $price_type->effective_price,
                        'data-pricing-mode' => $pricing_mode,
                    ],
                ];
            }

            // Generate display text with all categories and their default values
            $display_parts = [];
            foreach ($trip->price_types as $index => $price_type) {
                $category_label = $price_type->category_label ?? __('Traveler', 'yatra');
                $default_value = ($index === 0) ? 1 : 0;
                
                if ($default_value > 0) {
                    $display_parts[] = $category_label . ' x ' . $default_value;
                }
            }
            
            $traveler_display_text = !empty($display_parts) ? implode(', ', $display_parts) : __('Select travelers', 'yatra');
        } else {
            // Regular Pricing: Simple adult/children setup
            $traveler_rows = [
                [
                    'label' => __('Adult', 'yatra'),
                    'subtitle' => __('(Age 13-99)', 'yatra'),
                    'price_html' => '',
                    'row_attrs' => [],
                    'minus_disabled' => false,
                    'plus_disabled' => false,
                    'minus_attrs' => [
                        'data-target' => $context . '_adults',
                        'aria-label' => __('Decrease adults', 'yatra'),
                    ],
                    'plus_attrs' => [
                        'data-target' => $context . '_adults',
                        'aria-label' => __('Increase adults', 'yatra'),
                    ],
                    'input_attrs' => [
                        'id' => $context . '_adults',
                        'name' => $context . '_adults',
                        'value' => 1,
                        'min' => 1,
                        'max' => 20,
                    ],
                ],
                [
                    'label' => __('Child', 'yatra'),
                    'subtitle' => __('(Age 4-12)', 'yatra'),
                    'price_html' => '',
                    'row_attrs' => [],
                    'minus_disabled' => true,
                    'plus_disabled' => false,
                    'minus_attrs' => [
                        'data-target' => $context . '_children',
                        'aria-label' => __('Decrease children', 'yatra'),
                    ],
                    'plus_attrs' => [
                        'data-target' => $context . '_children',
                        'aria-label' => __('Increase children', 'yatra'),
                    ],
                    'input_attrs' => [
                        'id' => $context . '_children',
                        'name' => $context . '_children',
                        'value' => 0,
                        'min' => 0,
                        'max' => 10,
                    ],
                ],
            ];

            $traveler_display_text = __('Adult x 1', 'yatra');
        }

        return [
            'has_traveler_pricing' => $has_traveler_pricing,
            'traveler_rows' => $traveler_rows,
            'traveler_display_text' => $traveler_display_text,
            'context' => $context,
        ];
    }

    /**
     * Prepare traveler selector data for availability section
     * 
     * @param object $trip Trip data
     * @param array $card Availability card data
     * @param string $item_id Item ID
     * @param int $trip_id Trip ID
     * @param int $seats_available Seats available
     * @param int $max_travelers Max travelers
     * @param bool $dp_enabled Dynamic pricing enabled
     * @param array $initial_travelers Initial traveler counts from request (category_id => count)
     * @return array Traveler selector data
     */
    public static function prepareAvailabilityTravelerSelectorData($trip, array $card, string $item_id, int $trip_id, int $seats_available, int $max_travelers, bool $dp_enabled, array $initial_travelers = []): array
    {
        $card_pricing_type = $card['pricing_type'] ?? 'regular';
        $card_price_types = [];
        
        // Always use enriched trip-level price_types for traveler-based pricing
        if ($card_pricing_type === 'traveler_based' && !empty($trip->price_types)) {
            $card_price_types = $trip->price_types;
        }
        
        $has_traveler_pricing = ($card_pricing_type === 'traveler_based' && !empty($card_price_types));
        $traveler_rows = [];
        
        if ($has_traveler_pricing) {
            // Normalize price_types
            $normalized_price_types = [];
            foreach ($card_price_types as $pt) {
                if (is_array($pt)) {
                    $normalized_price_types[] = (object) $pt;
                } else {
                    $normalized_price_types[] = $pt;
                }
            }
            
            // Build display text from initial travelers if provided
            $display_parts = [];
            
            foreach ($normalized_price_types as $pt_index => $pt) {
                $pt_min = isset($pt->age_min) ? (int) $pt->age_min : 0;
                $pt_max = isset($pt->age_max) ? (int) $pt->age_max : 99;
                $pt_label = $pt->category_label ?? $pt->label ?? __('Traveler', 'yatra');
                $pt_age_text = ($pt_min > 0 || $pt_max < 99) ? sprintf(__('(Age %d-%d)', 'yatra'), $pt_min, $pt_max) : '';
                
                // Use initial traveler count if provided, otherwise use default
                $pt_category_id = $pt->category_id ?? $pt_index;
                $pt_default = isset($initial_travelers[$pt_category_id]) ? (int) $initial_travelers[$pt_category_id] : ($pt_index === 0 ? 1 : 0);
                
                $pt_price = 0;
                if (isset($pt->effective_price) && $pt->effective_price > 0) {
                    $pt_price = (float) $pt->effective_price;
                } elseif (isset($pt->sale_price) && $pt->sale_price > 0) {
                    $pt_price = (float) $pt->sale_price;
                } elseif (isset($pt->discounted_price) && $pt->discounted_price > 0) {
                    $pt_price = (float) $pt->discounted_price;
                } elseif (isset($pt->original_price) && $pt->original_price > 0) {
                    $pt_price = (float) $pt->original_price;
                }
                    
                // Apply dynamic pricing to traveler category prices
                if ($dp_enabled && $pt_price > 0) {
                    $pt_price = apply_filters('yatra_availability_price', $pt_price, $trip_id, [
                        'departure_date' => $card['date'] ?? null,
                        'spots_remaining' => $card['spots_remaining'] ?? null,
                        'availability_id' => $item_id,
                        'price_type_id' => $pt->id ?? ($pt->price_type_id ?? null),
                    ]);
                }

                $pt_category_id = $pt->category_id ?? $pt_index;
                $pt_min_qty = 0;
                $pt_max_qty = (int) min($seats_available, $max_travelers);
                $pt_pricing_mode = $pt->pricing_mode ?? 'per_person';
                $pt_is_per_group = ($pt_pricing_mode === 'per_group');
                
                // Build pricing label
                $pricing_label = '';
                if ($pt_is_per_group) {
                    if (!empty($pt->min_pax) && !empty($pt->max_pax)) {
                        $pricing_label = sprintf(__('per group (%d-%d pax)', 'yatra'), $pt->min_pax, $pt->max_pax);
                    } elseif (!empty($pt->max_pax)) {
                        $pricing_label = sprintf(__('per group (up to %d pax)', 'yatra'), $pt->max_pax);
                    } elseif (!empty($pt->min_pax)) {
                        $pricing_label = sprintf(__('per group (%d+ pax)', 'yatra'), $pt->min_pax);
                    } else {
                        $pricing_label = __('per group', 'yatra');
                    }
                }

                $price_html = '<div class="yatra-quantity-price-wrapper">';
                $price_html .= '<span class="yatra-quantity-price">' . yatra_format_price($pt_price) . '</span>';
                if ($pt_is_per_group) {
                    $price_html .= '<span class="yatra-pricing-mode-label yatra-pricing-mode-group">' . esc_html($pricing_label) . '</span>';
                }
                $price_html .= '</div>';

                $traveler_rows[] = [
                    'label' => $pt_label,
                    'subtitle' => $pt_age_text,
                    'price_html' => $price_html,
                    'row_attrs' => [
                        'data-category-id' => $pt_category_id,
                        'data-price' => $pt_price,
                        'data-pricing-mode' => $pt_pricing_mode,
                    ],
                    'minus_disabled' => ($pt_index !== 0),
                    'plus_disabled' => false,
                    'minus_attrs' => [
                        'data-target' => 'traveler_' . $pt_category_id . '_' . $item_id,
                        'aria-label' => sprintf(__('Decrease %s', 'yatra'), $pt_label),
                    ],
                    'plus_attrs' => [
                        'data-target' => 'traveler_' . $pt_category_id . '_' . $item_id,
                        'aria-label' => sprintf(__('Increase %s', 'yatra'), $pt_label),
                    ],
                    'input_attrs' => [
                        'data-item' => $item_id,
                        'data-category' => $pt_category_id,
                        'data-price' => $pt_price,
                        'data-pricing-mode' => $pt_pricing_mode,
                        'value' => $pt_default,
                        'min' => $pt_min_qty,
                        'max' => $pt_max_qty,
                    ],
                ];
                
                // Build display text parts
                if ($pt_default > 0) {
                    $display_parts[] = $pt_label . ' x ' . $pt_default;
                }
            }
            
            // Generate display text from parts
            $traveler_display_text = !empty($display_parts) ? implode(', ', $display_parts) : __('Select travelers', 'yatra');
        }

        return [
            'has_traveler_pricing' => $has_traveler_pricing,
            'traveler_rows' => $traveler_rows,
            'traveler_display_text' => $traveler_display_text ?? __('Adult x 1', 'yatra'),
            'item_id' => $item_id,
        ];
    }

    /**
     * Get navigation item for a specific tab
     *
     * @param object $tab Tab configuration
     * @param object $trip Trip object
     * @return array|null Navigation item data
     */
    private static function getNavigationItemForTab($tab, $trip)
    {
        // Only check if tab is enabled - content existence is handled by templates
        // All tabs should appear in navigation if enabled, regardless of content

        // Map content types to icons and hrefs
        $icon_map = [
            'overview' => 'book',
            'itinerary' => 'calendar',
            'included_excluded' => 'check',
            'location' => 'map-pin',
            'important_info' => 'info',
            'downloads' => 'download',
            'faq' => 'help-circle',
            'trip_story' => 'book',
            'what_makes_special' => 'star',
            'testimonials' => 'message-circle',
            'custom' => 'book'
        ];

        $href_map = [
            'overview' => '#overview',
            'itinerary' => '#itinerary',
            'included' => '#included',
            'location' => '#location',
            'important_info' => '#important-info',
            'downloads' => '#downloads',
            'faq' => '#faq',
            'trip_story' => '#trip-story',
            'what_makes_special' => '#what-makes-special',
            'testimonials' => '#testimonials',
            'custom' => '#custom'
        ];

        // For custom tabs, use the actual tab ID to ensure unique anchors
        $href = isset($href_map[$tab->id]) ? $href_map[$tab->id] : '#' . $tab->id;
        
        // Use custom icon if available, otherwise fallback to default icon mapping
        $icon = 'book'; // default fallback
        $icon_data = null;
        
        if (isset($tab->icon) && !empty($tab->icon)) {
            // Handle both array and object formats for icon
            if (is_array($tab->icon)) {
                $icon_data = $tab->icon;
            } elseif (is_object($tab->icon)) {
                $icon_data = (array) $tab->icon;
            } elseif (is_string($tab->icon)) {
                // Convert string to icon data structure
                $icon_data = ['type' => 'icon', 'value' => $tab->icon];
            }
        } else {
            // Fallback to default icon mapping
            $icon_data = ['type' => 'icon', 'value' => $icon_map[$tab->content_type] ?? 'book'];
        }
        
        return [
            'id' => $tab->id,
            'label' => $tab->label,
            'href' => $href,
            'icon' => $icon_data
        ];
    }

    /**
     * Merge database frontend_tabs with complete default array
     * Ensures all sections are always available in the backend
     *
     * @param array $db_tabs Database frontend_tabs data
     * @return array | object Merged frontend_tabs with all sections
     */
    private static function mergeFrontendTabsWithDefaults($db_tabs)
    {
       

        $default_tabs =  [
            // Core sections (always present)
            (object) ['id' => 'overview', 'label' => 'Overview', 'enabled' => true, 'order' => 1, 'content_type' => 'overview', 'icon' => 'book'],
            (object) ['id' => 'itinerary', 'label' => 'Itinerary', 'enabled' => true, 'order' => 2, 'content_type' => 'itinerary', 'icon' => 'calendar'],
            (object) ['id' => 'included', 'label' => 'Included', 'enabled' => true, 'order' => 3, 'content_type' => 'included_excluded', 'icon' => 'check'],
            (object) ['id' => 'location', 'label' => 'Location', 'enabled' => true, 'order' => 4, 'content_type' => 'location', 'icon' => 'map-pin'],
            (object) ['id' => 'important_info', 'label' => 'Important Info', 'enabled' => true, 'order' => 5, 'content_type' => 'important_info', 'icon' => 'info'],

            // Conditional sections (enabled by default, shown conditionally on frontend)
            (object) ['id' => 'downloads', 'label' => 'Downloads', 'enabled' => true, 'order' => 6, 'content_type' => 'downloads', 'icon' => 'download'],
            (object) ['id' => 'faq', 'label' => 'FAQ', 'enabled' => true, 'order' => 7, 'content_type' => 'faq', 'icon' => 'help-circle'],
            (object) ['id' => 'trip_story', 'label' => 'Story', 'enabled' => true, 'order' => 8, 'content_type' => 'trip_story', 'custom_content' => '', 'icon' => 'book'],
            (object) ['id' => 'what_makes_special', 'label' => 'Special', 'enabled' => true, 'order' => 9, 'content_type' => 'what_makes_special', 'custom_content' => '', 'icon' => 'star'],
            (object) ['id' => 'testimonials', 'label' => 'Testimonials', 'enabled' => true, 'order' => 10, 'content_type' => 'testimonials', 'icon' => 'message-circle'],
        ];

        // If no database data, return defaults
        if (empty($db_tabs) || !is_array($db_tabs)) {
            return $default_tabs;
        }

        // Create a map of database tabs by ID for easy lookup
        $db_tabs_map = [];
        foreach ($db_tabs as $db_tab) {
            // Handle both arrays and objects
            $tab_id = null;
            if (is_array($db_tab) && isset($db_tab['id'])) {
                $tab_id = $db_tab['id'];
            } elseif (is_object($db_tab) && isset($db_tab->id)) {
                $tab_id = $db_tab->id;
            }
            
            if ($tab_id) {
                $db_tabs_map[$tab_id] = $db_tab;
            }
        }

        // Merge defaults with database data
        $merged_tabs = [];
        foreach ($default_tabs as $default_tab) {
            $tab_id = $default_tab->id;
            
            if (isset($db_tabs_map[$tab_id])) {
                // Use database data, but ensure all required fields exist
                $db_tab = $db_tabs_map[$tab_id];

                // Handle both arrays and objects
                $db_label = is_array($db_tab) ? ($db_tab['label'] ?? null) : ($db_tab->label ?? null);
                $db_enabled = is_array($db_tab) ? ($db_tab['enabled'] ?? null) : ($db_tab->enabled ?? null);
                $db_order = is_array($db_tab) ? ($db_tab['order'] ?? null) : ($db_tab->order ?? null);
                $db_custom_content = is_array($db_tab) ? ($db_tab['custom_content'] ?? null) : ($db_tab->custom_content ?? null);
                $db_icon = is_array($db_tab) ? ($db_tab['icon'] ?? null) : ($db_tab->icon ?? null);

                // Preserve full icon data structure
                $icon_data = null;
                if ($db_icon) {
                    if (is_array($db_icon)) {
                        $icon_data = $db_icon;
                    } elseif (is_object($db_icon)) {
                        $icon_data = (array) $db_icon;
                    } elseif (is_string($db_icon)) {
                        // Convert string to icon data structure
                        $icon_data = ['type' => 'icon', 'value' => $db_icon];
                    }
                } else {
                    // Use default icon as data structure
                    $icon_data = ['type' => 'icon', 'value' => $default_tab->icon];
                }

                $merged_tab = [
                    'id' => $tab_id,
                    'label' => $db_label ?? $default_tab->label,
                    'enabled' => $db_enabled !== null ? filter_var($db_enabled, FILTER_VALIDATE_BOOLEAN) : $default_tab->enabled,
                    'order' => $db_order !== null ? (int) $db_order : $default_tab->order,
                    // Always use the new content type from defaults to ensure consistency
                    'content_type' => $default_tab->content_type,
                    'icon' => $icon_data
                ];
                // Add custom_content for custom tabs if exists
                if ($default_tab->content_type === 'custom') {
                    $merged_tab['custom_content'] = $db_custom_content ?? $default_tab->custom_content ?? '';
                }
                
                $merged_tabs[] = (object) $merged_tab;
            } else {
                // Use default for missing tabs
                $merged_tabs[] = (object) $default_tab;
            }
        }

        // Add custom tabs from database that aren't in the defaults
        foreach ($db_tabs_map as $tab_id => $db_tab) {
            // Skip if this tab was already processed in the defaults
            $found_in_defaults = false;
            foreach ($default_tabs as $default_tab) {
                if ($default_tab->id === $tab_id) {
                    $found_in_defaults = true;
                    break;
                }
            }
            
            // Handle both arrays and objects for content_type check
            $content_type = is_array($db_tab) ? ($db_tab['content_type'] ?? null) : ($db_tab->content_type ?? null);
            
            // If not found in defaults and it's a custom tab, add it
            if (!$found_in_defaults && $content_type === 'custom') {
                // Handle both arrays and objects for field access
                $db_label = is_array($db_tab) ? ($db_tab['label'] ?? null) : ($db_tab->label ?? null);
                $db_enabled = is_array($db_tab) ? ($db_tab['enabled'] ?? null) : ($db_tab->enabled ?? null);
                $db_order = is_array($db_tab) ? ($db_tab['order'] ?? null) : ($db_tab->order ?? null);
                $db_custom_content = is_array($db_tab) ? ($db_tab['custom_content'] ?? null) : ($db_tab->custom_content ?? null);
                $db_icon = is_array($db_tab) ? ($db_tab['icon'] ?? null) : ($db_tab->icon ?? null);
                
                $custom_tab = [
                    'id' => $tab_id,
                    'label' => $db_label ?? __('Custom Tab', 'yatra'),
                    'enabled' => $db_enabled !== null ? filter_var($db_enabled, FILTER_VALIDATE_BOOLEAN) : true,
                    'order' => $db_order !== null ? (int) $db_order : 999,
                    'content_type' => 'custom',
                    'custom_content' => $db_custom_content ?? '',
                    'icon' => $db_icon
                ];
                $merged_tabs[] = (object) $custom_tab;
            }
        }

        return $merged_tabs;
    }
}

