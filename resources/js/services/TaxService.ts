/**
 * Frontend Tax Service
 *
 * Handles tax calculations for booking forms and displays
 *
 * @package Yatra.Services
 * @since 3.0.0
 */

import { formatYatraMoney } from "../lib/currency-display";

interface TaxDetails {
  tax_amount: number;
  tax_rate: number;
  tax_inclusive: boolean;
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  subtotal?: number;
  total_amount?: number;
}

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

class TaxService {
  private static instance: TaxService;
  private taxSettings: any = null;

  private constructor() {}

  static getInstance(): TaxService {
    if (!TaxService.instance) {
      TaxService.instance = new TaxService();
    }
    return TaxService.instance;
  }

  /**
   * Load tax settings from API
   */
  async loadTaxSettings(): Promise<void> {
    try {
      const response = await fetch("/wp-json/yatra/v1/settings");
      const settings = await response.json();
      this.taxSettings = settings;
    } catch (error) {
      console.error("Failed to load tax settings:", error);
    }
  }

  /**
   * Get tax settings
   */
  getTaxSettings(): any {
    return this.taxSettings;
  }

  /**
   * Check if tax is enabled
   */
  isTaxEnabled(): boolean {
    return this.taxSettings?.enable_tax === true;
  }

  /**
   * Calculate tax for booking
   */
  calculateTax(amount: number, country?: string): TaxDetails {
    if (!this.isTaxEnabled()) {
      return {
        tax_amount: 0,
        tax_rate: 0,
        tax_inclusive: false,
        taxes: [],
      };
    }

    const taxInclusive = this.taxSettings?.tax_inclusive === true;
    const multipleTaxesEnabled =
      this.taxSettings?.multiple_taxes_enabled === true;

    if (multipleTaxesEnabled) {
      return this.calculateMultipleTaxes(amount, country, taxInclusive);
    } else {
      return this.calculateSingleTax(amount, country, taxInclusive);
    }
  }

  /**
   * Calculate single tax (backward compatibility)
   */
  private calculateSingleTax(
    amount: number,
    country?: string,
    taxInclusive: boolean = false,
  ): TaxDetails {
    let taxRate = this.taxSettings?.tax_rate || 0;
    const taxName =
      this.taxSettings?.tax_name || this.taxSettings?.tax_label || "Tax";

    // Check for country-specific tax
    if (
      this.taxSettings?.tax_by_country === true &&
      country &&
      this.taxSettings?.tax_rates?.[country]
    ) {
      taxRate = this.taxSettings.tax_rates[country];
    }

    let taxAmount: number;
    if (taxInclusive) {
      // Tax is included in the price
      taxAmount = amount - amount / (1 + taxRate / 100);
    } else {
      // Tax is added to the price
      taxAmount = amount * (taxRate / 100);
    }

    return {
      tax_amount: Math.round(taxAmount * 100) / 100,
      tax_rate: taxRate,
      tax_inclusive: taxInclusive,
      taxes: [
        {
          name: taxName,
          rate: taxRate,
          amount: Math.round(taxAmount * 100) / 100,
        },
      ],
    };
  }

  /**
   * Calculate multiple taxes
   */
  private calculateMultipleTaxes(
    amount: number,
    country?: string,
    taxInclusive: boolean = false,
  ): TaxDetails {
    let taxes = this.taxSettings?.multiple_taxes || [];

    // Check for country-specific taxes
    if (country && this.taxSettings?.multiple_taxes_by_country?.[country]) {
      taxes = this.taxSettings.multiple_taxes_by_country[country];
    }

    const calculatedTaxes: Array<{
      name: string;
      rate: number;
      amount: number;
    }> = [];
    let totalTaxAmount = 0;

    for (const tax of taxes) {
      const taxRate = tax.rate || 0;
      const taxName = tax.name || "Tax";

      let taxAmount: number;
      if (taxInclusive) {
        // For tax-inclusive, calculate based on remaining amount
        const baseAmount = amount - totalTaxAmount;
        taxAmount = baseAmount * (taxRate / 100);
      } else {
        // Tax is added to the price
        taxAmount = amount * (taxRate / 100);
      }

      taxAmount = Math.round(taxAmount * 100) / 100;
      totalTaxAmount += taxAmount;

      calculatedTaxes.push({
        name: taxName,
        rate: taxRate,
        amount: taxAmount,
      });
    }

    return {
      tax_amount: Math.round(totalTaxAmount * 100) / 100,
      tax_rate: taxes.reduce(
        (sum: number, tax: any) => sum + (tax.rate || 0),
        0,
      ),
      tax_inclusive: taxInclusive,
      taxes: calculatedTaxes,
    };
  }

  /**
   * Calculate complete booking tax breakdown
   */
  calculateBookingTax(
    subtotal: number,
    country?: string,
  ): BookingTaxCalculation {
    const taxDetails = this.calculateTax(subtotal, country);

    let finalSubtotal: number;
    let finalTotal: number;

    if (taxDetails.tax_inclusive) {
      // Tax is included - extract tax from total
      finalSubtotal = subtotal - taxDetails.tax_amount;
      finalTotal = subtotal;
    } else {
      // Tax is added to subtotal
      finalSubtotal = subtotal;
      finalTotal = subtotal + taxDetails.tax_amount;
    }

    const formattedTaxes = taxDetails.taxes.map((tax) => ({
      ...tax,
      formatted_amount: this.formatPrice(tax.amount),
      formatted_rate: `${tax.rate.toFixed(2)}%`,
    }));

    const taxBreakdown = formattedTaxes
      .map(
        (tax) => `${tax.name} (${tax.formatted_rate}): ${tax.formatted_amount}`,
      )
      .join("\n");

    return {
      subtotal: Math.round(finalSubtotal * 100) / 100,
      tax_amount: taxDetails.tax_amount,
      total_amount: Math.round(finalTotal * 100) / 100,
      tax_rate: taxDetails.tax_rate,
      tax_inclusive: taxDetails.tax_inclusive,
      taxes: formattedTaxes,
      tax_breakdown: taxBreakdown,
    };
  }

