/**
 * Availability Management Page
 * Manage trip availability dates separately from trip packages
 * Allows adding/editing dates for trips without modifying the trip itself
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  X, 
  Edit, 
  Trash2, 
  MapPin,
  Users,
  AlertCircle,
  List,
  Calendar,
  RefreshCw,
  Bell,
  Ban,
  Clock,
  Eye,
  Settings
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SearchableSelect } from '../components/ui/searchable-select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Alert } from '../components/ui/alert';
import { useNavigate } from '../hooks/useNavigate';
import { AvailabilityCalendar } from '../components/availability/AvailabilityCalendar';
import { RecurringRules } from '../components/availability/RecurringRules';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ui/toast';

interface Trip {
  id: number;
  title: string;
  slug: string;
  currency: string;
  starting_location?: string;
  ending_location?: string;
  trip_type?: 'single_day' | 'multi_day';
}

interface AvailabilityDate {
  id: string;
  trip_id: number;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  total_seats: number; // Total capacity
  booked_seats: number; // Currently booked
  available_seats: number; // Calculated: total_seats - booked_seats
  waitlist_count: number; // Number of people on waitlist
  seats_remaining: string; // Legacy field for display
  original_price: string;
  discounted_price: string;
  discount_percentage: string;
  status: 'available' | 'sold_out' | 'limited' | 'closed' | 'blocked' | 'cancelled';
  from_location?: string;
  to_location?: string;
  is_blocked?: boolean; // Blocked for maintenance/holidays
  block_reason?: string; // Reason for blocking
  alert_threshold?: number; // Alert when seats drop below this
  last_synced_at?: string; // Last real-time sync timestamp
  created_at?: string;
  updated_at?: string;
}

const Availability: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Get trip_id from URL on mount and when URL changes
  const [urlKey, setUrlKey] = useState(0);
  useEffect(() => {
    const handleLocationChange = () => {
      setUrlKey(prev => prev + 1);
    };

    // Listen for popstate (back/forward button)
    window.addEventListener('popstate', handleLocationChange);
    
    // Also check periodically (fallback for direct navigation)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      if (currentSearch !== (window as any).__lastAvailabilitySearch) {
        (window as any).__lastAvailabilitySearch = currentSearch;
        handleLocationChange();
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Read trip_id from URL
  const tripIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('trip_id');
    return tripId ? parseInt(tripId) : null;
  }, [urlKey]);
  
  // Trip selection - initialize from localStorage or URL if available
  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    // First try to get from localStorage
    const storedTripId = localStorage.getItem('yatra_selected_trip_id');
    if (storedTripId) {
      return parseInt(storedTripId);
    }
    // Fall back to URL if no localStorage value
    return tripIdFromUrl;
  });

  // Update selectedTripId when URL changes or localStorage changes
  useEffect(() => {
    const storedTripId = localStorage.getItem('yatra_selected_trip_id');
    if (selectedTripId !== (storedTripId ? parseInt(storedTripId) : null)) {
      setSelectedTripId(selectedTripId);
      if (selectedTripId !== null) {
        localStorage.setItem('yatra_selected_trip_id', selectedTripId.toString());
      }
    }
  }, [selectedTripId]);

  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Tab mode: 'specific' or 'recurring'
  const [tabMode, setTabMode] = useState<'specific' | 'recurring'>('specific');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  
  // Real-time sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Inventory alerts visibility
  const [showAlerts, setShowAlerts] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);

  // Fetch all trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/trips', { params: { per_page: 100, status: 'published' } });
      return {
        trips: (response?.data || []).map((trip: any) => ({
          id: trip.id,
          title: trip.title,
          slug: trip.slug,
          currency: trip.currency || 'USD',
          starting_location: trip.starting_location,
          ending_location: trip.ending_location,
          trip_type: trip.trip_type || 'multi_day',
        })) as Trip[]
      };
    },
  });

  // Fetch availability dates for selected trip
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability', selectedTripId, statusFilter, monthFilter, page, searchTerm],
    queryFn: async () => {
      if (!selectedTripId) return { dates: [], total: 0 };
      
      const response = await apiClient.get('/availability', { 
        params: { 
          trip_id: selectedTripId,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          month: monthFilter !== 'all' ? monthFilter : undefined,
          search: searchTerm || undefined,
          page,
          per_page: 50,
        } 
      });
      
      return {
        dates: (response?.dates || []).map((date: any) => ({
          id: date.id.toString(),
          trip_id: date.trip_id,
          departure_date: date.departure_date,
          departure_time: date.departure_time,
          arrival_date: date.arrival_date || date.departure_date,
          arrival_time: date.arrival_time,
          total_seats: date.total_seats || date.seats_total || 0,
          booked_seats: date.booked_seats || (date.total_seats || date.seats_total) - (date.available_seats || date.seats_available || 0),
          available_seats: date.available_seats || date.seats_available || 0,
          waitlist_count: date.waitlist_count || date.seats_waitlist || 0,
          seats_remaining: (date.available_seats || date.seats_available || 0) > 10 ? '10+' : (date.available_seats || date.seats_available || 0).toString(),
          original_price: date.original_price?.toString() || '0',
          discounted_price: date.discounted_price?.toString() || date.original_price?.toString() || '0',
          discount_percentage: date.discount_percentage?.toString() || '0',
          status: date.status || 'available',
          is_blocked: date.is_blocked || date.status === 'blocked',
          block_reason: date.block_reason,
          alert_threshold: date.alert_threshold || 5,
          last_synced_at: date.last_synced_at || date.updated_at,
          from_location: date.from_location,
          to_location: date.to_location,
          created_at: date.created_at,
          updated_at: date.updated_at,
        })) as AvailabilityDate[],
        total: response?.total || 0,
      };
    },
    enabled: !!selectedTripId,
  });

  // Delete availability date
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      showToast(__('Availability date deleted successfully', 'Availability date deleted successfully'), 'success');
    },
    onError: (error: any) => {
      showToast(error?.message || __('Failed to delete availability date', 'Failed to delete availability date'), 'error');
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  // Get status badge variant
  const getStatusBadge = (status: string, isBlocked?: boolean) => {
    if (isBlocked) {
      return <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">{__('Blocked', 'Blocked')}</Badge>;
    }
    switch (status) {
      case 'available':
        return <Badge variant="success" className="text-xs">{__('Available', 'Available')}</Badge>;
      case 'limited':
        return <Badge variant="warning" className="text-xs">{__('Limited', 'Limited')}</Badge>;
      case 'sold_out':
        return <Badge variant="error" className="text-xs">{__('Sold Out', 'Sold Out')}</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-xs">{__('Closed', 'Closed')}</Badge>;
      case 'blocked':
        return <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">{__('Blocked', 'Blocked')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // Real-time sync function
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Refresh availability data
      await queryClient.invalidateQueries({ queryKey: ['availability'] });
      setLastSyncTime(new Date());
      showToast(__('Availability data synced successfully', 'Availability data synced successfully'), 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast(__('Failed to sync availability data', 'Failed to sync availability data'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedTrip = tripsData?.trips.find(t => t.id === selectedTripId);

  // Filter availability dates
  const filteredDates = useMemo(() => {
    if (!availabilityData?.dates) return [];
    
    let filtered = [...availabilityData.dates];
    
    // Filter by search term (date range or time)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(date => 
        date.departure_date.includes(searchLower) ||
        date.arrival_date.includes(searchLower) ||
        date.departure_time?.toLowerCase().includes(searchLower) ||
        date.arrival_time?.toLowerCase().includes(searchLower) ||
        date.from_location?.toLowerCase().includes(searchLower) ||
        date.to_location?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(date => date.status === statusFilter);
    }
    
    // Filter by month (only for multi-day trips)
    if (monthFilter !== 'all' && selectedTrip?.trip_type !== 'single_day') {
      const [year, month] = monthFilter.split('-');
      filtered = filtered.filter(date => {
        const dateObj = new Date(date.departure_date);
        return dateObj.getFullYear() === parseInt(year) && 
               dateObj.getMonth() === parseInt(month) - 1;
      });
    }
    
    return filtered;
  }, [availabilityData, searchTerm, statusFilter, monthFilter, selectedTrip]);

  // Get available months for filter (only for multi-day trips)
  const availableMonths = useMemo(() => {
    if (!availabilityData?.dates || selectedTrip?.trip_type === 'single_day') return [];
    
    const months = new Set<string>();
    availabilityData.dates.forEach(date => {
      const dateObj = new Date(date.departure_date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months).sort();
  }, [availabilityData, selectedTrip]);

  // Calculate inventory alerts (after filteredDates is defined)
  const inventoryAlerts = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter(date => {
      if (date.is_blocked) return false;
      const threshold = date.alert_threshold || 5;
      return date.available_seats <= threshold && date.available_seats > 0;
    });
  }, [filteredDates]);

  // Get waitlist entries
  const waitlistEntries = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter(date => date.waitlist_count > 0);
  }, [filteredDates]);

  // Get blocked dates
  const blockedDates = useMemo(() => {
    if (!filteredDates || filteredDates.length === 0) return [];
    return filteredDates.filter(date => date.is_blocked);
  }, [filteredDates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Availability Management', 'Availability Management')}
        description={__('Manage departure dates and availability for your trips. Add dates for this month or plan ahead for the entire year.', 'Manage departure dates and availability for your trips. Add dates for this month or plan ahead for the entire year.')}
        actions={
          selectedTripId ? (
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-0"
                >
                  <List className="w-4 h-4 mr-1" />
                  {__('List', 'List')}
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-none border-0"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  {__('Calendar', 'Calendar')}
                </Button>
              </div>
              
              {/* Sync Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : __('Sync availability', 'Sync availability')}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {__('Sync', 'Sync')}
              </Button>
              
              {/* Add Availability Button */}
              <Button
                onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'create', trip_id: selectedTripId.toString() })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {__('Add Availability Date', 'Add Availability Date')}
              </Button>
            </div>
          ) : null
        }
      />

      {/* Trip Selector - Clean Design */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {__('Select Trip', 'Select Trip')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {__('Choose a trip to manage its availability dates and departure schedules', 'Choose a trip to manage its availability dates and departure schedules')}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {__('Trip', 'Trip')} <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={selectedTripId?.toString() || ''}
              onChange={(value) => {
                const tripId = value ? parseInt(value) : null;
                setSelectedTripId(tripId);
                setPage(1);
              }}
              options={[
                { value: '', label: __('-- Select a Trip --', '-- Select a Trip --') },
                ...(tripsData?.trips.map(trip => ({
                  value: trip.id.toString(),
                  label: `${trip.title}${trip.trip_type === 'single_day' ? ' (Single Day)' : trip.trip_type === 'multi_day' ? ' (Multi-Day)' : ''}`
                })) || [])
              ]}
              placeholder={__('Search or select a trip...', 'Search or select a trip...')}
              searchPlaceholder={__('Search by trip name or ID...', 'Search by trip name or ID...')}
              className="w-full"
              required
            />
          </div>

          {selectedTrip && (
            <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">{selectedTrip.starting_location}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{selectedTrip.ending_location}</span>
              </div>
              {selectedTrip.trip_type && (
                <Badge className={
                  selectedTrip.trip_type === 'single_day'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                }>
                  {selectedTrip.trip_type === 'single_day' ? __('Single Day', 'Single Day') : __('Multi-Day', 'Multi-Day')}
                </Badge>
              )}
            </div>
          )}

          {!selectedTripId && (
            <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200/50 dark:border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {__('Get Started', 'Get Started')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {__('Select a trip from the dropdown above to view and manage its availability dates, pricing, and booking status.', 'Select a trip from the dropdown above to view and manage its availability dates, pricing, and booking status.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTripId && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
            <button
              onClick={() => setTabMode('specific')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tabMode === 'specific'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <CalendarDays className="w-4 h-4 inline mr-2" />
              {__('Specific Dates', 'Specific Dates')}
            </button>
            <button
              onClick={() => setTabMode('recurring')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tabMode === 'recurring'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              {__('Recurring Rules', 'Recurring Rules')}
            </button>
              </div>
              
            </div>
          </div>

          {/* Recurring Rules Tab Content */}
          {tabMode === 'recurring' && (
            <RecurringRules
              tripId={selectedTripId}
              onAddRule={() => navigate({ subpage: 'trips', tab: 'availability', action: 'create-rule', trip_id: selectedTripId.toString() })}
              onEditRule={(id) => navigate({ subpage: 'trips', tab: 'availability', action: 'edit-rule', id: id.toString() })}
            />
          )}

          {/* Specific Dates Tab Content */}
          {tabMode === 'specific' && (
            <>
              {/* Inventory Alerts */}
              {showAlerts && inventoryAlerts.length > 0 && (
            <Alert variant="warning" className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-3 flex-1">
                  <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                        {__('Inventory Alerts', 'Inventory Alerts')}
                      </h4>
                      <Badge className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                        {inventoryAlerts.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                      {__('The following dates have low availability (below threshold)', 'The following dates have low availability (below threshold)')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inventoryAlerts.slice(0, 5).map((alert) => (
                        <Button
                          key={alert.id}
                          variant="outline"
                          size="sm"
                          onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: alert.id })}
                          className="text-xs border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300"
                        >
                          {formatDate(alert.departure_date)}
                          {alert.departure_time && ` ${formatTime(alert.departure_time)}`}
                          <span className="ml-1 font-semibold">({alert.available_seats} {__('seats', 'seats')})</span>
                        </Button>
                      ))}
                      {inventoryAlerts.length > 5 && (
                        <span className="text-xs text-yellow-700 dark:text-yellow-400 self-center">
                          +{inventoryAlerts.length - 5} {__('more', 'more')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlerts(false)}
                  className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Waitlist Summary */}
          {waitlistEntries.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-base">{__('Waitlist', 'Waitlist')}</CardTitle>
                    <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                      {waitlistEntries.reduce((sum, entry) => sum + entry.waitlist_count, 0)} {__('people', 'people')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'waitlist', trip_id: selectedTripId.toString() })}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {__('View All', 'View All')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waitlistEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(entry.departure_date)}
                            {entry.departure_time && ` ${formatTime(entry.departure_time)}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.booked_seats}/{entry.total_seats} {__('booked', 'booked')}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {entry.waitlist_count} {__('on waitlist', 'on waitlist')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blocked Dates Summary */}
          {blockedDates.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-base">{__('Blocked Dates', 'Blocked Dates')}</CardTitle>
                    <Badge className="bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
                      {blockedDates.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedDates.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(entry.departure_date)}
                            {entry.departure_time && ` ${formatTime(entry.departure_time)}`}
                          </div>
                          {entry.block_reason && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {__('Reason', 'Reason')}: {entry.block_reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: entry.id })}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
              <div className={`grid grid-cols-1 ${selectedTrip?.trip_type === 'single_day' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Search', 'Search')}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={__('Search dates, locations...', 'Search dates, locations...')}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {__('Status', 'Status')}
                  </label>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{__('All Status', 'All Status')}</option>
                    <option value="available">{__('Available', 'Available')}</option>
                    <option value="limited">{__('Limited', 'Limited')}</option>
                    <option value="sold_out">{__('Sold Out', 'Sold Out')}</option>
                    <option value="closed">{__('Closed', 'Closed')}</option>
                    <option value="blocked">{__('Blocked', 'Blocked')}</option>
                  </Select>
                </div>
                {selectedTrip?.trip_type !== 'single_day' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {__('Month', 'Month')}
                    </label>
                    <Select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    >
                      <option value="all">{__('All Months', 'All Months')}</option>
                      {availableMonths.map(month => {
                        const [year, monthNum] = month.split('-');
                        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                        return (
                          <option key={month} value={month}>
                            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                )}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setMonthFilter('all');
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {__('Clear Filters', 'Clear Filters')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Dates List */}
          <Card>
            <CardHeader>
              <CardTitle>{__('Availability Dates', 'Availability Dates')}</CardTitle>
              <CardDescription>
                {selectedTrip && (
                  <>
                    {__('Managing availability for', 'Managing availability for')} <strong>{selectedTrip.title}</strong>
                    {filteredDates.length > 0 && (
                      <span className="ml-2">
                        ({filteredDates.length} {selectedTrip?.trip_type === 'single_day' ? __('time slots', 'time slots') : __('dates', 'dates')})
                      </span>
                    )}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Departure Time', 'Departure Time') : __('Departure', 'Departure')}</TableHead>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Arrival Time', 'Arrival Time') : __('Arrival', 'Arrival')}</TableHead>
                        <TableHead>{__('From/To', 'From/To')}</TableHead>
                        <TableHead className="text-center">{__('Capacity', 'Capacity')}</TableHead>
                        <TableHead className="text-center">{__('Booked', 'Booked')}</TableHead>
                        <TableHead className="text-center">{__('Available', 'Available')}</TableHead>
                        <TableHead className="text-center">{__('Waitlist', 'Waitlist')}</TableHead>
                        <TableHead>{__('Price', 'Price')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(10)].map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div>
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : filteredDates.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {searchTerm || statusFilter !== 'all' || monthFilter !== 'all'
                      ? __('No availability dates match your filters', 'No availability dates match your filters')
                      : __('No availability dates added yet', 'No availability dates added yet')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    {__('Add departure dates with pricing and seat availability for this trip', 'Add departure dates with pricing and seat availability for this trip')}
                  </p>
                  <Button
                    onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'create', trip_id: selectedTripId.toString() })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {__('Add First Availability Date', 'Add First Availability Date')}
                  </Button>
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="p-4">
                  <AvailabilityCalendar
                    dates={filteredDates}
                    tripType={selectedTrip?.trip_type}
                    currency={selectedTrip?.currency || 'USD'}
                    onDateClick={(date) => {
                      navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: date.id });
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Departure Time', 'Departure Time') : __('Departure', 'Departure')}</TableHead>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Arrival Time', 'Arrival Time') : __('Arrival', 'Arrival')}</TableHead>
                        <TableHead>{__('From/To', 'From/To')}</TableHead>
                        <TableHead className="text-center">{__('Capacity', 'Capacity')}</TableHead>
                        <TableHead className="text-center">{__('Booked', 'Booked')}</TableHead>
                        <TableHead className="text-center">{__('Available', 'Available')}</TableHead>
                        <TableHead className="text-center">{__('Waitlist', 'Waitlist')}</TableHead>
                        <TableHead>{__('Price', 'Price')}</TableHead>
                        <TableHead>{__('Status', 'Status')}</TableHead>
                        <TableHead className="text-right w-[120px]">{__('Actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDates.map((date) => (
                        <TableRow key={date.id}>
                          <TableCell>
                            {selectedTrip?.trip_type === 'single_day' ? (
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium">{formatDate(date.departure_date)}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{date.departure_time ? formatTime(date.departure_time) : ''}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{formatDate(date.departure_date)}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {selectedTrip?.trip_type === 'single_day' ? (
                              <div>
                                <div className="text-sm font-medium">{formatDate(date.arrival_date)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{date.arrival_time ? formatTime(date.arrival_time) : ''}</div>
                              </div>
                            ) : (
                              <span className="text-sm">{formatDate(date.arrival_date)}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              <span>{date.from_location || selectedTrip?.starting_location}</span>
                              <span>→</span>
                              <span>{date.to_location || selectedTrip?.ending_location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{date.total_seats || 0}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{__('total', 'total')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{date.booked_seats || 0}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{__('booked', 'booked')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-semibold ${
                                date.available_seats === 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : date.available_seats <= (date.alert_threshold || 5)
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {date.available_seats || 0}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{__('available', 'available')}</span>
                              {date.available_seats <= (date.alert_threshold || 5) && date.available_seats > 0 && (
                                <Bell className="w-3 h-3 text-yellow-500 mt-0.5" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {date.waitlist_count > 0 ? (
                              <div className="flex flex-col items-center">
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                                  {date.waitlist_count}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{__('people', 'people')}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {date.discounted_price && parseFloat(date.discounted_price) < parseFloat(date.original_price) ? (
                                <>
                                  <span className="text-sm line-through text-gray-400">
                                    {getCurrencySymbol(selectedTrip?.currency || 'USD')}{parseFloat(date.original_price).toLocaleString()}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {getCurrencySymbol(selectedTrip?.currency || 'USD')}{parseFloat(date.discounted_price).toLocaleString()}
                                    </span>
                                    {date.discount_percentage && parseFloat(date.discount_percentage) > 0 && (
                                      <Badge variant="error" className="text-xs">
                                        {date.discount_percentage}% {__('OFF', 'OFF')}
                                      </Badge>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-sm font-semibold">
                                  {getCurrencySymbol(selectedTrip?.currency || 'USD')}{parseFloat(date.original_price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(date.status, date.is_blocked)}
                              {date.is_blocked && date.block_reason && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  {date.block_reason}
                                </span>
                              )}
                              {date.last_synced_at && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(date.last_synced_at).toLocaleTimeString()}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'edit', id: date.id })}
                                className="h-8 w-8"
                                title={__('Edit', 'Edit')}
                                aria-label={__('Edit availability date', 'Edit availability date')}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(__('Are you sure you want to delete this availability date?', 'Are you sure you want to delete this availability date?'))) {
                                    deleteMutation.mutate(date.id);
                                  }
                                }}
                                className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title={__('Delete', 'Delete')}
                                aria-label={__('Delete availability date', 'Delete availability date')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
              </>
          )}
          </>
        )}
    </div>
  );
};

export default Availability;

