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

  // Local filters for detailed reports sections
  const [revenueTripFilter, setRevenueTripFilter] = useState('');
  const [bookingTripFilter, setBookingTripFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

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

  const downloadFile = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildCsvFromReport = (data: any): string => {
    if (!data) return '';

    const lines: string[] = [];

    // Revenue summary
    if (data.revenue_stats) {
      const r = data.revenue_stats;
      lines.push('Section,Metric,Value');
      lines.push(`Revenue,Total Revenue,${r.total}`);
      lines.push(`Revenue,Total Bookings,${r.bookings}`);
      lines.push(`Revenue,Average Booking,${r.average}`);
      lines.push('');
    }

    // Daily revenue trend
    if (Array.isArray(data.revenue_trend)) {
      lines.push('Revenue Trend,Date,Amount');
      data.revenue_trend.forEach((row: any) => {
        lines.push(`Revenue Trend,${row.label},${row.value}`);
      });
      lines.push('');
    }

    // Daily booking trend
    if (Array.isArray(data.booking_trend)) {
      lines.push('Booking Trend,Date,Bookings');
      data.booking_trend.forEach((row: any) => {
        lines.push(`Booking Trend,${row.label},${row.value}`);
      });
      lines.push('');
    }

    // Booking status
    if (data.booking_stats) {
      const b = data.booking_stats;
      lines.push('Booking Status,Status,Count');
      lines.push(`Booking Status,Total,${b.total}`);
      lines.push(`Booking Status,Confirmed,${b.confirmed}`);
      lines.push(`Booking Status,Pending,${b.pending}`);
      lines.push(`Booking Status,Cancelled,${b.cancelled}`);
      lines.push(`Booking Status,Completed,${b.completed}`);
      lines.push('');
    }

    // Payment status
    if (Array.isArray(data.payment_status)) {
      lines.push('Payment Status,Label,Count,Amount');
      data.payment_status.forEach((p: any) => {
        lines.push(`Payment Status,${p.label},${p.value},${p.amount}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  };

  const openPrintWindowForReport = (data: any, title: string) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const safeTitle = title || 'Reports';
    const revenue = data?.revenue_stats;
    const booking = data?.booking_stats;

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background-color: #f9fafb; }
      .muted { color: #6b7280; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <div class="muted">Generated on ${new Date().toLocaleString()}</div>

    <h2>Revenue Summary</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Total Revenue</td><td>${revenue ? revenue.total : '-'}</td></tr>
        <tr><td>Total Bookings</td><td>${revenue ? revenue.bookings : '-'}</td></tr>
        <tr><td>Average Booking</td><td>${revenue ? revenue.average : '-'}</td></tr>
      </tbody>
    </table>

    <h2>Booking Status</h2>
    <table>
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>
        <tr><td>Total</td><td>${booking ? booking.total : '-'}</td></tr>
        <tr><td>Confirmed</td><td>${booking ? booking.confirmed : '-'}</td></tr>
        <tr><td>Pending</td><td>${booking ? booking.pending : '-'}</td></tr>
        <tr><td>Cancelled</td><td>${booking ? booking.cancelled : '-'}</td></tr>
        <tr><td>Completed</td><td>${booking ? booking.completed : '-'}</td></tr>
      </tbody>
    </table>
  </body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    const { start, end } = dateRangeParams;

    try {
      const resp = await apiClient.get('/reports', {
        params: {
          date_from: start,
          date_to: end,
        },
      });
      const data = resp?.data?.data || resp?.data || {};

      const rangeLabel = `${start}_to_${end}`;

      if (format === 'csv' || format === 'excel') {
        const csv = buildCsvFromReport(data);
        const filename = `reports_${rangeLabel}.${format === 'excel' ? 'csv' : 'csv'}`;
        downloadFile(csv, filename, 'text/csv;charset=utf-8;');
        return;
      }

      if (format === 'pdf') {
        openPrintWindowForReport(data, `Reports ${rangeLabel}`);
        return;
      }
    } catch (e) {
      console.error('Failed to export reports', e);
      alert(__('Failed to export reports. Please try again.', 'Failed to export reports. Please try again.'));
    }
  };

  const revenueStats = reportData?.revenue_stats;
  const revenueTrend = reportData?.revenue_trend || [];
  const bookingStats = reportData?.booking_stats;
  const bookingTrend = reportData?.booking_trend || [];
  const tripPerformance = reportData?.trip_performance || [];
  const paymentStatus = reportData?.payment_status || [];
  const operationalStats = reportData?.operational_stats;
  const customerAnalytics = reportData?.customer_analytics;
  const revenueByTrip: any[] = reportData?.revenue_by_trip || [];
  const bookingsTable: any[] = reportData?.bookings_table || [];
  const travelerSegments = reportData?.traveler_segments;
  const departuresTable: any[] = reportData?.departures_table || [];
  const occupancyTrend: any[] = reportData?.occupancy_trend || [];
  const seatUtilization: any[] = reportData?.seat_utilization || [];
  const cancellationsSummary = reportData?.cancellations;
  const profitability = reportData?.profitability;

  const revenueTripOptions = useMemo(() => {
    const names = new Set<string>();
    revenueByTrip.forEach((row: any) => {
      if (row.trip) {
        names.add(String(row.trip));
      }
    });
    return Array.from(names).sort();
  }, [revenueByTrip]);

  const bookingTripOptions = useMemo(() => {
    const names = new Set<string>();
    bookingsTable.forEach((row: any) => {
      if (row.trip) {
        names.add(String(row.trip));
      }
    });
    return Array.from(names).sort();
  }, [bookingsTable]);

  const filteredRevenueByTrip = useMemo(() => {
    if (!revenueTripFilter) return revenueByTrip;
    return revenueByTrip.filter((row: any) => row.trip === revenueTripFilter);
  }, [revenueByTrip, revenueTripFilter]);

  const filteredBookingsTable = useMemo(() => {
    return bookingsTable.filter((row: any) => {
      if (bookingTripFilter && row.trip !== bookingTripFilter) return false;
      if (bookingStatusFilter && row.status !== bookingStatusFilter) return false;
      return true;
    });
  }, [bookingsTable, bookingTripFilter, bookingStatusFilter]);

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
                        <Cell key={index} fill={(t as any).color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {tripPerformance && tripPerformance.length > 0 && (
                <div className="mt-4 space-y-2 text-sm">
                  {tripPerformance.slice(0, 3).map((trip: any, idx: number) => (
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
                  {paymentStatus.map((status: any, idx: number) => (
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

        {/* Traveler Reports */}
        {travelerSegments && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                {__('Traveler Reports', 'Traveler Reports')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Traveler Categories', 'Traveler Categories')}
                  </div>
                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={travelerSegments.segments || []}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {(travelerSegments.segments || []).map((seg: any, index: number) => (
                            <Cell key={`trav-${index}`} fill={['#3b82f6','#10b981','#f59e0b','#8b5cf6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {__('Travelers Over Time', 'Travelers Over Time')}
                  </div>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={travelerSegments.trend || []} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
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
                        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__('Total Travelers', 'Total Travelers')}
                      </div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {travelerSegments.totalTravelers || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__('Avg Travelers / Booking', 'Avg Travelers / Booking')}
                      </div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {(travelerSegments.avgTravelersPerBooking || 0).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {__('Top Category', 'Top Category')}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                        {travelerSegments.topCategory || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Departure Reports */}
        {departuresTable && departuresTable.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {__('Departure Reports', 'Departure Reports')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div style={{ width: '100%', height: 220 }}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Occupancy Rate Over Time', 'Occupancy Rate Over Time')}
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupancyTrend || []} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    {__('Seat Utilization by Trip', 'Seat Utilization by Trip')}
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seatUtilization || []} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="trip" tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                      <YAxis tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <Tooltip />
                      <Bar dataKey="utilization" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Departure Date', 'Departure Date')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Trip', 'Trip')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Max Seats', 'Max Seats')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Booked', 'Booked')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Left', 'Left')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departuresTable.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.date || '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.trip}</td>
                        <td className="px-4 py-2 text-right">{row.maxSeats ?? '-'}</td>
                        <td className="px-4 py-2 text-right">{row.bookedSeats ?? '-'}</td>
                        <td className="px-4 py-2 text-right">{row.leftSeats ?? '-'}</td>
                        <td
                          className={`px-4 py-2 whitespace-nowrap text-xs font-medium capitalize rounded-full
                            ${row.status === 'upcoming'
                              ? 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30'
                              : row.status === 'completed' || row.status === 'past'
                              ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                              : row.status === 'expired' || row.status === 'cancelled'
                              ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
                              : 'text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/40'
                            }`
                          }
                        >
                          {row.status || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancellations Report */}
        {cancellationsSummary && bookingsTable && bookingsTable.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {__('Cancellations Report', 'Cancellations Report')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-1">
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {__('Total cancellations', 'Total cancellations')}: {cancellationsSummary.totalCancellations || 0}
                {' '}
                &bull; {__('Cancellation rate', 'Cancellation rate')}: {(cancellationsSummary.cancellationRate || 0).toFixed(1)}%
                {' '}
                &bull; {__('Revenue lost', 'Revenue lost')}: {formatPrice(cancellationsSummary.revenueLost || 0)}
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Booking ID', 'Booking ID')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Trip', 'Trip')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Departure Date', 'Departure Date')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Reason', 'Reason')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Refund Amount', 'Refund Amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsTable
                      .filter((row: any) => row.status === 'cancelled')
                      .map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.bookingNumber || row.id}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.trip}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-200">{row.departureDate || '-'}</td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{row.cancellationReason || '-'}</td>
                          <td className="px-4 py-2 text-right">{formatPrice(row.refundAmount || 0)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profitability */}
        <Card className="mt-4">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {__('Profitability', 'Profitability')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 pt-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Total Revenue', 'Total Revenue')}
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatPrice(revenueStats?.total || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Estimated Cost', 'Estimated Cost')}
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatPrice(0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Estimated Profit', 'Estimated Profit')}
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatPrice(revenueStats?.total || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Profit Margin', 'Profit Margin')}
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {revenueStats && revenueStats.total > 0 ? '100%' : '0%'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Profit per Trip', 'Profit per Trip')}
                </div>
                {/* Compact height so the bar area feels lightweight in the card */}
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={revenueByTrip || []} margin={{ top: 4, right: 12, left: 0, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="trip" tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                    {/* Add some headroom so the tallest bar doesn't touch the top of the chart */}
                    <YAxis tickLine={false} axisLine={{ stroke: '#e5e7eb' }} domain={[0, (dataMax: number) => dataMax * 1.2]} />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Bar dataKey="totalRevenue" name={__('Profit', 'Profit')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full overflow-x-auto">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {__('Trip Profitability', 'Trip Profitability')}
                </div>
                <table className="w-full min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Trip', 'Trip')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Revenue', 'Revenue')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Estimated Cost', 'Estimated Cost')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Estimated Profit', 'Estimated Profit')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Margin %', 'Margin %')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(revenueByTrip || []).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.trip}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(row.totalRevenue || 0)}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(0)}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(row.totalRevenue || 0)}</td>
                        <td className="px-4 py-2 text-right">{row.totalRevenue > 0 ? '100%' : '0%'}</td>
                      </tr>
                    ))}
                    {(!revenueByTrip || revenueByTrip.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                          {__('No profitability data available for this period.', 'No profitability data available for this period.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Reports */}
        {revenueByTrip && revenueByTrip.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {__('Revenue Reports', 'Revenue Reports')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {__('Trip', 'Trip')}
                </span>
                <Select
                  value={revenueTripFilter}
                  onChange={(e) => setRevenueTripFilter(e.target.value)}
                  className="h-8 min-w-[140px]"
                >
                  <option value="">{__('All Trips', 'All Trips')}</option>
                  {revenueTripOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Trip', 'Trip')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Total Revenue', 'Total Revenue')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Avg / Booking', 'Avg / Booking')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Paid', 'Paid')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Pending', 'Pending')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Refunded', 'Refunded')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRevenueByTrip.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-100 whitespace-nowrap">{row.trip}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(row.totalRevenue || 0)}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(row.avgRevenuePerBooking || 0)}</td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{formatPrice(row.paidTotal || 0)}</td>
                        <td className="px-4 py-2 text-right text-yellow-600 dark:text-yellow-400">{formatPrice(row.pendingTotal || 0)}</td>
                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">{formatPrice(row.refundedTotal || 0)}</td>
                      </tr>
                    ))}
                    {filteredRevenueByTrip.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                          {__('No revenue data found for this filter.', 'No revenue data found for this filter.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Reports */}
        {bookingsTable && bookingsTable.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {__('Booking Reports', 'Booking Reports')}
                </CardTitle>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{__('Trip', 'Trip')}:</span>
                    <Select
                      value={bookingTripFilter}
                      onChange={(e) => setBookingTripFilter(e.target.value)}
                      className="h-8 min-w-[140px]"
                    >
                      <option value="">{__('All Trips', 'All Trips')}</option>
                      {bookingTripOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{__('Status', 'Status')}:</span>
                    <Select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="h-8 min-w-[120px]"
                    >
                      <option value="">{__('All', 'All')}</option>
                      <option value="confirmed">{__('Confirmed', 'Confirmed')}</option>
                      <option value="pending">{__('Pending', 'Pending')}</option>
                      <option value="cancelled">{__('Cancelled', 'Cancelled')}</option>
                      <option value="completed">{__('Completed', 'Completed')}</option>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Simple CSV export for the currently filtered bookings table
                      const header = ['Booking ID','Trip','Departure Date','Travelers','Price','Payment Method','Status'];
                      const rows = filteredBookingsTable.map((row: any) => [
                        row.bookingNumber || row.id || '',
                        row.trip || '',
                        row.departureDate || '',
                        row.travelerCount ?? '',
                        row.price ?? '',
                        row.paymentMethod || '',
                        row.status || '',
                      ]);
                      const csv = [header.join(','), ...rows.map(r => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
                      const filename = `booking_reports_${dateRangeParams.start}_to_${dateRangeParams.end}.csv`;
                      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {__('Export CSV', 'Export CSV')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {__('Total bookings', 'Total bookings')}: {filteredBookingsTable.length}
                {bookingStats && (
                  <>
                    {' '}
                    &bull; {__('Confirmed', 'Confirmed')}: {bookingStats.confirmed || 0}
                    {' '}
                    &bull; {__('Cancelled', 'Cancelled')}: {bookingStats.cancelled || 0}
                  </>
                )}
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Booking ID', 'Booking ID')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Trip', 'Trip')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Departure Date', 'Departure Date')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Travelers', 'Travelers')}</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Price', 'Price')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Payment Method', 'Payment Method')}</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{__('Status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookingsTable.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.bookingNumber || row.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-100">{row.trip}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-200">{row.departureDate || '-'}</td>
                        <td className="px-4 py-2 text-right">{row.travelerCount ?? '-'}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(row.price || 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-200">{row.paymentMethod || '-'}</td>
                        <td
                          className={`px-4 py-2 whitespace-nowrap text-xs font-medium capitalize rounded-full
                            ${row.status === 'confirmed' || row.status === 'completed'
                              ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30'
                              : row.status === 'pending'
                              ? 'text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30'
                              : row.status === 'cancelled'
                              ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30'
                              : 'text-gray-700 bg-gray-50 dark:text-gray-300 dark:bg-gray-900/40'
                            }`
                          }
                        >
                          {row.status || '-'}
                        </td>
                      </tr>
                    ))}
                    {filteredBookingsTable.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                          {__('No bookings found for this filter.', 'No bookings found for this filter.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
