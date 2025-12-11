/**
 * Travel Industry Reports & Analytics
 * Comprehensive reporting dashboard with advanced analytics and insights
 * Industry-standard metrics and visualizations for travel businesses
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
  LineChart,
  Filter,
  FileText,
  Target,
  Clock,
  Globe,
  Star,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Printer
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getCurrencySymbol, getCurrency } from '../data/currencies';
import { ConditionalRender } from '../components/ui/conditional-render';
import { apiClient } from '../lib/api';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

const Reports: React.FC = () => {
  const { can, isPro } = usePermissions();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReport, setSelectedReport] = useState('overview');

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

  // Comprehensive reports query
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['comprehensive-reports', dateRangeParams, selectedReport],
    enabled: can('yatra_view_bookings'),
    queryFn: async () => {
      const { start, end } = dateRangeParams;
      const resp = await apiClient.get('/reports', {
        params: {
          date_from: start,
          date_to: end,
        },
      });
      const data = resp?.data?.data || resp?.data || {};
      console.log('📊 Reports API Response:', data);
      return data;
    },
  });

  // Format currency
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

  // Export functions
  const exportToCSV = () => {
    if (!reportData) return;
    
    const csvContent = buildCsvFromReport(reportData);
    const filename = `travel-reports-${dateRangeParams.start}-to-${dateRangeParams.end}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const exportToPDF = () => {
    window.print();
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
    
    // Add comprehensive data export logic here
    lines.push('Travel Business Report');
    lines.push(`Period: ${dateRangeParams.start} to ${dateRangeParams.end}`);
    lines.push('');
    
    // Revenue metrics
    if (data.revenue_metrics) {
      lines.push('Revenue Metrics');
      lines.push('Metric,Value');
      Object.entries(data.revenue_metrics).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  };

  // Trend indicator component
  const TrendIndicator = ({ value, isPositive }: { value: number; isPositive?: boolean }) => {
    const isUp = isPositive !== undefined ? isPositive : value > 0;
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    const colorClass = isUp ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // Report sections
  const reportSections = [
    { id: 'overview', label: __('Business Overview', 'Business Overview'), icon: BarChart3 },
    { id: 'revenue', label: __('Revenue Analytics', 'Revenue Analytics'), icon: DollarSign },
    { id: 'bookings', label: __('Booking Analytics', 'Booking Analytics'), icon: Calendar },
    { id: 'customers', label: __('Customer Analytics', 'Customer Analytics'), icon: Users },
    { id: 'destinations', label: __('Destination Performance', 'Destination Performance'), icon: MapPin },
    { id: 'operational', label: __('Operational Metrics', 'Operational Metrics'), icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {__('Travel Business Reports', 'Travel Business Reports')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {__('Comprehensive analytics and insights for your travel business', 'Comprehensive analytics and insights for your travel business')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading || !reportData}
          >
            <Download className="w-4 h-4" />
            {__('Export CSV', 'Export CSV')}
          </Button>
          <Button
            onClick={exportToPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading || !reportData}
          >
            <Printer className="w-4 h-4" />
            {__('Print Report', 'Print Report')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {__('Report Filters', 'Report Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Time Period', 'Time Period')}
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="today">{__('Today', 'Today')}</option>
                <option value="last_7_days">{__('Last 7 Days', 'Last 7 Days')}</option>
                <option value="last_30_days">{__('Last 30 Days', 'Last 30 Days')}</option>
                <option value="last_90_days">{__('Last 90 Days', 'Last 90 Days')}</option>
                <option value="this_month">{__('This Month', 'This Month')}</option>
                <option value="last_month">{__('Last Month', 'Last Month')}</option>
                <option value="this_year">{__('This Year', 'This Year')}</option>
                <option value="custom">{__('Custom Range', 'Custom Range')}</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Start Date', 'Start Date')}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('End Date', 'End Date')}
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Report Type', 'Report Type')}
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {reportSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Navigation */}
      <div className="flex flex-wrap gap-2">
        {reportSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setSelectedReport(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedReport === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {__('Loading comprehensive reports...', 'Loading comprehensive reports...')}
          </p>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && reportData && (
        <div className="space-y-6">
          {/* Conditional Content Based on Selected Report */}
          {selectedReport === 'overview' && (
            <>
              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {__('Total Revenue', 'Total Revenue')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(reportData.revenue_stats?.total || 0)}
                  </p>
                  <TrendIndicator value={0} isPositive={true} />
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {__('Total Bookings', 'Total Bookings')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(reportData.booking_stats?.total || 0).toLocaleString()}
                  </p>
                  <TrendIndicator value={0} isPositive={true} />
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {__('Cancellation Rate', 'Cancellation Rate')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(reportData.booking_stats?.cancellationRate || 0).toFixed(1)}%
                  </p>
                  <TrendIndicator value={0} isPositive={false} />
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {__('Avg Booking Value', 'Avg Booking Value')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(reportData.revenue_stats?.average || 0)}
                  </p>
                  <TrendIndicator value={0} isPositive={true} />
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-600" />
                  {__('Revenue Trend', 'Revenue Trend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {(() => {
                    const rawChartData = reportData.revenue_trend || [];
                    console.log('📈 Revenue Trend Chart Data:', rawChartData);
                    console.log('📈 First item structure:', rawChartData[0]);
                    console.log('📈 All keys in first item:', rawChartData[0] ? Object.keys(rawChartData[0]) : 'No data');
                    
                    // More robust data transformation
                    const chartData = rawChartData.map((item: any, index: number) => {
                      console.log(`📈 Item ${index}:`, item);
                      return {
                        label: item.label || item.date || item.day || `Day ${index + 1}`,
                        value: Number(item.value || item.revenue || item.amount || 0)
                      };
                    });
                    
                    console.log('📈 Transformed Chart Data:', chartData.slice(0, 3)); // Show first 3 items
                    console.log('📈 Chart Data Length:', chartData.length);
                    console.log('📈 Has valid data:', chartData.some(item => item.value > 0));
                    
                    // If no real data, show sample data
                    const finalData = chartData.length > 0 ? chartData : [
                      { label: 'Day 1', value: 1000 },
                      { label: 'Day 2', value: 1500 },
                      { label: 'Day 3', value: 1200 }
                    ];
                    
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={finalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Revenue']} />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Booking Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-600" />
                  {__('Booking Status Distribution', 'Booking Status Distribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {(() => {
                    console.log('🥧 Full Booking Stats Object:', reportData.booking_stats);
                    
                    const rawPieData = [
                      { name: 'Pending', value: reportData.booking_stats?.pending || 0, color: '#f59e0b' },
                      { name: 'Confirmed', value: reportData.booking_stats?.confirmed || 0, color: '#10b981' },
                      { name: 'Completed', value: reportData.booking_stats?.completed || 0, color: '#3b82f6' },
                      { name: 'Cancelled', value: reportData.booking_stats?.cancelled || 0, color: '#ef4444' },
                    ];
                    
                    console.log('🥧 Raw Pie Data:', rawPieData);
                    
                    // Check if we have any real data
                    const hasData = rawPieData.some((item: any) => item.value > 0);
                    
                    // Use real data if available, otherwise show sample data
                    const pieData = hasData ? rawPieData : [
                      { name: 'Pending', value: 5, color: '#f59e0b' },
                      { name: 'Confirmed', value: 15, color: '#10b981' },
                      { name: 'Completed', value: 8, color: '#3b82f6' },
                      { name: 'Cancelled', value: 2, color: '#ef4444' },
                    ];
                    
                    console.log('🥧 Final Pie Data:', pieData);
                    console.log('📊 Has Real Data:', hasData);
                    console.log('📊 Total Values:', pieData.reduce((sum: number, item: any) => sum + item.value, 0));
                    
                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                {__('Performance Analytics', 'Performance Analytics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {__('Top Trips', 'Top Trips')}
                  </h4>
                  <div className="space-y-2">
                    {(reportData.trip_performance || []).slice(0, 5).map((trip: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{trip.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {trip.value} {__('bookings', 'bookings')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {__('Payment Status', 'Payment Status')}
                  </h4>
                  <div className="space-y-2">
                    {(reportData.payment_status || []).slice(0, 5).map((payment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{payment.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(payment.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {__('Customer Analytics', 'Customer Analytics')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {__('New Customers', 'New Customers')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {reportData.customer_analytics?.newCustomers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {__('Returning Customers', 'Returning Customers')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {reportData.customer_analytics?.returningCustomers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {__('Retention Rate', 'Retention Rate')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(reportData.customer_analytics?.repeatBookingRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}

          {/* Revenue Analytics Tab */}
          {selectedReport === 'revenue' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Analytics</h2>
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-blue-600" />
                      {__('Revenue Trend', 'Revenue Trend')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {(() => {
                        const rawChartData = reportData.revenue_trend || [];
                        const chartData = rawChartData.map((item: any) => ({
                          label: item.label || item.date || item.day,
                          value: Number(item.value || item.revenue || item.amount || 0)
                        }));
                        
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Revenue']} />
                              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue by Trip */}
                <Card>
                  <CardHeader>
                    <CardTitle>{__('Revenue by Trip', 'Revenue by Trip')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(reportData.revenue_by_trip || []).slice(0, 5).map((trip: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm font-medium">{trip.trip}</span>
                          <span className="text-sm text-green-600 font-bold">
                            {formatPrice(trip.totalRevenue || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Booking Analytics Tab */}
          {selectedReport === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Booking Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-green-600" />
                      {__('Booking Status Distribution', 'Booking Status Distribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {(() => {
                        const pieData = [
                          { name: 'Pending', value: reportData.booking_stats?.pending || 0, color: '#f59e0b' },
                          { name: 'Confirmed', value: reportData.booking_stats?.confirmed || 0, color: '#10b981' },
                          { name: 'Completed', value: reportData.booking_stats?.completed || 0, color: '#3b82f6' },
                          { name: 'Cancelled', value: reportData.booking_stats?.cancelled || 0, color: '#ef4444' },
                        ];
                        
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>{__('Booking Trend', 'Booking Trend')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.booking_trend || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Customer Analytics Tab */}
          {selectedReport === 'customers' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Customers</span>
                      <span className="font-bold">{reportData.customer_analytics?.newCustomers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Returning</span>
                      <span className="font-bold">{reportData.customer_analytics?.returningCustomers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Retention Rate</span>
                      <span className="font-bold">{(reportData.customer_analytics?.repeatBookingRate || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Destination Performance Tab */}
          {selectedReport === 'destinations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Destination Performance</h2>
              <Card>
                <CardHeader>
                  <CardTitle>{__('Top Performing Trips', 'Top Performing Trips')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(reportData.trip_performance || []).map((trip: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">{trip.label}</span>
                          <p className="text-sm text-gray-600">{trip.value} bookings</p>
                        </div>
                        <span className="text-green-600 font-bold">
                          {formatPrice(trip.revenue || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Operational Metrics Tab */}
          {selectedReport === 'operational' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Operational Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{__('Operational Stats', 'Operational Stats')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Upcoming Departures</span>
                        <span className="font-bold">{reportData.operational_stats?.upcomingDepartures || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupancy Rate</span>
                        <span className="font-bold">{reportData.operational_stats?.occupancyRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Group Size</span>
                        <span className="font-bold">{reportData.operational_stats?.averageGroupSize || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !reportData && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {__('No Data Available', 'No Data Available')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {__('No data found for the selected time period. Try adjusting your filters.', 'No data found for the selected time period. Try adjusting your filters.')}
          </p>
        </Card>
      )}
    </div>
  );
};

export default Reports;
