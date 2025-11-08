/**
 * Availability Management Page
 * Manage trip availability dates separately from trip packages
 * Allows adding/editing dates for trips without modifying the trip itself
 */

import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { __ } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Alert } from '../components/ui/alert';
import { useNavigate } from '../hooks/useNavigate';

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
  seats_remaining: string;
  original_price: string;
  discounted_price: string;
  discount_percentage: string;
  status: 'available' | 'sold_out' | 'limited' | 'closed';
  from_location?: string;
  to_location?: string;
  created_at?: string;
  updated_at?: string;
}

const Availability: React.FC = () => {
  const { navigate } = useNavigate();
  const queryClient = useQueryClient();
  
  // Trip selection
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(1);

  // Fetch all trips for dropdown
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: async () => {
      // return await apiClient.get('/yatra/v1/trips', { params: { per_page: 100, status: 'published' } });
      // Dummy data
      return {
        trips: [
          { id: 1, title: 'Everest Base Camp Trek', slug: 'everest-base-camp-trek', currency: 'USD', starting_location: 'Kathmandu', ending_location: 'Kathmandu', trip_type: 'multi_day' },
          { id: 2, title: 'Annapurna Circuit Adventure', slug: 'annapurna-circuit-adventure', currency: 'USD', starting_location: 'Pokhara', ending_location: 'Pokhara', trip_type: 'multi_day' },
          { id: 3, title: 'Golden Triangle Tour', slug: 'golden-triangle-tour', currency: 'USD', starting_location: 'Delhi', ending_location: 'Delhi', trip_type: 'multi_day' },
          { id: 4, title: 'Bhutan Cultural Journey', slug: 'bhutan-cultural-journey', currency: 'USD', starting_location: 'Paro', ending_location: 'Paro', trip_type: 'multi_day' },
          { id: 9, title: 'Kathmandu City Tour', slug: 'kathmandu-city-tour', currency: 'USD', starting_location: 'Kathmandu', ending_location: 'Kathmandu', trip_type: 'single_day' },
        ] as Trip[]
      };
    },
  });

  // Fetch availability dates for selected trip
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['availability', selectedTripId, statusFilter, monthFilter, page],
    queryFn: async () => {
      if (!selectedTripId) return { dates: [], total: 0 };
      
      // return await apiClient.get(`/yatra/v1/trips/${selectedTripId}/availability`, { params: { status: statusFilter, month: monthFilter, page, per_page: perPage } });
      // Dummy data
      const selectedTrip = tripsData?.trips.find(t => t.id === selectedTripId);
      const isSingleDay = selectedTrip?.trip_type === 'single_day';
      const today = new Date();
      const dates: AvailabilityDate[] = [];
      
      if (isSingleDay) {
        // For single-day trips, generate 12 different time slots on the same date
        const baseDate = today.toISOString().split('T')[0];
        const timeSlots = [
          { dep: '08:00', arr: '12:00' },
          { dep: '09:00', arr: '13:00' },
          { dep: '10:00', arr: '14:00' },
          { dep: '11:00', arr: '15:00' },
          { dep: '12:00', arr: '16:00' },
          { dep: '13:00', arr: '17:00' },
          { dep: '14:00', arr: '18:00' },
          { dep: '15:00', arr: '19:00' },
          { dep: '16:00', arr: '20:00' },
          { dep: '17:00', arr: '21:00' },
          { dep: '18:00', arr: '22:00' },
          { dep: '19:00', arr: '23:00' },
        ];
        
        for (let i = 0; i < 12; i++) {
          const originalPrice = 150 + (i * 10);
          const discountedPrice = i % 3 === 0 ? originalPrice * 0.9 : originalPrice;
          const discount = i % 3 === 0 ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
          
          dates.push({
            id: `avail_${i + 1}`,
            trip_id: selectedTripId,
            departure_date: baseDate,
            departure_time: timeSlots[i].dep,
            arrival_date: baseDate,
            arrival_time: timeSlots[i].arr,
            seats_remaining: i % 4 === 0 ? '5' : i % 4 === 1 ? '10+' : i % 4 === 2 ? '2' : '0',
            original_price: originalPrice.toString(),
            discounted_price: discountedPrice.toString(),
            discount_percentage: discount.toString(),
            status: i % 4 === 0 ? 'limited' : i % 4 === 1 ? 'available' : i % 4 === 2 ? 'sold_out' : 'closed',
            from_location: selectedTrip?.starting_location || '',
            to_location: selectedTrip?.ending_location || '',
          });
        }
      } else {
        // For multi-day trips, generate sample dates for the next 6 months
        for (let i = 0; i < 12; i++) {
          const departureDate = new Date(today);
          departureDate.setMonth(today.getMonth() + i);
          departureDate.setDate(15 + (i % 7)); // Vary the day
          
          const arrivalDate = new Date(departureDate);
          arrivalDate.setDate(departureDate.getDate() + 10);
          
          const originalPrice = 1200 + (i * 50);
          const discountedPrice = i % 3 === 0 ? originalPrice * 0.9 : originalPrice;
          const discount = i % 3 === 0 ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0;
          
          dates.push({
            id: `avail_${i + 1}`,
            trip_id: selectedTripId,
            departure_date: departureDate.toISOString().split('T')[0],
            arrival_date: arrivalDate.toISOString().split('T')[0],
            seats_remaining: i % 4 === 0 ? '5' : i % 4 === 1 ? '10+' : i % 4 === 2 ? '2' : '0',
            original_price: originalPrice.toString(),
            discounted_price: discountedPrice.toString(),
            discount_percentage: discount.toString(),
            status: i % 4 === 0 ? 'limited' : i % 4 === 1 ? 'available' : i % 4 === 2 ? 'sold_out' : 'closed',
            from_location: selectedTrip?.starting_location || '',
            to_location: selectedTrip?.ending_location || '',
          });
        }
      }
      
      return { dates, total: dates.length };
    },
    enabled: !!selectedTripId,
  });

  // Delete availability date
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // return await apiClient.delete(`/yatra/v1/availability/${id}`);
      console.log('Deleting availability:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success" className="text-xs">{__('Available', 'Available')}</Badge>;
      case 'limited':
        return <Badge variant="warning" className="text-xs">{__('Limited', 'Limited')}</Badge>;
      case 'sold_out':
        return <Badge variant="error" className="text-xs">{__('Sold Out', 'Sold Out')}</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-xs">{__('Closed', 'Closed')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={__('Availability Management', 'Availability Management')}
        description={__('Manage departure dates and availability for your trips. Add dates for this month or plan ahead for the entire year.', 'Manage departure dates and availability for your trips. Add dates for this month or plan ahead for the entire year.')}
        actions={
          selectedTripId ? (
            <Button
                    onClick={() => navigate({ subpage: 'trips', tab: 'availability', action: 'create', trip_id: selectedTripId.toString() })}
            >
              <Plus className="w-4 h-4 mr-2" />
              {__('Add Availability Date', 'Add Availability Date')}
            </Button>
          ) : null
        }
      />

      {/* Trip Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{__('Select Trip', 'Select Trip')}</CardTitle>
          <CardDescription>
            {__('Choose a trip to manage its availability dates', 'Choose a trip to manage its availability dates')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {__('Trip', 'Trip')} <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedTripId?.toString() || ''}
                onChange={(e) => {
                  const tripId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedTripId(tripId);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">{__('-- Select a Trip --', '-- Select a Trip --')}</option>
                {tripsData?.trips.map(trip => (
                  <option key={trip.id} value={trip.id.toString()}>
                    {trip.title} {trip.trip_type === 'single_day' ? '(Single Day)' : trip.trip_type === 'multi_day' ? '(Multi-Day)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            {selectedTrip && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedTrip.starting_location} → {selectedTrip.ending_location}</span>
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
          </div>
        </CardContent>
      </Card>

      {selectedTripId ? (
        <>
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
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{__('Loading availability dates...', 'Loading availability dates...')}</p>
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
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Departure Time', 'Departure Time') : __('Departure', 'Departure')}</TableHead>
                        <TableHead>{selectedTrip?.trip_type === 'single_day' ? __('Arrival Time', 'Arrival Time') : __('Arrival', 'Arrival')}</TableHead>
                        <TableHead>{__('From/To', 'From/To')}</TableHead>
                        <TableHead>{__('Seats', 'Seats')}</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{date.seats_remaining || '0'}</span>
                            </div>
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
                            {getStatusBadge(date.status)}
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
      ) : (
        <Alert variant="info">
          <AlertCircle className="w-4 h-4" />
          <div>
            <p className="font-medium">{__('No Trip Selected', 'No Trip Selected')}</p>
            <p className="text-sm">{__('Please select a trip from the dropdown above to manage its availability dates.', 'Please select a trip from the dropdown above to manage its availability dates.')}</p>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default Availability;

