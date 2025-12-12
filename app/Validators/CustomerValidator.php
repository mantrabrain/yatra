<?php

declare(strict_types=1);

namespace Yatra\Validators;

use Yatra\Exceptions\ValidationException;

/**
 * Customer Validator
 * 
 * Comprehensive validation for customer data
 */
class CustomerValidator
{
    /**
     * Validate customer creation data
     */
    public static function validateCreate(array $data): void
    {
        $errors = [];

        // Required fields
        if (empty($data['first_name'])) {
            $errors['first_name'][] = __('First name is required', 'yatra');
        } elseif (strlen($data['first_name']) < 2) {
            $errors['first_name'][] = __('First name must be at least 2 characters', 'yatra');
        }

        if (empty($data['last_name'])) {
            $errors['last_name'][] = __('Last name is required', 'yatra');
        } elseif (strlen($data['last_name']) < 2) {
            $errors['last_name'][] = __('Last name must be at least 2 characters', 'yatra');
        }

        if (empty($data['email'])) {
            $errors['email'][] = __('Email is required', 'yatra');
        } elseif (!is_email($data['email'])) {
            $errors['email'][] = __('Invalid email format', 'yatra');
        }

        // Optional field validation
        if (isset($data['phone']) && !empty($data['phone'])) {
            if (!preg_match('/^[\+]?[0-9\s\-\(\)]{7,20}$/', $data['phone'])) {
                $errors['phone'][] = __('Invalid phone number format', 'yatra');
            }
        }

        if (isset($data['date_of_birth']) && !empty($data['date_of_birth'])) {
            if (!self::isValidDate($data['date_of_birth'])) {
                $errors['date_of_birth'][] = __('Invalid date of birth format', 'yatra');
            } elseif (strtotime($data['date_of_birth']) > strtotime('-18 years')) {
                $errors['date_of_birth'][] = __('Customer must be at least 18 years old', 'yatra');
            }
        }

        if (isset($data['gender']) && !empty($data['gender'])) {
            $validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!in_array($data['gender'], $validGenders)) {
                $errors['gender'][] = __('Invalid gender value', 'yatra');
            }
        }

        if (isset($data['country_code']) && !empty($data['country_code'])) {
            if (!preg_match('/^[A-Z]{2}$/', $data['country_code'])) {
                $errors['country_code'][] = __('Country code must be 2 uppercase letters', 'yatra');
            }
        }

        if (isset($data['passport_number']) && !empty($data['passport_number'])) {
            if (strlen($data['passport_number']) < 6 || strlen($data['passport_number']) > 20) {
                $errors['passport_number'][] = __('Passport number must be between 6 and 20 characters', 'yatra');
            }
        }

