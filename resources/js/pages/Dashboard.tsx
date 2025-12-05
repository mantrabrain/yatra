/**
 * Dashboard Page
 * Clean, minimal SaaS-style dashboard with proper alignment
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Plane,
  TrendingUp,
  Info
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { usePermissions } from '../hooks/usePermissions';
import { StatCard } from '../components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ConditionalRender } from '../components/ui/conditional-render';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import BookingsOverviewChart from '../components/charts/BookingsOverviewChart';
import BookingStatusChart from '../components/charts/BookingStatusChart';
import { UpcomingDepartures } from '../components/dashboard/UpcomingDepartures';
import { PendingPayments } from '../components/dashboard/PendingPayments';
import { RecentBookings } from '../components/dashboard/RecentBookings';
import { apiClient } from '../lib/api';

const Dashboard: React.FC = () => {
  const { can } = usePermissions();

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

  // Fetch booking statistics (totals, revenue, status breakdown, upcoming)
  const { data: bookingStats, isLoading } = useQuery({
    queryKey: ['dashboard-booking-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/stats');
      // Shape: { success: true, data: { total, by_status, total_revenue, total_collected, this_month, upcoming } }
      return response?.data || {};
    },
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

  // Derive booking status breakdown from bookingStats.by_status
  const statusData = React.useMemo(() => {
    const byStatus = (bookingStats as any)?.by_status || {};

    const getCount = (key: string) => {
      const entry = byStatus[key];
      if (!entry) return 0;
      // entry is an object like { status: 'pending', count: '5' }
      const raw = (entry as any).count;
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw ?? 0);
      return Number.isNaN(n) ? 0 : n;
    };

    return [
      { label: __('Pending', 'Pending'), value: getCount('pending'), color: '#f59e0b' },
      { label: __('Confirmed', 'Confirmed'), value: getCount('confirmed'), color: '#10b981' },
      { label: __('Completed', 'Completed'), value: getCount('completed'), color: '#3b82f6' },
      { label: __('Cancelled', 'Cancelled'), value: getCount('cancelled'), color: '#ef4444' },
      { label: __('Refunded', 'Refunded'), value: getCount('refunded'), color: '#a855f7' },
    ];
  }, [bookingStats]);

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


  return (
    <div className="space-y-3">
      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {__('Welcome to Yatra Dashboard', 'Welcome to Yatra Dashboard')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {__('Here\'s an overview of your travel booking business. Use the cards below to see key metrics, upcoming trips, and recent activity.', 'Here\'s an overview of your travel booking business. Use the cards below to see key metrics, upcoming trips, and recent activity.')}
              </p>
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
