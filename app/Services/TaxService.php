<?php
/**
 * Tax Service
 * 
 * Handles tax calculations for bookings
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class TaxService
{
    /**
     * Calculate tax for a booking
     * 
     * @param float $amount Base amount
     * @param string|null $country Customer country (for country-specific tax)
     * @return array Tax details with amount and rate
     */
    public static function calculateTax(float $amount, ?string $country = null): array
    {
        // Check if tax is enabled
        if (!SettingsService::isEnabled('enable_tax')) {
            return [
                'tax_amount' => 0,
                'tax_rate' => 0,
                'tax_inclusive' => false,
            ];
        }
        
        // Get tax rate
        $tax_rate = self::getTaxRate($country);
        $tax_inclusive = SettingsService::isEnabled('tax_inclusive');
        
        // Calculate tax amount
        if ($tax_inclusive) {
            // Tax is included in the price
            $tax_amount = $amount - ($amount / (1 + ($tax_rate / 100)));
        } else {
            // Tax is added to the price
            $tax_amount = $amount * ($tax_rate / 100);
        }
        
        return [
            'tax_amount' => round($tax_amount, 2),
            'tax_rate' => $tax_rate,
            'tax_inclusive' => $tax_inclusive,
        ];
    }
    
    /**
     * Get tax rate for a country
     * 
     * @param string|null $country Country code
     * @return float Tax rate percentage
     */
    public static function getTaxRate(?string $country = null): float
    {
        // Check if country-specific tax is enabled
        if (SettingsService::isEnabled('tax_by_country') && !empty($country)) {
            $tax_rates = SettingsService::get('tax_rates', []);
            
            if (isset($tax_rates[$country])) {
                return (float) $tax_rates[$country];
            }
        }
        
        // Return default tax rate
        return SettingsService::getFloat('tax_rate', 0);
    }
    
    /**
     * Get tax label
     * 
     * @return string Tax label (e.g., "VAT", "Tax", "GST")
     */
    public static function getTaxLabel(): string
    {
        return SettingsService::getString('tax_label', __('Tax', 'yatra'));
    }
    
    /**
     * Get VAT number
     * 
     * @return string VAT number
     */
    public static function getVATNumber(): string
    {
        return SettingsService::getString('vat_number', '');
    }
    
    /**
     * Format tax display
     * 
     * @param float $taxAmount Tax amount
     * @param float $taxRate Tax rate
     * @return string Formatted tax display
     */
    public static function formatTaxDisplay(float $taxAmount, float $taxRate): string
    {
        $label = self::getTaxLabel();
        return sprintf('%s (%s%%): %s', $label, number_format($taxRate, 2), yatra_format_price($taxAmount));
    }
}
