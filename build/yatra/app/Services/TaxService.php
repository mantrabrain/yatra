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
     * @return array Tax details with multiple taxes
     */
    public static function calculateTax(float $amount, ?string $country = null): array
    {
        // Check if tax is enabled
        if (!SettingsService::isEnabled('enable_tax')) {
            return [
                'tax_amount' => 0,
                'tax_rate' => 0,
                'tax_inclusive' => false,
                'taxes' => [],
            ];
        }
        
        $tax_inclusive = SettingsService::isEnabled('tax_inclusive');
        $multiple_taxes_enabled = SettingsService::isEnabled('multiple_taxes_enabled');
        
        if ($multiple_taxes_enabled) {
            // Calculate multiple taxes
            return self::calculateMultipleTaxes($amount, $country, $tax_inclusive);
        } else {
            // Calculate single tax (backward compatibility)
            $tax_rate = self::getTaxRate($country);
            $tax_name = SettingsService::getString('tax_name', __('Tax', 'yatra'));
            
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
                'tax_name' => $tax_name,
                'taxes' => [
                    [
                        'name' => $tax_name,
                        'rate' => $tax_rate,
                        'amount' => round($tax_amount, 2),
                    ]
                ],
            ];
        }
    }
    
    /**
     * Calculate multiple taxes
     */
    private static function calculateMultipleTaxes(float $amount, ?string $country, bool $tax_inclusive): array
    {
        $taxes = self::getMultipleTaxes($country);
        $total_tax_amount = 0;
        $calculated_taxes = [];
        
        foreach ($taxes as $tax) {
            $tax_rate = $tax['rate'];
            $tax_name = $tax['name'];
            
            if ($tax_inclusive) {
                // For tax-inclusive, calculate based on remaining amount
                $base_amount = $amount;
                foreach ($calculated_taxes as $calculated_tax) {
                    $base_amount -= $calculated_tax['amount'];
                }
                $tax_amount = $base_amount * ($tax_rate / 100);
            } else {
                // Tax is added to the price
                $tax_amount = $amount * ($tax_rate / 100);
            }
            
            $tax_amount = round($tax_amount, 2);
            $total_tax_amount += $tax_amount;
            
            $calculated_taxes[] = [
                'name' => $tax_name,
                'rate' => $tax_rate,
                'amount' => $tax_amount,
            ];
        }
        
        return [
            'tax_amount' => round($total_tax_amount, 2),
            'tax_rate' => array_sum(array_column($taxes, 'rate')),
            'tax_inclusive' => $tax_inclusive,
            'taxes' => $calculated_taxes,
        ];
    }
    
    /**
     * Get multiple taxes configuration
     */
    private static function getMultipleTaxes(?string $country = null): array
    {
        $default_taxes = SettingsService::get('multiple_taxes', []);
        
        // Check if country-specific taxes exist
        $country_taxes = SettingsService::get('multiple_taxes_by_country', []);
        if ($country && isset($country_taxes[$country])) {
            return $country_taxes[$country];
        }
        
        return $default_taxes;
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
     * @param array $taxDetails Tax details from calculateTax()
     * @return string Formatted tax display
     */
    public static function formatTaxDisplay(array $taxDetails): string
    {
        if (empty($taxDetails['taxes'])) {
            return '';
        }
        
        $multiple_taxes_enabled = SettingsService::isEnabled('multiple_taxes_enabled');
        
        if ($multiple_taxes_enabled && count($taxDetails['taxes']) > 1) {
            // Multiple taxes - show each tax separately
            $display_lines = [];
            foreach ($taxDetails['taxes'] as $tax) {
                $display_lines[] = sprintf('%s (%s%%): %s', 
                    $tax['name'], 
                    number_format($tax['rate'], 2), 
                    yatra_format_price($tax['amount'])
                );
            }
            return implode("\n", $display_lines);
        } else {
            // Single tax
            $tax = $taxDetails['taxes'][0];
            return sprintf('%s (%s%%): %s', 
                $tax['name'], 
                number_format($tax['rate'], 2), 
                yatra_format_price($tax['amount'])
            );
        }
    }
    
    /**
     * Get tax breakdown for display
     * 
     * @param array $taxDetails Tax details
     * @return array Formatted tax breakdown
     */
    public static function getTaxBreakdown(array $taxDetails): array
    {
        $breakdown = [];
        
        foreach ($taxDetails['taxes'] as $tax) {
            $breakdown[] = [
                'name' => $tax['name'],
                'rate' => $tax['rate'],
                'amount' => $tax['amount'],
                'formatted' => sprintf('%s (%s%%): %s', 
                    $tax['name'], 
                    number_format($tax['rate'], 2), 
                    yatra_format_price($tax['amount'])
                ),
            ];
        }
        
        return $breakdown;
    }
}
