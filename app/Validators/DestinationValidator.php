<?php

declare(strict_types=1);

namespace Yatra\Validators;

use Yatra\Exceptions\ValidationException;

/**
 * Destination Validator
 * 
 * Comprehensive validation for destination data
 */
class DestinationValidator
{
    /**
     * Validate destination creation data
     */
    public static function validateCreate(array $data): void
    {
        $errors = [];

        // Required fields
        if (empty($data['name'])) {
            $errors['name'][] = __('Destination name is required', 'yatra');
        } elseif (strlen($data['name']) < 2) {
            $errors['name'][] = __('Destination name must be at least 2 characters', 'yatra');
        }

        if (empty($data['status'])) {
            $errors['status'][] = __('Status is required', 'yatra');
        } elseif (!in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        // Optional field validation
        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'][] = __('Description cannot exceed 10000 characters', 'yatra');
        }

        if (isset($data['short_description']) && strlen($data['short_description']) > 500) {
            $errors['short_description'][] = __('Short description cannot exceed 500 characters', 'yatra');
        }

        if (isset($data['slug']) && !empty($data['slug'])) {
            if (!preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
                $errors['slug'][] = __('Slug can only contain lowercase letters, numbers, and hyphens', 'yatra');
            }
        }

        if (isset($data['country_code']) && !empty($data['country_code'])) {
            if (!preg_match('/^[A-Z]{2}$/', $data['country_code'])) {
                $errors['country_code'][] = __('Country code must be 2 uppercase letters', 'yatra');
            }
        }

        if (isset($data['latitude']) && !empty($data['latitude'])) {
            if (!is_numeric($data['latitude']) || (float)$data['latitude'] < -90 || (float)$data['latitude'] > 90) {
                $errors['latitude'][] = __('Latitude must be between -90 and 90', 'yatra');
            }
        }

        if (isset($data['longitude']) && !empty($data['longitude'])) {
            if (!is_numeric($data['longitude']) || (float)$data['longitude'] < -180 || (float)$data['longitude'] > 180) {
                $errors['longitude'][] = __('Longitude must be between -180 and 180', 'yatra');
            }
        }

        if (isset($data['altitude']) && !empty($data['altitude'])) {
            if (!is_numeric($data['altitude'])) {
                $errors['altitude'][] = __('Altitude must be a valid number', 'yatra');
            }
        }

        if (isset($data['time_zone']) && !empty($data['time_zone'])) {
            if (!in_array($data['time_zone'], timezone_identifiers_list())) {
                $errors['time_zone'][] = __('Invalid timezone', 'yatra');
            }
        }

        if (isset($data['best_time_to_visit']) && !empty($data['best_time_to_visit'])) {
            $validMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
            if (is_array($data['best_time_to_visit'])) {
                foreach ($data['best_time_to_visit'] as $month) {
                    if (!in_array(strtolower($month), $validMonths)) {
                        $errors['best_time_to_visit'][] = __('Invalid month in best time to visit', 'yatra');
                        break;
                    }
                }
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Destination validation failed', $errors);
        }
    }

    /**
     * Validate destination update data
     */
    public static function validateUpdate(array $data, int $destinationId): void
    {
        $errors = [];

        // ID validation
        if ($destinationId <= 0) {
            $errors['id'][] = __('Invalid destination ID', 'yatra');
        }

        // Optional field validation
        if (isset($data['name'])) {
            if (empty($data['name'])) {
                $errors['name'][] = __('Destination name cannot be empty', 'yatra');
            } elseif (strlen($data['name']) < 2) {
                $errors['name'][] = __('Destination name must be at least 2 characters', 'yatra');
            }
        }

        if (isset($data['status']) && !in_array($data['status'], ['draft', 'publish', 'private', 'trash'])) {
            $errors['status'][] = __('Invalid status value', 'yatra');
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'][] = __('Description cannot exceed 10000 characters', 'yatra');
        }

        if (isset($data['short_description']) && strlen($data['short_description']) > 500) {
            $errors['short_description'][] = __('Short description cannot exceed 500 characters', 'yatra');
        }

        if (isset($data['slug']) && !empty($data['slug']) && !preg_match('/^[a-z0-9-]+$/', $data['slug'])) {
            $errors['slug'][] = __('Slug can only contain lowercase letters, numbers, and hyphens', 'yatra');
        }

        if (isset($data['country_code']) && !empty($data['country_code']) && !preg_match('/^[A-Z]{2}$/', $data['country_code'])) {
            $errors['country_code'][] = __('Country code must be 2 uppercase letters', 'yatra');
        }

        if (isset($data['latitude']) && !empty($data['latitude'])) {
            if (!is_numeric($data['latitude']) || (float)$data['latitude'] < -90 || (float)$data['latitude'] > 90) {
                $errors['latitude'][] = __('Latitude must be between -90 and 90', 'yatra');
            }
        }

        if (isset($data['longitude']) && !empty($data['longitude'])) {
            if (!is_numeric($data['longitude']) || (float)$data['longitude'] < -180 || (float)$data['longitude'] > 180) {
                $errors['longitude'][] = __('Longitude must be between -180 and 180', 'yatra');
            }
        }

        if (isset($data['altitude']) && !empty($data['altitude']) && !is_numeric($data['altitude'])) {
            $errors['altitude'][] = __('Altitude must be a valid number', 'yatra');
        }

        if (isset($data['time_zone']) && !empty($data['time_zone']) && !in_array($data['time_zone'], timezone_identifiers_list())) {
            $errors['time_zone'][] = __('Invalid timezone', 'yatra');
        }

        if (isset($data['best_time_to_visit']) && !empty($data['best_time_to_visit'])) {
            $validMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
            if (is_array($data['best_time_to_visit'])) {
                foreach ($data['best_time_to_visit'] as $month) {
                    if (!in_array(strtolower($month), $validMonths)) {
                        $errors['best_time_to_visit'][] = __('Invalid month in best time to visit', 'yatra');
                        break;
                    }
                }
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Destination validation failed', $errors);
        }
    }

    /**
     * Sanitize destination data
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        // Text fields
        if (isset($data['name'])) {
            $sanitized['name'] = sanitize_text_field($data['name']);
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

        if (isset($data['country'])) {
            $sanitized['country'] = sanitize_text_field($data['country']);
        }

        if (isset($data['state'])) {
            $sanitized['state'] = sanitize_text_field($data['state']);
        }

        if (isset($data['city'])) {
            $sanitized['city'] = sanitize_text_field($data['city']);
        }

        if (isset($data['address'])) {
            $sanitized['address'] = sanitize_textarea_field($data['address']);
        }

        if (isset($data['postal_code'])) {
            $sanitized['postal_code'] = sanitize_text_field($data['postal_code']);
        }

        if (isset($data['time_zone'])) {
            $sanitized['time_zone'] = sanitize_text_field($data['time_zone']);
        }

        if (isset($data['currency'])) {
            $sanitized['currency'] = sanitize_text_field($data['currency']);
        }

        if (isset($data['language'])) {
            $sanitized['language'] = sanitize_text_field($data['language']);
        }

        // Numeric fields
        if (isset($data['latitude'])) {
            $sanitized['latitude'] = (float)$data['latitude'];
        }

        if (isset($data['longitude'])) {
            $sanitized['longitude'] = (float)$data['longitude'];
        }

        if (isset($data['altitude'])) {
            $sanitized['altitude'] = (float)$data['altitude'];
        }

        if (isset($data['sort_order'])) {
            $sanitized['sort_order'] = (int)$data['sort_order'];
        }

        // Enum fields
        if (isset($data['status'])) {
            $validStatuses = ['draft', 'publish', 'private', 'trash'];
            $sanitized['status'] = in_array($data['status'], $validStatuses) ? $data['status'] : 'draft';
        }

        if (isset($data['country_code'])) {
            $sanitized['country_code'] = strtoupper(sanitize_text_field($data['country_code']));
        }

        // Boolean fields
        if (isset($data['is_featured'])) {
            $sanitized['is_featured'] = (bool)$data['is_featured'];
        }

        // JSON/Array fields
        if (isset($data['best_time_to_visit'])) {
            if (is_array($data['best_time_to_visit'])) {
                $sanitized['best_time_to_visit'] = json_encode(array_map('sanitize_text_field', $data['best_time_to_visit']));
            } else {
                $sanitized['best_time_to_visit'] = $data['best_time_to_visit'];
            }
        }

        if (isset($data['attractions'])) {
            $sanitized['attractions'] = is_array($data['attractions']) ? json_encode($data['attractions']) : $data['attractions'];
        }

        if (isset($data['activities'])) {
            $sanitized['activities'] = is_array($data['activities']) ? json_encode($data['activities']) : $data['activities'];
        }

        if (isset($data['climate_info'])) {
            $sanitized['climate_info'] = is_array($data['climate_info']) ? json_encode($data['climate_info']) : $data['climate_info'];
        }

        return $sanitized;
    }
}
