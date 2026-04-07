<?php
/**
 * Booking Tax Service
 * 
 * Integrates tax calculations into the booking process
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class BookingTaxService
{
    /**
     * Calculate tax breakdown for a booking
     * 
     * @param array $bookingData Booking data
     * @return array Tax calculation details
     */
    public static function calculateBookingTax(array $bookingData): array
    {
        $baseAmount = (float) ($bookingData['subtotal'] ?? $bookingData['total_amount'] ?? 0);
        $country = $bookingData['contact_country'] ?? null;
        
        // Get tax details from TaxService
        $taxDetails = TaxService::calculateTax($baseAmount, $country);
        
        // Add booking-specific information
        $taxDetails['booking_id'] = $bookingData['id'] ?? null;
        $taxDetails['booking_reference'] = $bookingData['reference'] ?? null;
        $taxDetails['customer_country'] = $country;
        $taxDetails['base_amount'] = $baseAmount;
        
        // Calculate final amounts
        if ($taxDetails['tax_inclusive']) {
            $taxDetails['subtotal'] = $baseAmount - $taxDetails['tax_amount'];
            $taxDetails['total_amount'] = $baseAmount;
        } else {
            $taxDetails['subtotal'] = $baseAmount;
            $taxDetails['total_amount'] = $baseAmount + $taxDetails['tax_amount'];
        }
        
        return $taxDetails;
    }
    
    /**
     * Apply tax to booking data before creation
     * 
     * @param array $bookingData Raw booking data
     * @return array Modified booking data with tax
     */
    public static function applyTaxToBooking(array $bookingData): array
    {
        // Skip tax calculation if tax is disabled
        if (!SettingsService::isEnabled('enable_tax')) {
            return $bookingData;
        }
        
        // Skip recalculation when checkout already sent a tax snapshot from CalculationService.
        // Important: tax_amount may legitimately be 0 while tax is enabled — still skip to avoid
        // resetting total_amount / amount_due (breaks deposit & partial "pay now" vs balance).
        if (array_key_exists('tax_amount', $bookingData)
            && array_key_exists('tax_details', $bookingData)
            && array_key_exists('tax_inclusive', $bookingData)) {
            return $bookingData;
        }
        
        // Calculate tax
        $taxDetails = self::calculateBookingTax($bookingData);
        
        // Update booking data with tax information
        $bookingData['tax_amount'] = $taxDetails['tax_amount'];
        $bookingData['tax_rate'] = $taxDetails['tax_rate'];
        $bookingData['tax_inclusive'] = $taxDetails['tax_inclusive'];
        $bookingData['tax_details'] = json_encode($taxDetails['taxes']);
        
        // Update amounts based on tax configuration
        if ($taxDetails['tax_inclusive']) {
            // Tax is included - adjust subtotal
            $bookingData['subtotal'] = $taxDetails['subtotal'];
            $bookingData['total_amount'] = $taxDetails['total_amount'];
        } else {
            // Tax is added - keep original subtotal, update total
            $bookingData['subtotal'] = $bookingData['subtotal'] ?? $bookingData['total_amount'] ?? 0;
            $bookingData['total_amount'] = $taxDetails['total_amount'];
        }
        
        // Recalculate amount due
        $amountPaid = (float) ($bookingData['amount_paid'] ?? 0);
        $bookingData['amount_due'] = $taxDetails['total_amount'] - $amountPaid;
        
        return $bookingData;
    }
    
    /**
     * Get tax breakdown for display in booking
     * 
     * @param array $booking Booking data
     * @return array Formatted tax breakdown
     */
    public static function getBookingTaxBreakdown(array $booking): array
    {
        $taxDetails = [];
        
        // Check if booking has tax details stored
        if (!empty($booking['tax_details'])) {
            $taxes = json_decode($booking['tax_details'], true) ?: [];
            
            foreach ($taxes as $tax) {
                $taxDetails[] = [
                    'name' => $tax['name'],
                    'rate' => $tax['rate'],
                    'amount' => $tax['amount'],
                    'formatted_amount' => yatra_format_price($tax['amount']),
                    'formatted_rate' => number_format($tax['rate'], 2) . '%',
                    'formatted_line' => sprintf('%s (%s%%): %s', 
                        $tax['name'], 
                        number_format($tax['rate'], 2), 
                        yatra_format_price($tax['amount'])
                    ),
                ];
            }
        } elseif (!empty($booking['tax_amount']) && $booking['tax_amount'] > 0) {
            // Fallback for single tax
            $taxName = SettingsService::getString('tax_name', __('Tax', 'yatra'));
            $taxRate = (float) ($booking['tax_rate'] ?? 0);
            $taxAmount = (float) $booking['tax_amount'];
            
            $taxDetails[] = [
                'name' => $taxName,
                'rate' => $taxRate,
                'amount' => $taxAmount,
                'formatted_amount' => yatra_format_price($taxAmount),
                'formatted_rate' => number_format($taxRate, 2) . '%',
                'formatted_line' => sprintf('%s (%s%%): %s', 
                    $taxName, 
                    number_format($taxRate, 2), 
                    yatra_format_price($taxAmount)
                ),
            ];
        }
        
        return $taxDetails;
    }
    
    /**
     * Format tax display for booking summary
     * 
     * @param array $booking Booking data
     * @return string Formatted tax display
     */
    public static function formatBookingTaxDisplay(array $booking): string
    {
        $taxBreakdown = self::getBookingTaxBreakdown($booking);
        
        if (empty($taxBreakdown)) {
            return '';
        }
        
        $lines = array_map(function($tax) {
            return $tax['formatted_line'];
        }, $taxBreakdown);
        
        return implode("\n", $lines);
    }
    
    /**
     * Calculate tax for booking edit/update
     * 
     * @param array $currentBooking Current booking data
     * @param array $newData New booking data
     * @return array Updated tax calculation
     */
    public static function recalculateBookingTax(array $currentBooking, array $newData): array
    {
        // Merge current booking with new data
        $mergedData = array_merge($currentBooking, $newData);
        
        // Recalculate tax
        return self::calculateBookingTax($mergedData);
    }
    
    /**
     * Validate tax configuration for booking
     * 
     * @param array $bookingData Booking data
     * @return array Validation result
     */
    public static function validateBookingTax(array $bookingData): array
    {
        $errors = [];
        
        // Check if tax is enabled
        if (!SettingsService::isEnabled('enable_tax')) {
            return ['valid' => true, 'errors' => []];
        }
        
        // Validate tax configuration
        $multipleTaxesEnabled = SettingsService::isEnabled('multiple_taxes_enabled');
        
        if ($multipleTaxesEnabled) {
            $multipleTaxes = SettingsService::get('multiple_taxes', []);
            $validation = TaxValidationService::validateMultipleTaxes($multipleTaxes);
            
            if (!$validation['valid']) {
                $errors[] = __('Tax configuration is invalid. Please check your tax settings.', 'yatra');
                $errors = array_merge($errors, $validation['errors']);
            }
        } else {
            $taxRate = SettingsService::getFloat('tax_rate', 0);
            $taxName = SettingsService::getString('tax_name', __('Tax', 'yatra'));
            
            $singleTaxData = [
                'tax_name' => $taxName,
                'tax_rate' => $taxRate,
            ];
            
            $validation = TaxValidationService::validateSingleTax($singleTaxData);
            
            if (!$validation['valid']) {
                $errors[] = __('Tax configuration is invalid. Please check your tax settings.', 'yatra');
                $errors = array_merge($errors, $validation['errors']);
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
    
    /**
     * Get tax summary for booking reports
     * 
     * @param array $bookings Array of bookings
     * @return array Tax summary statistics
     */
    public static function getTaxSummary(array $bookings): array
    {
        $summary = [
            'total_tax_collected' => 0,
            'total_bookings_with_tax' => 0,
            'tax_breakdown' => [],
            'average_tax_rate' => 0,
        ];
        
        $totalTaxRate = 0;
        $taxRateCount = 0;
        
        foreach ($bookings as $booking) {
            $taxAmount = (float) ($booking['tax_amount'] ?? 0);
            
            if ($taxAmount > 0) {
                $summary['total_tax_collected'] += $taxAmount;
                $summary['total_bookings_with_tax']++;
                
                $taxRate = (float) ($booking['tax_rate'] ?? 0);
                if ($taxRate > 0) {
                    $totalTaxRate += $taxRate;
                    $taxRateCount++;
                }
                
                // Collect tax breakdown
                $taxBreakdown = self::getBookingTaxBreakdown($booking);
                foreach ($taxBreakdown as $tax) {
                    $taxName = $tax['name'];
                    if (!isset($summary['tax_breakdown'][$taxName])) {
                        $summary['tax_breakdown'][$taxName] = [
                            'name' => $taxName,
                            'total_amount' => 0,
                            'count' => 0,
                            'average_rate' => 0,
                        ];
                    }
                    
                    $summary['tax_breakdown'][$taxName]['total_amount'] += $tax['amount'];
                    $summary['tax_breakdown'][$taxName]['count']++;
                    $summary['tax_breakdown'][$taxName]['average_rate'] += $tax['rate'];
                }
            }
        }
        
        // Calculate averages
        if ($taxRateCount > 0) {
            $summary['average_tax_rate'] = $totalTaxRate / $taxRateCount;
        }
        
        // Calculate average rates for tax breakdown
        foreach ($summary['tax_breakdown'] as $taxName => &$taxData) {
            if ($taxData['count'] > 0) {
                $taxData['average_rate'] = $taxData['average_rate'] / $taxData['count'];
            }
        }
        
        return $summary;
    }
}
