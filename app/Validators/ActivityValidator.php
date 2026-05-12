<?php

declare(strict_types=1);

namespace Yatra\Validators;

use Yatra\Exceptions\ValidationException;

/**
 * Activity Validator
 * 
 * Comprehensive validation for activity data
 */
class ActivityValidator
{
    /**
     * Validate activity creation data
     */
    public static function validateCreate(array $data): void
    {
        $errors = [];

        // Required fields
        if (empty($data['name'])) {
            $errors['name'][] = __('Activity name is required', 'yatra');
        } elseif (strlen($data['name']) < 2) {
            $errors['name'][] = __('Activity name must be at least 2 characters', 'yatra');
        }

        if (empty($data['status'])) {
            $errors['status'][] = __('Status is required', 'yatra');
        } elseif (!in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        // Optional field validation
        if (isset($data['description']) && strlen($data['description']) > 5000) {
            $errors['description'][] = __('Description cannot exceed 5000 characters', 'yatra');
        }

        if (isset($data['short_description']) && strlen($data['short_description']) > 500) {
            $errors['short_description'][] = __('Short description cannot exceed 500 characters', 'yatra');
        }

        if (isset($data['slug']) && !empty($data['slug'])) {
            if (!preg_match('/^[\pL\pN-]+$/u', $data['slug'])) {
                $errors['slug'][] = __('Slug can only contain letters, numbers, and hyphens', 'yatra');
            }
        }

        if (isset($data['difficulty_level']) && !empty($data['difficulty_level'])) {
            if (!in_array($data['difficulty_level'], ['easy', 'moderate', 'challenging', 'extreme'])) {
                $errors['difficulty_level'][] = __('Invalid difficulty level', 'yatra');
            }
        }

        if (isset($data['duration_hours']) && !empty($data['duration_hours'])) {
            if (!is_numeric($data['duration_hours']) || (float)$data['duration_hours'] <= 0) {
                $errors['duration_hours'][] = __('Duration must be a positive number', 'yatra');
            }
        }

        if (isset($data['min_age']) && !empty($data['min_age'])) {
            if (!is_numeric($data['min_age']) || (int)$data['min_age'] < 0 || (int)$data['min_age'] > 100) {
                $errors['min_age'][] = __('Minimum age must be between 0 and 100', 'yatra');
            }
        }

        if (isset($data['max_participants']) && !empty($data['max_participants'])) {
            if (!is_numeric($data['max_participants']) || (int)$data['max_participants'] <= 0) {
                $errors['max_participants'][] = __('Maximum participants must be a positive number', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Activity validation failed', $errors);
        }
    }

    /**
     * Validate activity update data
     */
    public static function validateUpdate(array $data, int $activityId): void
    {
        $errors = [];

        // ID validation
        if ($activityId <= 0) {
            $errors['id'][] = __('Invalid activity ID', 'yatra');
        }

        // Optional field validation
        if (isset($data['name'])) {
            if (empty($data['name'])) {
                $errors['name'][] = __('Activity name cannot be empty', 'yatra');
            } elseif (strlen($data['name']) < 2) {
                $errors['name'][] = __('Activity name must be at least 2 characters', 'yatra');
            }
        }

        if (isset($data['status']) && !in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        if (isset($data['description']) && strlen($data['description']) > 5000) {
            $errors['description'][] = __('Description cannot exceed 5000 characters', 'yatra');
        }

        if (isset($data['short_description']) && strlen($data['short_description']) > 500) {
            $errors['short_description'][] = __('Short description cannot exceed 500 characters', 'yatra');
        }

        if (isset($data['slug']) && !empty($data['slug']) && !preg_match('/^[\pL\pN-]+$/u', $data['slug'])) {
            $errors['slug'][] = __('Slug can only contain letters, numbers, and hyphens', 'yatra');
        }

        if (isset($data['difficulty_level']) && !empty($data['difficulty_level'])) {
            if (!in_array($data['difficulty_level'], ['easy', 'moderate', 'challenging', 'extreme'])) {
                $errors['difficulty_level'][] = __('Invalid difficulty level', 'yatra');
            }
        }

        if (isset($data['duration_hours']) && !empty($data['duration_hours'])) {
            if (!is_numeric($data['duration_hours']) || (float)$data['duration_hours'] <= 0) {
                $errors['duration_hours'][] = __('Duration must be a positive number', 'yatra');
            }
        }

        if (isset($data['min_age']) && !empty($data['min_age'])) {
            if (!is_numeric($data['min_age']) || (int)$data['min_age'] < 0 || (int)$data['min_age'] > 100) {
                $errors['min_age'][] = __('Minimum age must be between 0 and 100', 'yatra');
            }
        }

        if (isset($data['max_participants']) && !empty($data['max_participants'])) {
            if (!is_numeric($data['max_participants']) || (int)$data['max_participants'] <= 0) {
                $errors['max_participants'][] = __('Maximum participants must be a positive number', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Activity validation failed', $errors);
        }
    }

    /**
     * Sanitize activity data
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        // Text fields
        if (isset($data['name'])) {
            $sanitized['name'] = sanitize_text_field($data['name']);
        }

        if (isset($data['slug'])) {
            $sanitized['slug'] = \Yatra\Helpers\SlugHelper::generate($data['slug']);
        }

        if (isset($data['description'])) {
            $sanitized['description'] = wp_kses_post($data['description']);
        }

        if (isset($data['short_description'])) {
            $sanitized['short_description'] = wp_kses_post($data['short_description']);
        }

        if (isset($data['location'])) {
            $sanitized['location'] = sanitize_text_field($data['location']);
        }

        if (isset($data['equipment_needed'])) {
            $sanitized['equipment_needed'] = wp_kses_post($data['equipment_needed']);
        }

        if (isset($data['safety_requirements'])) {
            $sanitized['safety_requirements'] = wp_kses_post($data['safety_requirements']);
        }

        // Numeric fields
        if (isset($data['duration_hours'])) {
            $sanitized['duration_hours'] = (float)$data['duration_hours'];
        }

        if (isset($data['min_age'])) {
            $sanitized['min_age'] = (int)$data['min_age'];
        }

        if (isset($data['max_participants'])) {
            $sanitized['max_participants'] = (int)$data['max_participants'];
        }

        if (isset($data['sort_order'])) {
            $sanitized['sort_order'] = (int)$data['sort_order'];
        }

        // Enum fields
        if (isset($data['status'])) {
            $validStatuses = ['draft', 'publish', 'private', 'trash'];
            $sanitized['status'] = in_array($data['status'], $validStatuses) ? $data['status'] : 'draft';
        }

        if (isset($data['difficulty_level'])) {
            $validLevels = ['easy', 'moderate', 'challenging', 'extreme'];
            $sanitized['difficulty_level'] = in_array($data['difficulty_level'], $validLevels) ? $data['difficulty_level'] : null;
        }

        // Boolean fields
        if (isset($data['is_featured'])) {
            $sanitized['is_featured'] = (bool)$data['is_featured'];
        }

        if (isset($data['requires_guide'])) {
            $sanitized['requires_guide'] = (bool)$data['requires_guide'];
        }

        // JSON fields
        if (isset($data['features'])) {
            $sanitized['features'] = is_array($data['features']) ? json_encode($data['features']) : $data['features'];
        }

        if (isset($data['included_items'])) {
            $sanitized['included_items'] = is_array($data['included_items']) ? json_encode($data['included_items']) : $data['included_items'];
        }

        if (isset($data['excluded_items'])) {
            $sanitized['excluded_items'] = is_array($data['excluded_items']) ? json_encode($data['excluded_items']) : $data['excluded_items'];
        }

        // Icon (Yatra SVG / Font Awesome / image) — preserve full picker shape; Service layer serializes.
        if (array_key_exists('icon', $data)) {
            if (is_array($data['icon'])) {
                $sanitized['icon'] = function_exists('yatra_normalize_icon_picker_for_storage')
                    ? yatra_normalize_icon_picker_for_storage($data['icon'])
                    : $data['icon'];
            } elseif (is_string($data['icon'])) {
                $sanitized['icon'] = sanitize_text_field($data['icon']);
            } elseif ($data['icon'] === null) {
                $sanitized['icon'] = null;
            }
        }

        return $sanitized;
    }
}
