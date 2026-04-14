<?php
/**
 * Tax Validation Service
 * 
 * Validates tax configuration for single and multiple taxes
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class TaxValidationService
{
    /**
     * Validate single tax configuration
     * 
     * @param array $taxData Tax data
     * @return array Validation result
     */
    public static function validateSingleTax(array $taxData): array
    {
        $errors = [];
        
        // Validate tax name
        if (empty($taxData['tax_name'])) {
            $errors[] = __('Tax name is required', 'yatra');
        } elseif (strlen($taxData['tax_name']) > 50) {
            $errors[] = __('Tax name cannot exceed 50 characters', 'yatra');
        }
        
        // Validate tax rate
        if (!isset($taxData['tax_rate'])) {
            $errors[] = __('Tax rate is required', 'yatra');
        } elseif (!is_numeric($taxData['tax_rate'])) {
            $errors[] = __('Tax rate must be a number', 'yatra');
        } elseif ($taxData['tax_rate'] < 0 || $taxData['tax_rate'] > 100) {
            $errors[] = __('Tax rate must be between 0 and 100', 'yatra');
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
    
    /**
     * Validate multiple taxes configuration
     * 
     * @param array $taxes Array of tax configurations
     * @return array Validation result
     */
    public static function validateMultipleTaxes(array $taxes): array
    {
        $errors = [];
        
        if (empty($taxes)) {
            $errors[] = __('At least one tax must be configured', 'yatra');
            return [
                'valid' => false,
                'errors' => $errors,
            ];
        }
        
        $total_rate = 0;
        
        foreach ($taxes as $index => $tax) {
            $tax_errors = [];
            
            // Validate tax name
            if (empty($tax['name'])) {
                $tax_errors[] = __('Tax name is required', 'yatra');
            } elseif (strlen($tax['name']) > 50) {
                $tax_errors[] = __('Tax name cannot exceed 50 characters', 'yatra');
            }
            
            // Validate tax rate
            if (!isset($tax['rate'])) {
                $tax_errors[] = __('Tax rate is required', 'yatra');
            } elseif (!is_numeric($tax['rate'])) {
                $tax_errors[] = __('Tax rate must be a number', 'yatra');
            } elseif ($tax['rate'] < 0 || $tax['rate'] > 100) {
                $tax_errors[] = __('Tax rate must be between 0 and 100', 'yatra');
            } else {
                $total_rate += (float) $tax['rate'];
            }
            
            if (!empty($tax_errors)) {
                $errors[] = sprintf(__('Tax %d: %s', 'yatra'), $index + 1, implode(', ', $tax_errors));
            }
        }
        
        // Check total tax rate
        if ($total_rate > 100) {
            $errors[] = __('Total tax rate cannot exceed 100%', 'yatra');
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'total_rate' => $total_rate,
        ];
    }
    
    /**
     * Get default tax configuration examples
     * 
     * @return array Example tax configurations
     */
    public static function getDefaultTaxExamples(): array
    {
        return [
            'single_tax' => [
                'tax_name' => 'VAT',
                'tax_rate' => 20,
            ],
            'multiple_taxes' => [
                [
                    'name' => 'VAT',
                    'rate' => 15,
                ],
                [
                    'name' => 'Service Fee',
                    'rate' => 5,
                ],
                [
                    'name' => 'Tourism Tax',
                    'rate' => 2,
                ],
            ],
            'country_specific' => [
                'US' => [
                    'name' => 'Sales Tax',
                    'rate' => 8.25,
                ],
                'UK' => [
                    'name' => 'VAT',
                    'rate' => 20,
                ],
                'EU' => [
                    'name' => 'VAT',
                    'rate' => 21,
                ],
            ],
        ];
    }
}