        if (isset($data['emergency_contact_phone']) && !empty($data['emergency_contact_phone'])) {
            if (!preg_match('/^[\+]?[0-9\s\-\(\)]{7,20}$/', $data['emergency_contact_phone'])) {
                $errors['emergency_contact_phone'][] = __('Invalid emergency contact phone format', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Customer validation failed', $errors);
        }
    }

    /**
     * Validate customer update data
     */
    public static function validateUpdate(array $data, int $customerId): void
    {
        $errors = [];

        // ID validation
        if ($customerId <= 0) {
            $errors['id'][] = __('Invalid customer ID', 'yatra');
        }

        // Optional field validation
        if (isset($data['first_name'])) {
            if (empty($data['first_name'])) {
                $errors['first_name'][] = __('First name cannot be empty', 'yatra');
            } elseif (strlen($data['first_name']) < 2) {
                $errors['first_name'][] = __('First name must be at least 2 characters', 'yatra');
            }
        }

        if (isset($data['last_name'])) {
            if (empty($data['last_name'])) {
                $errors['last_name'][] = __('Last name cannot be empty', 'yatra');
            } elseif (strlen($data['last_name']) < 2) {
                $errors['last_name'][] = __('Last name must be at least 2 characters', 'yatra');
            }
        }

        if (isset($data['email'])) {
            if (empty($data['email'])) {
                $errors['email'][] = __('Email cannot be empty', 'yatra');
            } elseif (!is_email($data['email'])) {
                $errors['email'][] = __('Invalid email format', 'yatra');
            }
        }

        if (isset($data['phone']) && !empty($data['phone'])) {
            if (!preg_match('/^[\+]?[0-9\s\-\(\)]{7,20}$/', $data['phone'])) {
                $errors['phone'][] = __('Invalid phone number format', 'yatra');
            }
        }

        if (isset($data['date_of_birth']) && !empty($data['date_of_birth'])) {
            if (!self::isValidDate($data['date_of_birth'])) {
                $errors['date_of_birth'][] = __('Invalid date of birth format', 'yatra');
            } elseif (strtotime($data['date_of_birth']) > strtotime('-18 years')) {
                $errors['date_of_birth'][] = __('Customer must be at least 18 years old', 'yatra');
            }
        }

        if (isset($data['gender']) && !empty($data['gender'])) {
            $validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!in_array($data['gender'], $validGenders)) {
                $errors['gender'][] = __('Invalid gender value', 'yatra');
            }
        }

        if (isset($data['country_code']) && !empty($data['country_code'])) {
            if (!preg_match('/^[A-Z]{2}$/', $data['country_code'])) {
                $errors['country_code'][] = __('Country code must be 2 uppercase letters', 'yatra');
            }
        }

        if (isset($data['passport_number']) && !empty($data['passport_number'])) {
            if (strlen($data['passport_number']) < 6 || strlen($data['passport_number']) > 20) {
                $errors['passport_number'][] = __('Passport number must be between 6 and 20 characters', 'yatra');
            }
        }

        if (isset($data['emergency_contact_phone']) && !empty($data['emergency_contact_phone'])) {
            if (!preg_match('/^[\+]?[0-9\s\-\(\)]{7,20}$/', $data['emergency_contact_phone'])) {
                $errors['emergency_contact_phone'][] = __('Invalid emergency contact phone format', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Customer validation failed', $errors);
        }
    }

    /**
     * Sanitize customer data
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        // Text fields
        if (isset($data['first_name'])) {
            $sanitized['first_name'] = sanitize_text_field($data['first_name']);
        }

        if (isset($data['last_name'])) {
            $sanitized['last_name'] = sanitize_text_field($data['last_name']);
        }

        if (isset($data['email'])) {
            $sanitized['email'] = sanitize_email($data['email']);
        }

        if (isset($data['phone'])) {
            $sanitized['phone'] = sanitize_text_field($data['phone']);
        }

        if (isset($data['address'])) {
            $sanitized['address'] = sanitize_textarea_field($data['address']);
        }

        if (isset($data['city'])) {
            $sanitized['city'] = sanitize_text_field($data['city']);
        }

        if (isset($data['state'])) {
            $sanitized['state'] = sanitize_text_field($data['state']);
        }

        if (isset($data['country'])) {
            $sanitized['country'] = sanitize_text_field($data['country']);
        }

        if (isset($data['postal_code'])) {
            $sanitized['postal_code'] = sanitize_text_field($data['postal_code']);
        }

        if (isset($data['passport_number'])) {
            $sanitized['passport_number'] = sanitize_text_field($data['passport_number']);
        }

        if (isset($data['emergency_contact_name'])) {
            $sanitized['emergency_contact_name'] = sanitize_text_field($data['emergency_contact_name']);
        }

        if (isset($data['emergency_contact_phone'])) {
            $sanitized['emergency_contact_phone'] = sanitize_text_field($data['emergency_contact_phone']);
        }

        if (isset($data['notes'])) {
            $sanitized['notes'] = wp_kses_post($data['notes']);
        }

        // Date fields
        if (isset($data['date_of_birth'])) {
            $sanitized['date_of_birth'] = sanitize_text_field($data['date_of_birth']);
        }

        // Enum fields
        if (isset($data['gender'])) {
            $validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            $sanitized['gender'] = in_array($data['gender'], $validGenders) ? $data['gender'] : null;
        }

        if (isset($data['country_code'])) {
            $sanitized['country_code'] = strtoupper(sanitize_text_field($data['country_code']));
        }

        if (isset($data['status'])) {
            $validStatuses = ['active', 'inactive', 'blocked'];
            $sanitized['status'] = in_array($data['status'], $validStatuses) ? $data['status'] : 'active';
        }

        // Boolean fields
        if (isset($data['newsletter_subscribed'])) {
            $sanitized['newsletter_subscribed'] = (bool)$data['newsletter_subscribed'];
        }

        return $sanitized;
    }

    /**
     * Check if date is valid
     */
    private static function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
}
