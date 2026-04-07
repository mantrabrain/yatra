<?php

declare(strict_types=1);

namespace Yatra\Validators;

use Yatra\Exceptions\ValidationException;

/**
 * Booking Validator
 * 
 * Comprehensive validation for booking data
 */
class BookingValidator
{
    /**
     * Validate booking creation data
     */
    public static function validateCreate(array $data): void
    {
        $errors = [];

        // Required fields
        if (empty($data['trip_id'])) {
            $errors['trip_id'][] = __('Trip ID is required', 'yatra');
        } elseif (!is_numeric($data['trip_id']) || (int)$data['trip_id'] <= 0) {
            $errors['trip_id'][] = __('Trip ID must be a valid positive integer', 'yatra');
        }

        // Customer can be guest, so customer_id is optional (if provided, validate)
        if (isset($data['customer_id']) && $data['customer_id'] !== '') {
            if (!is_numeric($data['customer_id']) || (int)$data['customer_id'] <= 0) {
                $errors['customer_id'][] = __('Customer ID must be a valid positive integer', 'yatra');
            }
        }

        // Accept either departure_date or travel_date
        $departureDate = $data['departure_date'] ?? $data['travel_date'] ?? null;
        if (empty($departureDate)) {
            $errors['departure_date'][] = __('Departure date is required', 'yatra');
        } elseif (!self::isValidDate($departureDate)) {
            $errors['departure_date'][] = __('Departure date must be a valid date', 'yatra');
        } elseif (strtotime($departureDate) < strtotime('today')) {
            $errors['departure_date'][] = __('Departure date cannot be in the past', 'yatra');
        }

        // Validate status
        if (isset($data['status'])) {
            $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'waitlist'];
            if (!in_array($data['status'], $validStatuses, true)) {
                $errors['status'][] = __('Invalid booking status', 'yatra');
            }
        }

        // Validate pricing
        if (isset($data['total_amount'])) {
            if (!is_numeric($data['total_amount']) || (float)$data['total_amount'] < 0) {
                $errors['total_amount'][] = __('Total amount must be a valid positive number', 'yatra');
            }
        }

        if (isset($data['paid_amount'])) {
            if (!is_numeric($data['paid_amount']) || (float)$data['paid_amount'] < 0) {
                $errors['paid_amount'][] = __('Paid amount must be a valid positive number', 'yatra');
            }
        }

        // Validate traveler count
        $travelerCount = $data['total_travelers'] ?? $data['travelers_count'] ?? null;
        if ($travelerCount !== null) {
            if (!is_numeric($travelerCount) || (int)$travelerCount < 1) {
                $errors['total_travelers'][] = __('Total travelers must be at least 1', 'yatra');
            }
        }

        // Payment: booking "amount type" (full / deposit / partial) vs gateway (processor).
        // Checkout sends both; Pro Flexible Payments uses payment_method=deposit|partial|full.
        $bookingAmountMethods = ['full', 'partial', 'deposit'];
        $gatewayIds = apply_filters('yatra_valid_booking_payment_gateway_ids', [
            'cash',
            'bank_transfer',
            'credit_card',
            'paypal',
            'stripe',
            'razorpay',
            'pay_later',
            'paystack',
            'mollie',
            'square',
            'authorize_net',
            'esewa',
            'khalti',
        ]);

        if (isset($data['payment_method']) && $data['payment_method'] !== '') {
            if (!in_array($data['payment_method'], $bookingAmountMethods, true)) {
                // Legacy: some clients put the gateway id in payment_method only
                if (!in_array($data['payment_method'], $gatewayIds, true)) {
                    $errors['payment_method'][] = __('Invalid payment method', 'yatra');
                }
            }
        }

        if (isset($data['payment_gateway']) && $data['payment_gateway'] !== '') {
            if (!in_array($data['payment_gateway'], $gatewayIds, true)) {
                $errors['payment_gateway'][] = __('Invalid payment gateway', 'yatra');
            }
        }

        // Validate email format
        if (isset($data['customer_email']) && !empty($data['customer_email'])) {
            if (!is_email($data['customer_email'])) {
                $errors['customer_email'][] = __('Invalid email format', 'yatra');
            }
        }

