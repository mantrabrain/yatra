/**
 * Reports Page
 * Comprehensive analytics and reporting for travel booking plugin
 * Based on industry standards for trip booking software
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  MapPin,
  BarChart3,
  PieChart,
  Clock,
  XCircle,
  Globe,
  Plane
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { ConditionalRender } from '../components/ui/conditional-render';
import { SimpleLineChart } from '../components/charts/SimpleLineChart';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { SimplePieChart } from '../components/charts/SimplePieChart';

const Reports: React.FC = () => {
  const { can, isPro } = usePermissions();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate date range based on selection
  const dateRangeParams = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date(today);

    switch (dateRange) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'last_7_days':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case 'last_30_days':
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        break;
      case 'last_90_days':
        start = new Date(today);
        start.setDate(start.getDate() - 90);
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        } else {
          start = new Date(today);
          start.setDate(start.getDate() - 30);
        }
        break;
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [dateRange, startDate, endDate]);

  // Fetch revenue statistics with comprehensive dummy data
  const { data: revenueStats } = useQuery({
    queryKey: ['revenue-stats', dateRangeParams],
    queryFn: async () => {
      return {
        total: 245680,
        previous: 198500,
        change: 23.8,
        average: 5120,
        bookings: 48,
        byPaymentMethod: [
          { label: __('Credit Card', 'Credit Card'), value: 156432, color: '#3b82f6' },
          { label: __('PayPal', 'PayPal'), value: 52340, color: '#10b981' },
          { label: __('Bank Transfer', 'Bank Transfer'), value: 28908, color: '#f59e0b' },
          { label: __('Cash', 'Cash'), value: 8000, color: '#ef4444' },
        ],
        byDestination: [
          { label: __('Nepal', 'Nepal'), value: 125400, color: '#3b82f6' },
          { label: __('India', 'India'), value: 68000, color: '#10b981' },
          { label: __('Bhutan', 'Bhutan'), value: 35280, color: '#f59e0b' },
          { label: __('Tibet', 'Tibet'), value: 17000, color: '#ef4444' },
        ],
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch revenue trend with monthly data
  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend', dateRangeParams],
    queryFn: async () => {
      return [
        { label: __('Jan', 'Jan'), value: 18500 },
        { label: __('Feb', 'Feb'), value: 22000 },
        { label: __('Mar', 'Mar'), value: 28000 },
        { label: __('Apr', 'Apr'), value: 35000 },
        { label: __('May', 'May'), value: 42000 },
        { label: __('Jun', 'Jun'), value: 38000 },
        { label: __('Jul', 'Jul'), value: 45000 },
        { label: __('Aug', 'Aug'), value: 41000 },
        { label: __('Sep', 'Sep'), value: 39000 },
        { label: __('Oct', 'Oct'), value: 44000 },
        { label: __('Nov', 'Nov'), value: 36000 },
        { label: __('Dec', 'Dec'), value: 42000 },
      ];
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch booking statistics with comprehensive data
  const { data: bookingStats } = useQuery({
    queryKey: ['booking-stats', dateRangeParams],
    queryFn: async () => {
      return {
        total: 156,
        confirmed: 98,
        pending: 35,
        cancelled: 15,
        completed: 8,
        cancellationRate: 9.6,
        conversionRate: 12.5,
        averageBookingValue: 5120,
        trend: [
          { label: __('Jan', 'Jan'), value: 18 },
          { label: __('Feb', 'Feb'), value: 22 },
          { label: __('Mar', 'Mar'), value: 28 },
          { label: __('Apr', 'Apr'), value: 35 },
          { label: __('May', 'May'), value: 42 },
          { label: __('Jun', 'Jun'), value: 38 },
          { label: __('Jul', 'Jul'), value: 45 },
          { label: __('Aug', 'Aug'), value: 41 },
          { label: __('Sep', 'Sep'), value: 39 },
          { label: __('Oct', 'Oct'), value: 44 },
          { label: __('Nov', 'Nov'), value: 36 },
          { label: __('Dec', 'Dec'), value: 42 },
        ],
        peakPeriods: [
          { label: __('Spring (Mar-May)', 'Spring (Mar-May)'), value: 105, color: '#10b981' },
          { label: __('Summer (Jun-Aug)', 'Summer (Jun-Aug)'), value: 124, color: '#f59e0b' },
          { label: __('Autumn (Sep-Nov)', 'Autumn (Sep-Nov)'), value: 119, color: '#ef4444' },
          { label: __('Winter (Dec-Feb)', 'Winter (Dec-Feb)'), value: 58, color: '#3b82f6' },
        ],
        bookingSources: [
          { label: __('Website', 'Website'), value: 78, color: '#3b82f6' },
          { label: __('Social Media', 'Social Media'), value: 35, color: '#10b981' },
          { label: __('Referral', 'Referral'), value: 22, color: '#f59e0b' },
          { label: __('Direct Contact', 'Direct Contact'), value: 15, color: '#ef4444' },
          { label: __('Other', 'Other'), value: 6, color: '#8b5cf6' },
        ],
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch trip performance with revenue data
  const { data: tripPerformance } = useQuery({
    queryKey: ['trip-performance', dateRangeParams],
    queryFn: async () => {
      return [
        { label: __('Everest Base Camp Trek', 'Everest Base Camp Trek'), value: 45, revenue: 56250, occupancy: 85, color: '#3b82f6' },
        { label: __('Annapurna Circuit', 'Annapurna Circuit'), value: 32, revenue: 31360, occupancy: 78, color: '#10b981' },
        { label: __('Golden Triangle Tour', 'Golden Triangle Tour'), value: 28, revenue: 21000, occupancy: 72, color: '#f59e0b' },
        { label: __('Bhutan Cultural Journey', 'Bhutan Cultural Journey'), value: 22, revenue: 24200, occupancy: 68, color: '#ef4444' },
        { label: __('Tibet Spiritual Tour', 'Tibet Spiritual Tour'), value: 18, revenue: 15300, occupancy: 65, color: '#8b5cf6' },
        { label: __('Langtang Valley Trek', 'Langtang Valley Trek'), value: 15, revenue: 13800, occupancy: 60, color: '#06b6d4' },
      ];
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch customer analytics with comprehensive data
  const { data: customerAnalytics } = useQuery({
    queryKey: ['customer-analytics', dateRangeParams],
    queryFn: async () => {
      return {
        newCustomers: 24,
        returningCustomers: 12,
        totalCustomers: 89,
        customerLifetimeValue: 1408,
        repeatBookingRate: 13.5,
        customerRetentionRate: 68.5,
        topCustomers: [
          { name: __('John Smith', 'John Smith'), bookings: 5, revenue: 12500 },
          { name: __('Sarah Johnson', 'Sarah Johnson'), bookings: 4, revenue: 9800 },
          { name: __('Michael Brown', 'Michael Brown'), bookings: 3, revenue: 7500 },
        ],
        topCountries: [
          { label: __('United States', 'United States'), value: 35, color: '#3b82f6' },
          { label: __('United Kingdom', 'United Kingdom'), value: 22, color: '#10b981' },
          { label: __('Australia', 'Australia'), value: 18, color: '#f59e0b' },
          { label: __('Canada', 'Canada'), value: 14, color: '#ef4444' },
        ],
        customerSegments: [
          { label: __('First-time', 'First-time'), value: 65, color: '#3b82f6' },
          { label: __('Returning (2-3)', 'Returning (2-3)'), value: 20, color: '#10b981' },
          { label: __('Loyal (4+)', 'Loyal (4+)'), value: 15, color: '#f59e0b' },
        ],
      };
    },
    enabled: can('yatra_view_customers'),
  });

  // Fetch payment status breakdown
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status', dateRangeParams],
    queryFn: async () => {
      return [
        { label: __('Paid', 'Paid'), value: 120, amount: 198500, color: '#10b981' },
        { label: __('Pending', 'Pending'), value: 25, amount: 35200, color: '#f59e0b' },
        { label: __('Refunded', 'Refunded'), value: 8, amount: 12000, color: '#ef4444' },
        { label: __('Partial', 'Partial'), value: 3, amount: 5980, color: '#8b5cf6' },
      ];
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch operational reports
  const { data: operationalStats } = useQuery({
    queryKey: ['operational-stats', dateRangeParams],
    queryFn: async () => {
      return {
        upcomingDepartures: 12,
        totalCapacity: 480,
        bookedCapacity: 312,
        occupancyRate: 65.0,
        averageGroupSize: 4.2,
        resourceUtilization: [
          { label: __('Guides', 'Guides'), value: 78, color: '#3b82f6' },
          { label: __('Vehicles', 'Vehicles'), value: 65, color: '#10b981' },
          { label: __('Accommodations', 'Accommodations'), value: 82, color: '#f59e0b' },
        ],
        upcomingTrips: [
          { trip: __('Everest Base Camp Trek', 'Everest Base Camp Trek'), date: '2024-07-15', booked: 18, capacity: 20 },
          { trip: __('Annapurna Circuit', 'Annapurna Circuit'), date: '2024-07-20', booked: 15, capacity: 18 },
          { trip: __('Bhutan Cultural Journey', 'Bhutan Cultural Journey'), date: '2024-07-25', booked: 12, capacity: 16 },
        ],
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch seasonal trends
  const { data: seasonalTrends } = useQuery({
    queryKey: ['seasonal-trends', dateRangeParams],
    queryFn: async () => {
      return {
        byMonth: [
          { label: __('Jan', 'Jan'), bookings: 18, revenue: 18500 },
          { label: __('Feb', 'Feb'), bookings: 22, revenue: 22000 },
          { label: __('Mar', 'Mar'), bookings: 28, revenue: 28000 },
          { label: __('Apr', 'Apr'), bookings: 35, revenue: 35000 },
          { label: __('May', 'May'), bookings: 42, revenue: 42000 },
          { label: __('Jun', 'Jun'), bookings: 38, revenue: 38000 },
        ],
        bySeason: [
          { label: __('Spring', 'Spring'), bookings: 105, revenue: 105000 },
          { label: __('Summer', 'Summer'), bookings: 124, revenue: 124000 },
          { label: __('Autumn', 'Autumn'), bookings: 119, revenue: 119000 },
          { label: __('Winter', 'Winter'), bookings: 58, revenue: 58000 },
        ],
      };
    },
    enabled: can('yatra_view_bookings'),
  });

  const formatPrice = (price: number, currencyCode: string = 'USD') => {
    const symbol = getCurrencySymbol(currencyCode);
    const currencyData = getCurrency(currencyCode);
    const decimals = currencyData?.decimalDigits ?? 2;
    
    return `${symbol}${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price)}`;
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    // Placeholder for export functionality
    console.log(`Exporting reports as ${format}...`);
    alert(__('Export functionality will be implemented soon', 'Export functionality will be implemented soon'));
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={__('Reports & Analytics', 'Reports & Analytics')}
        description={__('Comprehensive insights into your travel booking business', 'Comprehensive insights into your travel booking business')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {__('Export PDF', 'Export PDF')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {__('Export CSV', 'Export CSV')}
            </Button>
          </div>
        }
      />

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {__('Date Range', 'Date Range')}:
              </span>
            </div>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 md:w-48 h-9"
            >
              <option value="today">{__('Today', 'Today')}</option>
              <option value="last_7_days">{__('Last 7 Days', 'Last 7 Days')}</option>
              <option value="last_30_days">{__('Last 30 Days', 'Last 30 Days')}</option>
              <option value="last_90_days">{__('Last 90 Days', 'Last 90 Days')}</option>
              <option value="this_month">{__('This Month', 'This Month')}</option>
              <option value="last_month">{__('Last Month', 'Last Month')}</option>
              <option value="this_year">{__('This Year', 'This Year')}</option>
              <option value="custom">{__('Custom Range', 'Custom Range')}</option>
            </Select>
            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-40 h-9"
                  placeholder={__('Start Date', 'Start Date')}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-40 h-9"
                  placeholder={__('End Date', 'End Date')}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ConditionalRender capability="yatra_view_bookings">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {__('Total Revenue', 'Total Revenue')}
                </div>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {revenueStats ? formatPrice(revenueStats.total) : '--'}
              </div>
              {revenueStats && revenueStats.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${
                  revenueStats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {revenueStats.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(revenueStats.change).toFixed(1)}% {__('vs previous', 'vs previous')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {__('Total Bookings', 'Total Bookings')}
                </div>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {bookingStats?.total || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {bookingStats?.confirmed || 0} {__('confirmed', 'confirmed')} • {bookingStats?.conversionRate || 0}% {__('conversion', 'conversion')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {__('Average Booking', 'Average Booking')}
                </div>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {revenueStats ? formatPrice(revenueStats.average) : '--'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {revenueStats?.bookings || 0} {__('bookings', 'bookings')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {__('Cancellation Rate', 'Cancellation Rate')}
                </div>
                <XCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {bookingStats?.cancellationRate || 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {bookingStats?.cancelled || 0} {__('cancelled', 'cancelled')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Booking Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {__('Revenue Trend', 'Revenue Trend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleLineChart
                data={revenueTrend || []}
                title=""
                height={250}
                color="#10b981"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {__('Booking Trend', 'Booking Trend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleLineChart
                data={bookingStats?.trend || []}
                title=""
                height={250}
                color="#3b82f6"
              />
            </CardContent>
          </Card>
        </div>

        {/* Trip Performance and Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {__('Top Performing Trips', 'Top Performing Trips')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleBarChart
                data={tripPerformance?.map(t => ({ label: t.label, value: t.value, color: t.color })) || []}
                title=""
                height={300}
                showValues={true}
              />
              {tripPerformance && tripPerformance.length > 0 && (
                <div className="mt-4 space-y-2 text-sm">
                  {tripPerformance.slice(0, 3).map((trip, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{trip.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 dark:text-gray-400">{formatPrice(trip.revenue)}</span>
                        <span className="text-xs text-gray-500">{trip.occupancy}% {__('occupancy', 'occupancy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {__('Payment Status', 'Payment Status')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center justify-center mb-4">
                <SimplePieChart
                  data={paymentStatus || []}
                  title=""
                  size={250}
                  showLegend={true}
                  donut={true}
                />
              </div>
              {paymentStatus && paymentStatus.length > 0 && (
                <div className="space-y-2 text-sm">
                  {paymentStatus.map((status, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <span className="text-gray-700 dark:text-gray-300">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 dark:text-gray-400">{status.value} {__('bookings', 'bookings')}</span>
                        <span className="font-medium">{formatPrice(status.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Payment Method and Destination */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {__('Revenue by Payment Method', 'Revenue by Payment Method')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleBarChart
                data={revenueStats?.byPaymentMethod?.map(m => ({ label: m.label, value: m.value / 1000, color: m.color })) || []}
                title=""
                height={250}
                showValues={true}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {__('Values in thousands', 'Values in thousands')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {__('Revenue by Destination', 'Revenue by Destination')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleBarChart
                data={revenueStats?.byDestination?.map(d => ({ label: d.label, value: d.value / 1000, color: d.color })) || []}
                title=""
                height={250}
                showValues={true}
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {__('Values in thousands', 'Values in thousands')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Status Breakdown and Peak Periods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                {__('Booking Status Breakdown', 'Booking Status Breakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-1">
                    {bookingStats?.confirmed || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Confirmed', 'Confirmed')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                    {bookingStats?.pending || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Pending', 'Pending')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-1">
                    {bookingStats?.cancelled || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Cancelled', 'Cancelled')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    {bookingStats?.completed || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Completed', 'Completed')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {__('Peak Booking Periods', 'Peak Booking Periods')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleBarChart
                data={bookingStats?.peakPeriods || []}
                title=""
                height={200}
                showValues={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Booking Sources and Seasonal Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {__('Booking Sources', 'Booking Sources')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center justify-center mb-4">
                <SimplePieChart
                  data={bookingStats?.bookingSources || []}
                  title=""
                  size={200}
                  showLegend={true}
                  donut={true}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {__('Seasonal Trends', 'Seasonal Trends')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <SimpleBarChart
                data={seasonalTrends?.bySeason?.map(s => ({ label: s.label, value: s.bookings, color: '#3b82f6' })) || []}
                title=""
                height={200}
                showValues={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Operational Reports */}
        {operationalStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {__('Operational Overview', 'Operational Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Upcoming Departures', 'Upcoming Departures')}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {operationalStats.upcomingDepartures}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Occupancy Rate', 'Occupancy Rate')}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {operationalStats.occupancyRate}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Booked Capacity', 'Booked Capacity')}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {operationalStats.bookedCapacity} / {operationalStats.totalCapacity}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Avg Group Size', 'Avg Group Size')}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {operationalStats.averageGroupSize}
                  </div>
                </div>
              </div>
              {operationalStats.upcomingTrips && operationalStats.upcomingTrips.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Upcoming Trips', 'Upcoming Trips')}:
                  </div>
                  {operationalStats.upcomingTrips.map((trip: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{trip.trip}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{trip.date}</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.booked} / {trip.capacity} {__('booked', 'booked')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer Analytics (Pro Feature) */}
        {isPro && customerAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {__('Customer Analytics', 'Customer Analytics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Total Customers', 'Total Customers')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customerAnalytics.totalCustomers}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Customer LTV', 'Customer LTV')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatPrice(customerAnalytics.customerLifetimeValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('New Customers', 'New Customers')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customerAnalytics.newCustomers}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {__('Retention Rate', 'Retention Rate')}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {customerAnalytics.customerRetentionRate}%
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Top Customers', 'Top Customers')}:
                  </div>
                  {customerAnalytics.topCustomers.map((customer: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{customer.bookings} {__('bookings', 'bookings')}</div>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatPrice(customer.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {__('Top Countries', 'Top Countries')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <SimpleBarChart
                  data={customerAnalytics.topCountries || []}
                  title=""
                  height={250}
                  showValues={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer Segments (Pro) */}
        {isPro && customerAnalytics && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                {__('Customer Segments', 'Customer Segments')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center justify-center mb-4">
                <SimplePieChart
                  data={customerAnalytics.customerSegments || []}
                  title=""
                  size={200}
                  showLegend={true}
                  donut={true}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Reports;