  /**
   * Format price display
   */
  formatPrice(amount: number): string {
    const currency = this.taxSettings?.currency || "USD";
    return formatYatraMoney(Number(amount) || 0, currency, {
      zeroAsUnknown: false,
    });
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹",
    };

    return symbols[currency] || currency;
  }

  /**
   * Get tax breakdown for display
   */
  getTaxBreakdown(taxDetails: TaxDetails): Array<{
    name: string;
    rate: number;
    amount: number;
    formatted_amount: string;
    formatted_rate: string;
    formatted_line: string;
  }> {
    return taxDetails.taxes.map((tax) => ({
      name: tax.name,
      rate: tax.rate,
      amount: tax.amount,
      formatted_amount: this.formatPrice(tax.amount),
      formatted_rate: `${tax.rate.toFixed(2)}%`,
      formatted_line: `${tax.name} (${tax.rate.toFixed(2)}%): ${this.formatPrice(tax.amount)}`,
    }));
  }

  /**
   * Format tax display for booking summary
   */
  formatTaxDisplay(taxDetails: TaxDetails): string {
    const breakdown = this.getTaxBreakdown(taxDetails);
    return breakdown.map((tax) => tax.formatted_line).join("\n");
  }

  /**
   * Validate tax configuration
   */
  validateTaxConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isTaxEnabled()) {
      return { valid: true, errors: [] };
    }

    const multipleTaxesEnabled =
      this.taxSettings?.multiple_taxes_enabled === true;

    if (multipleTaxesEnabled) {
      const multipleTaxes = this.taxSettings?.multiple_taxes || [];

      if (multipleTaxes.length === 0) {
        errors.push("At least one tax must be configured");
      }

      let totalRate = 0;
      for (let i = 0; i < multipleTaxes.length; i++) {
        const tax = multipleTaxes[i];

        if (!tax.name || tax.name.trim() === "") {
          errors.push(`Tax ${i + 1}: Name is required`);
        }

        if (typeof tax.rate !== "number" || tax.rate < 0 || tax.rate > 100) {
          errors.push(`Tax ${i + 1}: Rate must be between 0 and 100`);
        } else {
          totalRate += tax.rate;
        }
      }

      if (totalRate > 100) {
        errors.push("Total tax rate cannot exceed 100%");
      }
    } else {
      const taxRate = this.taxSettings?.tax_rate || 0;
      const taxName = this.taxSettings?.tax_name || "";

      if (typeof taxRate !== "number" || taxRate < 0 || taxRate > 100) {
        errors.push("Tax rate must be between 0 and 100");
      }

      if (!taxName || taxName.trim() === "") {
        errors.push("Tax name is required");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get tax summary for reporting
   */
  getTaxSummary(bookings: any[]): {
    total_tax_collected: number;
    total_bookings_with_tax: number;
    tax_breakdown: {
      [key: string]: {
        name: string;
        total_amount: number;
        count: number;
        average_rate: number;
      };
    };
    average_tax_rate: number;
  } {
    const summary = {
      total_tax_collected: 0,
      total_bookings_with_tax: 0,
      tax_breakdown: {} as {
        [key: string]: {
          name: string;
          total_amount: number;
          count: number;
          average_rate: number;
        };
      },
      average_tax_rate: 0,
    };

    let totalTaxRate = 0;
    let taxRateCount = 0;

    for (const booking of bookings) {
      const taxAmount = booking.tax_amount || 0;

      if (taxAmount > 0) {
        summary.total_tax_collected += taxAmount;
        summary.total_bookings_with_tax++;

        const taxRate = booking.tax_rate || 0;
        if (taxRate > 0) {
          totalTaxRate += taxRate;
          taxRateCount++;
        }

        // Collect tax breakdown
        const taxBreakdown = booking.tax_breakdown || [];
        for (const tax of taxBreakdown) {
          const taxName = tax.name;
          if (!summary.tax_breakdown[taxName]) {
            summary.tax_breakdown[taxName] = {
              name: taxName,
              total_amount: 0,
              count: 0,
              average_rate: 0,
            };
          }

          summary.tax_breakdown[taxName].total_amount += tax.amount;
          summary.tax_breakdown[taxName].count++;
          summary.tax_breakdown[taxName].average_rate += tax.rate;
        }
      }
    }

    // Calculate averages
    if (taxRateCount > 0) {
      summary.average_tax_rate = totalTaxRate / taxRateCount;
    }

    // Calculate average rates for tax breakdown
    for (const taxName in summary.tax_breakdown) {
      const taxData = summary.tax_breakdown[taxName];
      if (taxData.count > 0) {
        taxData.average_rate = taxData.average_rate / taxData.count;
      }
    }

    return summary;
  }
}

// Export singleton instance
export const taxService = TaxService.getInstance();
export default taxService;
