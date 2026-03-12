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
     * @return object Prepared trip data
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
        $trip->currency = $trip->currency ?? get_option('yatra_currency', 'USD');

        // Compute effective pricing (same logic as TripRepository::computeEffectivePricing)
        $trip->effective_price_min = 0;
        $trip->min_category_original_price = 0;
        $trip->max_discount_percentage = 0;
        
        if (!empty($trip->pricing_type) && $trip->pricing_type === 'traveler_based' && !empty($trip->price_types)) {
            // For traveler-based pricing, find minimum effective price from price_types
            $min_price = PHP_FLOAT_MAX;
            $min_original = 0;
            $max_discount = 0;
            
            foreach ($trip->price_types as $pt) {
                $original = (float) ($pt->original_price ?? 0);
                $discounted = (float) ($pt->discounted_price ?? 0);
                $effective = ($discounted > 0 && $discounted < $original) ? $discounted : $original;
                
                if ($effective > 0 && $effective < $min_price) {
                    $min_price = $effective;
                    $min_original = $original;
                }
                
                // Calculate discount percentage for this category
                if ($original > 0 && $discounted > 0 && $discounted < $original) {
                    $discount_pct = round((($original - $discounted) / $original) * 100);
                    if ($discount_pct > $max_discount) {
                        $max_discount = $discount_pct;
                    }
                }
            }
            
            if ($min_price < PHP_FLOAT_MAX) {
                $trip->effective_price_min = $min_price;
                $trip->min_category_original_price = $min_original;
                $trip->max_discount_percentage = $max_discount;
            }
        } else {
            // Regular pricing logic
            if (!empty($trip->discounted_price) && (float)$trip->discounted_price > 0) {
                $trip->effective_price_min = (float)$trip->discounted_price;
            } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
                $trip->effective_price_min = (float)$trip->sale_price;
            } elseif (!empty($trip->original_price) && (float)$trip->original_price > 0) {
                $trip->effective_price_min = (float)$trip->original_price;
            }
            
            // Set min_category_original_price for regular pricing
            $trip->min_category_original_price = (float)($trip->original_price ?? 0);
        }

        // Calculate discount percentage
        $trip->discount_percentage = 0;
        if ($trip->max_discount_percentage > 0) {
            $trip->discount_percentage = $trip->max_discount_percentage;
        } elseif ($trip->original_price > 0 && $trip->sale_price < $trip->original_price) {
            $trip->discount_percentage = round((($trip->original_price - $trip->sale_price) / $trip->original_price) * 100);
        }

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
        $trip->has_availability = !empty($trip->availability_dates) && is_array($trip->availability_dates) && count($trip->availability_dates) > 0;
        $trip->has_traveler_pricing = ($trip->pricing_type === 'traveler_based' && !empty($trip->price_types));
        
        // Format featured image
        $trip->featured_image_url = $this->getFeaturedImageUrl($trip->featured_image ?? '');

       
        return $trip;
    }

    /**
     * Calculate base price for template display
     * 
     * @param object $trip Trip object
     * @return float Base price
     */
    private function calculateBasePrice(object $trip): float
    {
        // Check if availability dates exist (PRIORITY)
        if (!empty($trip->availability_dates) && is_array($trip->availability_dates)) {
            $min_price = PHP_FLOAT_MAX;
            
            foreach ($trip->availability_dates as $avail) {
                $avail_price = $avail->effective_price ?? $avail->original_price ?? 0;
                if ($avail_price > 0 && $avail_price < $min_price) {
                    $min_price = $avail_price;
                }

                // Also check price_types within availability if traveler-based
                if (!empty($avail->price_types) && is_array($avail->price_types)) {
                    foreach ($avail->price_types as $pt) {
                        $pt = (object) $pt;
                        $pt_price = (float) ($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                        if ($pt_price > 0 && $pt_price < $min_price) {
                            $min_price = $pt_price;
                        }
                    }
                }
            }

            // If no price found from availability, check traveler-based pricing
            if ($min_price >= PHP_FLOAT_MAX && !empty($trip->price_types)) {
                foreach ($trip->price_types as $pt) {
                    $pt_price = (float) ($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                    if ($pt_price > 0 && $pt_price < $min_price) {
                        $min_price = $pt_price;
                    }
                }
            }

            $base_price = ($min_price < PHP_FLOAT_MAX) ? $min_price : ($trip->sale_price ?: $trip->original_price);
        } elseif (!empty($trip->price_types)) {
            // Get default or first traveler category price
            $default_price_type = null;
            foreach ($trip->price_types as $pt) {
                if (!empty($pt->is_default)) {
                    $default_price_type = $pt;
                    break;
                }
            }
            if (!$default_price_type && !empty($trip->price_types)) {
                $default_price_type = $trip->price_types[0];
            }

            // Get the price from the price type - check multiple possible fields
            $base_price = 0;
            if ($default_price_type) {
                // Try effective_price first, then discounted_price, then original_price
                if (!empty($default_price_type->effective_price) && $default_price_type->effective_price > 0) {
                    $base_price = (float) $default_price_type->effective_price;
                } elseif (!empty($default_price_type->discounted_price) && $default_price_type->discounted_price > 0) {
                    $base_price = (float) $default_price_type->discounted_price;
                } elseif (!empty($default_price_type->original_price) && $default_price_type->original_price > 0) {
                    $base_price = (float) $default_price_type->original_price;
                } elseif (!empty($default_price_type->sale_price) && $default_price_type->sale_price > 0) {
                    $base_price = (float) $default_price_type->sale_price;
                }

                // If still no price, try to get the minimum from all price types
                if ($base_price <= 0) {
                    foreach ($trip->price_types as $pt) {
                        $pt_price = (float) ($pt->effective_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                        if ($pt_price > 0 && ($base_price <= 0 || $pt_price < $base_price)) {
                            $base_price = $pt_price;
                        }
                    }
                }
            } else {
                $base_price = $trip->sale_price ?: $trip->original_price;
            }
        } else {
            // Regular pricing
            $base_price = $trip->sale_price > 0 ? $trip->sale_price : $trip->original_price;
        }

        // Apply dynamic pricing if module is enabled
        if (!empty($base_price) && apply_filters('yatra_dynamic_pricing_enabled', false)) {
            $base_price = apply_filters('yatra_trip_display_price', $base_price, $trip->id ?? 0, [
                'departure_date' => null, // Generic display for single trip page
                'spots_remaining' => null,
            ]);
        }

        return (float) $base_price;
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
     * Get availability dates for trip from database
     *
     * @param int $trip_id Trip ID
     * @return array Availability dates with pricing and seat info
     */
    private function getAvailabilityDates(int $trip_id): array
    {
        $table = TripAvailabilityDatesTable::getTableName();
        
        // Get all availability dates for this trip
        $availability = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$table}
                 WHERE trip_id = %d
                 ORDER BY departure_date ASC",
                $trip_id
            )
        ) ?: [];
        
        // Format availability dates for frontend
        foreach ($availability as $avail) {
            $avail->departure_date = $avail->departure_date;
            $avail->return_date = $avail->return_date;
            $avail->original_price = $avail->original_price ? (float) $avail->original_price : null;
            $avail->discounted_price = $avail->discounted_price ? (float) $avail->discounted_price : null;
            $avail->seats_total = (int) $avail->seats_total;
            $avail->seats_available = (int) $avail->seats_available;
            $avail->seats_reserved = (int) ($avail->seats_reserved ?? 0);
            
            // Parse price_types JSON for traveler-based pricing
            $price_types_raw = $avail->price_types ?? null;
            $avail->price_types = [];
            if (!empty($price_types_raw) && is_string($price_types_raw)) {
                $decoded = json_decode($price_types_raw, true);
                if (is_array($decoded)) {
                    $avail->price_types = $decoded;
                }
            }
            
            // Calculate effective price for this date
            // For traveler-based pricing, get the minimum price from price_types
            if (!empty($avail->price_types) && is_array($avail->price_types)) {
                $min_price = PHP_FLOAT_MAX;
                foreach ($avail->price_types as $pt) {
                    $pt_price = (float) ($pt['effective_price'] ?? $pt['discounted_price'] ?? $pt['original_price'] ?? 0);
                    if ($pt_price > 0 && $pt_price < $min_price) {
                        $min_price = $pt_price;
                    }
                }
                $avail->effective_price = ($min_price < PHP_FLOAT_MAX) ? $min_price : ($avail->discounted_price ?? $avail->original_price);
            } else {
                $avail->effective_price = $avail->discounted_price ?? $avail->original_price;
            }
            
            // Calculate if limited availability
            $avail->is_limited = ($avail->seats_available <= 5 && $avail->seats_available > 0);
            $avail->is_sold_out = ($avail->seats_available <= 0 || $avail->status === 'sold_out');
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
        // Table removed: return empty price types for traveler-based pricing
        return [];
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

