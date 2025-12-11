/**
 * Travel Industry Dashboard
 * Modern analytics dashboard with industry-standard KPIs and metrics
 * Designed for travel booking businesses with comprehensive insights
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Plane,
  TrendingUp,
  TrendingDown,
  Info,
  Target,
  Clock,
  CreditCard,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { StatCard } from '../components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { Select } from '../components/ui/select';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import BookingsOverviewChart from '../components/charts/BookingsOverviewChart';
import BookingStatusChart from '../components/charts/BookingStatusChart';
import { UpcomingDepartures } from '../components/dashboard/UpcomingDepartures';
import { PendingPayments } from '../components/dashboard/PendingPayments';
import { RecentBookings } from '../components/dashboard/RecentBookings';
import { apiClient } from '../lib/api';
import { getCurrencySymbol } from '../data/currencies';

const Dashboard: React.FC = () => {
  const { can } = usePermissions();
  const [timePeriod, setTimePeriod] = useState('last_30_days');

  const defaultCurrency =
    (window as any)?.yatraAdmin?.currency ||
    (window as any)?.yatraBookingData?.currency ||
    'USD';

  const currencyPosition =
    (window as any)?.yatraAdmin?.currency_position ||
    (window as any)?.yatraBookingData?.currency_position ||
    'left';

  const currencyDecimalsRaw =
    (window as any)?.yatraAdmin?.currency_decimals ||
    (window as any)?.yatraBookingData?.currency_decimals;
  const currencyDecimals = Number.isFinite(Number(currencyDecimalsRaw))
    ? Number(currencyDecimalsRaw)
    : 2;

  // Calculate date range based on selected time period
  const dateRange = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date(today);

    switch (timePeriod) {
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
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [timePeriod]);

  // Format currency values
  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol(defaultCurrency);
    const formatted = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: currencyDecimals,
      maximumFractionDigits: currencyDecimals,
    }).format(amount || 0);

    switch (currencyPosition) {
      case 'right':
        return `${formatted}${symbol}`;
      case 'left_space':
        return `${symbol} ${formatted}`;
      case 'right_space':
        return `${formatted} ${symbol}`;
      default:
        return `${symbol}${formatted}`;
    }
  };

  // Enhanced booking analytics with date range filtering
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-analytics', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/reports', {
        params: {
          date_from: dateRange.start,
          date_to: dateRange.end,
          include_analytics: true,
        },
      });
      return response?.data?.data || response?.data || {};
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch comparison data for previous period
  const previousPeriodRange = useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffTime);
    
    return {
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0],
    };
  }, [dateRange]);

  const { data: previousPeriodData } = useQuery({
    queryKey: ['dashboard-previous-period', previousPeriodRange],
    queryFn: async () => {
      const response = await apiClient.get('/reports', {
        params: {
          date_from: previousPeriodRange.start,
          date_to: previousPeriodRange.end,
        },
      });
      return response?.data?.data || response?.data || {};
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch total trips count
  const { data: tripsSummary } = useQuery({
    queryKey: ['dashboard-trips-total'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 1 } });
      return { total: response?.total ?? 0 };
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch total customers count
  const { data: customersSummary } = useQuery({
    queryKey: ['dashboard-customers-total'],
    queryFn: async () => {
      const response = await apiClient.get('/customers', { params: { per_page: 1 } });
      return { total: response?.total ?? 0 };
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch bookings chart data: bookings per month for the last 6 months (including current)
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings-chart'],
    queryFn: async () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      // Get a recent batch of bookings and aggregate by created_at month
      const response = await apiClient.get('/bookings', {
        params: {
          per_page: 500,
        },
      });

      const items: any[] = response?.data || [];
      const counts: Record<string, number> = {};
      const amounts: Record<string, number> = {};

      items.forEach((b) => {
        // Group by created_at month; fall back to travel_date
        const dateStr = b.created_at || b.travel_date;
        const date = dateStr ? new Date(dateStr) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        const ym = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
        counts[ym] = (counts[ym] || 0) + 1;
        const amount = Number(b.total_amount ?? 0) || 0;
        amounts[ym] = (amounts[ym] || 0) + amount;
      });

      // Build the last 6 calendar months (including current), oldest first
      const months: { label: string; count: number; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        const label = d.toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        });
        months.push({
          label,
          count: counts[ym] || 0,
          amount: amounts[ym] || 0,
        });
      }

      return months;
    },
    enabled: can('yatra_view_bookings'),
  });

  // Calculate KPIs and metrics from dashboard data
  const kpis = useMemo(() => {
    const current = dashboardData || {};
    const previous = previousPeriodData || {};
    
    const calculateChange = (currentVal: number, previousVal: number) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    return {
      totalRevenue: {
        value: current.total_revenue || 0,
        change: calculateChange(current.total_revenue || 0, previous.total_revenue || 0),
        previous: previous.total_revenue || 0,
      },
      totalBookings: {
        value: current.total_bookings || 0,
        change: calculateChange(current.total_bookings || 0, previous.total_bookings || 0),
        previous: previous.total_bookings || 0,
      },
      averageBookingValue: {
        value: current.total_bookings > 0 ? (current.total_revenue || 0) / current.total_bookings : 0,
        change: calculateChange(
          current.total_bookings > 0 ? (current.total_revenue || 0) / current.total_bookings : 0,
          previous.total_bookings > 0 ? (previous.total_revenue || 0) / previous.total_bookings : 0
        ),
      },
      conversionRate: {
        value: current.conversion_rate || 0,
        change: calculateChange(current.conversion_rate || 0, previous.conversion_rate || 0),
      },
      cancellationRate: {
        value: current.cancellation_rate || 0,
        change: calculateChange(current.cancellation_rate || 0, previous.cancellation_rate || 0),
      },
      averageLeadTime: {
        value: current.average_lead_time || 0,
        change: calculateChange(current.average_lead_time || 0, previous.average_lead_time || 0),
      },
    };
  }, [dashboardData, previousPeriodData]);

  // Derive booking status breakdown from dashboard data
  const statusData = useMemo(() => {
    const byStatus = dashboardData?.bookings_by_status || {};

    return [
      { label: __('Pending', 'Pending'), value: byStatus.pending || 0, color: '#f59e0b' },
      { label: __('Confirmed', 'Confirmed'), value: byStatus.confirmed || 0, color: '#10b981' },
      { label: __('Completed', 'Completed'), value: byStatus.completed || 0, color: '#3b82f6' },
      { label: __('Cancelled', 'Cancelled'), value: byStatus.cancelled || 0, color: '#ef4444' },
      { label: __('Refunded', 'Refunded'), value: byStatus.refunded || 0, color: '#a855f7' },
    ];
  }, [dashboardData]);

  // Fetch popular destinations (aggregate from trips API)
  const { data: destinationsData } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', {
        params: {
          per_page: 50,
        },
      });

      const trips = response?.data || [];
      const counts: Record<string, number> = {};

      // Each trip may have destinations array (from TripController prepare_item_for_response)
      trips.forEach((trip: any) => {
        const destinations = trip.destinations || [];
        destinations.forEach((dest: any) => {
          const name = dest?.name || dest?.destination_name || '';
          if (!name) return;
          counts[name] = (counts[name] || 0) + 1;
        });
      });

      const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];
      const entries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      return entries.map(([name, value], index) => ({
        label: name,
        value,
        color: palette[index % palette.length],
      }));
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch upcoming departures (real data from /departures)
  const { data: departures } = useQuery({
    queryKey: ['upcoming-departures'],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const response = await apiClient.get('/departures', {
        params: {
          status: 'upcoming',
          date_from: todayStr,
          include_past: false,
        },
      });

      const items = response?.data || [];

      // Map API departures into widget-friendly shape
      return items.map((d: any) => {
        const tripTitle = d?.trip?.title || d?.trip_title || d?.title || '';
        const destination = (d?.trip?.destinations && d.trip.destinations[0]?.name) || d?.destination || undefined;
        const totalSpots = d?.total_spots ?? d?.capacity ?? d?.total_seats ?? d?.max_travelers ?? 0;
        const availableSpots = d?.available_spots ?? d?.available_seats ?? d?.remaining_slots ?? (totalSpots - (d?.bookings_count || 0));

        return {
          id: d.id,
          trip_id: d.trip_id || d?.trip?.id,
          trip_title: tripTitle,
          departure_date: d.start_date || d.date || d.departure_date,
          available_spots: Number.isFinite(availableSpots) ? availableSpots : 0,
          total_spots: Number.isFinite(totalSpots) ? totalSpots : 0,
          status: d.status || 'upcoming',
          destination,
        };
      });
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch pending payments (real data)
  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const response = await apiClient.get('/payments', {
        params: {
          status: 'pending',
          per_page: 5,
        },
      });
      return response?.data || [];
    },
    enabled: can('yatra_view_bookings'),
  });


  // Fetch recent bookings (real data, latest 5) and map to widget shape
  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings', {
        params: {
          per_page: 5,
        },
      });
      const items = response?.data || [];

      return items.map((b: any) => ({
        id: b.id,
        booking_id: b.reference || `BK-${b.id}`,
        customer_name: b.customer_name || b.contact_first_name || '',
        trip_title: b.trip_title || '',
        // Prefer created_at, fallback to travel_date, otherwise empty string
        booking_date: b.created_at || b.travel_date || '',
        total_amount: b.total_amount ?? 0,
        status: (b.status || 'pending') as 'confirmed' | 'pending' | 'cancelled' | 'completed',
      }));
    },
    enabled: can('yatra_view_bookings'),
  });


  // Helper function to render trend indicator
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

  return (
    <div className="space-y-6">
      {/* Header with Time Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {__('Travel Analytics Dashboard', 'Travel Analytics Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {__('Monitor your travel business performance and key metrics', 'Monitor your travel business performance and key metrics')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select
            value={timePeriod}
            onValueChange={setTimePeriod}
            className="w-48"
          >
            <option value="today">{__('Today', 'Today')}</option>
            <option value="last_7_days">{__('Last 7 Days', 'Last 7 Days')}</option>
            <option value="last_30_days">{__('Last 30 Days', 'Last 30 Days')}</option>
            <option value="last_90_days">{__('Last 90 Days', 'Last 90 Days')}</option>
            <option value="this_month">{__('This Month', 'This Month')}</option>
            <option value="last_month">{__('Last Month', 'Last Month')}</option>
            <option value="this_year">{__('This Year', 'This Year')}</option>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Total Revenue', 'Total Revenue')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(kpis.totalRevenue.value)}
                </p>
                <TrendIndicator value={kpis.totalRevenue.change} isPositive={true} />
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Total Bookings', 'Total Bookings')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.totalBookings.value.toLocaleString()}
                </p>
                <TrendIndicator value={kpis.totalBookings.change} isPositive={true} />
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Avg Booking Value', 'Avg Booking Value')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(kpis.averageBookingValue.value)}
                </p>
                <TrendIndicator value={kpis.averageBookingValue.change} isPositive={true} />
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Conversion Rate', 'Conversion Rate')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.conversionRate.value.toFixed(1)}%
                </p>
                <TrendIndicator value={kpis.conversionRate.change} isPositive={true} />
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Cancellation Rate', 'Cancellation Rate')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.cancellationRate.value.toFixed(1)}%
                </p>
                <TrendIndicator value={kpis.cancellationRate.change} isPositive={false} />
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <RefreshCw className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {__('Avg Lead Time', 'Avg Lead Time')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.averageLeadTime.value.toFixed(0)} {__('days', 'days')}
                </p>
                <TrendIndicator value={kpis.averageLeadTime.change} isPositive={true} />
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
        </ConditionalRender>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                {__('Booking Trends', 'Booking Trends')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <BookingsOverviewChart data={bookingsData || []} />
            </CardContent>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                {__('Booking Status Distribution', 'Booking Status Distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <BookingStatusChart data={statusData} />
            </CardContent>
          </Card>
        </ConditionalRender>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConditionalRender condition={can('yatra_view_trips')}>
          <StatCard
            title={__('Active Trips', 'Active Trips')}
            value={tripsSummary?.total || 0}
            icon={<Plane className="w-6 h-6 text-blue-600" />}
            trend={{ value: 0, isPositive: true }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          />
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <StatCard
            title={__('Total Customers', 'Total Customers')}
            value={customersSummary?.total || 0}
            icon={<Users className="w-6 h-6 text-green-600" />}
            trend={{ value: 0, isPositive: true }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          />
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <StatCard
            title={__('Popular Destinations', 'Popular Destinations')}
            value={destinationsData?.length || 0}
            icon={<Globe className="w-6 h-6 text-purple-600" />}
            trend={{ value: 0, isPositive: true }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          />
        </ConditionalRender>
      </div>

      {/* Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConditionalRender condition={can('yatra_view_trips')}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                {__('Upcoming Departures', 'Upcoming Departures')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingDepartures 
                departures={upcomingDepartures || []} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-600" />
                {__('Pending Payments', 'Pending Payments')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PendingPayments 
                payments={pendingPayments || []} 
                isLoading={isLoading}
                formatCurrency={formatCurrency}
              />
            </CardContent>
          </Card>
        </ConditionalRender>

        <ConditionalRender condition={can('yatra_view_bookings')}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                {__('Recent Bookings', 'Recent Bookings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentBookings 
                bookings={recentBookings || []} 
                isLoading={isLoading}
                formatCurrency={formatCurrency}
              />
            </CardContent>
          </Card>
        </ConditionalRender>
      </div>
    </div>
  );
};
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - Top Row: single horizontal row (scrolls on small screens) */}
      <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
        <div className="flex-1 min-w-0">
          <StatCard
            title={__('Total Trips', 'Total Trips')}
            value={tripsSummary?.total || 0}
            icon={MapPin}
            color="blue"
            loading={isLoading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <StatCard
            title={__('Total Bookings', 'Total Bookings')}
            value={bookingStats?.total || 0}
            icon={Calendar}
            color="green"
            loading={isLoading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <StatCard
            title={__('Booked Revenue', 'Booked Revenue')}
            value={`$${(bookingStats?.total_revenue || 0).toLocaleString?.() || '0'}`}
            icon={DollarSign}
            color="purple"
            loading={isLoading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <StatCard
            title={__('Collected Revenue', 'Collected Revenue')}
            value={`$${(bookingStats?.total_collected || 0).toLocaleString?.() || '0'}`}
            icon={DollarSign}
            color="green"
            loading={isLoading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <StatCard
            title={__('Total Customers', 'Total Customers')}
            value={customersSummary?.total || 0}
            icon={Users}
            color="orange"
            loading={isLoading}
          />
        </div>
      </div>

      {/* Main Content Grid - Optimized Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column - Charts (7 columns) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Bookings Overview - Full Width */}
          <ConditionalRender capability="yatra_view_bookings">
            <Card>
              <CardHeader>
                <CardTitle>{__('Bookings Overview', 'Bookings Overview')}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <BookingsOverviewChart
                  data={bookingsData || []}
                  currency={defaultCurrency}
                  currencyPosition={currencyPosition}
                  currencyDecimals={currencyDecimals}
                />
              </CardContent>
            </Card>
          </ConditionalRender>

          {/* Booking Status and Popular Destinations - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ConditionalRender capability="yatra_view_bookings">
              <Card>
                <CardHeader>
                  <CardTitle>{__('Booking Status', 'Booking Status')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <BookingStatusChart data={statusData || []} />
                </CardContent>
              </Card>
            </ConditionalRender>

            <ConditionalRender capability="yatra_view_trips">
              <Card>
                <CardHeader>
                  <CardTitle>{__('Popular Destinations', 'Popular Destinations')}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <SimpleBarChart
                    data={destinationsData || []}
                    title=""
                    height={180}
                    showValues={true}
                  />
                </CardContent>
              </Card>
            </ConditionalRender>
          </div>

          {/* Additional Stats - Integrated into main grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ConditionalRender capability="yatra_view_bookings">
              <StatCard
                title={__('Pending Bookings', 'Pending Bookings')}
                value={(bookingStats as any)?.by_status?.pending?.count || 0}
                icon={TrendingUp}
                color="orange"
                loading={isLoading}
              />
            </ConditionalRender>

            <ConditionalRender capability="yatra_view_trips">
              <StatCard
                title={__('Upcoming Departures', 'Upcoming Departures')}
                value={bookingStats?.upcoming || 0}
                icon={Plane}
                color="green"
                loading={isLoading}
              />
            </ConditionalRender>
          </div>

          {/* Recent Bookings - Fill the gap */}
          <ConditionalRender capability="yatra_view_bookings">
            <RecentBookings
              bookings={recentBookings || []}
              loading={isLoading}
              onView={(booking) => {
                const admin = (window as any)?.yatraAdmin;
                const baseUrl = admin?.siteUrl || '';
                window.location.href = `${baseUrl}/wp-admin/admin.php?page=yatra&subpage=bookings&action=view&id=${booking.id}`;
              }}
            />
          </ConditionalRender>
        </div>

        {/* Right Column - Widgets (5 columns) */}
        <div className="lg:col-span-5 space-y-3">
          <ConditionalRender capability="yatra_view_trips">
            <UpcomingDepartures
              departures={departures || []}
              loading={isLoading}
            />
          </ConditionalRender>

          <ConditionalRender capability="yatra_view_bookings">
            <PendingPayments
              payments={pendingPayments || []}
              loading={isLoading}
            />
          </ConditionalRender>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
