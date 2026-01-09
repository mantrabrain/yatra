/**
 * YATRA DEPARTURE MANAGEMENT
 * Comprehensive departure view for travel booking businesses
 * Complete operational insights for tour operators
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { __ } from '../lib/i18n';
import { formatDate as formatDateUtil } from '../lib/dateFormat';
import { apiClient } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
// Button available for future use
// import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Skeleton Loading Components
const SkeletonMetricCard = () => (
  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-16 mx-auto"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mx-auto"></div>
  </div>
);

// SkeletonTabContent available for future use - exported to suppress unused warning
export const SkeletonTabContent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 w-48"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 w-48"></div>
        <div className="space-y-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// SVG Icons for ViewDeparture
const SVGIcons = {
  Truck: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  DollarSign: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  Activity: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  BarChart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  MapPin: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Info: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

const ViewDeparture: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get departure ID from URL
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const tripIdParam = params.get('trip_id');
  
  const id = idParam ? parseInt(idParam, 10) : NaN;
  const tripId = tripIdParam ? parseInt(tripIdParam, 10) : NaN;

  // Fetch departure data using apiClient
  const { data: departureData, isLoading, error } = useQuery({
    queryKey: ['departure-details', tripId, id],
    enabled: Number.isFinite(id) && Number.isFinite(tripId),
    queryFn: async () => {
      if (!Number.isFinite(id) || !Number.isFinite(tripId)) {
        throw new Error(__('Invalid departure or trip ID', 'yatra'));
      }
      const response = await apiClient.get(`/trips/${tripId}/departures/${id}`);
      return response?.data || {};
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!Number.isFinite(id) || !Number.isFinite(tripId)) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
          <SVGIcons.XCircle />
          {__('Departure Not Found', 'yatra')}
        </h2>
        <p className="text-red-600 dark:text-red-400 mt-2">{__('Missing or invalid departure ID or trip ID in the URL.', 'yatra')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
          <SVGIcons.XCircle />
          {__('Error Loading Departure', 'yatra')}
        </h2>
        <p className="text-red-600 dark:text-red-400 mt-2">{(error as any)?.message || __('Unable to load departure details.', 'yatra')}</p>
      </div>
    );
  }

  const departure = departureData || {};
  const trip = departure.trip || {};
  
  // Calculate metrics
  const maxCapacity = departure.max_capacity || 0;
  const bookedCount = departure.booked_count || 0;
  const availableSpots = maxCapacity - bookedCount;
  const occupancyRate = maxCapacity > 0 ? (bookedCount / maxCapacity) * 100 : 0;
  
  // Status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'upcoming':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'full':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'past':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart' },
    { id: 'bookings', label: 'Bookings', icon: 'Calendar' },
    { id: 'travelers', label: 'Travelers', icon: 'Users' },
    { id: 'financials', label: 'Financials', icon: 'DollarSign' },
    { id: 'operations', label: 'Operations', icon: 'Activity' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                <SVGIcons.Truck />
                {trip.title || __('Departure Details', 'yatra')}
              </CardTitle>
              <CardDescription>
                {departure.start_date && formatDate(departure.start_date)}
                {departure.time && ` ${__('at', 'yatra')} ${formatTime(departure.time)}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={departure.status === 'confirmed' ? 'success' : departure.status === 'cancelled' ? 'error' : 'default'}>
                {departure.status || __('upcoming', 'yatra')}
              </Badge>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                ID: {departure.id}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Key Metrics */}
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonMetricCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{bookedCount}</div>
              <div className="text-sm text-blue-800 mt-1">{__('Bookings', 'yatra')}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{maxCapacity}</div>
              <div className="text-sm text-green-800 mt-1">{__('Total Capacity', 'yatra')}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{occupancyRate.toFixed(1)}%</div>
              <div className="text-sm text-purple-800 mt-1">{__('Occupancy Rate', 'yatra')}</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{formatCurrency(departure.total_revenue || 0)}</div>
              <div className="text-sm text-orange-800 mt-1">{__('Total Revenue', 'yatra')}</div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex items-center justify-between min-w-[120px] ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="flex items-center">
                  {React.createElement(SVGIcons[tab.icon as keyof typeof SVGIcons])}
                </span>
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departure Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SVGIcons.Calendar />
                    {__('Departure Information', 'yatra')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Start Date', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{departure.start_date ? formatDate(departure.start_date) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('End Date', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{departure.end_date ? formatDate(departure.end_date) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Departure Time', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{departure.time ? formatTime(departure.time) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Duration', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{trip.duration_days || '--'} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Source', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{departure.source || 'Manual'}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Management */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SVGIcons.Users />
                    {__('Capacity Management', 'yatra')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">{__('Occupancy', 'yatra')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{occupancyRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bookedCount}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{__('Booked', 'yatra')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{availableSpots}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{__('Available', 'yatra')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{maxCapacity}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{__('Total', 'yatra')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <SVGIcons.MapPin />
                  {__('Trip Details', 'yatra')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Starting Location', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.starting_location || '--'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Ending Location', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.ending_location || '--'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Difficulty Level', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.difficulty_level || '--'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Group Type', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.group_type || '--'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Min Travelers', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.min_travelers || '--'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Max Travelers', 'yatra')}:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.max_travelers || '--'}</p>
                  </div>
                  {trip.duration && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Duration', 'yatra')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{trip.duration} {__('days', 'yatra')}</p>
                    </div>
                  )}
                  {trip.created_at && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Trip Created', 'yatra')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(trip.created_at)}</p>
                    </div>
                  )}
                  {trip.price && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{__('Base Price', 'yatra')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(trip.price)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {departure.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                    <SVGIcons.FileText />
                    {__('Notes', 'yatra')}
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{departure.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SVGIcons.Calendar />
                  {__('Linked Bookings', 'yatra')}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">{departure.booking_ids?.length || 0} {__('bookings', 'yatra')}</span>
              </div>
              
              {departure.booking_ids && departure.booking_ids.length > 0 ? (
                <div className="grid gap-4">
                  {departure.booking_ids.map((bookingId: number) => (
                    <div key={bookingId} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{__('Booking', 'yatra')} #{bookingId}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{__('Click to view booking details', 'yatra')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded">{__('Active', 'yatra')}</span>
                          <a
                            href={`?page=yatra&subpage=bookings&action=view&id=${bookingId}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
                    <SVGIcons.Calendar />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">{__('No Bookings Yet', 'yatra')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{__('This departure doesn\'t have any linked bookings.', 'yatra')}</p>
                </div>
              )}
            </div>
          )}

          {/* Travelers Tab */}
          {activeTab === 'travelers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SVGIcons.Users />
                  {__('Travelers', 'yatra')}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">{departure.travelers?.length || 0} {__('travelers', 'yatra')}</span>
              </div>
              
              {departure.travelers && departure.travelers.length > 0 ? (
                <div className="grid gap-4">
                  {departure.travelers.map((traveler: any, index: number) => (
                    <div key={traveler.id || index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {traveler.first_name} {traveler.last_name}
                            {traveler.is_lead && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded">{__('Lead', 'yatra')}</span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {traveler.email && (
                              <span className="block">{traveler.email}</span>
                            )}
                            {traveler.phone && (
                              <span className="block">{traveler.phone}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          {traveler.booking_reference && (
                            <a
                              href={`?page=yatra&subpage=bookings&action=view&id=${traveler.booking_id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Booking #{traveler.booking_reference}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
                    <SVGIcons.Users />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">{__('No Travelers Yet', 'yatra')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{__('No travelers have been assigned to this departure.', 'yatra')}</p>
                </div>
              )}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <SVGIcons.DollarSign />
                {__('Financial Overview', 'yatra')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(departure.total_revenue || 0)}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300 mt-1">{__('Total Revenue', 'yatra')}</div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(departure.collected_amount || 0)}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300 mt-1">{__('Collected', 'yatra')}</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency((departure.total_revenue || 0) - (departure.collected_amount || 0))}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-300 mt-1">{__('Pending', 'yatra')}</div>
                </div>
              </div>

              {departure.price_override && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <SVGIcons.Info />
                    {__('Price Override Active', 'yatra')}
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                    {__('This departure has a custom price of', 'yatra')} {formatCurrency(departure.price_override)} 
                    {__('instead of the standard trip price.', 'yatra')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Operations Tab */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <SVGIcons.Activity />
                {__('Operational Details', 'yatra')}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SVGIcons.BarChart />
                    {__('Status Information', 'yatra')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Current Status', 'yatra')}:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle(departure.status || 'upcoming')}`}>
                        {departure.status || 'upcoming'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Created', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {departure.created_at ? formatDate(departure.created_at) : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Last Updated', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {departure.updated_at ? formatDate(departure.updated_at) : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Source', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{departure.source || 'Manual'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SVGIcons.Activity />
                    {__('Performance Metrics', 'yatra')}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Booking Efficiency', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{occupancyRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Revenue per Seat', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency((departure.total_revenue || 0) / Math.max(maxCapacity, 1))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{__('Utilization Rate', 'yatra')}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{occupancyRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ViewDeparture;
