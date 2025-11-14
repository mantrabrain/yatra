<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Trip Model
 * Represents a trip/tour entity with comprehensive data structure
 * 
 * Expert-level model design:
 * - Type-safe properties
 * - Proper data serialization/deserialization
 * - JSON field handling
 * - Relationship data loading
 */
class Trip
{
    // Identification & Basic Info
    public int $id = 0;
    public string $title = '';
    public string $slug = '';
    public ?string $trip_code = null;
    public string $description = '';
    public ?string $short_description = null;
    public string $trip_details = '';
    public string $what_makes_special = '';
    public string $trip_story = '';
    public ?string $excerpt = null;

    // Location & Geography
    public ?string $starting_location = null;
    public ?string $ending_location = null;
    public ?string $latitude = null;
    public ?string $longitude = null;
    public int $map_zoom_level = 10;
    public ?string $timezone = null;
    public ?string $country_code = null;

    // Duration & Schedule
    public string $trip_type = 'multi_day';
    public ?int $duration_days = null;
    public ?int $duration_nights = null;
    public ?int $duration_hours = null;
    public ?string $available_from = null;
    public ?string $available_to = null;
    public int $booking_window_days = 30;
    public int $booking_deadline_hours = 24;
    public bool $flexible_dates = false;
    public bool $fixed_departures_only = false;

    // Seasonal & Availability
    public ?string $seasonal_availability = null;
    public ?string $best_season = null;
    public ?string $peak_season = null;
    public ?string $off_season = null;
    public bool $seasonal_auto_enable = false;
    public ?string $seasonal_enable_date = null;
    public ?string $seasonal_disable_date = null;
    public array $blackout_dates = [];

    // Categorization
    public ?string $trip_category = null;
    public ?string $trip_category_parent = null;
    public ?string $trip_category_sub = null;
    public ?string $difficulty_level = null;
    public ?string $activity_intensity = null;
    public string $featured_priority = 'none';
    public ?string $trip_style = null;
    public string $group_type = 'both';

    // Pricing
    public string $pricing_type = 'regular';
    public float $original_price = 0.00;
    public ?float $discounted_price = null;
    public ?float $sale_price = null;
    public string $currency = 'USD';
    public bool $price_per_person = true;
    public bool $deposit_required = false;
    public ?float $deposit_amount = null;
    public ?float $deposit_percentage = null;
    public string $payment_terms = '';
    public bool $payment_plans_enabled = false;
    public bool $tax_included = false;
    public ?float $tax_rate = null;
    public ?float $service_charge = null;
    public ?float $service_charge_percentage = null;

    // Group Pricing
    public bool $group_pricing_enabled = false;
    public ?int $group_size_min = null;
    public ?int $group_size_max = null;
    public string $group_discount_type = 'percentage';
    public ?float $group_discount_percentage = null;
    public ?float $group_discount_amount = null;

    // Early Bird / Last Minute
    public bool $early_bird_discount_enabled = false;
    public ?int $early_bird_days = null;
    public ?float $early_bird_discount = null;
    public bool $last_minute_discount_enabled = false;
    public ?int $last_minute_days = null;
    public ?float $last_minute_discount = null;

    // Booking Settings
    public int $min_travelers = 1;
    public ?int $max_travelers = null;
    public ?int $max_travelers_per_booking = null;
    public bool $waitlist_enabled = false;
    public ?int $waitlist_capacity = null;
    public bool $instant_booking = true;
    public bool $requires_approval = false;
    public bool $booking_confirmation_email = true;
    public bool $booking_reminder_email = true;
    public int $reminder_days_before = 7;

    // Requirements
    public ?int $age_min = null;
    public ?int $age_max = null;
    public string $physical_requirements = '';
    public string $medical_requirements = '';
    public string $visa_requirements = '';
    public string $vaccination_requirements = '';
    public int $passport_validity_months = 6;
    public bool $travel_insurance_required = false;
    public string $special_equipment = '';

    // Policies
    public string $cancellation_policy = '';
    public string $refund_policy = '';
    public string $change_policy = '';
    public string $weather_policy = '';
    public string $force_majeure_policy = '';
    public string $terms_conditions = '';

