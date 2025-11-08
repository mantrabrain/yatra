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
import { SimpleLineChart } from '../components/charts/SimpleLineChart';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';
import { SimplePieChart } from '../components/charts/SimplePieChart';
import { UpcomingDepartures } from '../components/dashboard/UpcomingDepartures';
import { PendingPayments } from '../components/dashboard/PendingPayments';
import { RecentBookings } from '../components/dashboard/RecentBookings';

const Dashboard: React.FC = () => {
  const { can } = usePermissions();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // return await apiClient.get('/dashboard/stats');
        // Dummy data for demonstration
        return {
          totalTrips: 24,
          totalBookings: 156,
          totalRevenue: 125400,
          pendingBookings: 12,
          totalCustomers: 89,
          upcomingDepartures: 8,
        };
      } catch (error) {
        return {
          totalTrips: 24,
          totalBookings: 156,
          totalRevenue: 125400,
          pendingBookings: 12,
          totalCustomers: 89,
          upcomingDepartures: 8,
        };
      }
    },
  });

  // Fetch bookings chart data
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings-chart'],
    queryFn: async () => {
      // Realistic booking trend data
      return [
        { label: 'Jan', value: 18 },
        { label: 'Feb', value: 22 },
        { label: 'Mar', value: 28 },
        { label: 'Apr', value: 35 },
        { label: 'May', value: 42 },
        { label: 'Jun', value: 38 },
      ];
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch booking status breakdown
  const { data: statusData } = useQuery({
    queryKey: ['booking-status'],
    queryFn: async () => {
      return [
        { label: __('Confirmed', 'Confirmed'), value: 45, color: '#10b981' },
        { label: __('Pending', 'Pending'), value: 25, color: '#f59e0b' },
        { label: __('Cancelled', 'Cancelled'), value: 15, color: '#ef4444' },
        { label: __('Completed', 'Completed'), value: 15, color: '#3b82f6' },
      ];
    },
    enabled: can('yatra_view_bookings'),
  });

  // Fetch popular destinations
  const { data: destinationsData } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: async () => {
      return [
        { label: __('Nepal', 'Nepal'), value: 120, color: '#3b82f6' },
        { label: __('India', 'India'), value: 85, color: '#10b981' },
        { label: __('Bhutan', 'Bhutan'), value: 65, color: '#f59e0b' },
        { label: __('Tibet', 'Tibet'), value: 45, color: '#ef4444' },
      ];
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch upcoming departures
  const { data: departures } = useQuery({
    queryKey: ['upcoming-departures'],
    queryFn: async () => {
      try {
        // return await apiClient.get('/dashboard/upcoming-departures');
        // Dummy departure data
        const today = new Date();
        const getDate = (days: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
        };
        
        return [
          {
            id: 1,
            trip_title: 'Everest Base Camp Trek',
            departure_date: getDate(3),
            available_spots: 3,
            total_spots: 15,
            status: 'confirmed',
            destination: 'Nepal',
          },
          {
            id: 2,
            trip_title: 'Annapurna Circuit Adventure',
            departure_date: getDate(7),
            available_spots: 8,
            total_spots: 20,
            status: 'confirmed',
            destination: 'Nepal',
          },
          {
            id: 3,
            trip_title: 'Golden Triangle Tour',
            departure_date: getDate(12),
            available_spots: 5,
            total_spots: 12,
            status: 'pending',
            destination: 'India',
          },
          {
            id: 4,
            trip_title: 'Bhutan Cultural Journey',
            departure_date: getDate(18),
            available_spots: 10,
            total_spots: 16,
            status: 'confirmed',
            destination: 'Bhutan',
          },
          {
            id: 5,
            trip_title: 'Tibet Spiritual Tour',
            departure_date: getDate(25),
            available_spots: 2,
            total_spots: 10,
            status: 'confirmed',
            destination: 'Tibet',
          },
        ];
      } catch (error) {
        return [];
      }
    },
    enabled: can('yatra_view_trips'),
  });

  // Fetch pending payments
  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      try {
        // return await apiClient.get('/dashboard/pending-payments');
        // Dummy pending payment data
        const today = new Date();
        const getDate = (days: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
        };
        
        return [
          {
            id: 1,
            booking_id: 124,
            customer_name: 'John Smith',
            trip_title: 'Everest Base Camp Trek',
            amount: 1250,
            due_date: getDate(-2),
            days_overdue: 2,
            payment_method: 'Bank Transfer',
          },
          {
            id: 2,
            booking_id: 128,
            customer_name: 'Sarah Johnson',
            trip_title: 'Annapurna Circuit Adventure',
            amount: 980,
            due_date: getDate(3),
            days_overdue: 0,
            payment_method: 'Credit Card',
          },
        ];
      } catch (error) {
        return [];
      }
    },
    enabled: can('yatra_view_bookings'),
  });


  // Fetch recent bookings
  const { data: recentBookings } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: async () => {
      try {
        // return await apiClient.get('/dashboard/recent-bookings');
        // Dummy recent bookings data
        const today = new Date();
        const getDate = (days: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() - days);
          return date.toISOString().split('T')[0];
        };
        
        return [
          {
            id: 1,
            booking_id: 'BK-2025-001',
            customer_name: 'Robert Taylor',
            trip_title: 'Everest Base Camp Trek',
            booking_date: getDate(1),
            total_amount: 1250,
            status: 'confirmed' as const,
          },
          {
            id: 2,
            booking_id: 'BK-2025-002',
            customer_name: 'Lisa Anderson',
            trip_title: 'Annapurna Circuit Adventure',
            booking_date: getDate(2),
            total_amount: 980,
            status: 'pending' as const,
          },
          {
            id: 3,
            booking_id: 'BK-2025-003',
            customer_name: 'David Brown',
            trip_title: 'Golden Triangle Tour',
            booking_date: getDate(3),
            total_amount: 750,
            status: 'confirmed' as const,
          },
          {
            id: 4,
            booking_id: 'BK-2025-004',
            customer_name: 'Maria Garcia',
            trip_title: 'Bhutan Cultural Journey',
            booking_date: getDate(5),
            total_amount: 1100,
            status: 'completed' as const,
          },
          {
            id: 5,
            booking_id: 'BK-2025-005',
            customer_name: 'James Wilson',
            trip_title: 'Tibet Spiritual Tour',
            booking_date: getDate(7),
            total_amount: 850,
            status: 'confirmed' as const,
          },
        ];
      } catch (error) {
        return [];
      }
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

      {/* Key Metrics - Top Row - Always Show 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={__('Total Trips', 'Total Trips')}
          value={stats?.totalTrips || 0}
          icon={MapPin}
          color="blue"
          loading={isLoading}
        />

        <StatCard
          title={__('Total Bookings', 'Total Bookings')}
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color="green"
          loading={isLoading}
        />

        <StatCard
          title={__('Total Revenue', 'Total Revenue')}
          value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          color="purple"
          loading={isLoading}
        />

        <StatCard
          title={__('Total Customers', 'Total Customers')}
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="orange"
          loading={isLoading}
        />
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
                <SimpleLineChart
                  data={bookingsData || []}
                  title=""
                  height={180}
                  color="#10b981"
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
                  <SimplePieChart
                    data={statusData || []}
                    title=""
                    size={180}
                    showLegend={true}
                    donut={true}
                  />
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
                value={stats?.pendingBookings || 0}
                icon={TrendingUp}
                color="orange"
                loading={isLoading}
              />
            </ConditionalRender>

            <ConditionalRender capability="yatra_view_trips">
              <StatCard
                title={__('Upcoming Departures', 'Upcoming Departures')}
                value={stats?.upcomingDepartures || 0}
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
