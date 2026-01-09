import React from 'react';
import {
  Calendar,
  CreditCard,
  User,
  LifeBuoy,
  FileText,
  Package,
  MapPin,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Plane,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { __ } from '../../lib/i18n';
import { formatDate, getBadge, currency } from './utils';
import type { Booking, Payment, CustomerProfile } from './types';

interface DashboardProps {
  bookings: Booking[];
  payments: Payment[];
  displayProfile: CustomerProfile | null;
  stats: Array<{
    label: string;
    value: string | number;
    icon: React.ElementType;
    badge?: string;
  }>;
  notifications: any[];
  onSectionChange: (section: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  bookings,
  payments,
  displayProfile,
  stats,
  notifications,
  onSectionChange,
}) => {
  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) > new Date()).length > 0
    ? bookings.filter((b) => new Date(b.travel_date) > new Date()).slice(0, 3)
    : bookings.filter((b) => new Date(b.travel_date) > new Date()).slice(0, 3);
  
  const recentBookings = bookings.length > 0 ? bookings.slice(0, 2) : [];
  
  const pendingPayments = payments.filter((p) => p.status === 'pending').length > 0 ? payments.filter((p) => p.status === 'pending').slice(0, 2) : [];

  const displayNotifications = notifications;

  // Enhanced stats with colors and gradients
  const enhancedStats = [
    {
      ...stats[0],
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      ...stats[1],
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      ...stats[2],
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      ...stats[3],
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div 
        className="yatra-dashboard-welcome relative overflow-hidden rounded-2xl p-8 shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4f46e5 100%)',
          color: '#ffffff'
        }}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: '#ffffff' }}
              >
                {__('Welcome back,', 'yatra')} {displayProfile?.name?.split(' ')[0] || __('Traveler', 'yatra')}! 👋
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ color: '#e0e7ff' }}
              >
                {__('You have', 'yatra')} {upcomingBookings.length} {upcomingBookings.length === 1 ? __('upcoming adventure', 'yatra') : __('upcoming adventures', 'yatra')} {__('coming up', 'yatra')}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => onSectionChange('bookings')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Calendar className="w-4 h-4" style={{ color: '#ffffff' }} />
                  {__('View Calendar', 'yatra')}
                </div>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => onSectionChange('documents')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <FileText className="w-4 h-4" style={{ color: '#ffffff' }} />
                  {__('My Documents', 'yatra')}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Plane className="w-12 h-12" style={{ color: '#ffffff' }} />
              </div>
            </div>
          </div>
        </div>
        <div 
          className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-24 -mb-24"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        ></div>
      </div>

      {/* Stats Grid */}
      <div className="yatra-dashboard-stats grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {enhancedStats.map((stat) => (
          <div
            key={stat.label}
            className={`yatra-stat-card yatra-stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')} group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.badge && (
                  <span className="inline-flex text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 font-medium">
                    {stat.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Trips - Takes 2 columns */}
        <div className="yatra-dashboard-upcoming-trips lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="yatra-dashboard-upcoming-trips-header p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{__('Upcoming Trips', 'yatra')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{__('Your next adventures', 'yatra')}</p>
                </div>
              </div>
              {upcomingBookings.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSectionChange('bookings')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {__('View all', 'yatra')}
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="yatra-booking-card yatra-booking-card-upcoming group relative border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {booking.trip_title}
                          </h4>
                          <span className={getBadge(booking.booking_status)}>{__(booking.booking_status, booking.booking_status)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {booking.destination || __('Multiple destinations', 'yatra')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(booking.travel_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {booking.travelers} {booking.travelers === 1 ? __('Traveler', 'yatra') : __('Travelers', 'yatra')}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">{__('No upcoming trips', 'yatra')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{__('Start planning your next adventure!', 'yatra')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Notifications - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="yatra-dashboard-quick-actions bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="yatra-dashboard-quick-actions-header p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{__('Quick Actions', 'yatra')}</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSectionChange('bookings')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {__('View Bookings', 'yatra')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSectionChange('payments')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {__('Make Payment', 'yatra')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSectionChange('documents')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {__('My Documents', 'yatra')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSectionChange('support')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer text-sm"
              >
                <div className="flex items-center gap-3">
                  <LifeBuoy className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {__('Get Support', 'yatra')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="yatra-dashboard-notifications bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="yatra-dashboard-notifications-header p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{__('Notifications', 'yatra')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{__('Updates & reminders', 'yatra')}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.type === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notif.type === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{notif.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">{__('No new notifications', 'yatra')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      {(recentBookings.length > 0 || pendingPayments.length > 0) && (
        <div className="yatra-dashboard-recent-activity bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="yatra-dashboard-recent-activity-header p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{__('Recent Activity', 'yatra')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{__('Your latest updates', 'yatra')}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{__('Booking confirmed:', 'yatra')} {booking.trip_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(booking.booking_date || booking.created_at)}</p>
                  </div>
                  <span className={getBadge(booking.booking_status)}>{__(booking.booking_status, booking.booking_status)}</span>
                </div>
              ))}
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {__('Payment pending:', 'yatra')} {currency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.date)}</p>
                  </div>
                  <span className={getBadge(payment.status)}>{__(payment.status, payment.status)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