    // Accommodation
    public ?string $accommodation_type = null;
    public ?string $accommodation_standard = null;
    public ?string $meal_plan = null;
    public string $accommodation_details = '';
    public bool $accommodation_included = true;

    // Transportation
    public bool $transportation_included = false;
    public ?string $pickup_location = null;
    public ?string $pickup_location_lat = null;
    public ?string $pickup_location_lng = null;
    public ?string $dropoff_location = null;
    public ?string $dropoff_location_lat = null;
    public ?string $dropoff_location_lng = null;
    public string $transportation_details = '';
    public string $internal_transportation = '';
    public bool $international_flights_included = false;
    public bool $domestic_flights_included = false;

    // Media
    public ?int $featured_image_id = null;
    public ?string $featured_image_url = null;
    public ?string $video_url = null;
    public ?string $virtual_tour_url = null;
    public ?string $promo_video_url = null;
    public ?int $social_share_image_id = null;

    // SEO
    public ?string $meta_title = null;
    public ?string $meta_description = null;
    public ?string $meta_keywords = null;
    public ?string $og_title = null;
    public ?string $og_description = null;
    public ?int $og_image_id = null;
    public ?string $schema_markup = null;

    // Status & Lifecycle
    public string $status = 'draft';
    public ?string $scheduled_publish_date = null;
    public ?string $scheduled_unpublish_date = null;
    public ?string $published_at = null;
    public int $version = 1;
    public bool $is_featured = false;
    public int $featured_order = 0;
    public int $sort_order = 0;

    // Analytics
    public int $views_count = 0;
    public int $bookings_count = 0;
    public float $revenue_total = 0.00;
    public float $conversion_rate = 0.00;
    public float $avg_rating = 0.00;
    public int $reviews_count = 0;
    public ?string $last_viewed_at = null;
    public ?string $last_booked_at = null;

    // JSON Fields (stored as arrays/objects)
    public array $highlights = [];
    public array $testimonials = [];
    public array $countries = [];
    public array $regions = [];
    public array $landmarks = [];
    public array $tags = [];
    public array $included_items = [];
    public array $excluded_items = [];
    public array $gallery_images = [];
    public array $price_types = [];
    public array $itinerary_days = [];
    public array $faqs = [];
    public array $frontend_tabs = [];
    public array $availability_dates = [];
    public array $custom_fields = [];
    public array $pricing_rules = [];
    public array $booking_rules = [];

    // Relationships (loaded separately)
    public array $destinations = [];
    public array $activities = [];

    // Timestamps
    public string $created_at = '';
    public string $updated_at = '';
    public int $created_by = 0;
    public int $updated_by = 0;
    public ?string $deleted_at = null;
    public ?int $deleted_by = null;

