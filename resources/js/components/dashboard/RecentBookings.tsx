/**
 * Recent Bookings Widget
 * Displays recent bookings list
 */

import React from 'react';
import { __ } from '../../lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { getCurrencySymbol } from '../../data/currencies';

interface Booking {
  id: number;
  booking_id: string;
  customer_name: string;
  trip_title: string;
  booking_date: string;
  total_amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

interface RecentBookingsProps {
  bookings: Booking[];
  loading?: boolean;
  onView?: (booking: Booking) => void;
}

/**
 * Recent Bookings Widget
 */
export const RecentBookings: React.FC<RecentBookingsProps> = ({
  bookings,
  loading = false,
  onView,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get global currency settings
  const globalCurrency = (window as any)?.yatraAdmin?.currency || 'USD';
  const currencyPosition = (window as any)?.yatraAdmin?.currencyPosition || (window as any)?.yatraAdmin?.currency_position || 'before';
  const decimalPlaces = Number((window as any)?.yatraAdmin?.decimalPlaces || (window as any)?.yatraAdmin?.currency_decimals || 2);
  const thousandSeparator = (window as any)?.yatraAdmin?.thousandSeparator || ',';
  const decimalSeparator = (window as any)?.yatraAdmin?.decimalSeparator || '.';

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return getCurrencySymbol(globalCurrency) + '0';
    
    const numPrice = Number(amount) || 0;
    
    // Format the number with proper separators
    const formattedAmount = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(numPrice)
      .replace(/,/g, 'TEMP_THOUSAND')
      .replace(/\./g, decimalSeparator)
      .replace(/TEMP_THOUSAND/g, thousandSeparator);
    
    // Get currency symbol
    const currencySymbol = getCurrencySymbol(globalCurrency);
    
    // Apply currency position
    if (currencyPosition === 'after' || currencyPosition === 'right') {
      return `${formattedAmount} ${currencySymbol}`;
    } else {
      return `${currencySymbol}${formattedAmount}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__('Recent Bookings', 'yatra')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {__('Loading...', 'yatra')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{__('Recent Bookings', 'yatra')}</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                onClick={() => onView && onView(booking)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {booking.trip_title}
                      </h4>
                      <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(booking.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.booking_id}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {__('No recent bookings', 'yatra')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentBookings;

