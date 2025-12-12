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

        // Numeric fields
        if (isset($data['original_price'])) {
            $sanitized['original_price'] = (float)$data['original_price'];
        }

        if (isset($data['sale_price'])) {
            $sanitized['sale_price'] = (float)$data['sale_price'];
        }

        if (isset($data['duration_days'])) {
            $sanitized['duration_days'] = (int)$data['duration_days'];
        }

        if (isset($data['duration_nights'])) {
            $sanitized['duration_nights'] = (int)$data['duration_nights'];
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

        // Enum fields
        if (isset($data['status'])) {
            $sanitized['status'] = in_array($data['status'], ['draft', 'publish', 'private', 'trash']) 
                ? $data['status'] 
                : 'draft';
        }

        if (isset($data['pricing_type'])) {
            $sanitized['pricing_type'] = in_array($data['pricing_type'], ['per_person', 'per_group', 'traveler_based']) 
                ? $data['pricing_type'] 
                : 'per_person';
        }

        // JSON fields
        if (isset($data['features'])) {
            $sanitized['features'] = is_array($data['features']) ? json_encode($data['features']) : $data['features'];
        }

        if (isset($data['includes'])) {
            $sanitized['includes'] = is_array($data['includes']) ? json_encode($data['includes']) : $data['includes'];
        }

        if (isset($data['excludes'])) {
            $sanitized['excludes'] = is_array($data['excludes']) ? json_encode($data['excludes']) : $data['excludes'];
        }

        return $sanitized;
    }
}