    /**
     * Create from array (database row)
     */
    public static function fromArray(array $data): self
    {
        $trip = new self();
        
        // Basic fields
        $trip->id = (int) ($data['id'] ?? 0);
        $trip->title = $data['title'] ?? '';
        $trip->slug = $data['slug'] ?? '';
        $trip->trip_code = $data['trip_code'] ?? null;
        $trip->description = $data['description'] ?? '';
        $trip->short_description = $data['short_description'] ?? null;
        $trip->trip_details = $data['trip_details'] ?? '';
        $trip->what_makes_special = $data['what_makes_special'] ?? '';
        $trip->trip_story = $data['trip_story'] ?? '';
        $trip->excerpt = $data['excerpt'] ?? null;

        // Location
        $trip->starting_location = $data['starting_location'] ?? null;
        $trip->ending_location = $data['ending_location'] ?? null;
        $trip->latitude = $data['latitude'] ?? null;
        $trip->longitude = $data['longitude'] ?? null;
        $trip->map_zoom_level = (int) ($data['map_zoom_level'] ?? 10);
        $trip->timezone = $data['timezone'] ?? null;
        $trip->country_code = $data['country_code'] ?? null;

        // Duration
        $trip->trip_type = $data['trip_type'] ?? 'multi_day';
        $trip->duration_days = isset($data['duration_days']) ? (int) $data['duration_days'] : null;
        $trip->duration_nights = isset($data['duration_nights']) ? (int) $data['duration_nights'] : null;
        $trip->duration_hours = isset($data['duration_hours']) ? (int) $data['duration_hours'] : null;
        $trip->available_from = $data['available_from'] ?? null;
        $trip->available_to = $data['available_to'] ?? null;
        $trip->booking_window_days = (int) ($data['booking_window_days'] ?? 30);
        $trip->booking_deadline_hours = (int) ($data['booking_deadline_hours'] ?? 24);
        $trip->flexible_dates = (bool) ($data['flexible_dates'] ?? false);
        $trip->fixed_departures_only = (bool) ($data['fixed_departures_only'] ?? false);

        // Seasonal
        $trip->seasonal_availability = $data['seasonal_availability'] ?? null;
        $trip->best_season = $data['best_season'] ?? null;
        $trip->peak_season = $data['peak_season'] ?? null;
        $trip->off_season = $data['off_season'] ?? null;
        $trip->seasonal_auto_enable = (bool) ($data['seasonal_auto_enable'] ?? false);
        $trip->seasonal_enable_date = $data['seasonal_enable_date'] ?? null;
        $trip->seasonal_disable_date = $data['seasonal_disable_date'] ?? null;
        $trip->blackout_dates = self::parseJsonField($data['blackout_dates'] ?? null);

        // Categorization
        $trip->trip_category = $data['trip_category'] ?? null;
        $trip->trip_category_parent = $data['trip_category_parent'] ?? null;
        $trip->trip_category_sub = $data['trip_category_sub'] ?? null;
        $trip->difficulty_level = $data['difficulty_level'] ?? null;
        $trip->activity_intensity = $data['activity_intensity'] ?? null;
        $trip->featured_priority = $data['featured_priority'] ?? 'none';
        $trip->trip_style = $data['trip_style'] ?? null;
        $trip->group_type = $data['group_type'] ?? 'both';

        // Pricing
        $trip->pricing_type = $data['pricing_type'] ?? 'regular';
        $trip->original_price = (float) ($data['original_price'] ?? 0.00);
        $trip->discounted_price = isset($data['discounted_price']) ? (float) $data['discounted_price'] : null;
        $trip->sale_price = isset($data['sale_price']) ? (float) $data['sale_price'] : null;
        $trip->currency = $data['currency'] ?? 'USD';
        $trip->price_per_person = (bool) ($data['price_per_person'] ?? true);
        $trip->deposit_required = (bool) ($data['deposit_required'] ?? false);
        $trip->deposit_amount = isset($data['deposit_amount']) ? (float) $data['deposit_amount'] : null;
        $trip->deposit_percentage = isset($data['deposit_percentage']) ? (float) $data['deposit_percentage'] : null;
        $trip->payment_terms = $data['payment_terms'] ?? '';
        $trip->payment_plans_enabled = (bool) ($data['payment_plans_enabled'] ?? false);
        $trip->tax_included = (bool) ($data['tax_included'] ?? false);
        $trip->tax_rate = isset($data['tax_rate']) ? (float) $data['tax_rate'] : null;
        $trip->service_charge = isset($data['service_charge']) ? (float) $data['service_charge'] : null;
        $trip->service_charge_percentage = isset($data['service_charge_percentage']) ? (float) $data['service_charge_percentage'] : null;

        // Group Pricing
        $trip->group_pricing_enabled = (bool) ($data['group_pricing_enabled'] ?? false);
        $trip->group_size_min = isset($data['group_size_min']) ? (int) $data['group_size_min'] : null;
        $trip->group_size_max = isset($data['group_size_max']) ? (int) $data['group_size_max'] : null;
        $trip->group_discount_type = $data['group_discount_type'] ?? 'percentage';
        $trip->group_discount_percentage = isset($data['group_discount_percentage']) ? (float) $data['group_discount_percentage'] : null;
        $trip->group_discount_amount = isset($data['group_discount_amount']) ? (float) $data['group_discount_amount'] : null;

        // Early Bird / Last Minute
        $trip->early_bird_discount_enabled = (bool) ($data['early_bird_discount_enabled'] ?? false);
        $trip->early_bird_days = isset($data['early_bird_days']) ? (int) $data['early_bird_days'] : null;
        $trip->early_bird_discount = isset($data['early_bird_discount']) ? (float) $data['early_bird_discount'] : null;
        $trip->last_minute_discount_enabled = (bool) ($data['last_minute_discount_enabled'] ?? false);
        $trip->last_minute_days = isset($data['last_minute_days']) ? (int) $data['last_minute_days'] : null;
        $trip->last_minute_discount = isset($data['last_minute_discount']) ? (float) $data['last_minute_discount'] : null;

        // Booking
        $trip->min_travelers = (int) ($data['min_travelers'] ?? 1);
        $trip->max_travelers = isset($data['max_travelers']) ? (int) $data['max_travelers'] : null;
        $trip->max_travelers_per_booking = isset($data['max_travelers_per_booking']) ? (int) $data['max_travelers_per_booking'] : null;
        $trip->waitlist_enabled = (bool) ($data['waitlist_enabled'] ?? false);
        $trip->waitlist_capacity = isset($data['waitlist_capacity']) ? (int) $data['waitlist_capacity'] : null;
        $trip->instant_booking = (bool) ($data['instant_booking'] ?? true);
        $trip->requires_approval = (bool) ($data['requires_approval'] ?? false);
        $trip->booking_confirmation_email = (bool) ($data['booking_confirmation_email'] ?? true);
        $trip->booking_reminder_email = (bool) ($data['booking_reminder_email'] ?? true);
        $trip->reminder_days_before = (int) ($data['reminder_days_before'] ?? 7);

        // Requirements
        $trip->age_min = isset($data['age_min']) ? (int) $data['age_min'] : null;
        $trip->age_max = isset($data['age_max']) ? (int) $data['age_max'] : null;
        $trip->physical_requirements = $data['physical_requirements'] ?? '';
        $trip->medical_requirements = $data['medical_requirements'] ?? '';
        $trip->visa_requirements = $data['visa_requirements'] ?? '';
        $trip->vaccination_requirements = $data['vaccination_requirements'] ?? '';
        $trip->passport_validity_months = (int) ($data['passport_validity_months'] ?? 6);
        $trip->travel_insurance_required = (bool) ($data['travel_insurance_required'] ?? false);
        $trip->special_equipment = $data['special_equipment'] ?? '';

        // Policies
        $trip->cancellation_policy = $data['cancellation_policy'] ?? '';
        $trip->refund_policy = $data['refund_policy'] ?? '';
        $trip->change_policy = $data['change_policy'] ?? '';
        $trip->weather_policy = $data['weather_policy'] ?? '';
        $trip->force_majeure_policy = $data['force_majeure_policy'] ?? '';
        $trip->terms_conditions = $data['terms_conditions'] ?? '';

        // Accommodation
        $trip->accommodation_type = $data['accommodation_type'] ?? null;
        $trip->accommodation_standard = $data['accommodation_standard'] ?? null;
        $trip->meal_plan = $data['meal_plan'] ?? null;
        $trip->accommodation_details = $data['accommodation_details'] ?? '';
        $trip->accommodation_included = (bool) ($data['accommodation_included'] ?? true);

        // Transportation
        $trip->transportation_included = (bool) ($data['transportation_included'] ?? false);
        $trip->pickup_location = $data['pickup_location'] ?? null;
        $trip->pickup_location_lat = $data['pickup_location_lat'] ?? null;
        $trip->pickup_location_lng = $data['pickup_location_lng'] ?? null;
        $trip->dropoff_location = $data['dropoff_location'] ?? null;
        $trip->dropoff_location_lat = $data['dropoff_location_lat'] ?? null;
        $trip->dropoff_location_lng = $data['dropoff_location_lng'] ?? null;
        $trip->transportation_details = $data['transportation_details'] ?? '';
        $trip->internal_transportation = $data['internal_transportation'] ?? '';
        $trip->international_flights_included = (bool) ($data['international_flights_included'] ?? false);
        $trip->domestic_flights_included = (bool) ($data['domestic_flights_included'] ?? false);

        // Media
        $trip->featured_image_id = isset($data['featured_image_id']) ? (int) $data['featured_image_id'] : null;
        $trip->featured_image_url = $data['featured_image_url'] ?? null;
        $trip->video_url = $data['video_url'] ?? null;
        $trip->virtual_tour_url = $data['virtual_tour_url'] ?? null;
        $trip->promo_video_url = $data['promo_video_url'] ?? null;
        $trip->social_share_image_id = isset($data['social_share_image_id']) ? (int) $data['social_share_image_id'] : null;

        // SEO
        $trip->meta_title = $data['meta_title'] ?? null;
        $trip->meta_description = $data['meta_description'] ?? null;
        $trip->meta_keywords = $data['meta_keywords'] ?? null;
        $trip->og_title = $data['og_title'] ?? null;
        $trip->og_description = $data['og_description'] ?? null;
        $trip->og_image_id = isset($data['og_image_id']) ? (int) $data['og_image_id'] : null;
        $trip->schema_markup = $data['schema_markup'] ?? null;

        // Status
        $trip->status = $data['status'] ?? 'draft';
        $trip->scheduled_publish_date = $data['scheduled_publish_date'] ?? null;
        $trip->scheduled_unpublish_date = $data['scheduled_unpublish_date'] ?? null;
        $trip->published_at = $data['published_at'] ?? null;
        $trip->version = (int) ($data['version'] ?? 1);
        $trip->is_featured = (bool) ($data['is_featured'] ?? false);
        $trip->featured_order = (int) ($data['featured_order'] ?? 0);
        $trip->sort_order = (int) ($data['sort_order'] ?? 0);

        // Analytics
        $trip->views_count = (int) ($data['views_count'] ?? 0);
        $trip->bookings_count = (int) ($data['bookings_count'] ?? 0);
        $trip->revenue_total = (float) ($data['revenue_total'] ?? 0.00);
        $trip->conversion_rate = (float) ($data['conversion_rate'] ?? 0.00);
        $trip->avg_rating = (float) ($data['avg_rating'] ?? 0.00);
        $trip->reviews_count = (int) ($data['reviews_count'] ?? 0);
        $trip->last_viewed_at = $data['last_viewed_at'] ?? null;
        $trip->last_booked_at = $data['last_booked_at'] ?? null;

        // JSON Fields
        $trip->highlights = self::parseJsonField($data['highlights'] ?? null);
        $trip->testimonials = self::parseJsonField($data['testimonials'] ?? null);
        $trip->countries = self::parseJsonField($data['countries'] ?? null);
        $trip->regions = self::parseJsonField($data['regions'] ?? null);
        $trip->landmarks = self::parseJsonField($data['landmarks'] ?? null);
        $trip->tags = self::parseJsonField($data['tags'] ?? null);
        $trip->included_items = self::parseJsonField($data['included_items'] ?? null);
        $trip->excluded_items = self::parseJsonField($data['excluded_items'] ?? null);
        $trip->gallery_images = self::parseJsonField($data['gallery_images'] ?? null);
        $trip->price_types = self::parseJsonField($data['price_types'] ?? null);
        $trip->itinerary_days = self::parseJsonField($data['itinerary_days'] ?? null);
        $trip->faqs = self::parseJsonField($data['faqs'] ?? null);
        $trip->frontend_tabs = self::parseJsonField($data['frontend_tabs'] ?? null);
        $trip->availability_dates = self::parseJsonField($data['availability_dates'] ?? null);
        $trip->custom_fields = self::parseJsonField($data['custom_fields'] ?? null, []);
        $trip->pricing_rules = self::parseJsonField($data['pricing_rules'] ?? null, []);
        $trip->booking_rules = self::parseJsonField($data['booking_rules'] ?? null, []);

        // Timestamps
        $trip->created_at = $data['created_at'] ?? '';
        $trip->updated_at = $data['updated_at'] ?? '';
        $trip->created_by = (int) ($data['created_by'] ?? 0);
        $trip->updated_by = (int) ($data['updated_by'] ?? 0);
        $trip->deleted_at = $data['deleted_at'] ?? null;
        $trip->deleted_by = isset($data['deleted_by']) ? (int) $data['deleted_by'] : null;

        return $trip;
    }

