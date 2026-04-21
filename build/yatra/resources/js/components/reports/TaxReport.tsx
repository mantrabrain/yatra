/**
 * Tax Report Component
 *
 * Displays tax analytics and reporting for admin dashboard
 *
 * @package Yatra.Components.Reports
 * @since 3.0.0
 */

import React from "react";
import { taxService } from "../../services/TaxService";

interface TaxReportProps {
  bookings: any[];
  className?: string;
}

const TaxReport: React.FC<TaxReportProps> = ({ bookings, className = "" }) => {
  // Calculate tax summary
  const taxSummary = React.useMemo(() => {
    return taxService.getTaxSummary(bookings);
  }, [bookings]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (taxSummary.total_bookings_with_tax === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tax Report
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No tax data available for the selected period.</p>
          <p className="text-sm mt-2">
            Either tax is disabled or no bookings with tax have been made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Tax Report
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
            Total Tax Collected
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(taxSummary.total_tax_collected)}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">
            Bookings with Tax
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {taxSummary.total_bookings_with_tax}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
            Average Tax Rate
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {taxSummary.average_tax_rate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      {Object.keys(taxSummary.tax_breakdown).length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Tax Breakdown by Type
          </h4>
          <div className="space-y-3">
            {Object.entries(taxSummary.tax_breakdown).map(([name, data]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {data.count} bookings • {data.average_rate.toFixed(2)}% avg
                    rate
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(data.total_amount)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {(
                      (data.total_amount / taxSummary.total_tax_collected) *
                      100
                    ).toFixed(1)}
                    % of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
          Tax Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Tax is enabled and actively collected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              {taxSummary.total_bookings_with_tax} taxable bookings this period
            </span>
          </div>
          {taxSummary.average_tax_rate > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Average tax rate: {taxSummary.average_tax_rate.toFixed(2)}%
              </span>
            </div>
          )}
          {Object.keys(taxSummary.tax_breakdown).length > 1 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Multiple tax types configured
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxReport;
