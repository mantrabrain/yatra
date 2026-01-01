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
        // Gallery images from separate table (with attachment IDs)
        $trip->gallery_images = $this->getGalleryImages((int) $trip->id);
        
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
        
        $trip->faqs = $this->decodeJson($trip->faqs ?? '');
        $trip->frontend_tabs = $this->decodeJson($trip->frontend_tabs ?? '');
        
        // Fetch availability dates from database table
        $trip->availability_dates = $this->getAvailabilityDates((int) $trip->id);
        
        // Debug: Log how many availability dates are loaded
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Yatra Debug: Trip ID ' . $trip->id . ' - Loaded ' . count($trip->availability_dates) . ' availability dates');
        }
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
        $trip->similar_trips = $this->getSimilarTrips($trip);

        // Calculate rating
        $trip->average_rating = $this->calculateAverageRating($trip->reviews);
        $trip->review_count = count($trip->reviews);

        // Format featured image
        $trip->featured_image_url = $this->getFeaturedImageUrl($trip->featured_image ?? '');

       
        return $trip;
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
        
        // Convert to array of URLs (using attachment ID when available)
        $gallery = [];
        foreach ($images as $img) {
            $url = '';
            
            // If we have an attachment ID, get the URL from WordPress
            if (!empty($img->image_id) && $img->image_id > 0) {
                $url = wp_get_attachment_url((int) $img->image_id);
            }
            
            // Fallback to stored URL
            if (empty($url) && !empty($img->image_url)) {
                $url = $img->image_url;
            }
            
            if (!empty($url)) {
                $gallery[] = $url;
            }
        }
        
        return $gallery;
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
        // Using hardcoded table names for legacy itinerary tables since they use a different schema
        // Note: Items and Item Types now use ClassificationsTable with unified approach
        $table_days = $this->wpdb->prefix . 'yatra_new_trip_itinerary_days';
        $table_entries = $this->wpdb->prefix . 'yatra_trip_itinerary_entries';
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
}