    /**
     * Convert to array (for database storage)
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'trip_code' => $this->trip_code,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'trip_details' => $this->trip_details,
            'what_makes_special' => $this->what_makes_special,
            'trip_story' => $this->trip_story,
            'excerpt' => $this->excerpt,
            'starting_location' => $this->starting_location,
            'ending_location' => $this->ending_location,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'map_zoom_level' => $this->map_zoom_level,
            'timezone' => $this->timezone,
            'country_code' => $this->country_code,
            'trip_type' => $this->trip_type,
            'duration_days' => $this->duration_days,
            'duration_nights' => $this->duration_nights,
            'duration_hours' => $this->duration_hours,
            'available_from' => $this->available_from,
            'available_to' => $this->available_to,
            'booking_window_days' => $this->booking_window_days,
            'booking_deadline_hours' => $this->booking_deadline_hours,
            'flexible_dates' => $this->flexible_dates ? 1 : 0,
            'fixed_departures_only' => $this->fixed_departures_only ? 1 : 0,
            'seasonal_availability' => $this->seasonal_availability,
            'best_season' => $this->best_season,
            'peak_season' => $this->peak_season,
            'off_season' => $this->off_season,
            'seasonal_auto_enable' => $this->seasonal_auto_enable ? 1 : 0,
            'seasonal_enable_date' => $this->seasonal_enable_date,
            'seasonal_disable_date' => $this->seasonal_disable_date,
            'blackout_dates' => self::serializeJsonField($this->blackout_dates),
            'trip_category' => $this->trip_category,
            'trip_category_parent' => $this->trip_category_parent,
            'trip_category_sub' => $this->trip_category_sub,
            'difficulty_level' => $this->difficulty_level,
            'activity_intensity' => $this->activity_intensity,
            'featured_priority' => $this->featured_priority,
            'trip_style' => $this->trip_style,
            'group_type' => $this->group_type,
            'pricing_type' => $this->pricing_type,
            'original_price' => $this->original_price,
            'discounted_price' => $this->discounted_price,
            'sale_price' => $this->sale_price,
            'currency' => $this->currency,
            'price_per_person' => $this->price_per_person ? 1 : 0,
            'deposit_required' => $this->deposit_required ? 1 : 0,
            'deposit_amount' => $this->deposit_amount,
            'deposit_percentage' => $this->deposit_percentage,
            'payment_terms' => $this->payment_terms,
            'payment_plans_enabled' => $this->payment_plans_enabled ? 1 : 0,
            'tax_included' => $this->tax_included ? 1 : 0,
            'tax_rate' => $this->tax_rate,
            'service_charge' => $this->service_charge,
            'service_charge_percentage' => $this->service_charge_percentage,
            'group_pricing_enabled' => $this->group_pricing_enabled ? 1 : 0,
            'group_size_min' => $this->group_size_min,
            'group_size_max' => $this->group_size_max,
            'group_discount_type' => $this->group_discount_type,
            'group_discount_percentage' => $this->group_discount_percentage,
            'group_discount_amount' => $this->group_discount_amount,
            'early_bird_discount_enabled' => $this->early_bird_discount_enabled ? 1 : 0,
            'early_bird_days' => $this->early_bird_days,
            'early_bird_discount' => $this->early_bird_discount,
            'last_minute_discount_enabled' => $this->last_minute_discount_enabled ? 1 : 0,
            'last_minute_days' => $this->last_minute_days,
            'last_minute_discount' => $this->last_minute_discount,
            'min_travelers' => $this->min_travelers,
            'max_travelers' => $this->max_travelers,
            'max_travelers_per_booking' => $this->max_travelers_per_booking,
            'waitlist_enabled' => $this->waitlist_enabled ? 1 : 0,
            'waitlist_capacity' => $this->waitlist_capacity,
            'instant_booking' => $this->instant_booking ? 1 : 0,
            'requires_approval' => $this->requires_approval ? 1 : 0,
            'booking_confirmation_email' => $this->booking_confirmation_email ? 1 : 0,
            'booking_reminder_email' => $this->booking_reminder_email ? 1 : 0,
            'reminder_days_before' => $this->reminder_days_before,
            'age_min' => $this->age_min,
            'age_max' => $this->age_max,
            'physical_requirements' => $this->physical_requirements,
            'medical_requirements' => $this->medical_requirements,
            'visa_requirements' => $this->visa_requirements,
            'vaccination_requirements' => $this->vaccination_requirements,
            'passport_validity_months' => $this->passport_validity_months,
            'travel_insurance_required' => $this->travel_insurance_required ? 1 : 0,
            'special_equipment' => $this->special_equipment,
            'cancellation_policy' => $this->cancellation_policy,
            'refund_policy' => $this->refund_policy,
            'change_policy' => $this->change_policy,
            'weather_policy' => $this->weather_policy,
            'force_majeure_policy' => $this->force_majeure_policy,
            'terms_conditions' => $this->terms_conditions,
            'accommodation_type' => $this->accommodation_type,
            'accommodation_standard' => $this->accommodation_standard,
            'meal_plan' => $this->meal_plan,
            'accommodation_details' => $this->accommodation_details,
            'accommodation_included' => $this->accommodation_included ? 1 : 0,
            'transportation_included' => $this->transportation_included ? 1 : 0,
            'pickup_location' => $this->pickup_location,
            'pickup_location_lat' => $this->pickup_location_lat,
            'pickup_location_lng' => $this->pickup_location_lng,
            'dropoff_location' => $this->dropoff_location,
            'dropoff_location_lat' => $this->dropoff_location_lat,
            'dropoff_location_lng' => $this->dropoff_location_lng,
            'transportation_details' => $this->transportation_details,
            'internal_transportation' => $this->internal_transportation,
            'international_flights_included' => $this->international_flights_included ? 1 : 0,
            'domestic_flights_included' => $this->domestic_flights_included ? 1 : 0,
            'featured_image_id' => $this->featured_image_id,
            'featured_image_url' => $this->featured_image_url,
            'video_url' => $this->video_url,
            'virtual_tour_url' => $this->virtual_tour_url,
            'promo_video_url' => $this->promo_video_url,
            'social_share_image_id' => $this->social_share_image_id,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_id' => $this->og_image_id,
            'schema_markup' => $this->schema_markup,
            'status' => $this->status,
            'scheduled_publish_date' => $this->scheduled_publish_date,
            'scheduled_unpublish_date' => $this->scheduled_unpublish_date,
            'published_at' => $this->published_at,
            'version' => $this->version,
            'is_featured' => $this->is_featured ? 1 : 0,
            'featured_order' => $this->featured_order,
            'sort_order' => $this->sort_order,
            'views_count' => $this->views_count,
            'bookings_count' => $this->bookings_count,
            'revenue_total' => $this->revenue_total,
            'conversion_rate' => $this->conversion_rate,
            'avg_rating' => $this->avg_rating,
            'reviews_count' => $this->reviews_count,
            'last_viewed_at' => $this->last_viewed_at,
            'last_booked_at' => $this->last_booked_at,
            'highlights' => self::serializeJsonField($this->highlights),
            'testimonials' => self::serializeJsonField($this->testimonials),
            'countries' => self::serializeJsonField($this->countries),
            'regions' => self::serializeJsonField($this->regions),
            'landmarks' => self::serializeJsonField($this->landmarks),
            'tags' => self::serializeJsonField($this->tags),
            'included_items' => self::serializeJsonField($this->included_items),
            'excluded_items' => self::serializeJsonField($this->excluded_items),
            'gallery_images' => self::serializeJsonField($this->gallery_images),
            'price_types' => self::serializeJsonField($this->price_types),
            'itinerary_days' => self::serializeJsonField($this->itinerary_days),
            'faqs' => self::serializeJsonField($this->faqs),
            'frontend_tabs' => self::serializeJsonField($this->frontend_tabs),
            'availability_dates' => self::serializeJsonField($this->availability_dates),
            'custom_fields' => self::serializeJsonField($this->custom_fields),
            'pricing_rules' => self::serializeJsonField($this->pricing_rules),
            'booking_rules' => self::serializeJsonField($this->booking_rules),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'deleted_at' => $this->deleted_at,
            'deleted_by' => $this->deleted_by,
        ];
    }

    /**
     * Parse JSON field from database
     */
    private static function parseJsonField(?string $value, array $default = []): array
    {
        if (empty($value)) {
            return $default;
        }

        $decoded = maybe_unserialize($value);
        if (is_array($decoded)) {
            return $decoded;
        }

        $json = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            return $json;
        }

        return $default;
    }

    /**
     * Serialize JSON field for database
     */
    private static function serializeJsonField(array $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return maybe_serialize($value);
    }
}
