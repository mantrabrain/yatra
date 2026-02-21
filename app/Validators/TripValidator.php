<?php

declare(strict_types=1);

namespace Yatra\Validators;

use Yatra\Exceptions\ValidationException;

/**
 * Trip Validator
 * 
 * Comprehensive validation for trip data
 */
class TripValidator
{
    /**
     * Validate trip creation data
     */
    public static function validateCreate(array $data): void
    {
        $errors = [];

        // Required fields
        if (empty($data['title'])) {
            $errors['title'][] = __('Title is required', 'yatra');
        }

        if (empty($data['status'])) {
            $errors['status'][] = __('Status is required', 'yatra');
        } elseif (!in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        // Validate pricing
        if (isset($data['original_price'])) {
            if (!is_numeric($data['original_price']) || (float)$data['original_price'] < 0) {
                $errors['original_price'][] = __('Original price must be a valid positive number', 'yatra');
            }
        }

        if (isset($data['sale_price'])) {
            if (!is_numeric($data['sale_price']) || (float)$data['sale_price'] < 0) {
                $errors['sale_price'][] = __('Sale price must be a valid positive number', 'yatra');
            }
        }

        // Validate duration
        if (isset($data['duration_days'])) {
            if (!is_numeric($data['duration_days']) || (int)$data['duration_days'] < 0) {
                $errors['duration_days'][] = __('Duration days must be a valid positive number', 'yatra');
            }
        }

        if (isset($data['duration_nights'])) {
            if (!is_numeric($data['duration_nights']) || (int)$data['duration_nights'] < 0) {
                $errors['duration_nights'][] = __('Duration nights must be a valid positive number', 'yatra');
            }
        }

        // Validate difficulty level
        if (isset($data['difficulty_level'])) {
            if (!is_numeric($data['difficulty_level']) || (int)$data['difficulty_level'] <= 0) {
                $errors['difficulty_level'][] = __('Difficulty level must be a valid positive integer', 'yatra');
            }
        }

        // Validate group size
        if (isset($data['min_group_size'])) {
            if (!is_numeric($data['min_group_size']) || (int)$data['min_group_size'] < 1) {
                $errors['min_group_size'][] = __('Minimum group size must be at least 1', 'yatra');
            }
        }

        if (isset($data['max_group_size'])) {
            if (!is_numeric($data['max_group_size']) || (int)$data['max_group_size'] < 1) {
                $errors['max_group_size'][] = __('Maximum group size must be at least 1', 'yatra');
            }
        }

        // Validate min/max group size relationship
        if (isset($data['min_group_size']) && isset($data['max_group_size'])) {
            if ((int)$data['min_group_size'] > (int)$data['max_group_size']) {
                $errors['max_group_size'][] = __('Maximum group size must be greater than or equal to minimum group size', 'yatra');
            }
        }

        // Validate slug format
        if (isset($data['slug']) && !empty($data['slug'])) {
            if (!preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
                $errors['slug'][] = __('Slug can only contain lowercase letters, numbers, and hyphens', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Trip validation failed', $errors);
        }
    }

    /**
     * Validate trip update data
     */
    public static function validateUpdate(array $data, int $tripId): void
    {
        $errors = [];

        // ID validation
        if ($tripId <= 0) {
            $errors['id'][] = __('Invalid trip ID', 'yatra');
        }

        // Optional field validation (same rules as create, but fields are optional)
        if (isset($data['status']) && !in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        if (isset($data['original_price']) && (!is_numeric($data['original_price']) || (float)$data['original_price'] < 0)) {
            $errors['original_price'][] = __('Original price must be a valid positive number', 'yatra');
        }

        if (isset($data['sale_price']) && (!is_numeric($data['sale_price']) || (float)$data['sale_price'] < 0)) {
            $errors['sale_price'][] = __('Sale price must be a valid positive number', 'yatra');
        }

        if (isset($data['duration_days']) && (!is_numeric($data['duration_days']) || (int)$data['duration_days'] < 0)) {
            $errors['duration_days'][] = __('Duration days must be a valid positive number', 'yatra');
        }

        if (isset($data['duration_nights']) && (!is_numeric($data['duration_nights']) || (int)$data['duration_nights'] < 0)) {
            $errors['duration_nights'][] = __('Duration nights must be a valid positive number', 'yatra');
        }

        if (isset($data['difficulty_level']) && (!is_numeric($data['difficulty_level']) || (int)$data['difficulty_level'] <= 0)) {
            $errors['difficulty_level'][] = __('Difficulty level must be a valid positive integer', 'yatra');
        }

        if (isset($data['min_group_size']) && (!is_numeric($data['min_group_size']) || (int)$data['min_group_size'] < 1)) {
            $errors['min_group_size'][] = __('Minimum group size must be at least 1', 'yatra');
        }

        if (isset($data['max_group_size']) && (!is_numeric($data['max_group_size']) || (int)$data['max_group_size'] < 1)) {
            $errors['max_group_size'][] = __('Maximum group size must be at least 1', 'yatra');
        }

        if (isset($data['min_group_size']) && isset($data['max_group_size'])) {
            if ((int)$data['min_group_size'] > (int)$data['max_group_size']) {
                $errors['max_group_size'][] = __('Maximum group size must be greater than or equal to minimum group size', 'yatra');
            }
        }

        if (isset($data['slug']) && !empty($data['slug']) && !preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
            $errors['slug'][] = __('Slug can only contain lowercase letters, numbers, and hyphens', 'yatra');
        }

        if (!empty($errors)) {
            throw new ValidationException('Trip validation failed', $errors);
        }
    }

    /**
     * Sanitize trip data
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        // Text fields
        if (isset($data['title'])) {
            $sanitized['title'] = sanitize_text_field($data['title']);
        }

        if (isset($data['slug'])) {
            $sanitized['slug'] = sanitize_title($data['slug']);
        }

        if (isset($data['description'])) {
            $sanitized['description'] = wp_kses_post($data['description']);
        }

        if (isset($data['short_description'])) {
            $sanitized['short_description'] = wp_kses_post($data['short_description']);
        }

        if (isset($data['trip_details'])) {
            $sanitized['trip_details'] = wp_kses_post($data['trip_details']);
        }

        if (isset($data['what_makes_special'])) {
            $sanitized['what_makes_special'] = wp_kses_post($data['what_makes_special']);
        }

        if (isset($data['trip_story'])) {
            $sanitized['trip_story'] = wp_kses_post($data['trip_story']);
        }

        if (isset($data['video_url'])) {
            $sanitized['video_url'] = esc_url_raw($data['video_url']);
        }

        if (isset($data['virtual_tour_url'])) {
            $sanitized['virtual_tour_url'] = esc_url_raw($data['virtual_tour_url']);
        }

        if (isset($data['starting_location'])) {
            $sanitized['starting_location'] = sanitize_text_field($data['starting_location']);
        }

        if (isset($data['ending_location'])) {
            $sanitized['ending_location'] = sanitize_text_field($data['ending_location']);
        }

        if (isset($data['latitude'])) {
            $sanitized['latitude'] = is_numeric($data['latitude']) ? (float) $data['latitude'] : null;
        }

        if (isset($data['longitude'])) {
            $sanitized['longitude'] = is_numeric($data['longitude']) ? (float) $data['longitude'] : null;
        }

        if (isset($data['seasonal_availability'])) {
            $sanitized['seasonal_availability'] = sanitize_text_field($data['seasonal_availability']);
        }

        if (isset($data['best_season'])) {
            $sanitized['best_season'] = sanitize_text_field($data['best_season']);
        }

        if (isset($data['peak_season'])) {
            $sanitized['peak_season'] = sanitize_text_field($data['peak_season']);
        }

        if (isset($data['off_season'])) {
            $sanitized['off_season'] = sanitize_text_field($data['off_season']);
        }

        if (isset($data['accommodation_type'])) {
            $sanitized['accommodation_type'] = sanitize_text_field($data['accommodation_type']);
        }

        if (isset($data['meal_plan'])) {
            $sanitized['meal_plan'] = sanitize_text_field($data['meal_plan']);
        }

        if (isset($data['accommodation_details'])) {
            $sanitized['accommodation_details'] = wp_kses_post($data['accommodation_details']);
        }

        if (isset($data['pickup_location'])) {
            $sanitized['pickup_location'] = sanitize_text_field($data['pickup_location']);
        }

        if (isset($data['dropoff_location'])) {
            $sanitized['dropoff_location'] = sanitize_text_field($data['dropoff_location']);
        }

        if (isset($data['transportation_details'])) {
            $sanitized['transportation_details'] = wp_kses_post($data['transportation_details']);
        }

        if (isset($data['payment_terms'])) {
            $sanitized['payment_terms'] = wp_kses_post($data['payment_terms']);
        }

        if (isset($data['cancellation_policy'])) {
            $sanitized['cancellation_policy'] = wp_kses_post($data['cancellation_policy']);
        }

        if (isset($data['physical_requirements'])) {
            $sanitized['physical_requirements'] = wp_kses_post($data['physical_requirements']);
        }

        if (isset($data['visa_requirements'])) {
            $sanitized['visa_requirements'] = wp_kses_post($data['visa_requirements']);
        }

        if (isset($data['vaccination_requirements'])) {
            $sanitized['vaccination_requirements'] = wp_kses_post($data['vaccination_requirements']);
        }

        if (isset($data['meta_title'])) {
            $sanitized['meta_title'] = sanitize_text_field($data['meta_title']);
        }

        if (isset($data['meta_description'])) {
            $sanitized['meta_description'] = sanitize_textarea_field($data['meta_description']);
        }

        if (isset($data['meta_keywords'])) {
            $sanitized['meta_keywords'] = sanitize_text_field($data['meta_keywords']);
        }

        // Numeric fields
        if (isset($data['original_price'])) {
            $sanitized['original_price'] = (float)$data['original_price'];
        }

        if (isset($data['discounted_price'])) {
            $sanitized['discounted_price'] = (float)$data['discounted_price'];
        }

        if (isset($data['duration_days'])) {
            $sanitized['duration_days'] = (int)$data['duration_days'];
        }

        if (isset($data['duration_hours'])) {
            $sanitized['duration_hours'] = (int)$data['duration_hours'];
        }

        if (isset($data['available_from'])) {
            $sanitized['available_from'] = sanitize_text_field($data['available_from']);
        }

        if (isset($data['available_to'])) {
            $sanitized['available_to'] = sanitize_text_field($data['available_to']);
        }

        if (isset($data['age_min'])) {
            $sanitized['age_min'] = (int)$data['age_min'];
        }

        if (isset($data['age_max'])) {
            $sanitized['age_max'] = (int)$data['age_max'];
        }

        if (isset($data['version'])) {
            $sanitized['version'] = (int)$data['version'];
        }

        if (isset($data['updated_by'])) {
            $sanitized['updated_by'] = (int)$data['updated_by'];
        }

        if (isset($data['updated_at'])) {
            $sanitized['updated_at'] = sanitize_text_field($data['updated_at']);
        }

        if (isset($data['difficulty_level'])) {
            $sanitized['difficulty_level'] = (int)$data['difficulty_level'];
        }

        if (isset($data['min_group_size'])) {
            $sanitized['min_group_size'] = (int)$data['min_group_size'];
        }

        if (isset($data['max_group_size'])) {
            $sanitized['max_group_size'] = (int)$data['max_group_size'];
        }

        // Booking fields
        if (isset($data['min_travelers'])) {
            $sanitized['min_travelers'] = (int)$data['min_travelers'];
        }

        if (isset($data['max_travelers'])) {
            $sanitized['max_travelers'] = (int)$data['max_travelers'];
        }

        if (isset($data['booking_window_days'])) {
            $sanitized['booking_window_days'] = (int)$data['booking_window_days'];
        }

        if (isset($data['booking_deadline_hours'])) {
            $sanitized['booking_deadline_hours'] = (int)$data['booking_deadline_hours'];
        }

        // Enum fields
        if (isset($data['status'])) {
            $sanitized['status'] = in_array($data['status'], ['draft', 'publish', 'private', 'trash']) 
                ? $data['status'] 
                : 'draft';
        }

        if (isset($data['trip_type'])) {
            $sanitized['trip_type'] = in_array($data['trip_type'], ['single_day', 'multi_day', 'flexible']) 
                ? $data['trip_type'] 
                : 'multi_day';
        }

        if (isset($data['pricing_type'])) {
            $sanitized['pricing_type'] = in_array($data['pricing_type'], ['regular', 'traveler_based', 'dynamic', 'custom']) 
                ? $data['pricing_type'] 
                : 'regular';
        }

        if (isset($data['featured_priority'])) {
            $sanitized['featured_priority'] = in_array($data['featured_priority'], ['none', 'featured', 'popular', 'new', 'limited', 'bestseller']) 
                ? $data['featured_priority'] 
                : 'none';
        }

        if (isset($data['currency'])) {
            $sanitized['currency'] = sanitize_text_field($data['currency']);
        }

        // Always include featured_image if it exists in the data, even if null
        if (array_key_exists('featured_image', $data)) {
            // Allow null or empty string to remove featured image
            $sanitized['featured_image'] = empty($data['featured_image']) ? null : sanitize_text_field($data['featured_image']);
        }

        // JSON fields
        if (isset($data['testimonials'])) {
            $sanitized['testimonials'] = is_array($data['testimonials']) ? maybe_serialize($data['testimonials']) : $data['testimonials'];
        }

        if (isset($data['countries'])) {
            $sanitized['countries'] = is_array($data['countries']) ? maybe_serialize($data['countries']) : $data['countries'];
        }

        if (isset($data['regions'])) {
            $sanitized['regions'] = is_array($data['regions']) ? maybe_serialize($data['regions']) : $data['regions'];
        }

        if (isset($data['landmarks'])) {
            $sanitized['landmarks'] = is_array($data['landmarks']) ? maybe_serialize($data['landmarks']) : $data['landmarks'];
        }

        if (isset($data['tags'])) {
            $sanitized['tags'] = is_array($data['tags']) ? maybe_serialize($data['tags']) : $data['tags'];
        }

        if (isset($data['included_items'])) {
            $sanitized['included_items'] = is_array($data['included_items']) ? maybe_serialize($data['included_items']) : $data['included_items'];
        }

        if (isset($data['excluded_items'])) {
            $sanitized['excluded_items'] = is_array($data['excluded_items']) ? maybe_serialize($data['excluded_items']) : $data['excluded_items'];
        }

        if (isset($data['frontend_tabs'])) {
            $sanitized['frontend_tabs'] = is_array($data['frontend_tabs']) ? maybe_serialize($data['frontend_tabs']) : $data['frontend_tabs'];
        }

        if (isset($data['features'])) {
            $sanitized['features'] = is_array($data['features']) ? json_encode($data['features']) : $data['features'];
        }

        if (isset($data['includes'])) {
            $sanitized['includes'] = is_array($data['includes']) ? json_encode($data['includes']) : $data['includes'];
        }

        if (isset($data['excludes'])) {
            $sanitized['excludes'] = is_array($data['excludes']) ? json_encode($data['excludes']) : $data['excludes'];
        }

        return apply_filters('yatra_trip_sanitize_data', $sanitized, $data);
    }
}
