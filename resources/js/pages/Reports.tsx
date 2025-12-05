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
  XCircle,
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
import { apiClient } from '../lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

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

  // Single consolidated reports query
  const { data: reportData } = useQuery({
    queryKey: ['reports', dateRangeParams],
    enabled: can('yatra_view_bookings'),
    queryFn: async () => {
      const { start, end } = dateRangeParams;
      const resp = await apiClient.get('/reports', {
        params: {
          date_from: start,
          date_to: end,
        },
      });
      return resp?.data?.data || resp?.data || {};
    },
  });

  const formatPrice = (price: number) => {
    const admin = (window as any)?.yatraAdmin || {};
    const currencyCode: string = admin.currency || 'USD';
    const position: string = admin.currency_position || 'left';
    const decimalsRaw = admin.currency_decimals;

    const currencyMeta = getCurrency(currencyCode);
    const defaultDecimals = currencyMeta?.decimalDigits ?? 2;
    const decimals = Number.isFinite(Number(decimalsRaw))
      ? Math.max(0, Math.min(4, Number(decimalsRaw)))
      : defaultDecimals;

    const symbol = getCurrencySymbol(currencyCode);
    const core = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price ?? 0);

    switch (position) {
      case 'right':
        return `${core}${symbol}`;
      case 'left_space':
        return `${symbol} ${core}`;
      case 'right_space':
        return `${core} ${symbol}`;
      case 'left':
      default:
        return `${symbol}${core}`;
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    // Placeholder for export functionality
    console.log(`Exporting reports as ${format}...`);
    alert(__('Export functionality will be implemented soon', 'Export functionality will be implemented soon'));
  };

  const revenueStats = reportData?.revenue_stats;
  const revenueTrend = reportData?.revenue_trend || [];
  const bookingStats = reportData?.booking_stats;
  const bookingTrend = reportData?.booking_trend || [];
  const tripPerformance = reportData?.trip_performance || [];
  const paymentStatus = reportData?.payment_status || [];
  const operationalStats = reportData?.operational_stats;
  const customerAnalytics = reportData?.customer_analytics;

  return (
    <div className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {__('Revenue Trend', 'Revenue Trend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend || []} margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => formatPrice(Number(value) || 0)}
                      tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatPrice(Number(value) || 0)}
                      labelFormatter={(label: string) => label}
                    />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {__('Booking Trend', 'Booking Trend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingTrend || []} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trip Performance and Payment Status */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {__('Top Performing Trips', 'Top Performing Trips')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tripPerformance || []} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {(tripPerformance || []).map((t, index) => (
                        <Cell key={index} fill={t.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={paymentStatus || []}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {(paymentStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
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

        {/* Booking Status Breakdown */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                {__('Booking Status Breakdown', 'Booking Status Breakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
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

        </div>

        {/* Operational Reports */}
        {operationalStats && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {__('Operational Overview', 'Operational Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
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
                <div className="space-y-3">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {__('Customer Analytics', 'Customer Analytics')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
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
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={customerAnalytics.customerSegments || []}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {(customerAnalytics.customerSegments || []).map((entry: any, index: number) => (
                          <Cell key={`seg-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </ConditionalRender>
    </div>
  );
};

export default Reports;
