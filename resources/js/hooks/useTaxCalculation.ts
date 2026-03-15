/**
 * Tax Calculation Hook
 * 
 * Provides tax calculation functionality for booking forms
 * 
 * @package Yatra.Hooks
 * @since 3.0.0
 */

import { useState, useEffect, useMemo } from 'react';
import { taxService } from '../services/TaxService';

interface BookingTaxCalculation {
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  tax_inclusive: boolean;
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
    formatted_amount: string;
    formatted_rate: string;
  }>;
  tax_breakdown: string;
}

interface UseTaxCalculationOptions {
  subtotal: number;
  country?: string;
  enabled?: boolean;
}

interface UseTaxCalculationReturn {
  taxCalculation: BookingTaxCalculation | null;
  isLoading: boolean;
  error: string | null;
  isTaxEnabled: boolean;
  recalculateTax: () => void;
}

export const useTaxCalculation = ({
  subtotal,
  country,
  enabled = true,
}: UseTaxCalculationOptions): UseTaxCalculationReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxSettingsLoaded, setTaxSettingsLoaded] = useState(false);

  // Load tax settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        await taxService.loadTaxSettings();
        setTaxSettingsLoaded(true);
        
        // Validate tax configuration
        const validation = taxService.validateTaxConfiguration();
        if (!validation.valid) {
          setError('Tax configuration error: ' + validation.errors.join(', '));
        }
      } catch (err) {
        setError('Failed to load tax settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Calculate tax when dependencies change
  const taxCalculation = useMemo(() => {
    if (!enabled || !taxSettingsLoaded || isLoading || error) {
      return null;
    }

    if (!taxService.isTaxEnabled()) {
      return null;
    }

    try {
      return taxService.calculateBookingTax(subtotal, country);
    } catch (err) {
      setError('Failed to calculate tax');
      return null;
    }
  }, [subtotal, country, enabled, taxSettingsLoaded, isLoading, error]);

  const recalculateTax = () => {
    // Force recalculation by triggering a settings reload
    setTaxSettingsLoaded(false);
    taxService.loadTaxSettings().then(() => {
      setTaxSettingsLoaded(true);
      setError(null);
    });
  };

  return {
    taxCalculation,
    isLoading,
    error,
    isTaxEnabled: taxService.isTaxEnabled(),
    recalculateTax,
  };
};