        if (!empty($errors)) {
            throw new ValidationException('Booking validation failed', $errors);
        }
    }

    /**
     * Validate booking update data
     */
    public static function validateUpdate(array $data, int $bookingId): void
    {
        $errors = [];

        // ID validation
        if ($bookingId <= 0) {
            $errors['id'][] = __('Invalid booking ID', 'yatra');
        }

        // Optional field validation
        if (isset($data['trip_id']) && (!is_numeric($data['trip_id']) || (int)$data['trip_id'] <= 0)) {
            $errors['trip_id'][] = __('Trip ID must be a valid positive integer', 'yatra');
        }

        if (isset($data['customer_id']) && (!is_numeric($data['customer_id']) || (int)$data['customer_id'] <= 0)) {
            $errors['customer_id'][] = __('Customer ID must be a valid positive integer', 'yatra');
        }

        if (isset($data['departure_date'])) {
            if (!self::isValidDate($data['departure_date'])) {
                $errors['departure_date'][] = __('Departure date must be a valid date', 'yatra');
            }
        }

        if (isset($data['status'])) {
            $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'waitlist'];
            if (!in_array($data['status'], $validStatuses, true)) {
                $errors['status'][] = __('Invalid booking status', 'yatra');
            }
        }

        if (isset($data['total_amount']) && (!is_numeric($data['total_amount']) || (float)$data['total_amount'] < 0)) {
            $errors['total_amount'][] = __('Total amount must be a valid positive number', 'yatra');
        }

        if (isset($data['paid_amount']) && (!is_numeric($data['paid_amount']) || (float)$data['paid_amount'] < 0)) {
            $errors['paid_amount'][] = __('Paid amount must be a valid positive number', 'yatra');
        }

        if (isset($data['total_travelers']) && (!is_numeric($data['total_travelers']) || (int)$data['total_travelers'] < 1)) {
            $errors['total_travelers'][] = __('Total travelers must be at least 1', 'yatra');
        }

        if (isset($data['payment_method'])) {
            $validMethods = ['cash', 'bank_transfer', 'credit_card', 'paypal', 'stripe', 'razorpay'];
            if (!in_array($data['payment_method'], $validMethods)) {
                $errors['payment_method'][] = __('Invalid payment method', 'yatra');
            }
        }

        if (isset($data['customer_email']) && !empty($data['customer_email']) && !is_email($data['customer_email'])) {
            $errors['customer_email'][] = __('Invalid email format', 'yatra');
        }

        if (!empty($errors)) {
            throw new ValidationException('Booking validation failed', $errors);
        }
    }

    /**
     * Sanitize booking data
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];

        // Integer fields
        if (isset($data['trip_id'])) {
            $sanitized['trip_id'] = (int)$data['trip_id'];
        }

        if (isset($data['customer_id'])) {
            $sanitized['customer_id'] = (int)$data['customer_id'];
        }

        if (isset($data['total_travelers'])) {
            $sanitized['total_travelers'] = (int)$data['total_travelers'];
        }
        if (isset($data['travelers_count'])) {
            $sanitized['travelers_count'] = (int)$data['travelers_count'];
        }

        // Float fields
        if (isset($data['total_amount'])) {
            $sanitized['total_amount'] = (float)$data['total_amount'];
        }

        if (isset($data['paid_amount'])) {
            $sanitized['paid_amount'] = (float)$data['paid_amount'];
        }

        // Date fields
        if (isset($data['departure_date'])) {
            $sanitized['departure_date'] = sanitize_text_field($data['departure_date']);
        }
        if (isset($data['travel_date'])) {
            $sanitized['travel_date'] = sanitize_text_field($data['travel_date']);
        }

        if (isset($data['booking_date'])) {
            $sanitized['booking_date'] = sanitize_text_field($data['booking_date']);
        }

        // Text fields
        if (isset($data['customer_name'])) {
            $sanitized['customer_name'] = sanitize_text_field($data['customer_name']);
        }

        if (isset($data['customer_email'])) {
            $sanitized['customer_email'] = sanitize_email($data['customer_email']);
        }

        if (isset($data['customer_phone'])) {
            $sanitized['customer_phone'] = sanitize_text_field($data['customer_phone']);
        }

        if (isset($data['notes'])) {
            $sanitized['notes'] = wp_kses_post($data['notes']);
        }

        // Enum fields
        if (isset($data['status'])) {
            $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'waitlist'];
            $sanitized['status'] = in_array($data['status'], $validStatuses, true) ? $data['status'] : 'pending';
        }

        if (isset($data['payment_method'])) {
            // Align with allowed frontend values (full/partial or gateway handles)
            $validMethods = [
                'full',
                'partial',
                'cash',
                'bank_transfer',
                'credit_card',
                'paypal',
                'stripe',
                'razorpay',
                'pay_later',
                'paystack',
                'mollie',
                'square',
                'authorize_net',
                'esewa',
                'khalti',
            ];
            $sanitized['payment_method'] = in_array($data['payment_method'], $validMethods, true)
                ? $data['payment_method']
                : $data['payment_method']; // keep original so validation can report exact value
        }
        if (isset($data['payment_gateway'])) {
            $sanitized['payment_gateway'] = sanitize_text_field($data['payment_gateway']);
        }

        if (isset($data['payment_status'])) {
            $validStatuses = ['pending', 'paid', 'partial', 'refunded', 'failed'];
            $sanitized['payment_status'] = in_array($data['payment_status'], $validStatuses) ? $data['payment_status'] : 'pending';
        }

        // Tax fields
        if (isset($data['subtotal'])) {
            $sanitized['subtotal'] = (float)$data['subtotal'];
        }
        if (isset($data['tax_amount'])) {
            $sanitized['tax_amount'] = (float)$data['tax_amount'];
        }
        if (isset($data['tax_rate'])) {
            $sanitized['tax_rate'] = (float)$data['tax_rate'];
        }
        if (isset($data['tax_inclusive'])) {
            $sanitized['tax_inclusive'] = (bool)$data['tax_inclusive'];
        }
        if (isset($data['tax_details'])) {
            $sanitized['tax_details'] = $data['tax_details']; // Already JSON encoded
        }

        // Other booking fields
        if (isset($data['currency'])) {
            $sanitized['currency'] = sanitize_text_field($data['currency']);
        }
        if (isset($data['amount_due'])) {
            $sanitized['amount_due'] = (float)$data['amount_due'];
        }
        if (isset($data['amount_paid'])) {
            $sanitized['amount_paid'] = (float)$data['amount_paid'];
        }
        if (isset($data['discount_amount'])) {
            $sanitized['discount_amount'] = (float)$data['discount_amount'];
        }
        if (isset($data['discount_code'])) {
            $sanitized['discount_code'] = sanitize_text_field($data['discount_code']);
        }
        if (isset($data['reference'])) {
            $sanitized['reference'] = sanitize_text_field($data['reference']);
        }
        if (isset($data['contact_first_name'])) {
            $sanitized['contact_first_name'] = sanitize_text_field($data['contact_first_name']);
        }
        if (isset($data['contact_last_name'])) {
            $sanitized['contact_last_name'] = sanitize_text_field($data['contact_last_name']);
        }
        if (isset($data['contact_email'])) {
            $sanitized['contact_email'] = sanitize_email($data['contact_email']);
        }
        if (isset($data['contact_phone'])) {
            $sanitized['contact_phone'] = sanitize_text_field($data['contact_phone']);
        }
        if (isset($data['contact_country'])) {
            $sanitized['contact_country'] = sanitize_text_field($data['contact_country']);
        }
        if (isset($data['contact_data'])) {
            $sanitized['contact_data'] = $data['contact_data']; // Already JSON encoded
        }
        if (isset($data['emergency_contact'])) {
            $sanitized['emergency_contact'] = $data['emergency_contact']; // Already JSON encoded
        }
        if (isset($data['availability_id'])) {
            $sanitized['availability_id'] = !empty($data['availability_id']) ? (int)$data['availability_id'] : null;
        }
        if (isset($data['user_id'])) {
            $sanitized['user_id'] = !empty($data['user_id']) ? (int)$data['user_id'] : null;
        }
        if (isset($data['special_requests'])) {
            $sanitized['special_requests'] = sanitize_textarea_field($data['special_requests']);
        }
        if (isset($data['newsletter_optin'])) {
            $sanitized['newsletter_optin'] = (int)(bool)$data['newsletter_optin'];
        }
        if (isset($data['ip_address'])) {
            $sanitized['ip_address'] = sanitize_text_field($data['ip_address']);
        }
        if (isset($data['created_at'])) {
            $sanitized['created_at'] = sanitize_text_field($data['created_at']);
        }
        if (isset($data['updated_at'])) {
            $sanitized['updated_at'] = sanitize_text_field($data['updated_at']);
        }
        
        // Itinerary costs fields
        if (isset($data['itinerary_costs'])) {
            $sanitized['itinerary_costs'] = $data['itinerary_costs']; // Already JSON encoded
        }
        if (isset($data['itinerary_costs_total'])) {
            $sanitized['itinerary_costs_total'] = (float)$data['itinerary_costs_total'];
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
