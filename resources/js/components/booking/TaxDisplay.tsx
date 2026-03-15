/**
 * Tax Display Component
 * 
 * Shows tax breakdown for booking forms and details
 * 
 * @package Yatra.Components.Booking
 * @since 3.0.0
 */

import React from 'react';
import { taxService } from '../../services/TaxService';

interface TaxDisplayProps {
  subtotal: number;
  country?: string;
  className?: string;
  showBreakdown?: boolean;
}

const TaxDisplay: React.FC<TaxDisplayProps> = ({
  subtotal,
  country,
  className = '',
  showBreakdown = true,
}) => {
  // Calculate tax
  const taxCalculation = React.useMemo(() => {
    return taxService.calculateBookingTax(subtotal, country);
  }, [subtotal, country]);

  // If tax is not enabled or no tax, don't display
  if (!taxService.isTaxEnabled() || taxCalculation.tax_amount === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Subtotal
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {taxService.formatPrice(taxCalculation.subtotal)}
        </span>
      </div>

      {/* Tax Breakdown */}
      {showBreakdown && taxCalculation.taxes.length > 0 && (
        <div className="space-y-1">
          {taxCalculation.taxes.map((tax, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {tax.name} ({tax.formatted_rate})
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {tax.formatted_amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="border-t pt-2">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Total
          </span>
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {taxService.formatPrice(taxCalculation.total_amount)}
          </span>
        </div>
      </div>

      {/* Tax Inclusive Notice */}
      {taxCalculation.tax_inclusive && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
          * Tax included in price
        </div>
      )}
    </div>
  );
};

export default TaxDisplay;
